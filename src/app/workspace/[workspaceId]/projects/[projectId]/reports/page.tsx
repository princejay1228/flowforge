"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowUpRight, CheckCircle2, FileText, GitBranch, Layers, ShieldCheck, AlertTriangle } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useWorkflows } from "@/hooks/use-workflows";
import { useMembers } from "@/hooks/use-members";
import { ReportExportButton } from "@/features/reports";
import { calculateWorkflowComplexity } from "@/features/validation";
import { validateWorkflowSemantics } from "@/lib/validation/validate-workflow";
import { scheduleWorkflow } from "@/features/scheduler";
import { buildWorkflowDFA } from "@/features/dfa";

export default function ProjectReportsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { project, isLoading: projLoading } = useProject(projectId);
  const { workflows, isLoading: wfLoading } = useWorkflows(projectId);
  const { members, isLoading: membersLoading } = useMembers(workspaceId);

  const isLoading = wsLoading || projLoading || wfLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading audit reports...
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
          <Link href={`/workspace/${workspaceId}/projects`}>
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </main>
      </div>
    );
  }

  const totalTasks = workflows.reduce((sum, w) => sum + w.tasks.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader workspaceId={workspace.id} workspaceName={workspace.name} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* Header section */}
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
            <h1 className="text-3xl font-bold tracking-tight">Audit & Feasibility Reports</h1>
            <p className="text-muted-foreground max-w-2xl">
              Deterministic verification reports, McCabe cyclomatic complexity scores, CPM schedules, and executive PDF exports for {project.name}.
            </p>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Workflows</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                <span>{workflows.length}</span>
                <Layers className="h-5 w-5 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Active workflow pipelines</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Compiled Tasks</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                <span>{totalTasks}</span>
                <GitBranch className="h-5 w-5 text-sky-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Across all execution graphs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Active Team Pool</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                <span>{members.length}</span>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Verified skill assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Compiler Engine</CardDescription>
              <CardTitle className="text-3xl font-bold flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 text-xl font-semibold">Deterministic</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Kahn CPM + DFA State Space</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Reports List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Workflow Execution Audits</h2>
            <Badge variant="outline">{workflows.length} Documented</Badge>
          </div>

          {workflows.length === 0 ? (
            <Card className="p-8 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">No workflows found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Generate or create a workflow in this project first to view and download audit PDF reports.
              </p>
              <Link href={`/workspace/${workspace.id}/projects/${project.id}`}>
                <Button>Go to Project</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((wf) => {
                const complexity = calculateWorkflowComplexity(wf);
                const validation = validateWorkflowSemantics(wf, members);
                const schedule = scheduleWorkflow(wf, members);
                const dfa = buildWorkflowDFA(wf);

                return (
                  <Card key={wf.id} className="overflow-hidden">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg font-bold">{wf.name}</CardTitle>
                            <Badge variant="outline" className="capitalize">{wf.domain}</Badge>
                            <Badge
                              variant="secondary"
                              className={
                                complexity.rating === "Optimal"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : complexity.rating === "Moderate"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-destructive/10 text-destructive border-destructive/20"
                              }
                            >
                              McCabe M={complexity.cyclomaticComplexity} ({complexity.rating})
                            </Badge>
                            {validation.valid ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 bg-emerald-500/5 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Valid DAG
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Semantic Issues ({validation.issues.length})
                              </Badge>
                            )}
                          </div>
                          {wf.description && (
                            <CardDescription className="text-xs line-clamp-2 max-w-3xl">
                              {wf.description}
                            </CardDescription>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <ReportExportButton
                            workflow={wf}
                            project={project}
                            members={members}
                            schedule={schedule}
                            dfa={dfa}
                            variant="default"
                            size="sm"
                            label="Export Audit PDF"
                          />
                          <Link href={`/workspace/${workspace.id}/projects/${project.id}/workflows/${wf.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <span>Open Editor</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-3 border-t bg-muted/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Tasks & Edges</span>
                          <span className="font-semibold text-foreground">
                            {wf.tasks.length} tasks / {wf.dependencies.length} deps
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">CPM Critical Path</span>
                          <span className="font-semibold text-foreground">
                            {schedule ? `${schedule.criticalPathTaskIds.length} tasks (${schedule.totalDurationMinutes}m)` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">DFA States</span>
                          <span className="font-semibold text-foreground">
                            {dfa ? `${dfa.states.length} states / ${dfa.transitions.length} transitions` : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Health Score</span>
                          <span className="font-semibold text-foreground">
                            {complexity.healthScore} / 100
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
