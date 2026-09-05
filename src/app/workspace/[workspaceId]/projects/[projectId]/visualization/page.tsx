"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitGraph, Calendar, Cpu, FileText, Edit3 } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useWorkflows } from "@/hooks/use-workflows";
import { useMembers } from "@/hooks/use-members";
import { WorkflowGraph } from "@/features/visualization";
import { scheduleWorkflow } from "@/features/scheduler";
import { WorkflowComplexityBadge } from "@/features/validation";

export default function ProjectVisualizationPage() {
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

  const isLoading = wsLoading || projLoading || wfLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading graph visualization...
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
                <GitGraph className="h-7 w-7 text-primary" />
                <span>Dependency Graph Visualizer</span>
              </h1>
              {activeWorkflow && <WorkflowComplexityBadge workflow={activeWorkflow} />}
            </div>
            <p className="text-muted-foreground max-w-3xl text-sm">
              Interactive topological DAG rendering with critical path highlighting, task inspection, and dependency tracing.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/schedule`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Schedule</span>
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

        {/* Graph Display */}
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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{activeWorkflow.name}</span>
                <span>•</span>
                <span>{activeWorkflow.tasks.length} tasks</span>
                <span>•</span>
                <span>{activeWorkflow.dependencies.length} dependencies</span>
                {schedule && (
                  <>
                    <span>•</span>
                    <span className="text-rose-500 font-medium">
                      {schedule.criticalPathTaskIds.length} critical path tasks
                    </span>
                  </>
                )}
              </div>
              <Badge variant="outline" className="capitalize">
                {activeWorkflow.domain.replace(/_/g, " ")}
              </Badge>
            </div>

            <WorkflowGraph workflow={activeWorkflow} schedule={schedule} members={members} />
          </div>
        )}
      </main>
    </div>
  );
}
