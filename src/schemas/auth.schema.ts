import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime(),
});

export type UserDTO = z.infer<typeof userSchema>;
