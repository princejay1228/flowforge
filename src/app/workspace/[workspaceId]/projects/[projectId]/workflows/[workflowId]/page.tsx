"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useWorkflow } from "@/hooks/use-workflows";
import { useMembers } from "@/hooks/use-members";
import { WorkflowEditor } from "@/features/workflow";
import { WorkflowGraph, DFAGraph, GanttChart } from "@/features/visualization";
import { scheduleWorkflow } from "@/features/scheduler";
import { buildWorkflowDFA } from "@/features/dfa";
import { WorkflowComplexityBadge, calculateWorkflowComplexity } from "@/features/validation";
import { ReportExportButton } from "@/features/reports";
import { Badge } from "@/components/ui/badge";
import { Clock, Layers, Sparkles } from "lucide-react";

export default function WorkflowDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const workflowId = params.workflowId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { project, isLoading: projLoading } = useProject(projectId);
  const { workflow, isLoading: wfLoading } = useWorkflow(workflowId);
  const { members, isLoading: membersLoading } = useMembers(workspaceId);

  const [activeTab, setActiveTab] = React.useState<"editor" | "graph" | "schedule" | "dfa">("editor");

  const schedule = React.useMemo(() => workflow ? scheduleWorkflow(workflow, members || []) : null, [workflow, members]);
  const dfa = React.useMemo(() => workflow ? buildWorkflowDFA(workflow) : null, [workflow]);
  const complexity = React.useMemo(() => workflow ? calculateWorkflowComplexity(workflow) : null, [workflow]);

  if (wsLoading || projLoading || wfLoading || membersLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading workflow...
        </div>
      </div>
    );
  }

  if (!workspace || !project || !workflow) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Workflow Not Found</h2>
          <p className="text-muted-foreground text-sm">
            The workflow you are looking for does not exist or was deleted.
          </p>
          <Button onClick={() => router.push(`/workspace/${workspaceId}/projects/${projectId}`)} variant="outline">
            Return to Project
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader workspaceId={workspace.id} workspaceName={workspace.name} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-6">
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
              <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
              <Badge variant="outline" className="capitalize">
                {workflow.domain.replace(/_/g, " ")}
              </Badge>
              <WorkflowComplexityBadge workflow={workflow} />
            </div>
            <p className="text-muted-foreground max-w-3xl text-sm">
              {workflow.description || "Review, simulate, and optimize deterministic workflow execution."}
            </p>

            {/* Quick Engine Metrics Strip */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Layers className="h-3.5 w-3.5 text-primary" />
                {workflow.tasks.length} Tasks ({workflow.dependencies.length} Dependencies)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-sky-500" />
                {schedule ? `${schedule.totalDurationMinutes}m Total` : "Calculating schedule..."}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                <Sparkles className="h-3.5 w-3.5" />
                {schedule ? `${schedule.criticalPathTaskIds.length} Critical Path Tasks` : "No schedule"}
              </span>
              {dfa && (
                <>
                  <span>•</span>
                  <span>{dfa.states.length} DFA States ({dfa.transitions.length} Transitions)</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ReportExportButton 
              workflow={workflow}
              project={project}
              members={members}
              schedule={schedule}
              dfa={dfa}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-b pb-4">
          <Button 
            variant={activeTab === "editor" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab("editor")}
          >
            Tasks & Edit
          </Button>
          <Button 
            variant={activeTab === "graph" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab("graph")}
          >
            Dependency Graph
          </Button>
          <Button 
            variant={activeTab === "schedule" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab("schedule")}
          >
            Schedule & Gantt
          </Button>
          <Button 
            variant={activeTab === "dfa" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveTab("dfa")}
          >
            DFA Machine
          </Button>
        </div>

        {activeTab === "editor" && <WorkflowEditor workflow={workflow} members={members} />}
        {activeTab === "graph" && <WorkflowGraph workflow={workflow} schedule={schedule} members={members} />}
        
        {activeTab === "schedule" && schedule && (
          <div className="space-y-4">
            {schedule.issues.length > 0 && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                <strong>Schedule Issues:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {schedule.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              </div>
            )}
            <GanttChart workflow={workflow} schedule={schedule} />
          </div>
        )}

        {activeTab === "dfa" && dfa && <DFAGraph dfa={dfa} />}

      </main>
    </div>
  );
}
