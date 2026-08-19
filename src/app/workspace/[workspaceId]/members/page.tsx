"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Users, Plus, ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspaces";
import { useMembers, type CreateMemberPayload, type UpdateMemberPayload } from "@/hooks/use-members";
import { MemberList, MemberFormDialog, DeleteMemberDialog } from "@/features/members";
import type { Member } from "@/types/member";

export default function WorkspaceMembersPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { workspace, isLoading: wsLoading } = useWorkspace(workspaceId);
  const { members, isLoading: membersLoading, createMember, updateMember, deleteMember } =
    useMembers(workspaceId);

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<Member | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingMember, setDeletingMember] = React.useState<Member | null>(null);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setFormDialogOpen(true);
  };

  const handleOpenDelete = (m: Member) => {
    setDeletingMember(m);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (
    payload: CreateMemberPayload | UpdateMemberPayload
  ) => {
    if (editingMember) {
      return await updateMember(editingMember.id, payload);
    } else {
      return await createMember(payload as CreateMemberPayload);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    return await deleteMember(id);
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
              <Users className="h-6 w-6 text-primary" />
              <span>Team Members</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registered human resources and roles in <strong>{workspace.name}</strong>.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span>Add Team Member</span>
          </Button>
        </div>

        {membersLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Loading team members...
          </div>
        ) : (
          <MemberList
            members={members}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onAddMember={handleOpenAdd}
          />
        )}
      </main>

      <MemberFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        member={editingMember}
        onSubmit={handleFormSubmit}
      />

      <DeleteMemberDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        member={deletingMember}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
