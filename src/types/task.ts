/**
 * Task and dependency types for the Workflow Intermediate Representation (IR).
 * See PROJECT_ROADMAP.md section "Workflow IR" for the conceptual model.
 */

export type TaskStatus =
  | "not_started"
  | "ready"
  | "in_progress"
  | "blocked"
  | "completed"
  | "skipped"
  | "failed";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskClassification = "mandatory" | "optional";

export interface Task {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  requiredSkills: string[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** IDs of tasks this task depends on (denormalized convenience view) */
  dependsOn: string[];
  assignedMemberId?: string;
  classification: TaskClassification;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type DependencyType = "finish_to_start" | "start_to_start" | "finish_to_finish";

export interface Dependency {
  id: string;
  workflowId: string;
  sourceTaskId: string;
  targetTaskId: string;
  dependencyType: DependencyType;
}
