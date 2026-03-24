import { z } from "zod";

export const UserCreate = z.object({
  username: z.string().min(1).max(100),
  display_name: z.string().min(1).max(255),
  is_ai: z.boolean().default(false),
});
export type UserCreate = z.infer<typeof UserCreate>;

export const UserRead = z.object({
  id: z.string().uuid(),
  username: z.string(),
  display_name: z.string(),
  is_ai: z.boolean(),
  created_at: z.string(),
});
export type UserRead = z.infer<typeof UserRead>;
