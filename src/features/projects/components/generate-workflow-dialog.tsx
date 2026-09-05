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

function ensureWorkflowConformity(candidate: any, project: Project): any {
  if (!candidate || typeof candidate !== "object") return candidate;
  const now = new Date().toISOString();
  const wfId = candidate.id || crypto.randomUUID();

  candidate.id = wfId;
  candidate.workspaceId = candidate.workspaceId || project.workspaceId;
  candidate.projectId = candidate.projectId || project.id;
  candidate.name = candidate.name || `${project.name} Workflow`;
  candidate.description = candidate.description || project.description || "";
  candidate.domain = candidate.domain || "software_development";
  candidate.objective = candidate.objective || `Deliver objectives for ${project.name}`;
  candidate.createdAt = candidate.createdAt || now;
  candidate.updatedAt = candidate.updatedAt || now;

  if (!candidate.metadata || typeof candidate.metadata !== "object") {
    candidate.metadata = { version: 1 };
  } else {
    candidate.metadata.version = typeof candidate.metadata.version === "number" ? candidate.metadata.version : 1;
  }

  if (Array.isArray(candidate.tasks)) {
    candidate.tasks = candidate.tasks.map((t: any, idx: number) => ({
      ...t,
      id: t.id || `task-${wfId}-${idx + 1}`,
      workflowId: t.workflowId || wfId,
      name: t.name || `Task ${idx + 1}`,
      description: t.description || "",
      status: ["not_started", "ready", "in_progress", "blocked", "completed", "skipped", "failed"].includes(t.status)
        ? t.status
        : "not_started",
      priority: ["low", "medium", "high", "critical"].includes(t.priority) ? t.priority : "medium",
      requiredSkills: Array.isArray(t.requiredSkills) ? t.requiredSkills : [],
      estimatedDuration: typeof t.estimatedDuration === "number" && t.estimatedDuration > 0 ? t.estimatedDuration : 60,
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
      classification: ["mandatory", "optional"].includes(t.classification) ? t.classification : "mandatory",
      createdAt: t.createdAt || now,
      updatedAt: t.updatedAt || now,
    }));
  } else {
    candidate.tasks = [];
  }

  if (Array.isArray(candidate.dependencies)) {
    candidate.dependencies = candidate.dependencies
      .map((d: any, idx: number) => ({
        ...d,
        id: d.id || `dep-${wfId}-${idx + 1}`,
        workflowId: d.workflowId || wfId,
        dependencyType: ["finish_to_start", "start_to_start", "finish_to_finish"].includes(d.dependencyType)
          ? d.dependencyType
          : "finish_to_start",
      }))
      .filter((d: any) => d.sourceTaskId && d.targetTaskId);
  } else {
    candidate.dependencies = [];
  }

  if (Array.isArray(candidate.milestones)) {
    candidate.milestones = candidate.milestones.map((m: any, idx: number) => ({
      ...m,
      id: m.id || `ms-${wfId}-${idx + 1}`,
      workflowId: m.workflowId || wfId,
      name: m.name || `Milestone ${idx + 1}`,
      targetDate: m.targetDate || now,
      taskIds: Array.isArray(m.taskIds) ? m.taskIds : [],
    }));
  } else {
    candidate.milestones = [];
  }

  if (Array.isArray(candidate.assignments)) {
    candidate.assignments = candidate.assignments.map((a: any, idx: number) => ({
      ...a,
      id: a.id || `asgn-${wfId}-${idx + 1}`,
      workflowId: a.workflowId || wfId,
      taskId: a.taskId || (candidate.tasks[idx]?.id || `task-${wfId}-1`),
      memberId: a.memberId || a.assignedMemberId || "unassigned",
      reason: a.reason || "Assigned based on skill profile and project requirements",
      confidence: typeof a.confidence === "number" ? Math.max(0, Math.min(1, a.confidence)) : 0.85,
      createdAt: a.createdAt || now,
    }));
  } else {
    candidate.assignments = [];
  }

  if (!Array.isArray(candidate.constraints)) candidate.constraints = [];
  candidate.constraints = candidate.constraints.map((c: any, idx: number) => ({
    id: c.id || `constraint-${wfId}-${idx + 1}`,
    description: typeof c === "string" ? c : c.description || "",
    type: ["deadline", "resource", "regulatory", "dependency", "other"].includes(c.type) ? c.type : "other",
  }));

  if (!Array.isArray(candidate.risks)) candidate.risks = [];
  candidate.risks = candidate.risks.map((r: any, idx: number) => ({
    id: r.id || `risk-${wfId}-${idx + 1}`,
    description: r.description || "Identified risk",
    severity: ["low", "medium", "high", "critical"].includes(r.severity) ? r.severity : "medium",
    relatedTaskIds: Array.isArray(r.relatedTaskIds) ? r.relatedTaskIds : [],
    mitigation: r.mitigation || undefined,
  }));

  return candidate;
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

      const normalized = ensureWorkflowConformity(result.rawOutput, project);
      const validation = validateWorkflowSchema(normalized);
      if (!validation.valid) {
        throw new Error("AI output failed schema validation: " + validation.issues.map(i => `${i.path}: ${i.message}`).join(", "));
      }

      const workflow = normalized as Workflow;
      
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

  const handleFallbackGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const m1 = members[0]?.id;
      const m2 = members[1]?.id || m1;

      const fallbackWf: Workflow = {
        id,
        workspaceId: project.workspaceId,
        projectId: project.id,
        name: `${project.name} Compiled Workflow`,
        description: project.description || `Generated workflow pipeline for ${project.name}`,
        domain: (domainHint.toLowerCase().includes("health") ? "healthcare" : "software_development") as any,
        objective: `Deliver milestone outcomes for ${project.name}`,
        tasks: [
          {
            id: `task-${id}-1`,
            workflowId: id,
            name: `Requirements Analysis & Architecture`,
            description: "Analyze specifications, team capacity, and functional constraints.",
            status: "completed",
            priority: "high",
            classification: "mandatory",
            estimatedDuration: 60,
            requiredSkills: members[0]?.skills?.slice(0, 2) || ["Analysis"],
            assignedMemberId: m1,
            dependsOn: [],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: `task-${id}-2`,
            workflowId: id,
            name: `Core Engine & Topological Pipeline`,
            description: "Build state machine transitions and execution graph modules.",
            status: "in_progress",
            priority: "critical",
            classification: "mandatory",
            estimatedDuration: 120,
            requiredSkills: members[0]?.skills?.slice(0, 2) || ["Architecture"],
            assignedMemberId: m1,
            dependsOn: [`task-${id}-1`],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: `task-${id}-3`,
            workflowId: id,
            name: `Component Integration & Testing`,
            description: "Assemble frontend and backend interfaces, run verification test suites.",
            status: "ready",
            priority: "high",
            classification: "mandatory",
            estimatedDuration: 90,
            requiredSkills: members[1]?.skills?.slice(0, 2) || ["Development"],
            assignedMemberId: m2,
            dependsOn: [`task-${id}-2`],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: `task-${id}-4`,
            workflowId: id,
            name: `Audit Review & PDF Feasibility Report`,
            description: "Calculate McCabe cyclomatic complexity and generate final sign-off PDF.",
            status: "not_started",
            priority: "medium",
            classification: "mandatory",
            estimatedDuration: 45,
            requiredSkills: ["Validation"],
            assignedMemberId: m1,
            dependsOn: [`task-${id}-3`],
            createdAt: now,
            updatedAt: now,
          },
        ],
        dependencies: [
          { id: `dep-${id}-1`, workflowId: id, sourceTaskId: `task-${id}-1`, targetTaskId: `task-${id}-2`, dependencyType: "finish_to_start" },
          { id: `dep-${id}-2`, workflowId: id, sourceTaskId: `task-${id}-2`, targetTaskId: `task-${id}-3`, dependencyType: "finish_to_start" },
          { id: `dep-${id}-3`, workflowId: id, sourceTaskId: `task-${id}-3`, targetTaskId: `task-${id}-4`, dependencyType: "finish_to_start" },
        ],
        milestones: [
          { id: `ms-${id}-1`, workflowId: id, name: "Phase 1 Complete", targetDate: now, taskIds: [`task-${id}-2`] }
        ],
        assignments: [],
        constraints: [],
        risks: [
          { id: `risk-${id}-1`, description: "Schedule variance on critical path", severity: "medium", relatedTaskIds: [`task-${id}-2`] }
        ],
        metadata: {
          createdBy: "Deterministic Engine",
          version: 1,
        },
        createdAt: now,
        updatedAt: now,
      };

      const saveResult = await saveWorkflow(fallbackWf);
      if (!saveResult.success) {
        throw new Error("Failed to save workflow: " + saveResult.error);
      }

      onOpenChange(false);
      router.push(`/workspace/${project.workspaceId}/projects/${project.id}/workflows/${fallbackWf.id}`);
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
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium whitespace-pre-wrap space-y-2">
            <div>{error}</div>
            <div className="flex items-center justify-between pt-2 border-t border-destructive/20 text-xs">
              <span className="text-muted-foreground font-normal">No API key or quota issue?</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-background text-foreground hover:bg-muted text-xs h-7"
                onClick={handleFallbackGenerate}
              >
                Compile Offline Workflow
              </Button>
            </div>
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
