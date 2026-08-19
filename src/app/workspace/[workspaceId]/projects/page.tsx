"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { FolderGit2, Plus, ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useProjects } from "@/hooks/use-projects";
import { ProjectList, ProjectFormDialog, DeleteProjectDialog } from "@/features/projects";
import type { Project } from "@/types/workspace";

export default function WorkspaceProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { projects, isLoading: projectsLoading, createProject, updateProject, deleteProject } =
    useProjects(workspaceId);

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (p: Project) => {
    setDeletingProject(p);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (name: string, description: string) => {
    if (editingProject) {
      return await updateProject(editingProject.id, { name, description });
    } else {
      return await createProject({ name, description, status: "draft" });
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    return await deleteProject(id);
  };

  if (wsLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Loading workspace details...
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Workspace Not Found</h2>
          <p className="text-muted-foreground text-sm">
            The workspace you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/workspace")} variant="outline">
            Return to Workspaces
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader workspaceId={workspace.id} workspaceName={workspace.name} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/workspace/${workspace.id}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground pl-0">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to {workspace.name}</span>
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-primary" />
              <span>Projects</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Projects define your objectives and house workflows for <strong>{workspace.name}</strong>.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        </div>

        {projectsLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading projects...
          </div>
        ) : (
          <ProjectList
            projects={projects}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onCreateNew={handleOpenAdd}
          />
        )}
      </main>

      <ProjectFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        project={editingProject}
        onSubmit={handleFormSubmit}
      />

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        project={deletingProject}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
