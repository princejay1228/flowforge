"use client";

import * as React from "react";
import ReactFlow, { Background, Controls, Node, Edge, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import type { DFA, DFAState } from "@/features/dfa";
import type { Workflow } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Cpu } from "lucide-react";

interface DFAGraphProps {
  dfa: DFA;
  workflow?: Workflow;
}

export function DFAGraph({ dfa, workflow }: DFAGraphProps) {
  const [selectedStateId, setSelectedStateId] = React.useState<string | null>(null);

  const taskMap = React.useMemo(() => {
    if (!workflow) return new Map();
    return new Map(workflow.tasks.map((t) => [t.id, t]));
  }, [workflow]);

  // Compute clean topological left-to-right positions by completion level
  const { nodes, nodePositions } = React.useMemo(() => {
    const levelBuckets = new Map<number, DFAState[]>();
    for (const s of dfa.states) {
      const lvl = s.completedTaskIds.length;
      if (!levelBuckets.has(lvl)) levelBuckets.set(lvl, []);
      levelBuckets.get(lvl)!.push(s);
    }

    const positions = new Map<string, { x: number; y: number }>();

    const COLUMN_SPACING = 340;
    const ROW_SPACING = 150;

    Array.from(levelBuckets.entries()).forEach(([level, statesInLevel]) => {
      const totalInLevel = statesInLevel.length;
      statesInLevel.forEach((state, idx) => {
        // Center states vertically per level
        const yOffset = (idx - (totalInLevel - 1) / 2) * ROW_SPACING;
        positions.set(state.id, {
          x: 60 + level * COLUMN_SPACING,
          y: 220 + yOffset,
        });
      });
    });

    const totalTasksCount = workflow?.tasks.length || dfa.alphabet.length;

    const flowNodes: Node[] = dfa.states.map((state) => {
      const pos = positions.get(state.id) || { x: 100, y: 100 };
      const isSelected = selectedStateId === state.id;

      // Determine human-readable task subtitle
      let primaryTaskLabel = "Ready to Begin";
      if (state.isStart) {
        primaryTaskLabel = "Workflow Initialized";
      } else if (state.isAccept) {
        primaryTaskLabel = "All Tasks Completed";
      } else if (state.lastCompletedTaskName) {
        primaryTaskLabel = `✓ ${state.lastCompletedTaskName}`;
      } else if (state.completedTaskIds.length > 0) {
        const lastId = state.completedTaskIds[state.completedTaskIds.length - 1];
        const lastTask = taskMap.get(lastId);
        primaryTaskLabel = `✓ ${lastTask ? lastTask.name : lastId}`;
      }

      return {
        id: state.id,
        position: pos,
        data: {
          label: (
            <div className="p-2.5 flex flex-col items-start text-left w-full h-full justify-between">
              <div className="flex items-center justify-between w-full gap-1 mb-1">
                <span className="font-bold text-xs tracking-tight truncate max-w-[130px] font-mono">
                  {state.name}
                </span>
                {state.isStart && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-primary h-4">START</Badge>
                )}
                {state.isAccept && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-600 h-4">ACCEPT</Badge>
                )}
              </div>
              <div
                className="text-[11px] text-foreground font-semibold line-clamp-2 leading-snug w-full"
                title={primaryTaskLabel}
              >
                {primaryTaskLabel}
              </div>
              {!state.isStart && !state.isAccept && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  {state.completedTaskIds.length} of {totalTasksCount} tasks
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: state.isStart
            ? "hsl(var(--primary) / 0.12)"
            : state.isAccept
            ? "hsl(var(--success, 142 71% 45%) / 0.15)"
            : "hsl(var(--card))",
          border: isSelected
            ? "2px solid hsl(var(--primary))"
            : state.isAccept
            ? "2px solid #10b981"
            : state.isStart
            ? "2px solid hsl(var(--primary))"
            : "1px solid hsl(var(--border))",
          borderRadius: "10px",
          width: 230,
          minHeight: 74,
          padding: 0,
          boxShadow: isSelected ? "0 0 12px hsl(var(--primary) / 0.4)" : "0 2px 6px rgba(0,0,0,0.15)",
          color: "hsl(var(--card-foreground))",
          cursor: "pointer",
        },
      };
    });

    return { nodes: flowNodes, nodePositions: positions };
  }, [dfa, selectedStateId, taskMap, workflow]);

  // Edges with prominent task name labels
  const edges: Edge[] = React.useMemo(() => {
    return dfa.transitions.map((t, i) => {
      // Find clean human-readable label
      const taskName = t.taskName || (t.taskId ? taskMap.get(t.taskId)?.name : null) || t.symbol.replace(/^COMPLETE_/, "");
      const shortTaskName = taskName.length > 24 ? taskName.slice(0, 22) + "…" : taskName;

      return {
        id: `t-${i}-${t.fromStateId}-${t.toStateId}`,
        source: t.fromStateId,
        target: t.toStateId,
        label: `→ ${shortTaskName}`,
        labelStyle: {
          fontSize: 10,
          fontWeight: 600,
          fill: "#f8fafc",
        },
        labelBgStyle: {
          fill: "#0f172a",
          fillOpacity: 0.95,
          stroke: "#3b82f6",
          strokeWidth: 1,
        },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 6,
        animated: true,
        style: {
          stroke: "#6366f1",
          strokeWidth: 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#6366f1",
        },
      };
    });
  }, [dfa, taskMap]);

  const selectedState = React.useMemo(() => {
    if (!selectedStateId) return null;
    return dfa.states.find((s) => s.id === selectedStateId) || null;
  }, [dfa, selectedStateId]);

  const outgoingTransitions = React.useMemo(() => {
    if (!selectedStateId) return [];
    return dfa.transitions.filter((t) => t.fromStateId === selectedStateId);
  }, [dfa, selectedStateId]);

  return (
    <div className="space-y-4">
      <div className="h-[520px] w-full border rounded-xl overflow-hidden bg-muted/10 relative shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_, node) => setSelectedStateId(node.id)}
          onPaneClick={() => setSelectedStateId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
          <Controls position="top-left" className="bg-background/80 backdrop-blur border rounded-md" />
        </ReactFlow>
      </div>

      {/* State Inspector Card */}
      {selectedState ? (
        <Card className="border-primary/40 bg-card/70 backdrop-blur">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground">{selectedState.name}</span>
                {selectedState.isStart && <Badge className="text-[10px] bg-primary">Start State</Badge>}
                {selectedState.isAccept && <Badge className="text-[10px] bg-emerald-600">Accept State</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">
                Completed: <strong>{selectedState.completedTaskIds.length}</strong> tasks
              </span>
            </div>

            {selectedState.lastCompletedTaskName && (
              <div className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Triggered by completing: <strong>{selectedState.lastCompletedTaskName}</strong></span>
              </div>
            )}

            {/* List all completed tasks by name */}
            {selectedState.completedTaskIds.length > 0 && (
              <div className="pt-2 border-t text-xs space-y-1.5">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Tasks Completed in this State ({selectedState.completedTaskIds.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedState.completedTaskIds.map((id) => {
                    const task = taskMap.get(id);
                    return (
                      <Badge key={id} variant="secondary" className="text-[11px] font-medium py-0.5 px-2 bg-muted/70">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500 shrink-0" />
                        <span>{task ? task.name : id}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {outgoingTransitions.length > 0 && (
              <div className="pt-2 border-t text-xs space-y-1.5">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Available Outgoing Transitions (Next Tasks):
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {outgoingTransitions.map((t, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-md border bg-muted/40 text-foreground font-medium flex items-center gap-1.5"
                    >
                      <ArrowRight className="h-3 w-3 text-primary" />
                      <span>{t.taskName || (t.taskId ? taskMap.get(t.taskId)?.name : null) || t.symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-xs text-center text-muted-foreground">
          Click on any automaton state to inspect its completed tasks and available step transitions.
        </p>
      )}
    </div>
  );
}
