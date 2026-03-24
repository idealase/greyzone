export interface EffectEstimate {
  actionType: string;
  targetDomain: string;
  intensity: number;
  estimatedStressDelta: number;
  estimatedResilienceDelta: number;
  newStress: number;
  newResilience: number;
  notes: string[];
}

/**
 * Estimates the immediate local effects of an action based on
 * approximate formulas mirroring the simulation engine.
 */
export async function estimateLocalEffects(
  input: Record<string, unknown>
): Promise<EffectEstimate> {
  const actionType = input.actionType as string;
  const targetDomain = input.targetDomain as string;
  const intensity = input.intensity as number;
  const currentStress = input.currentStress as number;
  const currentResilience = input.currentResilience as number;

  let stressDelta = 0;
  let resilienceDelta = 0;
  const notes: string[] = [];

  // Categorize the action and compute approximate deltas
  if (isEscalatory(actionType)) {
    stressDelta = intensity * (1 - currentResilience) * 0.1;
    resilienceDelta = -intensity * 0.02;
    notes.push("Escalatory action: increases stress, slightly erodes resilience.");
  } else if (isDeescalatory(actionType)) {
    stressDelta = -intensity * 0.05;
    resilienceDelta = intensity * 0.01;
    notes.push("De-escalatory action: reduces stress, marginally improves resilience.");
  } else if (isReinforcing(actionType)) {
    stressDelta = -intensity * 0.02;
    resilienceDelta = intensity * 0.05;
    notes.push("Reinforcing action: builds resilience, slightly reduces stress.");
  } else if (isDisruptive(actionType)) {
    stressDelta = intensity * 0.06;
    resilienceDelta = -intensity * 0.08;
    notes.push("Disruptive action: degrades resilience and increases stress.");
  } else if (actionType === "hold_steady") {
    stressDelta = 0;
    resilienceDelta = 0;
    notes.push("Hold steady: no immediate effects.");
  } else {
    // Generic moderate effect
    stressDelta = intensity * 0.03;
    resilienceDelta = -intensity * 0.01;
    notes.push("Action has moderate estimated effects.");
  }

  // Clamp resulting values to [0, 1]
  const newStress = Math.max(0, Math.min(1, currentStress + stressDelta));
  const newResilience = Math.max(0, Math.min(1, currentResilience + resilienceDelta));

  // Round for clarity
  const round = (v: number) => Math.round(v * 1000) / 1000;

  return {
    actionType,
    targetDomain,
    intensity,
    estimatedStressDelta: round(stressDelta),
    estimatedResilienceDelta: round(resilienceDelta),
    newStress: round(newStress),
    newResilience: round(newResilience),
    notes,
  };
}

function isEscalatory(actionType: string): boolean {
  return [
    "military_posture",
    "special_operations",
    "trade_route_disruption",
    "energy_supply_pressure",
    "pipeline_interdiction",
    "sanction_package",
    "industrial_sabotage",
    "cyber_intrusion",
    "ddos_attack",
    "satellite_interference",
    "pnt_spoofing",
    "disinformation_campaign",
    "strategic_leaks",
  ].includes(actionType);
}

function isDeescalatory(actionType: string): boolean {
  return [
    "deescalate",
    "trade_incentive",
    "energy_reserve_release",
    "media_counter_narrative",
    "political_messaging",
  ].includes(actionType);
}

function isReinforcing(actionType: string): boolean {
  return [
    "air_defense_activation",
    "port_security",
    "logistics_reinforcement",
    "supply_chain_diversification",
    "cyber_defense_hardening",
    "space_surveillance",
    "domestic_mobilization",
    "fiscal_stimulus",
  ].includes(actionType);
}

function isDisruptive(actionType: string): boolean {
  return [
    "naval_patrol",
    "trade_route_disruption",
    "pipeline_interdiction",
    "industrial_sabotage",
    "ddos_attack",
    "satellite_interference",
    "pnt_spoofing",
  ].includes(actionType);
}
