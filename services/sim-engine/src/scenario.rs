use crate::actor::{Actor, ActorKind, Role, Visibility};
use crate::coupling::CouplingMatrix;
use crate::domain::{DomainLayer, LayerState};
use crate::events::StochasticEvent;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// A scenario defines the initial configuration of a simulation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scenario {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub initial_layers: HashMap<DomainLayer, LayerState>,
    pub actors: Vec<Actor>,
    pub roles: Vec<Role>,
    pub coupling_overrides: Option<CouplingMatrix>,
    pub stochastic_events: Vec<StochasticEvent>,
    pub max_turns: u32,
}

/// Create the "Baltic Flashpoint" default scenario.
pub fn baltic_flashpoint() -> Scenario {
    // Actor IDs
    let blue_id = Uuid::from_bytes([0x01; 16]);
    let red_id = Uuid::from_bytes([0x02; 16]);
    let neutral_id = Uuid::from_bytes([0x03; 16]);
    let proxy_id = Uuid::from_bytes([0x04; 16]);
    let infra_id = Uuid::from_bytes([0x05; 16]);

    let blue = Actor::new("Blue Coalition", ActorKind::State)
        .with_id(blue_id)
        .with_capability(DomainLayer::Kinetic, 0.8)
        .with_capability(DomainLayer::MaritimeLogistics, 0.7)
        .with_capability(DomainLayer::Energy, 0.5)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.7)
        .with_capability(DomainLayer::Cyber, 0.8)
        .with_capability(DomainLayer::SpacePnt, 0.9)
        .with_capability(DomainLayer::InformationCognitive, 0.6)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.5)
        .with_resources(200.0)
        .with_morale(0.7);

    let red = Actor::new("Red Federation", ActorKind::State)
        .with_id(red_id)
        .with_capability(DomainLayer::Kinetic, 0.7)
        .with_capability(DomainLayer::MaritimeLogistics, 0.5)
        .with_capability(DomainLayer::Energy, 0.8)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.4)
        .with_capability(DomainLayer::Cyber, 0.7)
        .with_capability(DomainLayer::SpacePnt, 0.6)
        .with_capability(DomainLayer::InformationCognitive, 0.8)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.6)
        .with_resources(180.0)
        .with_morale(0.75);

    let neutral = Actor::new("Neutral States", ActorKind::Alliance)
        .with_id(neutral_id)
        .with_capability(DomainLayer::Kinetic, 0.3)
        .with_capability(DomainLayer::MaritimeLogistics, 0.4)
        .with_capability(DomainLayer::Energy, 0.6)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.5)
        .with_capability(DomainLayer::Cyber, 0.3)
        .with_capability(DomainLayer::SpacePnt, 0.2)
        .with_capability(DomainLayer::InformationCognitive, 0.4)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.7)
        .with_resources(120.0)
        .with_morale(0.6);

    let proxy = Actor::new("Separatist Movement", ActorKind::ProxyNonState)
        .with_id(proxy_id)
        .with_capability(DomainLayer::Kinetic, 0.4)
        .with_capability(DomainLayer::Cyber, 0.5)
        .with_capability(DomainLayer::InformationCognitive, 0.6)
        .with_resources(50.0)
        .with_morale(0.8)
        .with_visibility(Visibility::RoleScoped(vec!["red_commander".into()]));

    let infra = Actor::new("European Energy Grid", ActorKind::InfrastructureOperator)
        .with_id(infra_id)
        .with_capability(DomainLayer::Energy, 0.9)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.6)
        .with_capability(DomainLayer::Cyber, 0.4)
        .with_resources(150.0)
        .with_morale(0.5);

    let roles = vec![
        Role {
            id: "blue_commander".into(),
            name: "Blue Coalition Commander".into(),
            controlled_actor_ids: vec![blue_id],
            allied_actor_ids: vec![neutral_id, infra_id],
        },
        Role {
            id: "red_commander".into(),
            name: "Red Federation Commander".into(),
            controlled_actor_ids: vec![red_id],
            allied_actor_ids: vec![proxy_id],
        },
    ];

    // Initial layer states for the Baltic Flashpoint
    let mut initial_layers = HashMap::new();
    initial_layers.insert(
        DomainLayer::Kinetic,
        LayerState::new(0.15, 0.6, 0.2, 0.3)
            .with_variable("troop_readiness", 0.5)
            .with_variable("border_tension", 0.2),
    );
    initial_layers.insert(
        DomainLayer::MaritimeLogistics,
        LayerState::new(0.12, 0.7, 0.15, 0.25)
            .with_variable("shipping_disruption", 0.1)
            .with_variable("naval_presence", 0.3),
    );
    initial_layers.insert(
        DomainLayer::Energy,
        LayerState::new(0.20, 0.55, 0.25, 0.4)
            .with_variable("gas_supply_ratio", 0.7)
            .with_variable("pipeline_integrity", 0.9),
    );
    initial_layers.insert(
        DomainLayer::GeoeconomicIndustrial,
        LayerState::new(0.18, 0.6, 0.2, 0.35)
            .with_variable("trade_volume", 0.8)
            .with_variable("sanctions_severity", 0.1),
    );
    initial_layers.insert(
        DomainLayer::Cyber,
        LayerState::new(0.22, 0.5, 0.3, 0.45)
            .with_variable("attack_frequency", 0.3)
            .with_variable("defense_posture", 0.6),
    );
    initial_layers.insert(
        DomainLayer::SpacePnt,
        LayerState::new(0.10, 0.7, 0.1, 0.2)
            .with_variable("satellite_coverage", 0.85)
            .with_variable("gps_reliability", 0.95),
    );
    initial_layers.insert(
        DomainLayer::InformationCognitive,
        LayerState::new(0.25, 0.45, 0.35, 0.5)
            .with_variable("disinformation_level", 0.4)
            .with_variable("public_awareness", 0.5),
    );
    initial_layers.insert(
        DomainLayer::DomesticPoliticalFiscal,
        LayerState::new(0.18, 0.55, 0.2, 0.3)
            .with_variable("government_stability", 0.7)
            .with_variable("public_support_for_action", 0.4),
    );

    Scenario {
        id: Uuid::from_bytes([0xBA; 16]),
        name: "Baltic Flashpoint".into(),
        description: "A scenario where NATO and Russia compete across all 8 domains \
            around the Baltic region. Tensions escalate through hybrid operations, \
            energy manipulation, cyber attacks, and information warfare, with the \
            potential for conventional military confrontation."
            .into(),
        initial_layers,
        actors: vec![blue, red, neutral, proxy, infra],
        roles,
        coupling_overrides: None,
        stochastic_events: crate::events::default_stochastic_events(),
        max_turns: 100,
    }
}

/// Registry of built-in scenarios.
pub fn get_scenario(id: &str) -> Option<Scenario> {
    match id {
        "baltic_flashpoint" | "default" => Some(baltic_flashpoint()),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_baltic_flashpoint_creation() {
        let scenario = baltic_flashpoint();
        assert_eq!(scenario.name, "Baltic Flashpoint");
        assert_eq!(scenario.actors.len(), 5);
        assert_eq!(scenario.roles.len(), 2);
        assert_eq!(scenario.initial_layers.len(), 8);
    }

    #[test]
    fn test_all_domains_initialized() {
        let scenario = baltic_flashpoint();
        for domain in DomainLayer::ALL {
            assert!(
                scenario.initial_layers.contains_key(&domain),
                "Domain {:?} not initialized in scenario",
                domain
            );
        }
    }

    #[test]
    fn test_roles_reference_valid_actors() {
        let scenario = baltic_flashpoint();
        let actor_ids: Vec<Uuid> = scenario.actors.iter().map(|a| a.id).collect();
        for role in &scenario.roles {
            for aid in &role.controlled_actor_ids {
                assert!(actor_ids.contains(aid), "Role {} references unknown actor {}", role.id, aid);
            }
            for aid in &role.allied_actor_ids {
                assert!(actor_ids.contains(aid), "Role {} references unknown allied actor {}", role.id, aid);
            }
        }
    }

    #[test]
    fn test_scenario_serialization() {
        let scenario = baltic_flashpoint();
        let json = serde_json::to_string(&scenario).unwrap();
        let deser: Scenario = serde_json::from_str(&json).unwrap();
        assert_eq!(deser.name, "Baltic Flashpoint");
        assert_eq!(deser.actors.len(), 5);
    }

    #[test]
    fn test_get_scenario() {
        assert!(get_scenario("baltic_flashpoint").is_some());
        assert!(get_scenario("default").is_some());
        assert!(get_scenario("nonexistent").is_none());
    }
}
