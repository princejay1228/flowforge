/**
 * Assignment and scheduling types. Populated by the future Scheduling
 * Engine (src/features/scheduler). Not implemented in the scaffold phase.
 */

export interface Assignment {
  id: string;
  workflowId: string;
  taskId: string;
  memberId: string;
  /** Human-readable rationale, typically produced by the scheduler or AI */
  reason: string;
  /** Confidence score in [0, 1] for this assignment */
  confidence: number;
  createdAt: string;
}

export interface ScheduledTask {
  taskId: string;
  startDate: string;
  endDate: string;
}

export interface Milestone {
  id: string;
  workflowId: string;
  name: string;
  targetDate: string;
  taskIds: string[];
}

export interface ScheduleWorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Schedule {
  id: string;
  workflowId: string;
  startDate: string;
  endDate: string;
  tasks: ScheduledTask[];
  milestones: Milestone[];
  workingHours: ScheduleWorkingHours[];
  /** Task IDs identified as the critical path, filled in by the scheduler */
  criticalPath?: string[];
  generatedAt: string;
}
