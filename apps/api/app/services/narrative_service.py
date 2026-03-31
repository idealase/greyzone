"""Template-based narrative generation service for turn summaries."""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Optional


@dataclass
class DomainHighlight:
    domain: str
    label: str
    direction: str  # "rising" | "falling" | "stable"
    delta: float
    note: str


@dataclass
class TurnNarrative:
    turn: int
    headline: str
    body: str
    domain_highlights: list[DomainHighlight]
    threat_assessment: str
    intelligence_note: Optional[str]


_BALTIC_VOCAB = [
    "Eastern Flank",
    "Kaliningrad",
    "Baltic littoral",
    "NORDEFCO",
    "SACEUR",
    "Article 5",
    "eFP battlegroups",
    "Baltic Sea",
    "Gerasimov doctrine",
    "hybrid campaign",
]

_HORMUZ_VOCAB = [
    "Strait of Hormuz",
    "CENTCOM",
    "5th Fleet",
    "IRGC",
    "Bab-el-Mandeb",
    "GCC",
    "chokepoint",
    "tanker corridor",
    "mine warfare",
    "drone swarm",
    "oil price",
]

_PHASE_HEADLINE_TEMPLATES = {
    0: "Situation Report: Competitive pressures intensify in the {theatre}",
    1: "SITREP: Hybrid coercion campaign accelerates — {domain} domain deteriorating",
    2: "URGENT: Acute polycrisis — multiple domains destabilising simultaneously",
    3: "FLASH: War transition threshold breached — full mobilisation imminent",
    4: "WAR: Open interstate conflict declared — {theatre} now a combat zone",
    5: "CRITICAL: Generalised bloc war — strategic constraints lifted",
}

_PHASE_MAP = {
    "CompetitiveNormality": 0,
    "HybridCoercion": 1,
    "AcutePolycrisis": 2,
    "WarTransition": 3,
    "OvertInterstateWar": 4,
    "GeneralizedBlocWar": 5,
}

_DOMAIN_LABELS = {
    "Kinetic": "Kinetic",
    "MaritimeLogistics": "Maritime & Logistics",
    "Energy": "Energy",
    "GeoeconomicIndustrial": "Geoeconomic & Industrial",
    "Cyber": "Cyber",
    "SpacePnt": "Space & PNT",
    "InformationCognitive": "Information & Cognitive",
    "DomesticPoliticalFiscal": "Domestic Political & Fiscal",
}

_DOMAIN_NOTES: dict[str, dict[str, str]] = {
    "Kinetic": {
        "rising": "Force posture increasing",
        "falling": "Force posture easing",
        "stable": "Force posture holding",
    },
    "MaritimeLogistics": {
        "rising": "Supply chain disruption increasing",
        "falling": "Maritime routes stabilising",
        "stable": "Logistics pressure unchanged",
    },
    "Energy": {
        "rising": "Energy supply under pressure",
        "falling": "Supply pressure easing",
        "stable": "Energy markets holding",
    },
    "GeoeconomicIndustrial": {
        "rising": "Economic coercion escalating",
        "falling": "Geoeconomic tensions subsiding",
        "stable": "Industrial base stable",
    },
    "Cyber": {
        "rising": "Cyber operations intensifying",
        "falling": "Cyber threat landscape improving",
        "stable": "Cyber activity at baseline",
    },
    "SpacePnt": {
        "rising": "Space and navigation assets under threat",
        "falling": "Space domain pressure receding",
        "stable": "Space and PNT nominal",
    },
    "InformationCognitive": {
        "rising": "Disinformation campaign accelerating",
        "falling": "Cognitive pressure diminishing",
        "stable": "Information environment contested",
    },
    "DomesticPoliticalFiscal": {
        "rising": "Domestic stability deteriorating",
        "falling": "Political cohesion recovering",
        "stable": "Domestic situation unchanged",
    },
}


class NarrativeService:
    """Generates structured narrative summaries from simulation turn data."""

    def generate(
        self,
        turn: int,
        phase: str,
        order_parameter: float,
        prev_order_parameter: float,
        events: list[dict],
        domain_states: dict,
        prev_domain_states: dict,
        scenario_name: str,
        scenario_id: str,
    ) -> TurnNarrative:
        is_baltic = "Baltic" in scenario_name or "baltic" in scenario_id
        vocab = _BALTIC_VOCAB if is_baltic else _HORMUZ_VOCAB
        theatre = "Baltic littoral" if is_baltic else "Strait of Hormuz"

        phase_int = _PHASE_MAP.get(phase, 0)

        domain_highlights = self._compute_domain_highlights(domain_states, prev_domain_states)
        most_stressed_label = domain_highlights[0].label if domain_highlights else "Kinetic"

        headline = self._build_headline(phase_int, theatre, most_stressed_label, vocab)
        body = self._build_body(turn, order_parameter, prev_order_parameter, events, vocab)
        threat_assessment = self._build_threat_assessment(order_parameter)
        intelligence_note = self._build_intelligence_note(events)

        return TurnNarrative(
            turn=turn,
            headline=headline,
            body=body,
            domain_highlights=domain_highlights,
            threat_assessment=threat_assessment,
            intelligence_note=intelligence_note,
        )

    def _build_headline(
        self, phase_int: int, theatre: str, domain_label: str, vocab: list[str]
    ) -> str:
        template = _PHASE_HEADLINE_TEMPLATES.get(phase_int, _PHASE_HEADLINE_TEMPLATES[0])
        return template.format(theatre=theatre, domain=domain_label)

    def _build_body(
        self,
        turn: int,
        order_parameter: float,
        prev_order_parameter: float,
        events: list[dict],
        vocab: list[str],
    ) -> str:
        significant_types = {"phase_transition", "stochastic", "action"}
        filtered = [e for e in events if e.get("event_type") in significant_types]

        type_priority = {"phase_transition": 0, "stochastic": 1, "action": 2}
        filtered.sort(key=lambda e: type_priority.get(e.get("event_type", "action"), 2))
        top = filtered[:3]

        delta = order_parameter - prev_order_parameter
        if delta > 0.02:
            trend_sentence = "the operational environment is deteriorating"
        elif delta < -0.02:
            trend_sentence = "early de-escalatory signals are emerging"
        else:
            trend_sentence = "the situation remains in a precarious equilibrium"

        colour_word = random.choice(vocab)

        if not top:
            return (
                f"During Turn {turn}, no significant events were recorded in the {colour_word} theatre. "
                f"Intelligence assessments indicate {trend_sentence}."
            )

        parts: list[str] = []
        for i, evt in enumerate(top):
            desc = evt.get("description", "an unspecified event occurred")
            if i == 0:
                parts.append(f"During Turn {turn}, {desc}")
            elif i == 1:
                parts.append(f"Subsequently, {desc}")
            else:
                parts.append(f"Concurrently, {desc}")

        body = ". ".join(parts) + f". Intelligence assessments indicate {trend_sentence}."
        return body

    def _compute_domain_highlights(
        self, domain_states: dict, prev_domain_states: dict
    ) -> list[DomainHighlight]:
        highlights: list[DomainHighlight] = []

        for domain_key, state in domain_states.items():
            prev_state = prev_domain_states.get(domain_key, {})
            stress = state.get("stress", 0.0)
            prev_stress = prev_state.get("stress", stress)
            delta = stress - prev_stress

            if delta > 0.02:
                direction = "rising"
            elif delta < -0.02:
                direction = "falling"
            else:
                direction = "stable"

            label = _DOMAIN_LABELS.get(domain_key, domain_key)
            domain_notes = _DOMAIN_NOTES.get(domain_key, {})
            note = domain_notes.get(direction, f"{label} {direction}")

            highlights.append(
                DomainHighlight(
                    domain=domain_key,
                    label=label,
                    direction=direction,
                    delta=round(delta, 4),
                    note=note,
                )
            )

        highlights.sort(key=lambda h: abs(h.delta), reverse=True)
        return highlights[:3]

    def _build_threat_assessment(self, order_parameter: float) -> str:
        if order_parameter < 0.15:
            return "LOW — Competitive dynamics remain below escalation thresholds"
        elif order_parameter < 0.30:
            return "ELEVATED — Hybrid coercion is active; monitor for threshold approach"
        elif order_parameter < 0.50:
            return "HIGH — Multiple domains under sustained pressure; escalation probable"
        elif order_parameter < 0.70:
            return "CRITICAL — War transition imminent; immediate de-escalation required"
        else:
            return "EXTREME — Open conflict underway; strategic thresholds at risk"

    def _build_intelligence_note(self, events: list[dict]) -> Optional[str]:
        stochastic = [e for e in events if e.get("event_type") == "stochastic"]
        if not stochastic:
            return None
        most_significant = stochastic[0]
        desc = most_significant.get("description", "anomalous activity detected")
        return f"SIGINT/HUMINT: {desc} — Source reliability: CONFIRMED"
