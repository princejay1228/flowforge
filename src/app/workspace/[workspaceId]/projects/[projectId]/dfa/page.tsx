"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cpu, Play, GitGraph, Calendar, FileText, Edit3, Terminal, CheckCircle2 } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useWorkflows } from "@/hooks/use-workflows";
import { DFAGraph } from "@/features/visualization";
import { buildWorkflowDFA, DFAStepperDialog } from "@/features/dfa";

export default function ProjectDFAPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { project, isLoading: projLoading } = useProject(projectId);
  const { workflows, isLoading: wfLoading } = useWorkflows(projectId);

  const [selectedWfId, setSelectedWfId] = React.useState<string | null>(null);
  const [stepperOpen, setStepperOpen] = React.useState(false);

  const activeWorkflow = React.useMemo(() => {
    if (!workflows || workflows.length === 0) return null;
    if (selectedWfId) {
      const found = workflows.find((w) => w.id === selectedWfId);
      if (found) return found;
    }
    return workflows[0];
  }, [workflows, selectedWfId]);

  const dfa = React.useMemo(() => {
    if (!activeWorkflow) return null;
    return buildWorkflowDFA(activeWorkflow);
  }, [activeWorkflow]);

  const isLoading = wsLoading || projLoading || wfLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Compiling DFA state machine...
        </div>
      </div>
    );
  }

  if (!workspace || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Project Not Found</h2>
          <Button onClick={() => router.push(`/workspace/${workspaceId}/projects`)} variant="outline">
            Return to Projects
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader workspaceId={workspace.id} workspaceName={workspace.name} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link href={`/workspace/${workspace.id}/projects/${project.id}`}>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground pl-0">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to {project.name}</span>
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Cpu className="h-7 w-7 text-primary" />
                <span>Deterministic Finite Automaton (DFA)</span>
              </h1>
              {dfa && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {dfa.states.length} States • {dfa.transitions.length} Transitions
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-3xl text-sm">
              Rigorous formal language representation (Q, Σ, δ, q0, F) guaranteeing deterministic execution and zero deadlocks.
            </p>
          </div>

          {/* Quick links & Stepper trigger */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {activeWorkflow && (
              <Button onClick={() => setStepperOpen(true)} className="gap-1.5 shadow-sm">
                <Play className="h-4 w-4" />
                <span>Interactive Stepper</span>
              </Button>
            )}
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/visualization`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <GitGraph className="h-4 w-4" />
                <span>Graph</span>
              </Button>
            </Link>
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/schedule`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Schedule</span>
              </Button>
            </Link>
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/reports`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Reports</span>
              </Button>
            </Link>
            {activeWorkflow && (
              <Link href={`/workspace/${workspace.id}/projects/${project.id}/workflows/${activeWorkflow.id}`}>
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Edit3 className="h-4 w-4" />
                  <span>Editor</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Workflow Switcher if multiple */}
        {workflows.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Workflow:</span>
            {workflows.map((wf) => (
              <Button
                key={wf.id}
                variant={wf.id === activeWorkflow?.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWfId(wf.id)}
              >
                {wf.name}
              </Button>
            ))}
          </div>
        )}

        {/* DFA Display */}
        {!activeWorkflow ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Workflows Found</CardTitle>
              <CardDescription>
                This project does not have any workflows generated yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/workspace/${workspace.id}/projects/${project.id}`}>
                <Button>Go to Project to Generate Workflow</Button>
              </Link>
            </CardContent>
          </Card>
        ) : !dfa ? (
          <div className="py-12 text-center text-muted-foreground">Unable to construct DFA.</div>
        ) : (
          <div className="space-y-6">
            {/* Visual State Graph */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/20">
                <div>
                  <CardTitle className="text-base">State Transition Diagram</CardTitle>
                  <CardDescription>
                    Visual mapping of automaton states from start (q0) through topological milestones to accept states (F).
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setStepperOpen(true)} className="gap-1.5 text-xs">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Step Simulator</span>
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <DFAGraph dfa={dfa} workflow={activeWorkflow} />
              </CardContent>
            </Card>

            {/* Formal 5-Tuple Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Alphabet (Σ) & States (Q)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">Alphabet (Σ) — {dfa.alphabet.length} symbols:</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {dfa.alphabet.map((sym) => {
                        const task = activeWorkflow.tasks.find(t => `COMPLETE_${t.id}` === sym);
                        return (
                          <Badge key={sym} variant="outline" className="text-[11px] flex items-center gap-1">
                            <span>{task ? task.name : sym}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <span className="font-semibold text-foreground">States (Q) — {dfa.states.length} states:</span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dfa.states.map((s) => (
                        <div key={s.id} className="p-2 border rounded-md flex items-center justify-between bg-muted/30">
                          <div>
                            <div className="font-semibold">{s.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                              {s.lastCompletedTaskName ? `✓ ${s.lastCompletedTaskName}` : s.id}
                            </div>
                          </div>
                          {s.isStart && <Badge className="text-[9px] bg-primary">START</Badge>}
                          {s.isAccept && <Badge variant="default" className="text-[9px] bg-emerald-600">ACCEPT</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Transition Table (δ: Q × Σ → Q)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b bg-muted/40 uppercase font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Current State (q)</th>
                        <th className="p-2.5">Executed Task (σ)</th>
                        <th className="p-2.5">Next State (δ(q, σ))</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dfa.transitions.map((t, idx) => {
                        const fromState = dfa.states.find(s => s.id === t.fromStateId);
                        const toState = dfa.states.find(s => s.id === t.toStateId);

                        return (
                          <tr key={idx} className="hover:bg-muted/50">
                            <td className="p-2.5">
                              <div className="font-semibold text-foreground">{fromState ? fromState.name : t.fromStateId}</div>
                              <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">{t.fromStateId}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-foreground">{t.taskName || t.symbol}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">{t.symbol}</div>
                            </td>
                            <td className="p-2.5">
                              <div className="font-semibold text-primary">{toState ? toState.name : t.toStateId}</div>
                              <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[140px]">{t.toStateId}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Stepper Dialog */}
      {activeWorkflow && (
        <DFAStepperDialog
          workflow={activeWorkflow}
          open={stepperOpen}
          onOpenChange={setStepperOpen}
        />
      )}
    </div>
  );
}
