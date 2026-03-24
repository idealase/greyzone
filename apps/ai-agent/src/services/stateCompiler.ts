import type { TurnBrief, DomainSummary, LegalAction } from "../types/index.js";
import type { GameState, DomainState } from "../types/state.js";

export class StateCompiler {
  private previousStates: Map<string, GameState> = new Map();

  async compileTurnBrief(
    runId: string,
    roleId: string,
    currentState: GameState,
    legalActions: LegalAction[]
  ): Promise<TurnBrief> {
    const previousState = this.previousStates.get(runId);

    const salientChanges = this.computeSalientChanges(
      previousState,
      currentState
    );
    const currentObjectives = this.computeObjectives(
      roleId,
      currentState.phase,
      currentState
    );
    const constraints = this.computeConstraints(currentState, legalActions);
    const strategicTradeoffs = this.computeTradeoffs(currentState, legalActions);
    const domainSummary = this.compileDomainSummaries(
      previousState,
      currentState
    );

    // Cache current state for next turn comparison
    this.previousStates.set(runId, currentState);

    return {
      role: roleId,
      turn: currentState.turn,
      phase: currentState.phase,
      orderParameter: currentState.orderParameter,
      salientChanges,
      currentObjectives,
      constraints,
      strategicTradeoffs,
      legalActionCount: legalActions.length,
      domainSummary,
    };
  }

  private computeSalientChanges(
    previous: GameState | undefined,
    current: GameState
  ): string[] {
    const changes: string[] = [];

    if (!previous) {
      changes.push("First turn - no prior state to compare");
      return changes;
    }

    // Phase change
    if (previous.phase !== current.phase) {
      changes.push(
        `Phase transitioned from "${previous.phase}" to "${current.phase}"`
      );
    }

    // Order parameter shift
    const opDelta = current.orderParameter - previous.orderParameter;
    if (Math.abs(opDelta) > 0.02) {
      const direction = opDelta > 0 ? "increased" : "decreased";
      changes.push(
        `Order parameter ${direction} by ${Math.abs(opDelta).toFixed(3)} to ${current.orderParameter.toFixed(3)}`
      );
    }

    // Domain stress changes > 0.05
    for (const currentDomain of current.domains) {
      const prevDomain = previous.domains.find(
        (d) => d.domain === currentDomain.domain
      );
      if (!prevDomain) continue;

      const stressDelta = currentDomain.stress - prevDomain.stress;
      if (Math.abs(stressDelta) > 0.05) {
        const direction = stressDelta > 0 ? "rose" : "fell";
        changes.push(
          `${currentDomain.domain} stress ${direction} by ${Math.abs(stressDelta).toFixed(2)} to ${currentDomain.stress.toFixed(2)}`
        );
      }

      const resilienceDelta = currentDomain.resilience - prevDomain.resilience;
      if (Math.abs(resilienceDelta) > 0.05) {
        const direction = resilienceDelta > 0 ? "improved" : "degraded";
        changes.push(
          `${currentDomain.domain} resilience ${direction} by ${Math.abs(resilienceDelta).toFixed(2)}`
        );
      }
    }

    // New events
    const previousEventIds = new Set(previous.events.map((e) => e.eventId));
    const newEvents = current.events.filter(
      (e) => !previousEventIds.has(e.eventId)
    );
    for (const event of newEvents.slice(0, 5)) {
      changes.push(`New event: ${event.description}`);
    }

    if (changes.length === 0) {
      changes.push("No significant changes since last turn");
    }

    return changes;
  }

  private computeObjectives(
    roleId: string,
    phase: string,
    state: GameState
  ): string[] {
    const objectives: string[] = [];

    if (roleId === "red_commander") {
      // Red objectives shift with phase
      switch (phase) {
        case "Competition":
          objectives.push(
            "Probe adversary defenses across domains to identify weaknesses"
          );
          objectives.push(
            "Build strategic leverage through economic and information operations"
          );
          objectives.push("Avoid premature escalation that unites the coalition");
          break;
        case "Crisis":
          objectives.push(
            "Exploit crisis dynamics to create fait accompli situations"
          );
          objectives.push(
            "Increase pressure in weakest adversary domains"
          );
          objectives.push("Maintain deniability where possible");
          break;
        case "HybridCoercion":
          objectives.push(
            "Apply coordinated pressure across multiple domains"
          );
          objectives.push(
            "Exploit domain couplings to amplify effects"
          );
          objectives.push(
            "Keep escalation below kinetic threshold if possible"
          );
          break;
        case "WarTransition":
        case "LimitedWar":
        case "Escalation":
          objectives.push(
            "Achieve decisive advantage before adversary can mobilize fully"
          );
          objectives.push("Protect critical home infrastructure");
          objectives.push(
            "Seek war termination on favorable terms"
          );
          break;
        default:
          objectives.push("Advance strategic interests across all domains");
      }
    } else {
      // Blue objectives
      switch (phase) {
        case "Competition":
          objectives.push("Strengthen alliance cohesion and deterrence posture");
          objectives.push("Reinforce resilience in critical infrastructure domains");
          objectives.push("Monitor and attribute adversary grey zone activities");
          break;
        case "Crisis":
          objectives.push("De-escalate while maintaining credible deterrence");
          objectives.push("Coordinate coalition response to provocations");
          objectives.push("Protect critical supply chains and energy infrastructure");
          break;
        case "HybridCoercion":
          objectives.push(
            "Counter hybrid attacks while avoiding unnecessary escalation"
          );
          objectives.push("Reinforce cyber and information defenses");
          objectives.push(
            "Maintain domestic political support for sustained response"
          );
          break;
        case "WarTransition":
        case "LimitedWar":
        case "Escalation":
          objectives.push(
            "Defend critical infrastructure and population centers"
          );
          objectives.push(
            "Maintain coalition unity under pressure"
          );
          objectives.push(
            "Seek de-escalation opportunities while maintaining defense"
          );
          break;
        default:
          objectives.push("Maintain stability and deter aggression");
      }
    }

    // Add domain-specific objectives for high-stress domains
    const highStressDomains = state.domains.filter((d) => d.stress > 0.6);
    for (const domain of highStressDomains) {
      if (roleId === "blue_commander") {
        objectives.push(
          `URGENT: Address critical stress in ${domain.domain} (${domain.stress.toFixed(2)})`
        );
      } else {
        objectives.push(
          `OPPORTUNITY: Exploit high stress in ${domain.domain} (${domain.stress.toFixed(2)})`
        );
      }
    }

    return objectives;
  }

  private computeConstraints(
    state: GameState,
    legalActions: LegalAction[]
  ): string[] {
    const constraints: string[] = [];

    constraints.push(`Current phase: ${state.phase}`);
    constraints.push(
      `Order parameter: ${state.orderParameter.toFixed(3)} (higher = closer to escalation)`
    );
    constraints.push(`Available actions: ${legalActions.length}`);

    // Resource constraints from actors
    for (const actor of state.actors) {
      if (actor.resources < 0.3) {
        constraints.push(
          `WARNING: ${actor.role} resources are low (${actor.resources.toFixed(2)})`
        );
      }
    }

    // Phase-based constraints
    if (state.phase === "Competition") {
      constraints.push(
        "Phase constraint: Kinetic actions may be limited or carry high escalation risk"
      );
    }

    return constraints;
  }

  private computeTradeoffs(
    state: GameState,
    legalActions: LegalAction[]
  ): string[] {
    const tradeoffs: string[] = [];

    // Find domain couplings
    for (const domain of state.domains) {
      const strongCouplings = Object.entries(domain.couplingStrength || {})
        .filter(([, strength]) => strength > 0.3)
        .map(([coupled]) => coupled);

      if (strongCouplings.length > 0 && domain.stress > 0.4) {
        tradeoffs.push(
          `Acting in ${domain.domain} may cascade to ${strongCouplings.join(", ")} due to strong coupling`
        );
      }
    }

    // Escalation vs. opportunity tradeoff
    const hasEscalatory = legalActions.some((a) => a.estimatedStressImpact > 0.1);
    const hasDeescalatory = legalActions.some(
      (a) => a.estimatedStressImpact < -0.05
    );
    if (hasEscalatory && hasDeescalatory) {
      tradeoffs.push(
        "Escalatory actions offer greater impact but risk phase transition; de-escalatory actions preserve stability but cede initiative"
      );
    }

    // Multi-domain vs. concentrated approach
    const domainsWithActions = new Set(legalActions.map((a) => a.targetDomain));
    if (domainsWithActions.size > 3) {
      tradeoffs.push(
        "Spreading effort across many domains provides breadth but reduces impact; concentrating may break through but leaves flanks exposed"
      );
    }

    if (tradeoffs.length === 0) {
      tradeoffs.push("No major strategic tradeoffs identified this turn");
    }

    return tradeoffs;
  }

  private compileDomainSummaries(
    previous: GameState | undefined,
    current: GameState
  ): DomainSummary[] {
    return current.domains.map((domain) => {
      const prevDomain = previous?.domains.find(
        (d) => d.domain === domain.domain
      );

      let trend: "rising" | "falling" | "stable" = "stable";
      if (prevDomain) {
        const delta = domain.stress - prevDomain.stress;
        if (delta > 0.02) trend = "rising";
        else if (delta < -0.02) trend = "falling";
      }

      return {
        domain: domain.domain,
        stress: domain.stress,
        resilience: domain.resilience,
        trend,
        keyEvents: domain.recentEvents?.slice(0, 3) ?? [],
      };
    });
  }

  clearCache(runId?: string): void {
    if (runId) {
      this.previousStates.delete(runId);
    } else {
      this.previousStates.clear();
    }
  }
}
