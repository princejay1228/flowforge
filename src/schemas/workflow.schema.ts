import { z } from "zod";
import { taskSchema, dependencySchema } from "./task.schema";
import { assignmentSchema, scheduleSchema, milestoneSchema } from "./schedule.schema";

export const workflowDomainSchema = z.enum([
  "software_development",
  "healthcare",
  "food_service",
  "manufacturing",
  "construction",
  "research",
  "education",
  "events",
  "administrative",
  "emergency_procedures",
  "equipment_maintenance",
  "other",
]);

export const riskSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const riskSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: riskSeveritySchema,
  relatedTaskIds: z.array(z.string()),
  mitigation: z.string().optional(),
});

export const workflowConstraintSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: z.enum(["deadline", "resource", "regulatory", "dependency", "other"]),
});

export const workflowMetadataSchema = z.object({
  createdBy: z.string().optional(),
  aiProvider: z.string().optional(),
  aiModel: z.string().optional(),
  sourceDocumentIds: z.array(z.string()).optional(),
  version: z.number().int().nonnegative(),
});

/**
 * Top-level schema for validating AI-generated workflow output before it
 * enters the application. This is the boundary described in
 * ARCHITECTURE.md — never trust `rawOutput` from an AIProvider without
 * passing it through this schema first.
 */
export const workflowSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  domain: workflowDomainSchema,
  objective: z.string(),
  tasks: z.array(taskSchema),
  dependencies: z.array(dependencySchema),
  milestones: z.array(milestoneSchema),
  assignments: z.array(assignmentSchema),
  schedule: scheduleSchema.optional(),
  constraints: z.array(workflowConstraintSchema),
  risks: z.array(riskSchema),
  metadata: workflowMetadataSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkflowInput = z.infer<typeof workflowSchema>;
