import { z } from "zod";

export const ScenarioCreate = z.object({
  name: z.string().min(1).max(255),
  description: z.string().default(""),
  config: z.record(z.string(), z.unknown()).default({}),
});
export type ScenarioCreate = z.infer<typeof ScenarioCreate>;

export const ScenarioRead = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  config: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ScenarioRead = z.infer<typeof ScenarioRead>;
