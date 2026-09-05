"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, FolderGit2 } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProject } from "@/hooks/use-projects";
import { useWorkflows } from "@/hooks/use-workflows";

export default function ProjectWorkflowIndexPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { project, isLoading: projLoading } = useProject(projectId);
  const { workflows, isLoading: wfLoading } = useWorkflows(projectId);

  // Automatically redirect to the first workflow if available
  React.useEffect(() => {
    if (!wfLoading && workflows && workflows.length > 0) {
      router.replace(`/workspace/${workspaceId}/projects/${projectId}/workflows/${workflows[0].id}`);
    }
  }, [wfLoading, workflows, workspaceId, projectId, router]);

  const isLoading = wsLoading || projLoading || wfLoading;

  if (isLoading || (workflows && workflows.length > 0)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Navigating to workflow editor...
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

      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-16 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">No Workflows in {project.name}</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            This project does not have any workflows generated yet. Return to the project dashboard to generate a workflow using AI or upload context documents.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Link href={`/workspace/${workspace.id}/projects/${project.id}`}>
            <Button className="gap-2">
              <FolderGit2 className="h-4 w-4" />
              <span>Back to Project Dashboard</span>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
