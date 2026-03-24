import type { TurnBrief, LegalAction } from "../types/index.js";

export function buildTurnPrompt(
  brief: TurnBrief,
  legalActions: LegalAction[]
): string {
  const sections: string[] = [];

  // Turn info header
  sections.push(`## SITUATION BRIEFING - Turn ${brief.turn}`);
  sections.push(`**Phase:** ${brief.phase}`);
  sections.push(`**Order Parameter:** ${brief.orderParameter.toFixed(3)}`);
  sections.push(`**Role:** ${brief.role}`);
  sections.push("");

  // Domain summaries
  sections.push("## DOMAIN STATUS");
  for (const domain of brief.domainSummary) {
    const trendIcon =
      domain.trend === "rising"
        ? "[RISING]"
        : domain.trend === "falling"
          ? "[FALLING]"
          : "[STABLE]";
    sections.push(
      `- **${domain.domain}**: stress=${domain.stress.toFixed(2)}, resilience=${domain.resilience.toFixed(2)} ${trendIcon}`
    );
    if (domain.keyEvents.length > 0) {
      for (const event of domain.keyEvents) {
        sections.push(`  - ${event}`);
      }
    }
  }
  sections.push("");

  // Salient changes
  if (brief.salientChanges.length > 0) {
    sections.push("## SALIENT CHANGES");
    for (const change of brief.salientChanges) {
      sections.push(`- ${change}`);
    }
    sections.push("");
  }

  // Objectives
  if (brief.currentObjectives.length > 0) {
    sections.push("## CURRENT OBJECTIVES");
    for (const objective of brief.currentObjectives) {
      sections.push(`- ${objective}`);
    }
    sections.push("");
  }

  // Constraints
  if (brief.constraints.length > 0) {
    sections.push("## CONSTRAINTS");
    for (const constraint of brief.constraints) {
      sections.push(`- ${constraint}`);
    }
    sections.push("");
  }

  // Strategic tradeoffs
  if (brief.strategicTradeoffs.length > 0) {
    sections.push("## STRATEGIC TRADEOFFS");
    for (const tradeoff of brief.strategicTradeoffs) {
      sections.push(`- ${tradeoff}`);
    }
    sections.push("");
  }

  // Legal actions
  sections.push(`## AVAILABLE ACTIONS (${legalActions.length})`);
  for (let i = 0; i < legalActions.length; i++) {
    const action = legalActions[i];
    const [minI, maxI] = action.intensityRange;
    sections.push(
      `${i + 1}. **${action.actionType}** -> ${action.targetDomain} | intensity: [${minI.toFixed(2)}, ${maxI.toFixed(2)}] | est. stress impact: ${action.estimatedStressImpact >= 0 ? "+" : ""}${action.estimatedStressImpact.toFixed(2)}`
    );
    sections.push(`   ${action.description}`);
    if (action.targetActorId) {
      sections.push(`   Target actor: ${action.targetActorId}`);
    }
  }
  sections.push("");

  // Request
  sections.push("## YOUR DECISION");
  sections.push(
    "Select ONE action from the list above. Respond with a JSON object containing: actionType, targetDomain, intensity, rationale, and confidence."
  );

  return sections.join("\n");
}
