"use client";

import React, { useState, useMemo } from "react";
import type { Workflow } from "@/types/workflow";
import { buildWorkflowDFA } from "../dfa-builder";
import { DFASimulator } from "../dfa-simulator";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, CheckCircle2, ArrowRight, Terminal } from "lucide-react";

interface DFAStepperDialogProps {
  workflow: Workflow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DFAStepperDialog({ workflow, open, onOpenChange }: DFAStepperDialogProps) {
  const dfa = useMemo(() => buildWorkflowDFA(workflow), [workflow]);
  const [simulatorKey, setSimulatorKey] = useState(0);

  // Maintain step history
  const [history, setHistory] = useState<Array<{ stateName: string; symbolExecuted?: string }>>([]);

  const simulator = useMemo(() => {
    return new DFASimulator(dfa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dfa, simulatorKey]);

  const currentState = simulator.getCurrentState();
  const availableTransitions = simulator.getAvailableTransitions();
  const isAccept = simulator.isAccept();

  const handleStep = (symbol: string) => {
    const success = simulator.transition(symbol);
    if (success) {
      const nextState = simulator.getCurrentState();
      setHistory((prev) => [...prev, { stateName: nextState.name, symbolExecuted: symbol }]);
    }
  };

  const handleReset = () => {
    setSimulatorKey((k) => k + 1);
    setHistory([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="DFA Interactive State Stepper"
      description={`Formal Automaton simulation for workflow: "${workflow.name}"`}
      className="sm:max-w-xl"
    >
      <div className="space-y-4 py-2">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Current Formal State
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold">{currentState?.name || "START"}</span>
              {isAccept && (
                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Accepting State (F)
                </Badge>
              )}
            </div>
            {currentState?.lastCompletedTaskName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed: <strong className="text-foreground">{currentState.lastCompletedTaskName}</strong>
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        {/* Transition Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5 text-primary" /> Execute Next Symbol (Σ)
          </label>

          {availableTransitions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableTransitions.map((sym) => {
                const taskId = sym.replace("COMPLETE_", "");
                const task = workflow.tasks.find((t) => t.id === taskId);

                return (
                  <Button
                    key={sym}
                    variant="outline"
                    size="sm"
                    className="justify-between text-xs h-auto py-2.5 px-3 border border-border/60 hover:border-primary/50 transition-all text-left"
                    onClick={() => handleStep(sym)}
                  >
                    <span className="truncate max-w-[160px]">{task ? task.name : sym}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-1 flex-shrink-0" />
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center border rounded-lg bg-muted/20 text-xs text-muted-foreground">
              {isAccept
                ? "Workflow execution complete! All final states reached."
                : "No valid transitions available from this state."}
            </div>
          )}
        </div>

        {/* Execution Log */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> Transition Trace ({history.length} steps)
          </span>
          <div className="bg-slate-950 text-slate-100 p-3 rounded-lg text-xs font-mono max-h-36 overflow-y-auto space-y-1">
            <p className="text-slate-400">q0 = START</p>
            {history.map((h, idx) => {
              const taskId = h.symbolExecuted?.replace("COMPLETE_", "");
              const task = workflow.tasks.find((t) => t.id === taskId);
              const label = task ? task.name : h.symbolExecuted;

              return (
                <p key={idx} className="flex items-center gap-1.5 text-emerald-400">
                  <span className="text-slate-500">[{idx + 1}]</span>
                  <span className="text-slate-300">δ(q, &quot;{label}&quot;) ➔</span>
                  <span className="font-semibold">{h.stateName}</span>
                </p>
              );
            })}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
// __wf_hash: V2F0ZXJtYXJrOiBDcmVhdGVkIGJ5IEpheWFkZWVwIGF0IDIwMjYtMDgtMTdUMTM6NTM6MDYrMDU6MzA=
