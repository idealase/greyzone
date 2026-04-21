import axios from "axios";
import pino from "pino";
import { config } from "../config.js";
import type {
  AdvisorResponse,
  AdvisorSuggestion,
  LegalAction,
  TurnBrief,
} from "../types/index.js";
import type { ActionInspection } from "../tools/inspectAction.js";
import type { EffectEstimate } from "../tools/estimateLocalEffects.js";
import { ToolExecutor } from "./toolExecutor.js";

const logger = pino({ level: config.logLevel });

type AdvisorToolName =
  | "getTurnBrief"
  | "listLegalActions"
  | "inspectAction"
  | "estimateLocalEffects";

interface ScoredAction {
  action: LegalAction;
  score: number;
  intensity: number;
}

interface NarrativeRefinement {
  stateSummary: string;
  strategicOutlook: string;
}

export class AdvisorService {
  constructor(private toolExecutor: ToolExecutor) {}

  async advise(
    runId: string,
    roleId: string,
    maxSuggestions = 3
  ): Promise<AdvisorResponse> {
    this.toolExecutor.reset();

    const brief = await this.executeTool<TurnBrief>("getTurnBrief", {
      runId,
      roleId,
    });
    const legalActions = await this.executeTool<LegalAction[]>("listLegalActions", {
      runId,
      roleId,
    });

    const suggestions = await this.buildSuggestions(
      runId,
      brief,
      legalActions,
      maxSuggestions
    );
    let stateSummary = this.buildStateSummary(brief);
    let strategicOutlook = this.buildStrategicOutlook(brief, suggestions);

    const refinedNarrative = await this.refineNarrativeWithLlm(
      brief,
      suggestions,
      stateSummary,
      strategicOutlook
    );
    if (refinedNarrative) {
      stateSummary = refinedNarrative.stateSummary;
      strategicOutlook = refinedNarrative.strategicOutlook;
    }

    return {
      stateSummary,
      strategicOutlook,
      suggestions,
    };
  }

  private async buildSuggestions(
    runId: string,
    brief: TurnBrief,
    legalActions: LegalAction[],
    maxSuggestions: number
  ): Promise<AdvisorSuggestion[]> {
    if (legalActions.length === 0) {
      return [];
    }

    const scored = legalActions.map((action) => ({
      action,
      score: this.scoreAction(action, brief),
      intensity: this.selectIntensity(action, brief),
    }));

    scored.sort((a, b) => this.compareScoredActions(a, b));

    const selected = scored.slice(0, Math.min(maxSuggestions, scored.length));
    const [minScore, maxScore] = this.getScoreBounds(scored);

    const suggestions: AdvisorSuggestion[] = [];
    for (let index = 0; index < selected.length; index++) {
      const candidate = selected[index];
      const domainStatus = brief.domainSummary.find(
        (summary) => summary.domain === candidate.action.targetDomain
      );
      const inspection = await this.executeTool<ActionInspection>("inspectAction", {
        runId,
        actionType: candidate.action.actionType,
        targetDomain: candidate.action.targetDomain,
      });
      const effects = await this.executeTool<EffectEstimate>("estimateLocalEffects", {
        actionType: candidate.action.actionType,
        targetDomain: candidate.action.targetDomain,
        intensity: candidate.intensity,
        currentStress: domainStatus?.stress ?? 0.5,
        currentResilience: domainStatus?.resilience ?? 0.5,
      });

      const normalizedScore =
        maxScore === minScore
          ? 1
          : (candidate.score - minScore) / (maxScore - minScore);
      const confidence = this.clamp(
        0.45 + normalizedScore * 0.4 - index * 0.05,
        0.35,
        0.92
      );

      suggestions.push({
        rank: index + 1,
        action: {
          actionType: candidate.action.actionType,
          targetDomain: candidate.action.targetDomain,
          targetActorId: candidate.action.targetActorId,
          intensity: candidate.intensity,
        },
        rationale: this.buildSuggestionRationale(
          inspection,
          domainStatus?.trend ?? "stable"
        ),
        confidence: Math.round(confidence * 1000) / 1000,
        expectedLocalEffects: {
          summary: this.buildEffectsSummary(effects),
          stressDelta: effects.estimatedStressDelta,
          resilienceDelta: effects.estimatedResilienceDelta,
        },
      });
    }

    return suggestions;
  }

  private compareScoredActions(a: ScoredAction, b: ScoredAction): number {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.action.actionType !== b.action.actionType) {
      return a.action.actionType.localeCompare(b.action.actionType);
    }
    return a.action.targetDomain.localeCompare(b.action.targetDomain);
  }

  private getScoreBounds(scored: ScoredAction[]): [number, number] {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const candidate of scored) {
      min = Math.min(min, candidate.score);
      max = Math.max(max, candidate.score);
    }
    return [min, max];
  }

  private scoreAction(action: LegalAction, brief: TurnBrief): number {
    const domainStatus = brief.domainSummary.find(
      (domain) => domain.domain === action.targetDomain
    );
    const stress = domainStatus?.stress ?? 0.5;
    const resilience = domainStatus?.resilience ?? 0.5;
    const trendScore =
      domainStatus?.trend === "rising"
        ? 0.12
        : domainStatus?.trend === "falling"
          ? -0.06
          : 0;

    let score = stress * 0.4 + (1 - resilience) * 0.25 + trendScore;

    if (brief.role === "blue_commander") {
      if (action.estimatedStressImpact < 0) score += 0.2;
      if (this.isStabilizingAction(action.actionType)) score += 0.1;
      if (brief.orderParameter > 0.6 && action.estimatedStressImpact > 0) {
        score -= 0.15;
      }
      if (brief.phase === "Crisis" && action.actionType === "deescalate") {
        score += 0.08;
      }
    } else {
      if (action.estimatedStressImpact > 0) score += 0.2;
      if (this.isPressureAction(action.actionType)) score += 0.1;
      if (
        (brief.phase === "Competition" || brief.phase === "Crisis") &&
        action.estimatedStressImpact > 0
      ) {
        score += 0.08;
      }
      if (brief.phase === "Escalation" && action.actionType === "deescalate") {
        score -= 0.1;
      }
    }

    return score;
  }

  private selectIntensity(action: LegalAction, brief: TurnBrief): number {
    const domainStatus = brief.domainSummary.find(
      (domain) => domain.domain === action.targetDomain
    );
    const stress = domainStatus?.stress ?? 0.5;
    const [minIntensity, maxIntensity] = action.intensityRange;
    const midpoint = (minIntensity + maxIntensity) / 2;

    let intensity = midpoint;
    if (brief.role === "blue_commander") {
      intensity += action.estimatedStressImpact < 0 ? 0.08 : -0.04;
      intensity += (stress - 0.5) * 0.2;
    } else {
      intensity += action.estimatedStressImpact > 0 ? 0.1 : -0.03;
      intensity += brief.phase === "WarTransition" || brief.phase === "LimitedWar"
        ? 0.06
        : 0;
    }

    intensity = this.clamp(intensity, minIntensity, maxIntensity);
    return Math.round(intensity * 100) / 100;
  }

  private buildStateSummary(brief: TurnBrief): string {
    const topDomains = [...brief.domainSummary]
      .sort((a, b) => b.stress - a.stress)
      .slice(0, 2)
      .map(
        (domain) =>
          `${domain.domain} (stress ${domain.stress.toFixed(2)}, resilience ${domain.resilience.toFixed(2)})`
      );
    const salient = brief.salientChanges[0];

    return `Turn ${brief.turn} in ${brief.phase} (order parameter ${brief.orderParameter.toFixed(3)}). Priority pressure points: ${topDomains.join("; ")}.${salient ? ` Most recent shift: ${salient}.` : ""}`;
  }

  private buildStrategicOutlook(
    brief: TurnBrief,
    suggestions: AdvisorSuggestion[]
  ): string {
    const highStressCount = brief.domainSummary.filter(
      (domain) => domain.stress >= 0.6
    ).length;
    const risingCount = brief.domainSummary.filter(
      (domain) => domain.trend === "rising"
    ).length;
    const riskLevel =
      brief.orderParameter >= 0.75
        ? "high"
        : brief.orderParameter >= 0.45
          ? "moderate"
          : "contained";
    const topSuggestion = suggestions[0];
    const tradeoff =
      brief.strategicTradeoffs[0] ??
      "Balance immediate gains against second-order escalation effects.";

    if (!topSuggestion) {
      return `Escalation risk is ${riskLevel}. No legal actions are currently available; monitor ${highStressCount} high-stress domains and reassess as the turn state changes.`;
    }

    return `Escalation risk is ${riskLevel}, with ${highStressCount} high-stress domain(s) and ${risingCount} domain(s) still rising. Lead option is ${topSuggestion.action.actionType} in ${topSuggestion.action.targetDomain}; ${tradeoff}`;
  }

  private buildSuggestionRationale(
    inspection: ActionInspection,
    trend: "rising" | "falling" | "stable"
  ): string {
    const trendText =
      trend === "rising"
        ? "Domain stress is rising, so timely intervention matters."
        : trend === "falling"
          ? "Stress is easing, so this helps consolidate gains."
          : "Stress is stable, making this a controlled adjustment.";

    return `${inspection.description} ${trendText} ${inspection.domainContext}`;
  }

  private buildEffectsSummary(effectEstimate: EffectEstimate): string {
    const stressDirection =
      effectEstimate.estimatedStressDelta >= 0 ? "increase" : "decrease";
    const resilienceDirection =
      effectEstimate.estimatedResilienceDelta >= 0 ? "increase" : "decrease";
    const note = effectEstimate.notes[0] ?? "Local effects estimated from heuristic model.";

    return `Estimated ${stressDirection} in stress (${effectEstimate.estimatedStressDelta.toFixed(3)}) and ${resilienceDirection} in resilience (${effectEstimate.estimatedResilienceDelta.toFixed(3)}). ${note}`;
  }

  private async refineNarrativeWithLlm(
    brief: TurnBrief,
    suggestions: AdvisorSuggestion[],
    stateSummary: string,
    strategicOutlook: string
  ): Promise<NarrativeRefinement | null> {
    if (config.useMockAi || !config.copilotApiKey) {
      return null;
    }

    const suggestionPayload = suggestions.map((suggestion) => ({
      rank: suggestion.rank,
      actionType: suggestion.action.actionType,
      targetDomain: suggestion.action.targetDomain,
      intensity: suggestion.action.intensity,
      rationale: suggestion.rationale,
      confidence: suggestion.confidence,
    }));

    const prompt = [
      "You are an operational advisor in a grey-zone simulation.",
      "Refine two narrative fields based on the supplied brief and ranked suggestions.",
      "Return ONLY valid JSON with keys: stateSummary, strategicOutlook.",
      "",
      "Current stateSummary:",
      stateSummary,
      "",
      "Current strategicOutlook:",
      strategicOutlook,
      "",
      "Turn brief:",
      JSON.stringify(
        {
          turn: brief.turn,
          phase: brief.phase,
          orderParameter: brief.orderParameter,
          salientChanges: brief.salientChanges,
          strategicTradeoffs: brief.strategicTradeoffs,
        },
        null,
        2
      ),
      "",
      "Ranked suggestions:",
      JSON.stringify(suggestionPayload, null, 2),
    ].join("\n");

    try {
      const response = await axios.post(
        "https://api.githubcopilot.com/chat/completions",
        {
          model: config.copilotModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 350,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${config.copilotApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 25000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        return null;
      }

      return this.parseNarrativeResponse(content);
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : String(error) },
        "Advisor narrative refinement failed, using heuristic narrative"
      );
      return null;
    }
  }

  private parseNarrativeResponse(content: string): NarrativeRefinement | null {
    const jsonPayload = this.extractJson(content);
    if (!jsonPayload) {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonPayload) as Record<string, unknown>;
      const stateSummaryValue =
        typeof parsed.stateSummary === "string"
          ? parsed.stateSummary
          : typeof parsed.state_summary === "string"
            ? parsed.state_summary
            : null;
      const strategicOutlookValue =
        typeof parsed.strategicOutlook === "string"
          ? parsed.strategicOutlook
          : typeof parsed.strategic_outlook === "string"
            ? parsed.strategic_outlook
            : null;

      if (!stateSummaryValue || !strategicOutlookValue) {
        return null;
      }

      return {
        stateSummary: this.sanitizeNarrative(stateSummaryValue),
        strategicOutlook: this.sanitizeNarrative(strategicOutlookValue),
      };
    } catch {
      return null;
    }
  }

  private sanitizeNarrative(value: string): string {
    const trimmed = value.trim();
    return trimmed.length > 500 ? `${trimmed.slice(0, 497)}...` : trimmed;
  }

  private extractJson(content: string): string | null {
    const fenced = content.match(/```json\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return fenced[1].trim();
    }

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    return content.slice(start, end + 1).trim();
  }

  private async executeTool<T>(
    toolName: AdvisorToolName,
    input: Record<string, unknown>
  ): Promise<T> {
    const output = await this.toolExecutor.executeTool(toolName, input);
    return output as T;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private isStabilizingAction(actionType: string): boolean {
    return [
      "deescalate",
      "cyber_defense_hardening",
      "port_security",
      "logistics_reinforcement",
      "supply_chain_diversification",
      "media_counter_narrative",
      "air_defense_activation",
    ].includes(actionType);
  }

  private isPressureAction(actionType: string): boolean {
    return [
      "military_posture",
      "special_operations",
      "trade_route_disruption",
      "energy_supply_pressure",
      "industrial_sabotage",
      "cyber_intrusion",
      "ddos_attack",
      "satellite_interference",
      "disinformation_campaign",
    ].includes(actionType);
  }
}
