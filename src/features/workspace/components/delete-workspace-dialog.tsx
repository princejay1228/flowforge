"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Workspace } from "@/types/workspace";

interface DeleteWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  onConfirm: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  workspace,
  onConfirm,
}: DeleteWorkspaceDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!workspace) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const res = await onConfirm(workspace.id);
    setIsDeleting(false);

    if (res.success) {
      onOpenChange(false);
    } else {
      setError(res.error || "Failed to delete workspace.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Workspace"
      description="This action cannot be undone."
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 rounded-md bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            Are you sure you want to delete <strong>{workspace.name}</strong>?
            <br />
            Deleting this workspace will also delete all team members belonging to it.
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Workspace"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
