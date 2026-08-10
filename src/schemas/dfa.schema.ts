import { z } from "zod";

export const dfaStateSchema = z.object({
  id: z.string(),
  label: z.string(),
  relatedTaskId: z.string().optional(),
  isAccepting: z.boolean(),
  isDead: z.boolean(),
});

export const dfaTransitionSchema = z.object({
  from: z.string(),
  symbol: z.string(),
  to: z.string(),
});

export const dfaDefinitionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  states: z.array(dfaStateSchema),
  alphabet: z.array(z.string()),
  transitions: z.array(dfaTransitionSchema),
  startState: z.string(),
  acceptingStates: z.array(z.string()),
  deadState: z.string().optional(),
  generatedAt: z.string(),
});

export type DFADefinitionInput = z.infer<typeof dfaDefinitionSchema>;
