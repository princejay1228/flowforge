import { z } from "zod";

export const taskStatusSchema = z.enum([
  "not_started",
  "ready",
  "in_progress",
  "blocked",
  "completed",
  "skipped",
  "failed",
]);

export const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const taskClassificationSchema = z.enum(["mandatory", "optional"]);

export const taskSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  requiredSkills: z.array(z.string()),
  estimatedDuration: z.number().positive(),
  dependsOn: z.array(z.string()),
  assignedMemberId: z.string().optional(),
  classification: taskClassificationSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const dependencyTypeSchema = z.enum([
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
]);

export const dependencySchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  sourceTaskId: z.string(),
  targetTaskId: z.string(),
  dependencyType: dependencyTypeSchema,
});

export type TaskInput = z.infer<typeof taskSchema>;
export type DependencyInput = z.infer<typeof dependencySchema>;
