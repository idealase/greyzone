import { z } from "zod";
import { DomainLayer } from "./domains.js";

export const ActionType = z.enum([
  "Escalate",
  "DeEscalate",
  "Reinforce",
  "Disrupt",
  "Mobilize",
  "Negotiate",
  "CyberAttack",
  "InformationOp",
  "SanctionImpose",
  "SanctionRelief",
  "MilitaryDeploy",
  "NavalBlockade",
  "SpaceAssetDeploy",
  "DomesticPolicyShift",
]);
export type ActionType = z.infer<typeof ActionType>;

export const ActionSubmit = z.object({
  role_id: z.string(),
  action_type: ActionType,
  target_layer: DomainLayer,
  target_actor_id: z.string().uuid().optional(),
  parameters: z.record(z.string(), z.number()).default({}),
});
export type ActionSubmit = z.infer<typeof ActionSubmit>;

export const ActionTemplate = z.object({
  action_type: ActionType,
  target_layer: DomainLayer,
  target_actor_id: z.string().uuid().optional(),
  description: z.string(),
  intensity_range: z.tuple([z.number(), z.number()]),
  estimated_stress_impact: z.number(),
  resource_cost: z.number(),
  phase_restricted: z.boolean().default(false),
});
export type ActionTemplate = z.infer<typeof ActionTemplate>;

export const ActionResult = z.object({
  success: z.boolean(),
  action_id: z.string().uuid(),
  effects: z.array(
    z.object({
      domain: DomainLayer,
      field: z.string(),
      delta: z.number(),
      new_value: z.number(),
    })
  ),
  validation_errors: z.array(z.string()).default([]),
});
export type ActionResult = z.infer<typeof ActionResult>;
