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

/// Create the "Strait of Hormuz Flashpoint" scenario.
pub fn hormuz_flashpoint() -> Scenario {
    // Actor IDs — unique byte patterns for Hormuz actors
    let us_fleet_id = Uuid::from_bytes([0x10; 16]);
    let irgc_id = Uuid::from_bytes([0x11; 16]);
    let houthi_id = Uuid::from_bytes([0x12; 16]);
    let tanker_id = Uuid::from_bytes([0x13; 16]);
    let infra_id = Uuid::from_bytes([0x14; 16]);

    let us_fleet = Actor::new("US 5th Fleet / GCC Coalition", ActorKind::State)
        .with_id(us_fleet_id)
        .with_capability(DomainLayer::Kinetic, 0.85)
        .with_capability(DomainLayer::MaritimeLogistics, 0.90)
        .with_capability(DomainLayer::Energy, 0.30)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.55)
        .with_capability(DomainLayer::Cyber, 0.75)
        .with_capability(DomainLayer::SpacePnt, 0.85)
        .with_capability(DomainLayer::InformationCognitive, 0.55)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.60)
        .with_resources(85.0)
        .with_morale(0.75);

    let irgc = Actor::new("IRGC / Islamic Republic of Iran", ActorKind::State)
        .with_id(irgc_id)
        .with_capability(DomainLayer::Kinetic, 0.70)
        .with_capability(DomainLayer::MaritimeLogistics, 0.75)
        .with_capability(DomainLayer::Energy, 0.85)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.65)
        .with_capability(DomainLayer::Cyber, 0.80)
        .with_capability(DomainLayer::SpacePnt, 0.35)
        .with_capability(DomainLayer::InformationCognitive, 0.75)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.70)
        .with_resources(100.0)
        .with_morale(0.70);

    let houthi = Actor::new("Houthi Movement", ActorKind::ProxyNonState)
        .with_id(houthi_id)
        .with_capability(DomainLayer::Kinetic, 0.60)
        .with_capability(DomainLayer::MaritimeLogistics, 0.55)
        .with_capability(DomainLayer::Energy, 0.20)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.15)
        .with_capability(DomainLayer::Cyber, 0.30)
        .with_capability(DomainLayer::SpacePnt, 0.10)
        .with_capability(DomainLayer::InformationCognitive, 0.70)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.20)
        .with_resources(30.0)
        .with_morale(0.80)
        .with_visibility(Visibility::RoleScoped(vec!["red_commander".into()]));

    let tanker_fleet = Actor::new("Gulf Tanker Fleet / Neutral Shipping", ActorKind::StrategicFirm)
        .with_id(tanker_id)
        .with_capability(DomainLayer::Kinetic, 0.10)
        .with_capability(DomainLayer::MaritimeLogistics, 0.80)
        .with_capability(DomainLayer::Energy, 0.65)
        .with_capability(DomainLayer::GeoeconomicIndustrial, 0.70)
        .with_capability(DomainLayer::Cyber, 0.25)
        .with_capability(DomainLayer::SpacePnt, 0.30)
        .with_capability(DomainLayer::InformationCognitive, 0.25)
        .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.20)
        .with_resources(50.0)
        .with_morale(0.60);

    let energy_infra =
        Actor::new("Gulf Energy Infrastructure", ActorKind::InfrastructureOperator)
            .with_id(infra_id)
            .with_capability(DomainLayer::Kinetic, 0.05)
            .with_capability(DomainLayer::MaritimeLogistics, 0.40)
            .with_capability(DomainLayer::Energy, 0.90)
            .with_capability(DomainLayer::GeoeconomicIndustrial, 0.80)
            .with_capability(DomainLayer::Cyber, 0.30)
            .with_capability(DomainLayer::SpacePnt, 0.15)
            .with_capability(DomainLayer::InformationCognitive, 0.20)
            .with_capability(DomainLayer::DomesticPoliticalFiscal, 0.55)
            .with_resources(60.0)
            .with_morale(0.65);

    let roles = vec![
        Role {
            id: "blue_commander".into(),
            name: "Blue Commander".into(),
            controlled_actor_ids: vec![us_fleet_id, tanker_id],
            allied_actor_ids: vec![infra_id],
        },
        Role {
            id: "red_commander".into(),
            name: "Red Commander".into(),
            controlled_actor_ids: vec![irgc_id, houthi_id],
            allied_actor_ids: vec![],
        },
    ];

    let mut initial_layers = HashMap::new();
    initial_layers.insert(
        DomainLayer::Kinetic,
        LayerState::new(0.25, 0.72, 0.25, 0.30)
            .with_variable("force_posture", 0.30)
            .with_variable("readiness", 0.72)
            .with_variable("theater_control", 0.45),
    );
    initial_layers.insert(
        DomainLayer::MaritimeLogistics,
        LayerState::new(0.38, 0.58, 0.35, 0.45)
            .with_variable("sloc_throughput", 0.62)
            .with_variable("naval_presence", 0.50)
            .with_variable("mine_density", 0.25)
            .with_variable("strait_transit_rate", 0.70),
    );
    initial_layers.insert(
        DomainLayer::Energy,
        LayerState::new(0.40, 0.55, 0.30, 0.50)
            .with_variable("production_level", 0.75)
            .with_variable("price_index", 1.45)
            .with_variable("infrastructure_integrity", 0.68)
            .with_variable("oil_export_rate", 0.72),
    );
    initial_layers.insert(
        DomainLayer::GeoeconomicIndustrial,
        LayerState::new(0.30, 0.62, 0.25, 0.35)
            .with_variable("trade_flow", 0.68)
            .with_variable("sanctions_pressure", 0.32)
            .with_variable("industrial_output", 0.72)
            .with_variable("oil_market_stability", 0.55),
    );
    initial_layers.insert(
        DomainLayer::Cyber,
        LayerState::new(0.20, 0.65, 0.20, 0.28)
            .with_variable("cyber_posture", 0.62)
            .with_variable("vulnerability_index", 0.35)
            .with_variable("attack_capacity", 0.70),
    );
    initial_layers.insert(
        DomainLayer::SpacePnt,
        LayerState::new(0.12, 0.75, 0.15, 0.22)
            .with_variable("satellite_health", 0.82)
            .with_variable("pnt_accuracy", 0.88)
            .with_variable("asat_readiness", 0.25),
    );
    initial_layers.insert(
        DomainLayer::InformationCognitive,
        LayerState::new(0.28, 0.60, 0.28, 0.38)
            .with_variable("narrative_control", 0.45)
            .with_variable("public_opinion", 0.52)
            .with_variable("disinformation_intensity", 0.42),
    );
    initial_layers.insert(
        DomainLayer::DomesticPoliticalFiscal,
        LayerState::new(0.22, 0.68, 0.20, 0.25)
            .with_variable("gov_stability", 0.70)
            .with_variable("fiscal_reserves", 0.75)
            .with_variable("political_will", 0.65)
            .with_variable("alliance_cohesion", 0.55),
    );

    let stochastic_events = hormuz_stochastic_events();

    Scenario {
        id: Uuid::from_bytes([0xAC; 16]),
        name: "Strait of Hormuz Flashpoint".into(),
        description: "The world's most critical maritime chokepoint is at the breaking point. \
            Twenty percent of global oil transits the 35km-wide Strait of Hormuz. \
            Following tanker seizures, drone strikes, and covert mine-laying operations, \
            US CENTCOM and the IRGC stand at the edge of open conflict. The GCC coalition \
            is fractured. China watches from the wings. Every move echoes across global \
            energy markets."
            .into(),
        initial_layers,
        actors: vec![us_fleet, irgc, houthi, tanker_fleet, energy_infra],
        roles,
        coupling_overrides: None,
        stochastic_events,
        max_turns: 40,
    }
}

/// Stochastic events specific to the Strait of Hormuz scenario.
fn hormuz_stochastic_events() -> Vec<StochasticEvent> {
    vec![
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "IRGC Fast Boat Swarm".into(),
            description: "A swarm of IRGC fast attack craft conducts a high-speed intercept of a US naval vessel in international waters.".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.08,
            resilience_delta: -0.02,
            probability: 0.18,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Tanker Seizure in Strait".into(),
            description: "IRGC commandos rappel onto a flagged tanker in the Strait, triggering an international maritime incident.".into(),
            affected_layer: DomainLayer::MaritimeLogistics,
            stress_delta: 0.12,
            resilience_delta: -0.04,
            probability: 0.15,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Drone Strike on Aramco Facility".into(),
            description: "Iranian-linked drones strike a Saudi Aramco processing facility, briefly cutting 5% of global oil supply.".into(),
            affected_layer: DomainLayer::Energy,
            stress_delta: 0.14,
            resilience_delta: -0.05,
            probability: 0.14,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "US Carrier Strike Group Arrival".into(),
            description: "A US carrier strike group transits the Strait of Hormuz and takes up position in the Gulf of Oman.".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.06,
            resilience_delta: 0.04,
            probability: 0.13,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Houthi Ballistic Missile Launch".into(),
            description: "Houthi forces launch a barrage of ballistic missiles at GCC military installations.".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.09,
            resilience_delta: -0.03,
            probability: 0.17,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Oil Price Shock".into(),
            description: "Strait tensions trigger a 25% oil price spike, destabilising global financial markets.".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: 0.11,
            resilience_delta: -0.03,
            probability: 0.20,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Iranian Mine Deployment".into(),
            description: "Intelligence confirms IRGC mine-laying vessels have seeded portions of the strait with contact mines.".into(),
            affected_layer: DomainLayer::MaritimeLogistics,
            stress_delta: 0.10,
            resilience_delta: -0.04,
            probability: 0.16,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Strait GPS Jamming".into(),
            description: "Sophisticated GPS jamming blankets the strait, forcing tankers onto manual navigation.".into(),
            affected_layer: DomainLayer::SpacePnt,
            stress_delta: 0.08,
            resilience_delta: -0.03,
            probability: 0.14,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Gulf Disinformation Surge".into(),
            description: "A coordinated disinformation campaign floods regional media with fabricated footage.".into(),
            affected_layer: DomainLayer::InformationCognitive,
            stress_delta: 0.08,
            resilience_delta: -0.02,
            probability: 0.19,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "GCC Emergency Summit".into(),
            description: "Gulf leaders convene an emergency summit, producing a joint communiqué that strengthens coalition solidarity.".into(),
            affected_layer: DomainLayer::DomesticPoliticalFiscal,
            stress_delta: -0.05,
            resilience_delta: 0.04,
            probability: 0.13,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "China Diplomatic Intervention".into(),
            description: "China's foreign minister conducts shuttle diplomacy between Tehran and Riyadh.".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: -0.06,
            resilience_delta: 0.03,
            probability: 0.12,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Cyberattack on Abqaiq Facility".into(),
            description: "A sophisticated cyberattack penetrates industrial control systems at the Abqaiq oil processing complex.".into(),
            affected_layer: DomainLayer::Cyber,
            stress_delta: 0.12,
            resilience_delta: -0.05,
            probability: 0.14,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "US Sanctions Escalation".into(),
            description: "Washington announces sweeping new sanctions targeting Iranian oil exports, banking, and IRGC commanders.".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: 0.09,
            resilience_delta: -0.02,
            probability: 0.16,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "IRGC Submarine Activity".into(),
            description: "A US P-8 Poseidon locates an IRGC submarine conducting close surveillance of the carrier strike group.".into(),
            affected_layer: DomainLayer::MaritimeLogistics,
            stress_delta: 0.07,
            resilience_delta: -0.02,
            probability: 0.15,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Houthi Sea Mine Strike".into(),
            description: "A commercial tanker strikes a Houthi-laid sea mine in the Red Sea.".into(),
            affected_layer: DomainLayer::MaritimeLogistics,
            stress_delta: 0.11,
            resilience_delta: -0.04,
            probability: 0.18,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Iranian Nuclear Signal".into(),
            description: "Iran announces enrichment to 90% purity at Fordow, crossing a red line that triggers international alarm.".into(),
            affected_layer: DomainLayer::DomesticPoliticalFiscal,
            stress_delta: 0.10,
            resilience_delta: -0.03,
            probability: 0.13,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Red Sea Shipping Diversion".into(),
            description: "Major shipping companies divert vessels away from the Red Sea and Hormuz.".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: 0.08,
            resilience_delta: -0.02,
            probability: 0.17,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "US Embassy Evacuation".into(),
            description: "Washington orders non-essential staff evacuated from Gulf embassies as the threat level reaches CRITICAL.".into(),
            affected_layer: DomainLayer::DomesticPoliticalFiscal,
            stress_delta: 0.07,
            resilience_delta: -0.02,
            probability: 0.14,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "GCC Air Defense Alert".into(),
            description: "GCC air defence systems go to maximum alert following detection of multiple ballistic missile trajectories.".into(),
            affected_layer: DomainLayer::Kinetic,
            stress_delta: 0.06,
            resilience_delta: 0.02,
            probability: 0.15,
            visibility: Visibility::Public,
        },
        StochasticEvent {
            id: Uuid::new_v4(),
            name: "Oil Tanker Insurance Collapse".into(),
            description: "Lloyd's of London withdraws coverage for Gulf-transiting tankers, effectively halting commercial shipping.".into(),
            affected_layer: DomainLayer::GeoeconomicIndustrial,
            stress_delta: 0.09,
            resilience_delta: -0.04,
            probability: 0.22,
            visibility: Visibility::Public,
        },
    ]
}

/// Registry of built-in scenarios.
pub fn get_scenario(id: &str) -> Option<Scenario> {
    match id {
        "baltic_flashpoint" | "default" => Some(baltic_flashpoint()),
        "strait_of_hormuz_flashpoint" | "hormuz_flashpoint" => Some(hormuz_flashpoint()),
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
                assert!(
                    actor_ids.contains(aid),
                    "Role {} references unknown actor {}",
                    role.id,
                    aid
                );
            }
            for aid in &role.allied_actor_ids {
                assert!(
                    actor_ids.contains(aid),
                    "Role {} references unknown allied actor {}",
                    role.id,
                    aid
                );
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
        assert!(get_scenario("strait_of_hormuz_flashpoint").is_some());
        assert!(get_scenario("hormuz_flashpoint").is_some());
        assert!(get_scenario("nonexistent").is_none());
    }

    #[test]
    fn test_hormuz_flashpoint_creation() {
        let scenario = hormuz_flashpoint();
        assert_eq!(scenario.name, "Strait of Hormuz Flashpoint");
        assert_eq!(scenario.actors.len(), 5);
        assert_eq!(scenario.roles.len(), 2);
        assert_eq!(scenario.initial_layers.len(), 8);
        assert_eq!(scenario.max_turns, 40);
    }

    #[test]
    fn test_hormuz_all_domains_initialized() {
        let scenario = hormuz_flashpoint();
        for domain in DomainLayer::ALL {
            assert!(
                scenario.initial_layers.contains_key(&domain),
                "Domain {:?} not initialized in Hormuz scenario",
                domain
            );
        }
    }

    #[test]
    fn test_hormuz_roles_reference_valid_actors() {
        let scenario = hormuz_flashpoint();
        let actor_ids: Vec<Uuid> = scenario.actors.iter().map(|a| a.id).collect();
        for role in &scenario.roles {
            for aid in &role.controlled_actor_ids {
                assert!(
                    actor_ids.contains(aid),
                    "Hormuz role {} references unknown actor {}",
                    role.id,
                    aid
                );
            }
            for aid in &role.allied_actor_ids {
                assert!(
                    actor_ids.contains(aid),
                    "Hormuz role {} references unknown allied actor {}",
                    role.id,
                    aid
                );
            }
        }
    }

    #[test]
    fn test_hormuz_serialization() {
        let scenario = hormuz_flashpoint();
        let json = serde_json::to_string(&scenario).unwrap();
        let deser: Scenario = serde_json::from_str(&json).unwrap();
        assert_eq!(deser.name, "Strait of Hormuz Flashpoint");
        assert_eq!(deser.actors.len(), 5);
        assert_eq!(deser.max_turns, 40);
    }

    #[test]
    fn test_hormuz_stochastic_events() {
        let events = hormuz_stochastic_events();
        assert_eq!(events.len(), 20);
        for ev in &events {
            assert!(
                ev.probability > 0.0 && ev.probability <= 1.0,
                "Hormuz event '{}' has invalid probability: {}",
                ev.name,
                ev.probability
            );
        }
    }

    #[test]
    fn test_hormuz_events_cover_all_domains() {
        let events = hormuz_stochastic_events();
        for domain in DomainLayer::ALL {
            assert!(
                events.iter().any(|e| e.affected_layer == domain),
                "No Hormuz stochastic event covers domain {:?}",
                domain
            );
        }
    }
}
