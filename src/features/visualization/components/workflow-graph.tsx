"use client";

import * as React from "react";
import ReactFlow, { Background, Controls, Node, Edge, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import type { Workflow } from "@/types/workflow";

interface WorkflowGraphProps {
  workflow: Workflow;
}

export function WorkflowGraph({ workflow }: WorkflowGraphProps) {
  const nodes: Node[] = React.useMemo(() => {
    return workflow.tasks.map((task, i) => ({
      id: task.id,
      position: { x: 250 + (i % 3) * 200, y: 100 + Math.floor(i / 3) * 150 }, // Very basic layout
      data: { 
        label: (
          <div className="text-xs p-1">
            <div className="font-bold">{task.id}</div>
            <div>{task.name}</div>
            <div className="text-[10px] text-muted-foreground">{task.estimatedDuration}m</div>
          </div>
        )
      },
      style: {
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "6px",
        color: "hsl(var(--foreground))",
      },
    }));
  }, [workflow]);

  const edges: Edge[] = React.useMemo(() => {
    const e: Edge[] = [];
    
    // Convert dependsOn to edges
    for (const task of workflow.tasks) {
      for (const depId of task.dependsOn) {
        e.push({
          id: `e-${depId}-${task.id}`,
          source: depId,
          target: task.id,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    }
    
    // Add dependencies
    for (const dep of workflow.dependencies) {
      if (!e.find(x => x.source === dep.sourceTaskId && x.target === dep.targetTaskId)) {
        e.push({
          id: `e-ext-${dep.id}`,
          source: dep.sourceTaskId,
          target: dep.targetTaskId,
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    }
    return e;
  }, [workflow]);

  return (
    <div className="h-[500px] w-full border rounded-md bg-muted/20">
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
