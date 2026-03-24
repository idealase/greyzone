export const STRESS_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  CRITICAL: 95,
} as const;

export const PHASE_TRANSITION_THRESHOLD = 0.7;

export const MAX_INTENSITY = 1.0;
export const MIN_INTENSITY = 0.1;
export const INTENSITY_STEP = 0.1;

export const ROLES = [
  { value: "blue_commander", label: "Blue Commander" },
  { value: "red_commander", label: "Red Commander" },
  { value: "observer", label: "Observer" },
] as const;

export const ROLE_COLORS: Record<string, string> = {
  blue_commander: "#3b82f6",
  red_commander: "#ef4444",
  observer: "#a1a1aa",
};
