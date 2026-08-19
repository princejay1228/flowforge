"use client";

import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Plus, FolderGit2 } from "lucide-react";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  WorkspaceList,
  WorkspaceFormDialog,
  DeleteWorkspaceDialog,
} from "@/features/workspace";
import type { Workspace } from "@/types/workspace";

export default function WorkspacesPage() {
  const { workspaces, isLoading, createWorkspace, updateWorkspace, deleteWorkspace } =
    useWorkspaces();

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingWorkspace, setEditingWorkspace] = React.useState<Workspace | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = React.useState<Workspace | null>(
    null
  );

  const handleOpenCreate = () => {
    setEditingWorkspace(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (ws: Workspace) => {
    setDeletingWorkspace(ws);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (name: string, description?: string) => {
    if (editingWorkspace) {
      return await updateWorkspace(editingWorkspace.id, name, description);
    } else {
      return await createWorkspace(name, description);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    return await deleteWorkspace(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FolderGit2 className="h-6 w-6 text-primary" />
              <span>Workspaces</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Select or create a workspace to manage team members, resources, and compiled processes.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span>Create Workspace</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading workspaces from IndexedDB...
          </div>
        ) : (
          <WorkspaceList
            workspaces={workspaces}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onCreateNew={handleOpenCreate}
          />
        )}
      </main>

      <WorkspaceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        workspace={editingWorkspace}
        onSubmit={handleFormSubmit}
      />

      <DeleteWorkspaceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workspace={deletingWorkspace}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
