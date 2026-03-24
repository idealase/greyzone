use crate::action::{Action, Effect};
use crate::actor::Visibility;
use crate::domain::DomainLayer;
use crate::phase::Phase;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A stochastic event that can occur each tick.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StochasticEvent {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub affected_layer: DomainLayer,
    pub stress_delta: f64,
    pub resilience_delta: f64,
    pub probability: f64,
    pub visibility: Visibility,
}

/// An event in the simulation event log (event sourcing).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Event {
    ActionApplied {
        turn: u32,
        action: Action,
        effects: Vec<Effect>,
    },
    StochasticEvent {
        turn: u32,
        event: StochasticEvent,
    },
    PhaseTransition {
        turn: u32,
        from: Phase,
        to: Phase,
        order_parameter: f64,
    },
    TurnAdvanced {
        turn: u32,
    },
    SnapshotTaken {
        turn: u32,
    },
}

/// Result of advancing a turn.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurnResult {
    pub turn: u32,
    pub phase: Phase,
    pub order_parameter: f64,
    pub events_fired: Vec<StochasticEvent>,
    pub phase_transition: Option<(Phase, Phase)>,
    pub effects: Vec<Effect>,
}

/// Metrics about the simulation run.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationMetrics {
    pub current_turn: u32,
    pub current_phase: Phase,
    pub order_parameter: f64,
    pub total_events: usize,
    pub total_actions_applied: usize,
    pub phase_transitions: Vec<(u32, Phase, Phase)>,
    pub domain_stresses: Vec<(DomainLayer, f64)>,
    pub domain_resiliences: Vec<(DomainLayer, f64)>,
}

/// Generate the default set of stochastic events.
pub fn default_stochastic_events() -> Vec<StochasticEvent> {
    vec![
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Major Cyber Incident".into(),
            description: "A significant cyber attack disrupts critical infrastructure".into(),
            affected_layer: DomainLayer::Cyber,
            stress_delta: 0.12,
            resilience_delta: -0.05,
            probability: 0.08,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Energy Supply Disruption".into(),
            description: "Pipeline sabotage or supply chain failure reduces energy supply".into(),
            affected_layer: DomainLayer::Energy,
            stress_delta: 0.15,
            resilience_delta: -0.03,
            probability: 0.06,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Political Crisis".into(),
            description: "Government collapse or major political scandal".into(),
            affected_layer: DomainLayer::DomesticPoliticalFiscal,
            stress_delta: 0.10,
            resilience_delta: -0.08,
            probability: 0.05,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Maritime Incident".into(),
            description: "Naval confrontation or shipping lane disruption".into(),
            affected_layer: DomainLayer::MaritimeLogistics,
            stress_delta: 0.10,
            resilience_delta: -0.02,
            probability: 0.07,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Satellite Interference".into(),
            description: "GPS jamming or anti-satellite weapon test".into(),
            affected_layer: DomainLayer::SpacePnt,
            stress_delta: 0.08,
            resilience_delta: -0.04,
            probability: 0.04,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Disinformation Campaign".into(),
            description: "Large-scale coordinated disinformation operation".into(),
            affected_layer: DomainLayer::InformationCognitive,
            stress_delta: 0.09,
            resilience_delta: -0.03,
            probability: 0.10,
            visibility: Visibility::RoleScoped(vec!["blue_commander".into()]),
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Economic Sanctions Escalation".into(),
            description: "Unilateral sanctions imposed by major economy".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: 0.11,
            resilience_delta: -0.04,
            probability: 0.06,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Border Skirmish".into(),
            description: "Small-scale military exchange at contested border".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.14,
            resilience_delta: -0.02,
            probability: 0.05,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Diplomatic Breakthrough".into(),
            description: "Unexpected diplomatic channel yields de-escalation".into(),
            affected_layer: DomainLayer::InformationCognitive,
            stress_delta: -0.10,
            resilience_delta: 0.05,
            probability: 0.04,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Energy Discovery".into(),
            description: "New energy reserves or alternative supply route found".into(),
            affected_layer: DomainLayer::Energy,
            stress_delta: -0.08,
            resilience_delta: 0.06,
            probability: 0.03,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Cyber Defense Success".into(),
            description: "Major cyber attack successfully repelled, boosting confidence".into(),
            affected_layer: DomainLayer::Cyber,
            stress_delta: -0.05,
            resilience_delta: 0.08,
            probability: 0.05,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Refugee Crisis".into(),
            description: "Mass displacement strains domestic systems".into(),
            affected_layer: DomainLayer::DomesticPoliticalFiscal,
            stress_delta: 0.12,
            resilience_delta: -0.06,
            probability: 0.04,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Submarine Cable Cut".into(),
            description: "Undersea communications cable severed".into(),
            affected_layer: DomainLayer::Cyber,
            stress_delta: 0.10,
            resilience_delta: -0.07,
            probability: 0.03,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Trade Route Blockage".into(),
            description: "Major shipping chokepoint blocked or contested".into(),
            affected_layer: DomainLayer::MaritimeLogistics,
            stress_delta: 0.13,
            resilience_delta: -0.04,
            probability: 0.05,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Military Exercise Provocation".into(),
            description: "Large-scale military exercise near contested area".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.08,
            resilience_delta: 0.0,
            probability: 0.07,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Economic Boom".into(),
            description: "Unexpected economic growth strengthens industrial base".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: -0.07,
            resilience_delta: 0.05,
            probability: 0.03,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Proxy Force Activation".into(),
            description: "Non-state proxy forces mobilize in contested region".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.11,
            resilience_delta: -0.03,
            probability: 0.06,
            visibility: Visibility::RoleScoped(vec!["red_commander".into()]),
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Space Weather Event".into(),
            description: "Solar storm disrupts satellite operations".into(),
            affected_layer: DomainLayer::SpacePnt,
            stress_delta: 0.06,
            resilience_delta: -0.02,
            probability: 0.03,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Alliance Solidarity Declaration".into(),
            description: "Allied nations publicly reaffirm mutual defense commitments".into(),
            affected_layer: DomainLayer::DomesticPoliticalFiscal,
            stress_delta: -0.06,
            resilience_delta: 0.04,
            probability: 0.05,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Critical Infrastructure Failure".into(),
            description: "Power grid or communications network suffers cascading failure".into(),
            affected_layer: DomainLayer::Energy,
            stress_delta: 0.16,
            resilience_delta: -0.08,
            probability: 0.02,
            visibility: Visibility::Public,
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_events_count() {
        let events = default_stochastic_events();
        assert!(events.len() >= 15, "Should have at least 15 events, got {}", events.len());
        assert!(events.len() <= 25, "Should have at most 25 events, got {}", events.len());
    }

    #[test]
    fn test_events_have_valid_probabilities() {
        for ev in default_stochastic_events() {
            assert!(ev.probability > 0.0 && ev.probability <= 1.0,
                "Event '{}' has invalid probability: {}", ev.name, ev.probability);
        }
    }

    #[test]
    fn test_events_cover_all_domains() {
        let events = default_stochastic_events();
        for domain in DomainLayer::ALL {
            assert!(
                events.iter().any(|e| e.affected_layer == domain),
                "No stochastic event covers domain {:?}",
                domain
            );
        }
    }

    #[test]
    fn test_event_serialization() {
        let ev = Event::TurnAdvanced { turn: 5 };
        let json = serde_json::to_string(&ev).unwrap();
        let deser: Event = serde_json::from_str(&json).unwrap();
        if let Event::TurnAdvanced { turn } = deser {
            assert_eq!(turn, 5);
        } else {
            panic!("Wrong event type after deserialization");
        }
    }
}
