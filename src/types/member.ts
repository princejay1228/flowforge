/**
 * Domain types for team members / resources that can be assigned to tasks
 * within a workflow. A "member" represents any real-world actor: a person,
 * a role, or a resource with capacity constraints.
 *
 * These types are the TypeScript source of truth. Corresponding runtime
 * validation lives in `src/schemas/member.schema.ts` and MUST be kept in
 * sync (see DEVELOPMENT_RULES.md).
 */

export interface WorkingHours {
  /** Day of week, 0 = Sunday ... 6 = Saturday */
  dayOfWeek: number;
  /** 24h time string, e.g. "09:00" */
  startTime: string;
  /** 24h time string, e.g. "17:00" */
  endTime: string;
}

export interface Availability {
  workingHours: WorkingHours[];
  /** ISO date strings the member is unavailable (leave, holidays, etc.) */
  unavailableDates: string[];
  /** Fraction of a standard working week the member is available, 0-1 */
  capacityFraction: number;
}

export type PreferredTaskType = string;

export interface Member {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  specialties: string[];
  skills: string[];
  /** Free-form or structured experience description */
  experience: string;
  availability: Availability;
  /** Current workload, expressed as a fraction of capacity already committed, 0-1 */
  workload: number;
  preferredTaskTypes: PreferredTaskType[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
