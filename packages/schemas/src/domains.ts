import { z } from "zod";

export const DomainLayer = z.enum([
  "Kinetic",
  "MaritimeLogistics",
  "Energy",
  "GeoeconomicIndustrial",
  "Cyber",
  "SpacePnt",
  "InformationCognitive",
  "DomesticPoliticalFiscal",
]);
export type DomainLayer = z.infer<typeof DomainLayer>;

export const LayerState = z.object({
  stress: z.number().min(0).max(1),
  resilience: z.number().min(0).max(1),
  friction: z.number().min(0).max(1),
  activity_level: z.number().min(0).max(1),
  variables: z.record(z.string(), z.number()),
});
export type LayerState = z.infer<typeof LayerState>;

export const ActorKind = z.enum([
  "State",
  "Alliance",
  "ProxyNonState",
  "InfrastructureOperator",
  "StrategicFirm",
  "PoliticalBody",
]);
export type ActorKind = z.infer<typeof ActorKind>;

export const Visibility = z.union([
  z.literal("Public"),
  z.object({ RoleScoped: z.array(z.string()) }),
  z.literal("Hidden"),
]);
export type Visibility = z.infer<typeof Visibility>;

export const Actor = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: ActorKind,
  capabilities: z.record(DomainLayer, z.number()),
  resources: z.number(),
  morale: z.number(),
  visibility: Visibility,
});
export type Actor = z.infer<typeof Actor>;

export const CouplingEntry = z.object({
  domain_a: DomainLayer,
  domain_b: DomainLayer,
  strength: z.number().min(0).max(1),
});
export type CouplingEntry = z.infer<typeof CouplingEntry>;
