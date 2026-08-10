import { z } from "zod";

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const projectStatusSchema = z.enum(["draft", "active", "completed", "archived"]);

export const projectSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  status: projectStatusSchema,
  deadline: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
