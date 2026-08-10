import { z } from "zod";

/**
 * Runtime schema mirroring `src/types/member.ts`. Keep in sync manually —
 * see DEVELOPMENT_RULES.md.
 */

export const workingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM"),
});

export const availabilitySchema = z.object({
  workingHours: z.array(workingHoursSchema),
  unavailableDates: z.array(z.string()),
  capacityFraction: z.number().min(0).max(1),
});

export const memberSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1),
  role: z.string().min(1),
  specialties: z.array(z.string()),
  skills: z.array(z.string()),
  experience: z.string(),
  availability: availabilitySchema,
  workload: z.number().min(0).max(1),
  preferredTaskTypes: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MemberInput = z.infer<typeof memberSchema>;
