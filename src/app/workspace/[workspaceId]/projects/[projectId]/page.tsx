"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Play, Settings, ListTree, FileText } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useMembers } from "@/hooks/use-members";
import { useWorkflows } from "@/hooks/use-workflows";
import { useDocuments } from "@/hooks/use-documents";
import { Badge } from "@/components/ui/badge";
import { GenerateWorkflowDialog } from "@/features/projects";
import { DocumentUploader, DocumentList } from "@/features/documents";

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { project, isLoading: projLoading } = useProject(projectId);
  const { members, isLoading: membersLoading } = useMembers(workspaceId);
  const { workflows, isLoading: workflowsLoading } = useWorkflows(projectId);
  const { documents, isLoading: documentsLoading } = useDocuments(workspaceId, projectId);

  const [generateOpen, setGenerateOpen] = React.useState(false);

  if (wsLoading || projLoading || membersLoading || documentsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading project details...
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
          <p className="text-muted-foreground text-sm">
            The project you are looking for does not exist or was deleted.
          </p>
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

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link href={`/workspace/${workspace.id}/projects`}>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground pl-0">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Projects</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize">{project.status}</Badge>
              {project.deadline && (
                <span className="text-xs text-muted-foreground">Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl mt-4 whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Link href={`/workspace/${workspace.id}/projects/${project.id}/reports`}>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4 text-rose-500" />
                <span>Audit Reports</span>
              </Button>
            </Link>
            <Button 
              size="sm" 
              className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-0"
              onClick={() => setGenerateOpen(true)}
            >
              <Play className="h-4 w-4" />
              <span>Generate Workflow</span>
            </Button>
          </div>
        </div>

        {/* Engine Pipeline Analysis Tools */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={`/workspace/${workspace.id}/projects/${project.id}/visualization`}>
            <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">DAG Visualizer</span>
                  <ListTree className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base mt-1">Dependency Graph</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Topological rendering with critical path inspection and node tracking.
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspace/${workspace.id}/projects/${project.id}/schedule`}>
            <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Critical Path</span>
                  <Play className="h-4 w-4 text-sky-500" />
                </div>
                <CardTitle className="text-base mt-1">CPM Schedule & Gantt</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Earliest/latest start times, slack buffer analysis, and resource timeline.
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspace/${workspace.id}/projects/${project.id}/dfa`}>
            <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Formal Language</span>
                  <ListTree className="h-4 w-4 text-emerald-500" />
                </div>
                <CardTitle className="text-base mt-1">DFA State Machine</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                Deterministic 5-tuple automaton with live interactive step simulator.
              </CardContent>
            </Card>
          </Link>

          <Link href={`/workspace/${workspace.id}/projects/${project.id}/reports`}>
            <Card className="hover:border-primary/50 transition-all cursor-pointer h-full">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Audit Engine</span>
                  <FileText className="h-4 w-4 text-rose-500" />
                </div>
                <CardTitle className="text-base mt-1">Feasibility & PDF</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                McCabe complexity analysis, validation rules, and exportable PDF audit.
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col justify-between sm:col-span-2 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <ListTree className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Workflows</CardTitle>
                    <CardDescription>Compiled Pipelines</CardDescription>
                  </div>
                </div>
                {workflows.length > 0 && (
                  <Link href={`/workspace/${workspace.id}/projects/${project.id}/visualization`}>
                    <Button variant="ghost" size="sm" className="text-xs text-primary">
                      View Visualizer →
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {workflowsLoading ? (
                <p>Loading workflows...</p>
              ) : workflows.length === 0 ? (
                <p>No workflows generated yet. Click &quot;Generate Workflow&quot; to have the AI analyze the project objectives and team skills to create a structured workflow.</p>
              ) : (
                <div className="space-y-3 mt-2">
                  {workflows.map(wf => (
                    <div key={wf.id} className="p-3 border rounded-md hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <Link href={`/workspace/${workspace.id}/projects/${project.id}/workflows/${wf.id}`} className="font-semibold text-foreground hover:underline">
                          {wf.name}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {wf.tasks.length} tasks • {wf.dependencies.length} dependencies
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">{wf.domain}</Badge>
                        <Link href={`/workspace/${workspace.id}/projects/${project.id}/workflows/${wf.id}`}>
                          <Button size="sm" variant="default" className="text-xs h-7 px-2.5">
                            Editor
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Project Context Documents</CardTitle>
              <CardDescription>Upload .txt or .md files to provide extra context for the AI when generating workflows.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <DocumentUploader workspaceId={workspace.id} projectId={project.id} />
              <DocumentList workspaceId={workspace.id} projectId={project.id} />
            </CardContent>
          </Card>
        </div>
      </main>

      <GenerateWorkflowDialog 
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        project={project}
        members={members}
        documents={documents}
      />
    </div>
  );
}
