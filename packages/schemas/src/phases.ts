import { z } from "zod";

export const Phase = z.enum([
  "CompetitiveNormality",
  "HybridCoercion",
  "AcutePolycrisis",
  "WarTransition",
  "OvertInterstateWar",
  "GeneralizedBlocWar",
]);
export type Phase = z.infer<typeof Phase>;

export const PhaseTransition = z.object({
  turn: z.number(),
  from: Phase,
  to: Phase,
  order_parameter: z.number(),
});
export type PhaseTransition = z.infer<typeof PhaseTransition>;

/** Phase thresholds with hysteresis bands */
export const PHASE_THRESHOLDS = {
  CompetitiveNormality: { enter: 0, exit: 0 },
  HybridCoercion: { enter: 0.15, exit: 0.12 },
  AcutePolycrisis: { enter: 0.30, exit: 0.27 },
  WarTransition: { enter: 0.50, exit: 0.47 },
  OvertInterstateWar: { enter: 0.70, exit: 0.67 },
  GeneralizedBlocWar: { enter: 0.85, exit: 0.82 },
} as const;
