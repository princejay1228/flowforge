"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Workspace } from "@/types/workspace";

interface WorkspaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: Workspace | null;
  onSubmit: (name: string, description?: string) => Promise<{ success: boolean; error?: string }>;
}

interface WorkspaceFormProps {
  workspace?: Workspace | null;
  onSubmit: (name: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

function WorkspaceForm({ workspace, onSubmit, onCancel }: WorkspaceFormProps) {
  const [name, setName] = React.useState(workspace?.name || "");
  const [description, setDescription] = React.useState(workspace?.description || "");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await onSubmit(name, description);
    setIsSubmitting(false);

    if (res.success) {
      onCancel();
    } else {
      setError(res.error || "Failed to save workspace.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Workspace Name <span className="text-destructive">*</span>
        </label>
        <Input
          placeholder="e.g. Surgical Suite A, Engineering Team, Kitchen Prep"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">Description</label>
        <Textarea
          placeholder="Brief description of the workspace domain or team mandate..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : workspace ? "Save Changes" : "Create Workspace"}
        </Button>
      </div>
    </form>
  );
}

export function WorkspaceFormDialog({
  open,
  onOpenChange,
  workspace,
  onSubmit,
}: WorkspaceFormDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={workspace ? "Edit Workspace" : "Create New Workspace"}
      description={
        workspace
          ? "Update workspace details below."
          : "Workspaces isolate your team members, projects, and AI-generated workflows."
      }
    >
      <WorkspaceForm
        key={workspace?.id || "new-workspace"}
        workspace={workspace}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
