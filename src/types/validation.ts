/**
 * Type contracts for the future deterministic Validation Engine
 * (src/features/validation). The engine itself is not implemented in the
 * scaffold phase; see PROJECT_ROADMAP.md "Validation engine".
 */

export type ValidationIssueCode =
  | "invalid_json"
  | "missing_required_field"
  | "duplicate_task_id"
  | "missing_dependency"
  | "circular_dependency"
  | "invalid_member_reference"
  | "skill_mismatch"
  | "member_overloaded"
  | "impossible_schedule"
  | "deadline_violation"
  | "invalid_workflow_transition"
  | "unreachable_state"
  | "invalid_dfa_transition";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
  path?: string;
  relatedId?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
