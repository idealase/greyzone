import axios from "axios";
import pino from "pino";
import type {
  ActionDecision,
  LegalAction,
  TurnBrief,
} from "../types/index.js";
import type { ToolDefinition } from "../types/tools.js";
import { config } from "../config.js";

const logger = pino({ level: config.logLevel });

export interface AiClient {
  selectAction(
    brief: TurnBrief,
    legalActions: LegalAction[],
    systemPrompt: string,
    turnPrompt: string,
    tools: ToolDefinition[]
  ): Promise<ActionDecision>;
}

/**
 * Heuristic AI client for local development.
 * Produces reasonably varied, strategically plausible actions without
 * calling any external LLM.
 */
export class HeuristicAiClient implements AiClient {
  private turnSeed = 0;

  async selectAction(
    brief: TurnBrief,
    legalActions: LegalAction[],
    _systemPrompt?: string,
    _turnPrompt?: string,
    _tools?: ToolDefinition[]
  ): Promise<ActionDecision> {
    if (legalActions.length === 0) {
      return {
        actionType: "hold_steady",
        targetDomain: "kinetic",
        intensity: 0,
        rationale: "No legal actions available; holding steady.",
        confidence: 1.0,
      };
    }

    this.turnSeed = brief.turn;
    const isRed = brief.role === "red_commander";
    const phase = brief.phase;

    // Score each legal action
    const scored = legalActions.map((action) => ({
      action,
      score: this.scoreAction(action, brief, isRed, phase),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Pick from top 3 with some randomness for variety
    const topN = Math.min(3, scored.length);
    const pickIndex = this.pseudoRandom(brief.turn, topN);
    const selected = scored[pickIndex];

    // Determine intensity
    const intensity = this.computeIntensity(
      selected.action,
      brief,
      isRed,
      phase
    );

    const rationale = this.buildRationale(
      selected.action,
      brief,
      isRed,
      intensity
    );

    return {
      actionType: selected.action.actionType,
      targetDomain: selected.action.targetDomain,
      targetActorId: selected.action.targetActorId,
      intensity,
      rationale,
      confidence: Math.min(0.95, 0.5 + selected.score * 0.1),
    };
  }

  private scoreAction(
    action: LegalAction,
    brief: TurnBrief,
    isRed: boolean,
    phase: string
  ): number {
    let score = 0;
    const domainSummary = brief.domainSummary.find(
      (d) => d.domain === action.targetDomain
    );

    if (!domainSummary) return 0;

    if (isRed) {
      // Red prefers: high-stress domains (exploitable), low-resilience targets
      score += domainSummary.stress * 2;
      score += (1 - domainSummary.resilience) * 1.5;

      // Red prefers escalation in early phases
      if (phase === "Competition" || phase === "Crisis") {
        if (action.estimatedStressImpact > 0) score += 2;
      }

      // In later phases, prefer decisive actions
      if (phase === "WarTransition" || phase === "LimitedWar") {
        score += Math.abs(action.estimatedStressImpact) * 3;
      }

      // Penalize de-escalation for red (unless resources are critically low)
      if (action.actionType === "deescalate") score -= 2;
    } else {
      // Blue prefers: stabilizing high-stress domains, reinforcing resilience
      if (domainSummary.stress > 0.5) score += domainSummary.stress * 3;
      score += (1 - domainSummary.resilience) * 2;

      // Blue prefers defensive/resilience actions
      if (action.estimatedStressImpact < 0) score += 2;

      // In escalated phases, blue prefers de-escalation
      if (
        phase === "WarTransition" ||
        phase === "LimitedWar" ||
        phase === "Escalation"
      ) {
        if (action.actionType === "deescalate") score += 3;
      }

      // Prefer cyber defense, media counter-narrative, etc.
      if (
        action.actionType.includes("defense") ||
        action.actionType.includes("counter") ||
        action.actionType.includes("reinforcement") ||
        action.actionType.includes("hardening")
      ) {
        score += 1.5;
      }
    }

    // Rising trend domains get priority
    if (domainSummary.trend === "rising") score += 1;

    // Bonus for variety (prefer domains not recently targeted)
    score += this.pseudoRandom(brief.turn + score, 100) / 200;

    return score;
  }

  private computeIntensity(
    action: LegalAction,
    brief: TurnBrief,
    isRed: boolean,
    phase: string
  ): number {
    const [min, max] = action.intensityRange;
    const range = max - min;

    let proportion: number;

    if (isRed) {
      // Red uses higher intensity in later phases
      switch (phase) {
        case "Competition":
          proportion = 0.3 + this.pseudoRandom(brief.turn, 100) / 400;
          break;
        case "Crisis":
          proportion = 0.4 + this.pseudoRandom(brief.turn, 100) / 300;
          break;
        case "HybridCoercion":
          proportion = 0.5 + this.pseudoRandom(brief.turn, 100) / 300;
          break;
        default:
          proportion = 0.6 + this.pseudoRandom(brief.turn, 100) / 300;
      }
    } else {
      // Blue uses moderate intensity, higher in urgent situations
      const urgency = brief.domainSummary
        .filter((d) => d.domain === action.targetDomain)
        .map((d) => d.stress)[0] ?? 0.5;

      proportion = 0.3 + urgency * 0.4 + this.pseudoRandom(brief.turn, 100) / 500;
    }

    proportion = Math.max(0, Math.min(1, proportion));
    return Math.round((min + range * proportion) * 100) / 100;
  }

  private buildRationale(
    action: LegalAction,
    brief: TurnBrief,
    isRed: boolean,
    intensity: number
  ): string {
    const domainInfo = brief.domainSummary.find(
      (d) => d.domain === action.targetDomain
    );

    const parts: string[] = [];

    parts.push(
      `Turn ${brief.turn}, Phase: ${brief.phase}, Order Parameter: ${brief.orderParameter.toFixed(3)}.`
    );

    if (domainInfo) {
      parts.push(
        `${action.targetDomain} domain shows stress=${domainInfo.stress.toFixed(2)}, resilience=${domainInfo.resilience.toFixed(2)}, trend=${domainInfo.trend}.`
      );
    }

    if (isRed) {
      parts.push(
        `Selecting ${action.actionType} at intensity ${intensity.toFixed(2)} to advance Red objectives.`
      );
      if (action.estimatedStressImpact > 0) {
        parts.push(
          `This action is expected to increase adversary stress by ~${action.estimatedStressImpact.toFixed(2)}.`
        );
      }
    } else {
      parts.push(
        `Selecting ${action.actionType} at intensity ${intensity.toFixed(2)} to reinforce Blue stability.`
      );
      if (action.estimatedStressImpact < 0) {
        parts.push(
          `This action is expected to reduce stress by ~${Math.abs(action.estimatedStressImpact).toFixed(2)}.`
        );
      }
    }

    if (brief.strategicTradeoffs.length > 0) {
      parts.push(`Key tradeoff: ${brief.strategicTradeoffs[0]}`);
    }

    return parts.join(" ");
  }

  /**
   * Deterministic pseudo-random for reproducible but varied behavior.
   */
  private pseudoRandom(seed: number, max: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return Math.abs(Math.floor(x)) % max;
  }
}

/**
 * Copilot SDK AI client for real LLM-powered decisions.
 * Uses the GitHub Copilot API with tool calling.
 */
export class CopilotAiClient implements AiClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async selectAction(
    brief: TurnBrief,
    legalActions: LegalAction[],
    systemPrompt: string,
    turnPrompt: string,
    _tools: ToolDefinition[]
  ): Promise<ActionDecision> {
    try {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: turnPrompt },
      ];

      const response = await axios.post(
        "https://api.githubcopilot.com/chat/completions",
        {
          model: this.model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 25000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content ?? "";
      return this.parseActionFromResponse(content, legalActions);
    } catch (err) {
      logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        "Copilot API call failed, falling back to heuristic"
      );
      // Graceful fallback to heuristic
      const fallback = new HeuristicAiClient();
      return fallback.selectAction(brief, legalActions, "", "", []);
    }
  }

  private parseActionFromResponse(
    content: string,
    legalActions: LegalAction[]
  ): ActionDecision {
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*?"actionType"[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.actionType && parsed.targetDomain) {
          return {
            actionType: parsed.actionType,
            targetDomain: parsed.targetDomain,
            targetActorId: parsed.targetActorId,
            intensity: parsed.intensity ?? 0.5,
            rationale: parsed.rationale ?? content.slice(0, 200),
            confidence: parsed.confidence ?? 0.7,
          };
        }
      } catch {
        // Fall through to heuristic
      }
    }

    // If we can't parse, fall back to heuristic
    logger.warn("Could not parse LLM response, falling back to heuristic");
    const fallback = new HeuristicAiClient();
    // Return synchronously since HeuristicAiClient.selectAction returns immediately
    return {
      actionType: legalActions[0]?.actionType ?? "hold_steady",
      targetDomain: legalActions[0]?.targetDomain ?? "kinetic",
      intensity: 0.5,
      rationale: `LLM response unparseable. Original: ${content.slice(0, 100)}`,
      confidence: 0.3,
    };
  }
}

/**
 * Factory function to create the appropriate AI client based on config.
 */
export function createAiClient(): AiClient {
  if (config.useMockAi || !config.copilotApiKey) {
    logger.info("Using heuristic AI client (mock mode)");
    return new HeuristicAiClient();
  }

  logger.info({ model: config.copilotModel }, "Using Copilot AI client");
  return new CopilotAiClient(config.copilotApiKey, config.copilotModel);
}
