"use client";

import * as React from "react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/types/workspace";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (name: string, description: string) => Promise<{ success: boolean; error?: string }>;
}

const FORM_ID = "project-form";

/** Inner form — remounted via `key` each time the dialog opens, so state is always fresh */
function ProjectFormBody({
  project,
  onOpenChange,
  onSubmit,
}: {
  project?: Project | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, description: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [name, setName] = React.useState(project?.name || "");
  const [description, setDescription] = React.useState(project?.description || "");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    setIsSubmitting(true);
    setError(null);
    const res = await onSubmit(name.trim(), description.trim());
    setIsSubmitting(false);
    if (res.success) {
      onOpenChange(false);
    } else {
      setError(res.error || "Failed to save project.");
    }
  };

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="project-name" className="text-sm font-medium leading-none">
          Project Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="project-name"
          placeholder="e.g. Q3 Software Release, Cardiac Surgery Prep"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="project-desc" className="text-sm font-medium leading-none">
          Description &amp; Objective <span className="text-destructive">*</span>
        </label>
        <Textarea
          id="project-desc"
          placeholder="What do you want to accomplish? This will be used as context for AI workflow generation."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          disabled={isSubmitting}
        />
      </div>
    </form>
  );
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectFormDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={project ? "Edit Project" : "Create New Project"}
      description={
        project
          ? "Update project details below."
          : "Define your objective. The AI will use this to generate a structured workflow."
      }
    >
      {/* key forces remount → fresh useState values each time dialog opens */}
      <ProjectFormBody
        key={`${open}-${project?.id ?? "new"}`}
        project={project}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID}>
          {project ? "Save Changes" : "Create Project"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
