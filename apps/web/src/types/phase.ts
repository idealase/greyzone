export enum Phase {
  CompetitiveNormality = "CompetitiveNormality",
  HybridCoercion = "HybridCoercion",
  AcutePolycrisis = "AcutePolycrisis",
  WarTransition = "WarTransition",
  OvertInterstateWar = "OvertInterstateWar",
  GeneralizedBlocWar = "GeneralizedBlocWar",
}

export const PHASE_LABELS: Record<Phase, string> = {
  [Phase.CompetitiveNormality]: "Phase 0: Competitive Normality",
  [Phase.HybridCoercion]: "Phase 1: Hybrid Coercion",
  [Phase.AcutePolycrisis]: "Phase 2: Acute Polycrisis",
  [Phase.WarTransition]: "Phase 3: War Transition",
  [Phase.OvertInterstateWar]: "Phase 4: Overt Interstate War",
  [Phase.GeneralizedBlocWar]: "Phase 5: Generalized / Bloc War",
};

export const PHASE_COLORS: Record<Phase, string> = {
  [Phase.CompetitiveNormality]: "#22c55e",
  [Phase.HybridCoercion]: "#eab308",
  [Phase.AcutePolycrisis]: "#f97316",
  [Phase.WarTransition]: "#ef4444",
  [Phase.OvertInterstateWar]: "#dc2626",
  [Phase.GeneralizedBlocWar]: "#991b1b",
};

export const PHASE_ORDER: Phase[] = [
  Phase.CompetitiveNormality,
  Phase.HybridCoercion,
  Phase.AcutePolycrisis,
  Phase.WarTransition,
  Phase.OvertInterstateWar,
  Phase.GeneralizedBlocWar,
];
