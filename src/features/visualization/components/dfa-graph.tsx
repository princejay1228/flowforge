"use client";

import * as React from "react";
import ReactFlow, { Background, Controls, Node, Edge, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import type { DFA } from "@/features/dfa";

interface DFAGraphProps {
  dfa: DFA;
}

export function DFAGraph({ dfa }: DFAGraphProps) {
  const nodes: Node[] = React.useMemo(() => {
    return dfa.states.map((state, i) => ({
      id: state.id,
      position: { 
        // A very basic spiral/grid layout for DFA
        x: 100 + (i % 5) * 200, 
        y: 100 + Math.floor(i / 5) * 150 
      },
      data: { 
        label: (
          <div className="text-[10px] p-1 flex flex-col items-center">
            <div className="font-bold text-xs truncate max-w-[120px]">{state.name}</div>
            <div className="text-muted-foreground truncate max-w-[120px]">{state.id}</div>
          </div>
        )
      },
      style: {
        background: state.isStart ? "hsl(var(--primary) / 0.1)" : state.isAccept ? "hsl(var(--success) / 0.1)" : "hsl(var(--background))",
        border: state.isAccept ? "2px solid hsl(var(--success))" : state.isStart ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
        borderRadius: state.isAccept ? "50%" : "8px", // DFA states are typically circles, but due to text we'll use rounded unless accept
        width: 140,
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "hsl(var(--foreground))",
      },
    }));
  }, [dfa]);

  const edges: Edge[] = React.useMemo(() => {
    return dfa.transitions.map((t, i) => ({
      id: `t-${i}-${t.fromStateId}-${t.toStateId}`,
      source: t.fromStateId,
      target: t.toStateId,
      label: t.symbol,
      labelStyle: { fontSize: 9, fill: "hsl(var(--muted-foreground))" },
      labelBgStyle: { fill: "hsl(var(--background))", fillOpacity: 0.8 },
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));
  }, [dfa]);

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
