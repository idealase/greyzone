import { ACTION_DESCRIPTIONS } from "../types/actions.js";

export interface ActionInspection {
  actionType: string;
  targetDomain: string;
  description: string;
  domainContext: string;
}

const DOMAIN_CONTEXT: Record<string, string> = {
  kinetic:
    "The kinetic domain covers military forces, posture, and direct force projection. Actions here carry the highest escalation risk but also the strongest deterrent signal.",
  maritime_logistics:
    "The maritime and logistics domain covers trade routes, port operations, and supply chain infrastructure. Disruptions cascade into economic and energy domains.",
  energy:
    "The energy domain covers fuel supplies, pipelines, reserves, and power generation. Energy shocks propagate rapidly into domestic and economic domains.",
  geoeconomic_industrial:
    "The geoeconomic and industrial domain covers sanctions, trade, industrial capacity, and supply chains. Actions here shape long-term strategic balance.",
  cyber:
    "The cyber domain covers network operations, intrusion, and defense. Cyber actions are deniable but can have outsized effects when targeting critical infrastructure.",
  space_pnt:
    "The space and PNT domain covers satellite communications, surveillance, and positioning/navigation/timing. Disruptions degrade precision and C2 across all domains.",
  information_cognitive:
    "The information and cognitive domain covers media narratives, disinformation, and public perception. Shaping the narrative can constrain or enable kinetic options.",
  domestic_political_fiscal:
    "The domestic political and fiscal domain covers public support, government stability, and economic policy. Domestic erosion can collapse external commitments.",
};

export async function inspectAction(
  _runId: string,
  actionType: string,
  targetDomain: string
): Promise<ActionInspection> {
  const description =
    ACTION_DESCRIPTIONS[actionType] ??
    `No detailed description available for action type "${actionType}".`;

  const domainContext =
    DOMAIN_CONTEXT[targetDomain] ??
    `No context available for domain "${targetDomain}".`;

  return {
    actionType,
    targetDomain,
    description,
    domainContext,
  };
}
