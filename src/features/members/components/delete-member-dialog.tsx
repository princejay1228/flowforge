"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { Member } from "@/types/member";

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onConfirm: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function DeleteMemberDialog({
  open,
  onOpenChange,
  member,
  onConfirm,
}: DeleteMemberDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!member) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const res = await onConfirm(member.id);
    setIsDeleting(false);

    if (res.success) {
      onOpenChange(false);
    } else {
      setError(res.error || "Failed to delete member.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove Team Member"
      description="This action cannot be undone."
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 rounded-md bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            Are you sure you want to remove <strong>{member.name}</strong> ({member.role}) from this workspace?
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
            {isDeleting ? "Removing..." : "Remove Member"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
