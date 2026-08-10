import type { Workflow } from "@/types/workflow";
import type { ValidationResult } from "@/types/validation";
import { workflowSchema } from "@/schemas/workflow.schema";

/**
 * Entry point for the deterministic Validation Engine
 * (src/features/validation). This is the boundary between AI output and
 * the rest of the application — see ARCHITECTURE.md.
 *
 * Currently performs schema validation only. The deeper checks (circular
 * dependencies, skill mismatches, overloaded members, impossible
 * schedules, etc. — see PROJECT_ROADMAP.md "Validation engine") are a
 * future development phase and are NOT implemented here.
 */
export function validateWorkflowSchema(candidate: unknown): ValidationResult {
  const result = workflowSchema.safeParse(candidate);

  if (result.success) {
    return { valid: true, issues: [] };
  }

  return {
    valid: false,
    issues: result.error.issues.map((issue) => ({
      code: "missing_required_field",
      severity: "error",
      message: issue.message,
      path: issue.path.join("."),
    })),
  };
}

/**
 * NOT IMPLEMENTED. Placeholder for the full deterministic validation pass
 * (dependency graph checks, assignment checks, schedule feasibility,
 * DFA reachability). See src/features/validation for the module boundary.
 */
export function validateWorkflowSemantics(_workflow: Workflow): ValidationResult {
  throw new Error(
    "validateWorkflowSemantics is not implemented yet. This is expected " +
      "during the scaffold phase — see PROJECT_ROADMAP.md 'Validation engine'."
  );
}
