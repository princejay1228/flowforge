"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, GitGraph, Cpu, FileText, Edit3, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useWorkflows } from "@/hooks/use-workflows";
import { useMembers } from "@/hooks/use-members";
import { GanttChart } from "@/features/visualization";
import { scheduleWorkflow } from "@/features/scheduler";

export default function ProjectSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { project, isLoading: projLoading } = useProject(projectId);
  const { workflows, isLoading: wfLoading } = useWorkflows(projectId);
  const { members, isLoading: membersLoading } = useMembers(workspaceId);

  const [selectedWfId, setSelectedWfId] = React.useState<string | null>(null);

  const activeWorkflow = React.useMemo(() => {
    if (!workflows || workflows.length === 0) return null;
    if (selectedWfId) {
      const found = workflows.find((w) => w.id === selectedWfId);
      if (found) return found;
    }
    return workflows[0];
  }, [workflows, selectedWfId]);

  const schedule = React.useMemo(() => {
    if (!activeWorkflow) return null;
    return scheduleWorkflow(activeWorkflow, members || []);
  }, [activeWorkflow, members]);

  const memberMap = React.useMemo(() => {
    return new Map((members || []).map((m) => [m.id, m]));
  }, [members]);

  const isLoading = wsLoading || projLoading || wfLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Calculating CPM schedule...
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
                <Calendar className="h-7 w-7 text-primary" />
                <span>Critical Path Schedule & Gantt</span>
              </h1>
              {schedule && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {schedule.totalDurationMinutes} minutes total
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-3xl text-sm">
              Deterministic Critical Path Method (CPM) calculations, early/late start windows, float margins, and interactive Gantt chart.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/visualization`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <GitGraph className="h-4 w-4" />
                <span>Graph</span>
              </Button>
            </Link>
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/dfa`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Cpu className="h-4 w-4" />
                <span>DFA</span>
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
                <Button size="sm" className="gap-1.5">
                  <Edit3 className="h-4 w-4" />
                  <span>Full Editor</span>
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

        {/* Schedule Display */}
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
        ) : !schedule ? (
          <div className="py-12 text-center text-muted-foreground">Unable to compute schedule.</div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase">Total Duration</CardDescription>
                  <CardTitle className="text-2xl font-bold flex items-center justify-between">
                    <span>{schedule.totalDurationMinutes} min</span>
                    <Clock className="h-5 w-5 text-sky-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    ~{(schedule.totalDurationMinutes / 60).toFixed(1)} hours of workload
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase">Critical Path Tasks</CardDescription>
                  <CardTitle className="text-2xl font-bold flex items-center justify-between text-rose-500">
                    <span>{schedule.criticalPathTaskIds.length}</span>
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Tasks that determine minimum timeline</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase">Non-Critical Tasks</CardDescription>
                  <CardTitle className="text-2xl font-bold flex items-center justify-between text-emerald-500">
                    <span>{activeWorkflow.tasks.length - schedule.criticalPathTaskIds.length}</span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Tasks with positive float buffer</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs font-semibold uppercase">Assigned Members</CardDescription>
                  <CardTitle className="text-2xl font-bold flex items-center justify-between">
                    <span>{new Set(activeWorkflow.tasks.map((t) => t.assignedMemberId).filter(Boolean)).size}</span>
                    <Calendar className="h-5 w-5 text-indigo-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Team members allocated</p>
                </CardContent>
              </Card>
            </div>

            {/* Schedule Issues warning if any */}
            {schedule.issues.length > 0 && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Scheduling Warnings / Constraints</span>
                </div>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                  {schedule.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gantt Chart */}
            <GanttChart workflow={activeWorkflow} schedule={schedule} />

            {/* Detailed CPM Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Schedule Matrix</CardTitle>
                <CardDescription>
                  Detailed timeline windows, topological dependencies, and critical path designation.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-xs text-left">
                  <thead className="border-b bg-muted/40 uppercase tracking-wider font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3">Task Name</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Timeline Window (ES - EF)</th>
                      <th className="p-3">Dependencies</th>
                      <th className="p-3">Assignee</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Critical Path?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {schedule.scheduledTasks.map((st) => {
                      const task = activeWorkflow.tasks.find((t) => t.id === st.taskId);
                      if (!task) return null;
                      const member = task.assignedMemberId ? memberMap.get(task.assignedMemberId) : null;
                      return (
                        <tr key={st.taskId} className={st.isCriticalPath ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}>
                          <td className="p-3 font-medium">
                            <div className="text-foreground font-semibold">{task.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs">{task.description}</div>
                          </td>
                          <td className="p-3 font-mono">{task.estimatedDuration}m</td>
                          <td className="p-3 font-mono font-medium">
                            {st.earliestStartMinutes}m – {st.earliestFinishMinutes}m
                          </td>
                          <td className="p-3">
                            {task.dependsOn.length === 0 ? (
                              <span className="text-muted-foreground italic">Root Task</span>
                            ) : (
                              <span>{task.dependsOn.length} prereq{task.dependsOn.length > 1 ? "s" : ""}</span>
                            )}
                          </td>
                          <td className="p-3">
                            {member ? member.name : <span className="text-muted-foreground italic">Unassigned</span>}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {task.status.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {st.isCriticalPath ? (
                              <Badge variant="destructive" className="text-[10px]">CRITICAL PATH</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Buffered</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
