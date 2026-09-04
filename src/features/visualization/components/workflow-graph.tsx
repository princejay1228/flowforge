"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Workflow } from "@/types/workflow";
import type { Member } from "@/types/member";
import type { ScheduleResult } from "@/features/scheduler";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

interface WorkflowGraphProps {
  workflow: Workflow;
  schedule?: ScheduleResult | null;
  members?: Member[];
}

export function WorkflowGraph({ workflow, schedule, members = [] }: WorkflowGraphProps) {
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  const membersById = React.useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const critTaskIds = React.useMemo(
    () => new Set(schedule?.criticalPathTaskIds || []),
    [schedule]
  );

  // Compute topological level (longest dependency chain from root)
  const { nodePositions, maxLevel } = React.useMemo(() => {
    const levels = new Map<string, number>();
    workflow.tasks.forEach((t) => levels.set(t.id, 0));

    // Iterative relaxation to compute longest path levels
    let changed = true;
    for (let iter = 0; iter < workflow.tasks.length && changed; iter++) {
      changed = false;
      for (const task of workflow.tasks) {
        const curLevel = levels.get(task.id) || 0;
        for (const depId of task.dependsOn || []) {
          const depLevel = levels.get(depId) || 0;
          if (curLevel <= depLevel) {
            levels.set(task.id, depLevel + 1);
            changed = true;
          }
        }
      }
    }

    // Group tasks by level to assign Y positions
    const levelBuckets = new Map<number, string[]>();
    let highestLevel = 0;

    for (const task of workflow.tasks) {
      const lvl = levels.get(task.id) || 0;
      if (lvl > highestLevel) highestLevel = lvl;
      if (!levelBuckets.has(lvl)) levelBuckets.set(lvl, []);
      levelBuckets.get(lvl)!.push(task.id);
    }

    const positions = new Map<string, { x: number; y: number }>();
    const COLUMN_WIDTH = 270;
    const ROW_HEIGHT = 140;

    levelBuckets.forEach((taskIds, lvl) => {
      taskIds.forEach((taskId, indexInBucket) => {
        // Center-align columns vertically for a balanced DAG look
        const totalInBucket = taskIds.length;
        const startY = 60 + ((4 - Math.min(4, totalInBucket)) * ROW_HEIGHT) / 4;
        positions.set(taskId, {
          x: 40 + lvl * COLUMN_WIDTH,
          y: startY + indexInBucket * ROW_HEIGHT,
        });
      });
    });

    return { nodePositions: positions, maxLevel: highestLevel };
  }, [workflow]);

  // Construct React Flow Nodes
  const nodes: Node[] = React.useMemo(() => {
    return workflow.tasks.map((task) => {
      const isCritical = critTaskIds.has(task.id);
      const isSelected = selectedTaskId === task.id;
      const assignee = task.assignedMemberId ? membersById.get(task.assignedMemberId) : null;
      const pos = nodePositions.get(task.id) || { x: 50, y: 50 };

      return {
        id: task.id,
        position: pos,
        data: {
          label: (
            <div className="w-[220px] text-left p-3 rounded-lg flex flex-col gap-2">
              {/* Top status bar */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/80 text-foreground border">
                  {task.id}
                </span>
                {isCritical ? (
                  <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Critical
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {task.status.replace("_", " ")}
                  </span>
                )}
              </div>

              {/* Task Title */}
              <div className="font-semibold text-xs leading-snug line-clamp-2 text-foreground">
                {task.name}
              </div>

              {/* Bottom metadata badges */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-1.5 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-foreground/80">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  {task.estimatedDuration}m
                </span>

                {assignee ? (
                  <span className="truncate max-w-[90px] bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    {assignee.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>
          ),
        },
        style: {
          background: isSelected
            ? "hsl(var(--card))"
            : "hsl(var(--background))",
          border: isCritical
            ? "2px solid rgb(244, 63, 94)"
            : isSelected
            ? "2px solid hsl(var(--primary))"
            : "1px solid hsl(var(--border))",
          borderRadius: "10px",
          boxShadow: isCritical
            ? "0 4px 14px rgba(244, 63, 94, 0.2)"
            : isSelected
            ? "0 4px 14px rgba(59, 130, 246, 0.2)"
            : "0 2px 8px rgba(0,0,0,0.04)",
          cursor: "pointer",
          padding: 0,
        },
      };
    });
  }, [workflow, critTaskIds, selectedTaskId, membersById, nodePositions]);

  // Construct React Flow Edges with Critical Path highlighting
  const edges: Edge[] = React.useMemo(() => {
    const edgeList: Edge[] = [];
    const addedPairs = new Set<string>();

    // 1. Edges from task.dependsOn
    for (const task of workflow.tasks) {
      for (const prereqId of task.dependsOn || []) {
        const pairKey = `${prereqId}->${task.id}`;
        if (addedPairs.has(pairKey)) continue;
        addedPairs.add(pairKey);

        const isCriticalEdge = critTaskIds.has(prereqId) && critTaskIds.has(task.id);

        edgeList.push({
          id: `e-${prereqId}-${task.id}`,
          source: prereqId,
          target: task.id,
          animated: isCriticalEdge,
          style: {
            stroke: isCriticalEdge ? "rgb(244, 63, 94)" : "hsl(var(--border))",
            strokeWidth: isCriticalEdge ? 2.5 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCriticalEdge ? "rgb(244, 63, 94)" : "hsl(var(--muted-foreground))",
            width: 16,
            height: 16,
          },
        });
      }
    }

    // 2. Explicit dependencies from workflow.dependencies
    for (const dep of workflow.dependencies || []) {
      const pairKey = `${dep.sourceTaskId}->${dep.targetTaskId}`;
      if (addedPairs.has(pairKey)) continue;
      addedPairs.add(pairKey);

      const isCriticalEdge =
        critTaskIds.has(dep.sourceTaskId) && critTaskIds.has(dep.targetTaskId);

      edgeList.push({
        id: `e-${dep.id}`,
        source: dep.sourceTaskId,
        target: dep.targetTaskId,
        animated: isCriticalEdge,
        style: {
          stroke: isCriticalEdge ? "rgb(244, 63, 94)" : "hsl(var(--border))",
          strokeWidth: isCriticalEdge ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCriticalEdge ? "rgb(244, 63, 94)" : "hsl(var(--muted-foreground))",
          width: 16,
          height: 16,
        },
      });
    }

    return edgeList;
  }, [workflow, critTaskIds]);

  const selectedTask = React.useMemo(
    () => workflow.tasks.find((t) => t.id === selectedTaskId),
    [workflow, selectedTaskId]
  );

  return (
    <div className="space-y-4">
      {/* Visualizer Header Bar & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Critical Path ({critTaskIds.size} Tasks)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Standard Task</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Dependency Flow</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>DAG Depth: <strong className="text-foreground">{maxLevel + 1} Levels</strong></span>
          <span>•</span>
          <span>Edges: <strong className="text-foreground">{edges.length} Links</strong></span>
        </div>
      </div>

      {/* Main React Flow Graph Canvas */}
      <div className="h-[540px] w-full border rounded-xl overflow-hidden bg-muted/10 relative shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => setSelectedTaskId(node.id)}
          onPaneClick={() => setSelectedTaskId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={18} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
          <Controls position="top-left" className="bg-background/80 backdrop-blur border rounded-md" />
          <MiniMap
            position="bottom-right"
            nodeColor={(n) => (critTaskIds.has(n.id) ? "#f43f5e" : "#94a3b8")}
            className="bg-background/90 border rounded-lg overflow-hidden shadow-md"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Selected Task Inspector Drawer */}
      {selectedTask ? (
        <Card className="border-primary/40 bg-card/60 backdrop-blur animate-in fade-in-50">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                  {selectedTask.id}
                </span>
                <h4 className="font-bold text-sm text-foreground">{selectedTask.name}</h4>
                {critTaskIds.has(selectedTask.id) && (
                  <Badge variant="destructive" className="text-[10px] uppercase">
                    Critical Path (Zero Slack)
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] capitalize">
                  {selectedTask.status.replace("_", " ")}
                </Badge>
              </div>

              {selectedTask.description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                  {selectedTask.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span>
                  <strong>Prerequisites:</strong>{" "}
                  {selectedTask.dependsOn.length > 0 ? selectedTask.dependsOn.join(", ") : "None (Root task)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {selectedTask.estimatedDuration} minutes
              </div>

              {selectedTask.assignedMemberId && membersById.has(selectedTask.assignedMemberId) && (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {membersById.get(selectedTask.assignedMemberId)!.name}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-xs text-center text-muted-foreground">
          Click on any node in the graph to inspect its parameters, prerequisites, and critical path metrics.
        </p>
      )}
    </div>
  );
}
