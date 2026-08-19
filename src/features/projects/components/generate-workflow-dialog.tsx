"use client";

import * as React from "react";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import type { Project } from "@/types/workspace";
import type { Member } from "@/types/member";
import { generateWorkflow } from "@/lib/ai/generate-workflow";
import { validateWorkflowSchema, validateWorkflowSemantics } from "@/lib/validation/validate-workflow";
import { useWorkflows } from "@/hooks/use-workflows";
import { useRouter } from "next/navigation";
import type { Workflow } from "@/types/workflow";
import type { UploadedDocument } from "@/types/document";

interface GenerateWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  members: Member[];
  documents: UploadedDocument[];
}

export function GenerateWorkflowDialog({
  open,
  onOpenChange,
  project,
  members,
  documents,
}: GenerateWorkflowDialogProps) {
  const [domainHint, setDomainHint] = React.useState(project.name);
  const [constraints, setConstraints] = React.useState("");
  const [deadline, setDeadline] = React.useState(project.deadline || "");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { saveWorkflow } = useWorkflows(project.id);
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateWorkflow({
        workspaceId: project.workspaceId,
        projectId: project.id,
        requirements: project.description,
        domainHint,
        deadline,
        members,
        documentContext: documents.flatMap(d => d.chunks || []),
        constraints: constraints ? constraints.split("\n").filter(Boolean) : [],
      });

      const validation = validateWorkflowSchema(result.rawOutput);
      if (!validation.valid) {
        throw new Error("AI output failed schema validation: " + validation.issues.map(i => `${i.path}: ${i.message}`).join(", "));
      }

      const workflow = result.rawOutput as Workflow;
      
      const semanticValidation = validateWorkflowSemantics(workflow, members);
      if (!semanticValidation.valid) {
        // We log warnings, but throw on errors
        const errors = semanticValidation.issues.filter(i => i.severity === "error");
        if (errors.length > 0) {
          throw new Error("AI output failed semantic validation: " + errors.map(i => i.message).join(", "));
        }
      }
      
      const saveResult = await saveWorkflow(workflow);
      if (!saveResult.success) {
        throw new Error("Failed to save generated workflow: " + saveResult.error);
      }

      onOpenChange(false);
      router.push(`/workspace/${project.workspaceId}/projects/${project.id}/workflows/${workflow.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Generate Workflow with AI"
      description={`Generate a structured workflow for "${project.name}" using team skills as context.`}
      disableBackdropClose={isGenerating}
    >
      <form id="gen-workflow-form" onSubmit={handleGenerate} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="domain-hint" className="text-sm font-medium leading-none">Domain Hint</label>
          <Input
            id="domain-hint"
            placeholder="e.g. software_development, healthcare, etc."
            value={domainHint}
            onChange={(e) => setDomainHint(e.target.value)}
            disabled={isGenerating}
          />
          <p className="text-[13px] text-muted-foreground">Helps the AI choose standard industry patterns.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="constraints" className="text-sm font-medium leading-none">Additional Constraints</label>
          <Textarea
            id="constraints"
            placeholder="One constraint per line (e.g., Must use React, Budget is $500)"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            rows={3}
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="deadline" className="text-sm font-medium leading-none">Target Deadline</label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isGenerating}
          />
        </div>
      </form>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isGenerating}
        >
          Cancel
        </Button>
        <Button type="submit" form="gen-workflow-form" disabled={isGenerating} className="gap-2">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? "Compiling..." : "Generate Workflow"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
