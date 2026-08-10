import type { Task, Dependency } from "./task";
import type { Assignment, Schedule, Milestone } from "./schedule";

/**
 * The Workflow is the central object in FlowForge's Intermediate
 * Representation (IR). It is produced by validating and structuring AI
 * output, never trusted directly from the AI. See ARCHITECTURE.md for the
 * full compilation pipeline.
 */

export type WorkflowDomain =
  | "software_development"
  | "healthcare"
  | "food_service"
  | "manufacturing"
  | "construction"
  | "research"
  | "education"
  | "events"
  | "administrative"
  | "emergency_procedures"
  | "equipment_maintenance"
  | "other";

export type RiskSeverity = "low" | "medium" | "high" | "critical";

export interface Risk {
  id: string;
  description: string;
  severity: RiskSeverity;
  relatedTaskIds: string[];
  mitigation?: string;
}

export interface WorkflowConstraint {
  id: string;
  description: string;
  type: "deadline" | "resource" | "regulatory" | "dependency" | "other";
}

export interface WorkflowMetadata {
  createdBy?: string;
  aiProvider?: string;
  aiModel?: string;
  sourceDocumentIds?: string[];
  version: number;
}

export interface Workflow {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  description: string;
  domain: WorkflowDomain;
  objective: string;
  tasks: Task[];
  dependencies: Dependency[];
  milestones: Milestone[];
  assignments: Assignment[];
  schedule?: Schedule;
  constraints: WorkflowConstraint[];
  risks: Risk[];
  metadata: WorkflowMetadata;
  createdAt: string;
  updatedAt: string;
}
