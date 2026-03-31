"""Turn narration service — generates rich narrative text for game events."""

from __future__ import annotations

import random
from typing import Any

# ── Stochastic Event Narrative Templates ──────────────────────────────────────

EVENT_NARRATIVES: dict[str, list[str]] = {
    # Escalatory events
    "Major Cyber Incident": [
        "A sophisticated cyber intrusion has compromised critical infrastructure networks. Defense teams scramble to contain the breach as cascading failures threaten connected systems.",
        "Signals intelligence detects a coordinated cyber attack across multiple networks. Firewalls are crumbling faster than they can be rebuilt.",
        "A zero-day exploit has been activated across key government and military systems. Cyber command reports significant data exfiltration underway.",
    ],
    "Energy Supply Disruption": [
        "Pipeline monitoring stations report a sudden drop in gas flow. European energy markets are in turmoil as emergency reserves are activated.",
        "A critical energy chokepoint has been disrupted. Wholesale electricity prices surge as grid operators scramble to maintain stability.",
        "Unconfirmed reports of sabotage at a major energy hub send shockwaves through commodity markets. Emergency protocols are in effect.",
    ],
    "Political Crisis": [
        "A coalition government has collapsed under pressure from competing factions. Political paralysis threatens to undermine the alliance's unified response.",
        "Street protests erupt in a key allied capital as public frustration with the crisis boils over. Leadership credibility is at stake.",
        "Leaked diplomatic cables reveal deep divisions within the alliance. Opposition leaders demand an immediate policy reversal.",
    ],
    "Maritime Incident": [
        "Naval patrol ships report a near-collision in contested waters. Both sides are locked in a dangerous game of brinkmanship at sea.",
        "An unidentified submarine has been detected in sovereign territorial waters. Anti-submarine warfare assets are being mobilized.",
        "A merchant vessel has been seized under disputed legal pretenses. Shipping companies are rerouting through longer, costlier corridors.",
    ],
    "Satellite Interference": [
        "GPS accuracy has degraded significantly across the operational theater. Navigation systems report anomalous behavior consistent with targeted jamming.",
        "A positioning satellite has gone dark without explanation. Military and civilian systems dependent on it are switching to degraded backup modes.",
        "Electronic warfare specialists detect coordinated spoofing of satellite navigation signals. Precision-guided operations may be compromised.",
    ],
    "Disinformation Campaign": [
        "A coordinated disinformation campaign is flooding social media with fabricated narratives. Public trust in official channels is eroding rapidly.",
        "Deepfake videos of senior officials are circulating widely, sowing confusion about the alliance's actual policy positions.",
        "Bot networks have amplified divisive narratives tenfold overnight. Media literacy teams report being overwhelmed by the sheer volume.",
    ],
    "Economic Sanctions Escalation": [
        "New rounds of targeted sanctions are being imposed, but their secondary effects are hitting allied economies harder than expected.",
        "Financial markets react sharply to expanded sanctions. Several allied banks report exposure to frozen assets beyond initial estimates.",
        "Trade flows are grinding to a halt as sanctions compliance checks create bottlenecks at every port and border crossing.",
    ],
    "Border Skirmish": [
        "Shots fired along the eastern border have left both sides on high alert. Military commanders demand authorization for retaliatory measures.",
        "A border patrol unit reports contact with unidentified armed forces. Rules of engagement are being urgently reviewed at the highest levels.",
        "An exchange of fire near a disputed border checkpoint has resulted in casualties. Both sides blame the other for provocation.",
    ],
    "Refugee Crisis": [
        "A sudden surge of displaced civilians is overwhelming border processing centers. Humanitarian organizations report critical shortages of supplies.",
        "Columns of refugees are creating security concerns at multiple border crossings. Intelligence warns of potential infiltration by hostile operatives.",
        "The humanitarian situation has reached crisis proportions. Political pressure to close borders clashes with alliance obligations.",
    ],
    "Submarine Cable Cut": [
        "Subsea fiber-optic cables have been severed in suspicious circumstances. International communications are being rerouted through limited satellite bandwidth.",
        "Critical undersea data cables have gone offline. Financial transactions and military communications are experiencing severe latency.",
        "Naval intelligence suspects deliberate sabotage of seabed infrastructure. Repair vessels will take weeks to reach the damage sites.",
    ],
    "Trade Route Blockage": [
        "A key maritime trade corridor has been blockaded. Container ships are stacking up at anchor as shipping costs skyrocket.",
        "Access to critical port facilities has been denied under security pretenses. Supply chain disruptions are rippling across the continent.",
        "Insurance premiums for commercial shipping in the affected zone have tripled. Several major carriers have suspended operations.",
    ],
    "Military Exercise Provocation": [
        "Large-scale military exercises near the border are being interpreted as a provocation. Satellite imagery shows unprecedented force concentrations.",
        "Live-fire exercises with strategic weapons systems have sent a clear signal of escalatory intent. Allied forces are elevating readiness levels.",
        "Military maneuvers simulate invasion scenarios uncomfortably close to allied territory. Diplomatic protests have been filed.",
    ],
    "Proxy Force Activation": [
        "Intelligence reports indicate activation of proxy forces in contested regions. Deniable operations are underway across multiple fronts.",
        "Non-state armed groups with known state backing have begun coordinated operations. Attribution remains deliberately ambiguous.",
        "Proxy militias have seized key infrastructure in a disputed zone. The action bears hallmarks of a state-sponsored operation.",
    ],
    "Critical Infrastructure Failure": [
        "A catastrophic failure at a major power plant has triggered widespread blackouts. Emergency services are stretched to their limits.",
        "Critical infrastructure has suffered a cascading failure. The root cause — whether technical fault or sabotage — remains under investigation.",
        "Multiple infrastructure systems have failed simultaneously in what experts call a 'correlated failure event.' Restoration may take weeks.",
    ],
    # De-escalatory events
    "Diplomatic Breakthrough": [
        "Back-channel negotiations have produced a framework for de-escalation. Both sides signal cautious willingness to step back from the brink.",
        "A surprise diplomatic initiative has opened new channels of communication. Optimism is tempered by awareness of how fragile progress remains.",
        "Senior envoys have reached a preliminary agreement on confidence-building measures. The diplomatic corps is cautiously celebrating.",
    ],
    "Energy Discovery": [
        "The discovery of new energy reserves has eased supply concerns. Market prices are stabilizing as futures contracts adjust.",
        "Alternative energy supply routes have been secured, reducing dependence on vulnerable corridors. Energy security improves measurably.",
        "A breakthrough in emergency energy agreements provides strategic breathing room. The immediate crisis pressure on energy markets is easing.",
    ],
    "Cyber Defense Success": [
        "Cyber defense teams have successfully neutralized a major threat. Lessons learned are being rapidly shared across allied networks.",
        "A coordinated cyber defense operation has identified and patched critical vulnerabilities before they could be exploited.",
        "Advanced threat detection systems have intercepted and contained a sophisticated intrusion attempt. Defensive posture improves.",
    ],
    "Economic Boom": [
        "Positive economic indicators are bolstering confidence across allied markets. Growth projections are being revised upward.",
        "Strong trade data and improving business sentiment provide economic resilience against external pressures.",
        "A wave of private investment signals confidence in long-term stability. Economic fundamentals provide a solid foundation for sustained operations.",
    ],
    "Alliance Solidarity Declaration": [
        "Alliance leaders have issued a joint statement reaffirming collective defense commitments. Unity sends a clear signal of resolve.",
        "An emergency summit has produced a unanimous declaration of solidarity. Internal divisions have been set aside — for now.",
        "A show of allied unity at the highest political level has reinforced deterrence credibility. Public confidence in the alliance rises.",
    ],
    "Space Weather Event": [
        "A solar storm has disrupted satellite communications across the theater. Both sides are equally affected, creating an unexpected pause in space-based operations.",
    ],
}

# ── Action Narrative Templates ────────────────────────────────────────────────

ACTION_NARRATIVES: dict[str, dict[str, str]] = {
    "Escalate": {
        "positive": "Blue Coalition has escalated operations in {domain}. Stress levels rise by {delta}, signaling a deliberate increase in pressure.",
        "narrative": "The decision to escalate in {domain} sends shockwaves through the operational theater. Adversary analysts are recalculating their assumptions.",
    },
    "DeEscalate": {
        "positive": "Diplomatic channels in {domain} have been activated, easing tensions by {delta}.",
        "narrative": "A deliberate de-escalation in {domain} provides breathing room. The question is whether the other side will reciprocate.",
    },
    "Reinforce": {
        "positive": "Reinforcement operations have bolstered resilience in {domain} by {delta}.",
        "narrative": "Additional resources are being deployed to shore up {domain} defenses. Resilience improves, but at the cost of operational tempo elsewhere.",
    },
    "Disrupt": {
        "positive": "Disruption operations in {domain} have degraded adversary resilience by {delta}.",
        "narrative": "Targeted disruption in {domain} has weakened the opponent's ability to absorb shocks. The domain is increasingly fragile.",
    },
    "Mobilize": {
        "positive": "Forces are being mobilized in {domain}, increasing operational activity by {delta}.",
        "narrative": "Mobilization orders have been issued for {domain}. Activity levels surge, but the buildup itself creates additional stress.",
    },
    "Negotiate": {
        "positive": "Negotiations in {domain} have produced a fragile agreement, reducing stress by {delta}.",
        "narrative": "Quiet negotiations in {domain} have yielded a tentative accord. Connected domains also benefit from the reduced tension.",
    },
    "CyberAttack": {
        "positive": "A cyber offensive in {domain} has increased stress by {delta} while degrading defensive posture.",
        "narrative": "Cyber operations have penetrated deep into {domain} networks. The digital battlefield shifts as defenders scramble to respond.",
    },
    "InformationOp": {
        "positive": "Information operations have increased {domain} stress by {delta}, with spillover effects into political domains.",
        "narrative": "A coordinated information campaign is reshaping public perception in {domain}. The narrative war intensifies as trust erodes.",
    },
    "SanctionImpose": {
        "positive": "Economic sanctions have been imposed, increasing {domain} stress by {delta}.",
        "narrative": "New sanctions packages target key economic sectors. However, the blowback on domestic markets creates political friction.",
    },
    "SanctionRelief": {
        "positive": "Sanctions relief in {domain} has eased stress by {delta} and improved resilience.",
        "narrative": "The easing of sanctions provides economic relief in {domain}. Trade flows begin to normalize as market confidence returns.",
    },
    "MilitaryDeploy": {
        "positive": "Military deployment in {domain} has significantly increased stress by {delta}.",
        "narrative": "Military forces have been deployed to {domain}. The show of force raises the stakes dramatically — there is no mistaking the intent.",
    },
    "NavalBlockade": {
        "positive": "A naval blockade has increased maritime stress by {delta} and degraded resilience.",
        "narrative": "Naval forces have established a blockade in {domain}. Shipping lanes constrict as the noose tightens on maritime commerce.",
    },
    "SpaceAssetDeploy": {
        "positive": "Space assets deployed in {domain} have increased stress by {delta}.",
        "narrative": "New space-based assets are being positioned in {domain}. The high ground of the modern battlefield is being contested.",
    },
    "DomesticPolicyShift": {
        "positive": "A domestic policy shift has reduced {domain} stress by {delta}.",
        "narrative": "Leadership has pivoted on domestic policy in {domain}, seeking to shore up public support for the ongoing crisis response.",
    },
}

# ── Phase Transition Narratives ───────────────────────────────────────────────

PHASE_TRANSITIONS: dict[tuple[str, str], str] = {
    ("CompetitiveNormality", "HybridCoercion"): (
        "The veneer of normalcy has cracked. Intelligence reports confirm coordinated "
        "hybrid operations across multiple domains. The situation has entered a new and "
        "more dangerous phase."
    ),
    ("HybridCoercion", "AcutePolycrisis"): (
        "Multiple crises are converging simultaneously. Decision-makers face impossible "
        "trade-offs as every domain demands attention. The polycrisis threatens to overwhelm "
        "coordination capacity."
    ),
    ("AcutePolycrisis", "WarTransition"): (
        "The conflict is rapidly approaching a point of no return. Military preparations "
        "are accelerating on all sides. Diplomatic channels are going silent as the rhetoric "
        "turns explicitly adversarial."
    ),
    ("WarTransition", "OvertInterstateWar"): (
        "Open hostilities have begun. What was once a grey-zone competition has escalated "
        "into overt interstate conflict. The international order trembles."
    ),
    ("OvertInterstateWar", "GeneralizedBlocWar"): (
        "The war has expanded beyond the original parties. Alliance commitments have been "
        "invoked, drawing multiple nations into a bloc-level confrontation. This is the "
        "scenario everyone hoped to avoid."
    ),
    # De-escalation transitions
    ("HybridCoercion", "CompetitiveNormality"): (
        "De-escalation efforts have succeeded in pulling the situation back from hybrid "
        "coercion to competitive normality. Tensions remain, but the immediate danger has passed."
    ),
    ("AcutePolycrisis", "HybridCoercion"): (
        "The polycrisis is receding. Coordinated action has resolved the most acute pressure "
        "points, though hybrid operations continue at a reduced tempo."
    ),
    ("WarTransition", "AcutePolycrisis"): (
        "A last-minute de-escalation has pulled the situation back from the brink of war. "
        "The crisis remains acute, but direct military confrontation has been averted — for now."
    ),
}

# ── Coupling Cascade Narratives ───────────────────────────────────────────────

COUPLING_NARRATIVES: dict[tuple[str, str], str] = {
    ("Kinetic", "MaritimeLogistics"): "Military operations are disrupting maritime supply lines. Port access and shipping routes face increased security restrictions.",
    ("Kinetic", "Energy"): "Military activity near energy infrastructure has raised security alerts. Pipeline operators report increased risk assessments.",
    ("Kinetic", "Cyber"): "Combat operations are driving a surge in cyber warfare. Both sides attempt to gain information advantage through digital means.",
    ("Cyber", "SpacePnt"): "Cyber operations are targeting space-based systems. Satellite control networks report anomalous commands and degraded performance.",
    ("Cyber", "InformationCognitive"): "Cyber attacks are amplifying information warfare. Compromised systems leak sensitive data that fuels hostile narratives.",
    ("InformationCognitive", "DomesticPoliticalFiscal"): "The information war is eroding public confidence. Political leaders face mounting pressure as narratives clash with official positions.",
    ("Energy", "GeoeconomicIndustrial"): "Energy disruptions are cascading through industrial supply chains. Factory output falls as energy costs make production unviable.",
    ("Energy", "DomesticPoliticalFiscal"): "Rising energy costs are hitting households hard. Public anger at energy prices threatens political stability.",
    ("MaritimeLogistics", "GeoeconomicIndustrial"): "Maritime disruptions are strangling trade flows. Just-in-time supply chains are breaking down across the continent.",
}

# ── Phase Threshold Data ──────────────────────────────────────────────────────

PHASE_THRESHOLDS = [
    ("CompetitiveNormality", 0.0, 0.15),
    ("HybridCoercion", 0.15, 0.30),
    ("AcutePolycrisis", 0.30, 0.50),
    ("WarTransition", 0.50, 0.70),
    ("OvertInterstateWar", 0.70, 0.85),
    ("GeneralizedBlocWar", 0.85, 1.0),
]

PHASE_LABELS = {
    "CompetitiveNormality": "Competitive Normality",
    "HybridCoercion": "Hybrid Coercion",
    "AcutePolycrisis": "Acute Polycrisis",
    "WarTransition": "War Transition",
    "OvertInterstateWar": "Overt Interstate War",
    "GeneralizedBlocWar": "Generalized Bloc War",
}

DOMAIN_LABELS = {
    "Kinetic": "Military/Kinetic",
    "MaritimeLogistics": "Maritime & Logistics",
    "Energy": "Energy",
    "GeoeconomicIndustrial": "Geoeconomic & Industrial",
    "Cyber": "Cyber",
    "SpacePnt": "Space & PNT",
    "InformationCognitive": "Information & Cognitive",
    "DomesticPoliticalFiscal": "Domestic Political & Fiscal",
}


def _get_domain_label(domain: str) -> str:
    return DOMAIN_LABELS.get(domain, domain)


def _format_delta(delta: float) -> str:
    pct = abs(delta) * 100
    direction = "+" if delta > 0 else "-"
    return f"{direction}{pct:.1f}%"


def narrate_event(event: dict[str, Any]) -> str:
    """Generate narrative text for a stochastic event."""
    desc = event.get("description", event.get("name", ""))
    # Try exact match first, then partial match
    for key, narratives in EVENT_NARRATIVES.items():
        if key.lower() in desc.lower() or desc.lower() in key.lower():
            return random.choice(narratives)
    # Fallback: use the event description
    return desc


def narrate_action(
    action_type: str,
    domain: str,
    effects: list[dict[str, Any]] | None = None,
) -> str:
    """Generate narrative text for a player action."""
    templates = ACTION_NARRATIVES.get(action_type, {})
    domain_label = _get_domain_label(domain)

    # Calculate primary delta from effects
    delta_str = ""
    if effects:
        for eff in effects:
            if eff.get("field") == "stress":
                delta_str = _format_delta(eff.get("delta", 0))
                break
    if not delta_str:
        delta_str = "a measurable amount"

    narrative = templates.get("narrative", f"An action of type {action_type} was executed in {{domain}}.")
    return narrative.format(domain=domain_label, delta=delta_str)


def narrate_action_effects(effects: list[dict[str, Any]]) -> list[str]:
    """Generate short descriptions of each action effect."""
    lines = []
    for eff in effects:
        layer = _get_domain_label(eff.get("layer", ""))
        field = eff.get("field", "")
        delta = eff.get("delta", 0)
        desc = eff.get("description", "")
        if desc:
            lines.append(desc)
        else:
            direction = "increased" if delta > 0 else "decreased"
            lines.append(f"{layer} {field} {direction} by {_format_delta(delta)}")
    return lines


def narrate_phase_transition(old_phase: str, new_phase: str) -> str:
    """Generate narrative for a phase transition."""
    narrative = PHASE_TRANSITIONS.get((old_phase, new_phase))
    if narrative:
        return narrative
    old_label = PHASE_LABELS.get(old_phase, old_phase)
    new_label = PHASE_LABELS.get(new_phase, new_phase)
    if PHASE_THRESHOLDS:
        # Determine direction
        old_idx = next((i for i, (p, _, _) in enumerate(PHASE_THRESHOLDS) if p == old_phase), 0)
        new_idx = next((i for i, (p, _, _) in enumerate(PHASE_THRESHOLDS) if p == new_phase), 0)
        if new_idx > old_idx:
            return f"The situation has escalated from {old_label} to {new_label}. The operational environment has fundamentally changed."
        else:
            return f"De-escalation from {old_label} to {new_label}. The immediate pressure has eased, though vigilance remains essential."
    return f"Phase transition: {old_label} → {new_label}."


def narrate_coupling_cascade(source_domain: str, target_domain: str) -> str:
    """Generate narrative for a coupling cascade effect."""
    narrative = COUPLING_NARRATIVES.get((source_domain, target_domain))
    if narrative:
        return narrative
    # Try reverse
    narrative = COUPLING_NARRATIVES.get((target_domain, source_domain))
    if narrative:
        return narrative
    src = _get_domain_label(source_domain)
    tgt = _get_domain_label(target_domain)
    return f"Disruptions in {src} are cascading into {tgt} through interconnected systems."


def generate_phase_warning(order_parameter: float, current_phase: str) -> str | None:
    """Generate warning if near a phase transition threshold."""
    for phase_name, lower, upper in PHASE_THRESHOLDS:
        if phase_name == current_phase:
            distance_to_next = upper - order_parameter
            if 0 < distance_to_next <= 0.05:
                next_idx = next(
                    (i + 1 for i, (p, _, _) in enumerate(PHASE_THRESHOLDS) if p == current_phase),
                    None,
                )
                if next_idx is not None and next_idx < len(PHASE_THRESHOLDS):
                    next_phase = PHASE_LABELS.get(
                        PHASE_THRESHOLDS[next_idx][0],
                        PHASE_THRESHOLDS[next_idx][0],
                    )
                    return (
                        f"WARNING: Order parameter at {order_parameter:.3f} — "
                        f"only {distance_to_next:.3f} from {next_phase} threshold ({upper:.2f}). "
                        f"Immediate action recommended to prevent escalation."
                    )
            break
    return None


def generate_turn_narrative(
    turn_result: dict[str, Any],
    world_state: dict[str, Any] | None = None,
    previous_state: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Generate a complete turn narrative from the advance_turn result.

    Returns:
        {
            "summary": str,          # 2-3 sentence turn summary
            "event_narratives": [...], # Narrative for each event
            "warnings": [str],        # Phase proximity warnings
            "phase_narrative": str | None,  # If phase changed
        }
    """
    turn = turn_result.get("turn", 0)
    phase = turn_result.get("phase", "CompetitiveNormality")
    order_param = turn_result.get("order_parameter", 0.0)
    events = turn_result.get("events", [])
    _ = turn_result.get("effects", [])
    phase_changed = turn_result.get("phase_changed", False)
    previous_phase = turn_result.get("previous_phase")

    # Event narratives
    event_narratives = []
    for evt in events:
        narrative = narrate_event(evt)
        event_narratives.append({
            "type": evt.get("type", "unknown"),
            "description": evt.get("description", ""),
            "narrative": narrative,
            "domain": evt.get("domain") or evt.get("affected_layer"),
        })

    # Phase transition narrative
    phase_narrative = None
    if phase_changed and previous_phase:
        phase_narrative = narrate_phase_transition(previous_phase, phase)

    # Warnings
    warnings: list[str] = []
    warning = generate_phase_warning(order_param, phase)
    if warning:
        warnings.append(warning)

    # Build summary
    summary_parts: list[str] = []

    if phase_changed and phase_narrative:
        summary_parts.append(phase_narrative)
    elif events:
        # Summarize key events
        event_count = len(events)
        if event_count == 1:
            summary_parts.append(event_narratives[0]["narrative"])
        else:
            summary_parts.append(
                f"Turn {turn} saw {event_count} significant developments across the theater."
            )
            # Highlight the most impactful event
            summary_parts.append(event_narratives[0]["narrative"])
    else:
        # Quiet turn
        phase_label = PHASE_LABELS.get(phase, phase)
        summary_parts.append(
            f"Turn {turn} passes without major incident. The {phase_label} phase continues "
            f"with the order parameter at {order_param:.3f}."
        )

    # Add stress context from world state
    if world_state and isinstance(world_state, dict):
        layers = world_state.get("layers", {})
        if isinstance(layers, dict):
            high_stress = [
                (_get_domain_label(d), s.get("stress", 0))
                for d, s in layers.items()
                if isinstance(s, dict) and s.get("stress", 0) > 0.5
            ]
            if high_stress:
                high_stress.sort(key=lambda x: x[1], reverse=True)
                top = high_stress[0]
                summary_parts.append(
                    f"{top[0]} remains under critical pressure at {top[1]:.0%} stress."
                )

    return {
        "summary": " ".join(summary_parts),
        "event_narratives": event_narratives,
        "warnings": warnings,
        "phase_narrative": phase_narrative,
    }
