import { z } from "zod";

export const assignmentSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  taskId: z.string(),
  memberId: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  createdAt: z.string(),
});

export const milestoneSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  name: z.string().min(1),
  targetDate: z.string(),
  taskIds: z.array(z.string()),
});

export const scheduledTaskSchema = z.object({
  taskId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const scheduleWorkingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

export const scheduleSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  tasks: z.array(scheduledTaskSchema),
  milestones: z.array(milestoneSchema),
  workingHours: z.array(scheduleWorkingHoursSchema),
  criticalPath: z.array(z.string()).optional(),
  generatedAt: z.string(),
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
