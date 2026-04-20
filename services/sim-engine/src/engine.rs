use crate::action::{Action, ActionTemplate, ActionType, Effect};
use crate::actor::{Role, RoleId, Visibility};
use crate::coupling::{default_coupling_matrix, CouplingMatrix};
use crate::domain::{DomainLayer, LayerState};
use crate::errors::{ActionError, EngineError};
use crate::events::{Event, SimulationMetrics, StochasticEvent, TurnResult};
use crate::phase::{compute_order_parameter, determine_phase, Phase};
use crate::scenario::Scenario;
use rand::Rng;
use rand_chacha::rand_core::SeedableRng;
use rand_chacha::ChaCha8Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// The complete world state at any point in time.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldState {
    pub turn: u32,
    pub phase: Phase,
    pub order_parameter: f64,
    pub layers: HashMap<DomainLayer, LayerState>,
    pub actors: Vec<crate::actor::Actor>,
    pub roles: Vec<Role>,
    pub events: Vec<Event>,
    pub pending_actions: Vec<Action>,
    pub rng_seed: u64,
    pub phase_history: Vec<(u32, Phase)>,
    pub max_turns: u32,
}

/// A filtered view of the world state visible to a specific role.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleVisibleState {
    pub turn: u32,
    pub phase: Phase,
    pub order_parameter: f64,
    pub layers: HashMap<DomainLayer, LayerState>,
    pub visible_actors: Vec<crate::actor::Actor>,
    pub role_id: RoleId,
    pub controlled_actor_ids: Vec<Uuid>,
    pub allied_actor_ids: Vec<Uuid>,
}

/// The main simulation engine.
pub struct SimulationEngine {
    state: WorldState,
    rng: ChaCha8Rng,
    coupling_matrix: CouplingMatrix,
    event_log: Vec<Event>,
    snapshots: Vec<(u32, WorldState)>,
    stochastic_events: Vec<StochasticEvent>,
    seed: u64,
}

impl SimulationEngine {
    /// Create a new simulation engine from a scenario and seed.
    pub fn new(scenario: Scenario, seed: u64) -> Self {
        let coupling_matrix = scenario
            .coupling_overrides
            .clone()
            .unwrap_or_else(default_coupling_matrix);

        let stochastic_events = scenario.stochastic_events.clone();

        let state = WorldState {
            turn: 0,
            phase: Phase::CompetitiveNormality,
            order_parameter: 0.0,
            layers: scenario.initial_layers,
            actors: scenario.actors,
            roles: scenario.roles,
            events: Vec::new(),
            pending_actions: Vec::new(),
            rng_seed: seed,
            phase_history: vec![(0, Phase::CompetitiveNormality)],
            max_turns: scenario.max_turns,
        };

        let mut engine = Self {
            state,
            rng: ChaCha8Rng::seed_from_u64(seed),
            coupling_matrix,
            event_log: Vec::new(),
            snapshots: Vec::new(),
            stochastic_events,
            seed,
        };

        // Compute initial order parameter
        engine.state.order_parameter = compute_order_parameter(&engine.state.layers);

        engine
    }

    /// Get a reference to the current world state.
    pub fn get_state(&self) -> &WorldState {
        &self.state
    }

    /// Get the world state filtered for a specific role's visibility.
    pub fn get_role_visible_state(&self, role_id: &RoleId) -> RoleVisibleState {
        let role = self.state.roles.iter().find(|r| &r.id == role_id);
        let (controlled, allied) = match role {
            Some(r) => (r.controlled_actor_ids.clone(), r.allied_actor_ids.clone()),
            None => (vec![], vec![]),
        };

        // Filter actors based on visibility
        let visible_actors: Vec<crate::actor::Actor> = self
            .state
            .actors
            .iter()
            .filter(|a| {
                match &a.visibility {
                    Visibility::Public => true,
                    Visibility::RoleScoped(roles) => roles.iter().any(|r| r == role_id),
                    Visibility::Hidden => {
                        // Only visible if the role controls this actor
                        controlled.contains(&a.id)
                    }
                }
            })
            .cloned()
            .collect();

        RoleVisibleState {
            turn: self.state.turn,
            phase: self.state.phase,
            order_parameter: self.state.order_parameter,
            layers: self.state.layers.clone(),
            visible_actors,
            role_id: role_id.clone(),
            controlled_actor_ids: controlled,
            allied_actor_ids: allied,
        }
    }

    /// Derive legal actions for a given role based on current state.
    pub fn derive_legal_actions(&self, role_id: &RoleId) -> Vec<ActionTemplate> {
        let role = match self.state.roles.iter().find(|r| &r.id == role_id) {
            Some(r) => r,
            None => return vec![],
        };

        let mut templates = Vec::new();

        for actor_id in &role.controlled_actor_ids {
            let actor = match self.state.actors.iter().find(|a| &a.id == actor_id) {
                Some(a) => a,
                None => continue,
            };

            for action_type in ActionType::ALL.iter() {
                // Phase restriction
                if action_type.min_phase().index() > self.state.phase.index() {
                    continue;
                }

                // Resource check
                if actor.resources < action_type.resource_cost() {
                    continue;
                }

                // Determine available layers
                let available_layers = match action_type.primary_domain() {
                    Some(domain) => {
                        // Domain-specific action: only available if actor has capability
                        if actor.capability(&domain) > 0.0 {
                            vec![domain]
                        } else {
                            continue;
                        }
                    }
                    None => {
                        // Generic action: available on any domain where actor has capability
                        DomainLayer::ALL
                            .iter()
                            .filter(|d| actor.capability(d) > 0.1)
                            .copied()
                            .collect()
                    }
                };

                if available_layers.is_empty() {
                    continue;
                }

                let mut param_ranges = HashMap::new();
                param_ranges.insert(
                    "intensity".into(),
                    (
                        0.1,
                        actor
                            .capability(available_layers.first().unwrap_or(&DomainLayer::Kinetic))
                            .max(0.1),
                    ),
                );

                let domain_names: Vec<String> =
                    available_layers.iter().map(ToString::to_string).collect();
                let description = format!(
                    "{} by {} targeting {}",
                    action_type,
                    actor.name,
                    domain_names.join(" and ")
                );

                templates.push(ActionTemplate {
                    action_type: action_type.clone(),
                    available_layers,
                    actor_id: *actor_id,
                    parameter_ranges: param_ranges,
                    resource_cost: action_type.resource_cost(),
                    description,
                });
            }
        }

        templates
    }

    /// Validate an action without applying it.
    pub fn validate_action(&self, action: &Action) -> Result<(), ActionError> {
        // Find the role
        let role = self
            .state
            .roles
            .iter()
            .find(|r| r.id == action.role_id)
            .ok_or_else(|| ActionError::ActorNotFound(action.role_id.clone()))?;

        // Check role controls actor
        if !role.controlled_actor_ids.contains(&action.actor_id) {
            return Err(ActionError::RoleDoesNotControlActor(
                action.role_id.clone(),
                action.actor_id.to_string(),
            ));
        }

        // Find the actor
        let actor = self
            .state
            .actors
            .iter()
            .find(|a| a.id == action.actor_id)
            .ok_or_else(|| ActionError::ActorNotFound(action.actor_id.to_string()))?;

        // Phase restriction
        let min_phase = action.action_type.min_phase();
        if min_phase.index() > self.state.phase.index() {
            return Err(ActionError::PhaseRestriction(
                format!("{:?}", action.action_type),
                format!("{}", min_phase),
                format!("{}", self.state.phase),
            ));
        }

        // Resource check
        let cost = action.action_type.resource_cost();
        if actor.resources < cost {
            return Err(ActionError::InsufficientResources {
                needed: cost,
                available: actor.resources,
            });
        }

        // Target layer validation for domain-specific actions
        if let Some(required_domain) = action.action_type.primary_domain() {
            if action.target_layer != required_domain {
                return Err(ActionError::InvalidTargetLayer(format!(
                    "{:?} must target {:?}",
                    action.action_type, required_domain
                )));
            }
        }

        // Target actor validation
        if let Some(target_id) = action.target_actor_id {
            if !self.state.actors.iter().any(|a| a.id == target_id) {
                return Err(ActionError::TargetActorNotFound(target_id.to_string()));
            }
        }

        // Intensity validation
        let intensity = action.intensity();
        if !(0.0..=1.0).contains(&intensity) {
            return Err(ActionError::InvalidParameter(
                "intensity must be between 0.0 and 1.0".into(),
            ));
        }

        Ok(())
    }

    /// Submit and immediately apply an action.
    pub fn submit_action(&mut self, action: Action) -> Result<Vec<Effect>, ActionError> {
        self.validate_action(&action)?;

        let effects = self.apply_action(&action);

        // Deduct resources
        let cost = action.action_type.resource_cost();
        if let Some(actor) = self
            .state
            .actors
            .iter_mut()
            .find(|a| a.id == action.actor_id)
        {
            actor.resources -= cost;
        }

        // Log the event
        let event = Event::ActionApplied {
            turn: self.state.turn,
            action: action.clone(),
            effects: effects.clone(),
        };
        self.state.events.push(event.clone());
        self.event_log.push(event);

        Ok(effects)
    }

    /// Apply an action and return its effects.
    fn apply_action(&mut self, action: &Action) -> Vec<Effect> {
        let intensity = action.intensity();
        let mut effects = Vec::new();

        match action.action_type {
            ActionType::Escalate => {
                if let Some(layer) = self.state.layers.get_mut(&action.target_layer) {
                    let delta = intensity * (1.0 - layer.resilience) * 0.1;
                    layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "stress".into(),
                        delta,
                        description: format!("Escalation increased stress by {:.4}", delta),
                    });
                }
            }
            ActionType::DeEscalate => {
                if let Some(layer) = self.state.layers.get_mut(&action.target_layer) {
                    let delta = intensity * 0.05;
                    layer.stress = (layer.stress - delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "stress".into(),
                        delta: -delta,
                        description: format!("De-escalation reduced stress by {:.4}", delta),
                    });
                }
            }
            ActionType::Reinforce => {
                if let Some(layer) = self.state.layers.get_mut(&action.target_layer) {
                    let delta = intensity * 0.05;
                    layer.resilience = (layer.resilience + delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "resilience".into(),
                        delta,
                        description: format!("Reinforcement increased resilience by {:.4}", delta),
                    });
                }
            }
            ActionType::Disrupt => {
                if let Some(layer) = self.state.layers.get_mut(&action.target_layer) {
                    let delta = intensity * 0.08;
                    layer.resilience = (layer.resilience - delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "resilience".into(),
                        delta: -delta,
                        description: format!("Disruption reduced resilience by {:.4}", delta),
                    });
                }
            }
            ActionType::Mobilize => {
                if let Some(layer) = self.state.layers.get_mut(&action.target_layer) {
                    let delta = intensity * 0.1;
                    layer.activity_level = (layer.activity_level + delta).clamp(0.0, 1.0);
                    // Mobilization also slightly increases stress
                    let stress_delta = intensity * 0.03;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "activity_level".into(),
                        delta,
                        description: format!("Mobilization increased activity by {:.4}", delta),
                    });
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!(
                            "Mobilization side-effect: stress increased by {:.4}",
                            stress_delta
                        ),
                    });
                }
            }
            ActionType::Negotiate => {
                // Negotiate reduces stress in target layer and one coupled layer
                if let Some(layer) = self.state.layers.get_mut(&action.target_layer) {
                    let delta = intensity * 0.07;
                    layer.stress = (layer.stress - delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: action.target_layer,
                        field: "stress".into(),
                        delta: -delta,
                        description: format!("Negotiation reduced stress by {:.4}", delta),
                    });
                }
                // Also slightly reduce stress in a coupled domain
                let secondary_domain = match action.target_layer {
                    DomainLayer::Kinetic => DomainLayer::DomesticPoliticalFiscal,
                    DomainLayer::Energy => DomainLayer::GeoeconomicIndustrial,
                    DomainLayer::Cyber => DomainLayer::InformationCognitive,
                    _ => DomainLayer::InformationCognitive,
                };
                if let Some(layer) = self.state.layers.get_mut(&secondary_domain) {
                    let delta = intensity * 0.03;
                    layer.stress = (layer.stress - delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: secondary_domain,
                        field: "stress".into(),
                        delta: -delta,
                        description: format!(
                            "Negotiation spillover: reduced stress in {:?} by {:.4}",
                            secondary_domain, delta
                        ),
                    });
                }
            }
            ActionType::CyberAttack => {
                if let Some(layer) = self.state.layers.get_mut(&DomainLayer::Cyber) {
                    let stress_delta = intensity * (1.0 - layer.resilience) * 0.12;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    let res_delta = intensity * 0.04;
                    layer.resilience = (layer.resilience - res_delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::Cyber,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!(
                            "Cyber attack increased stress by {:.4}",
                            stress_delta
                        ),
                    });
                    effects.push(Effect {
                        layer: DomainLayer::Cyber,
                        field: "resilience".into(),
                        delta: -res_delta,
                        description: format!(
                            "Cyber attack degraded resilience by {:.4}",
                            res_delta
                        ),
                    });
                }
            }
            ActionType::InformationOp => {
                if let Some(layer) = self
                    .state
                    .layers
                    .get_mut(&DomainLayer::InformationCognitive)
                {
                    let stress_delta = intensity * 0.09;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    layer.friction = (layer.friction + intensity * 0.05).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::InformationCognitive,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!(
                            "Information op increased stress by {:.4}",
                            stress_delta
                        ),
                    });
                }
                // Also affect domestic political domain
                if let Some(layer) = self
                    .state
                    .layers
                    .get_mut(&DomainLayer::DomesticPoliticalFiscal)
                {
                    let delta = intensity * 0.04;
                    layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::DomesticPoliticalFiscal,
                        field: "stress".into(),
                        delta,
                        description: format!("Info op spillover: domestic stress +{:.4}", delta),
                    });
                }
            }
            ActionType::SanctionImpose => {
                if let Some(layer) = self
                    .state
                    .layers
                    .get_mut(&DomainLayer::GeoeconomicIndustrial)
                {
                    let stress_delta = intensity * 0.10;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::GeoeconomicIndustrial,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!(
                            "Sanctions increased economic stress by {:.4}",
                            stress_delta
                        ),
                    });
                }
                // Sanctions also hurt own economy slightly
                if let Some(layer) = self
                    .state
                    .layers
                    .get_mut(&DomainLayer::DomesticPoliticalFiscal)
                {
                    let delta = intensity * 0.02;
                    layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::DomesticPoliticalFiscal,
                        field: "stress".into(),
                        delta,
                        description: format!("Sanctions blowback: domestic stress +{:.4}", delta),
                    });
                }
            }
            ActionType::SanctionRelief => {
                if let Some(layer) = self
                    .state
                    .layers
                    .get_mut(&DomainLayer::GeoeconomicIndustrial)
                {
                    let delta = intensity * 0.08;
                    layer.stress = (layer.stress - delta).clamp(0.0, 1.0);
                    layer.resilience = (layer.resilience + intensity * 0.03).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::GeoeconomicIndustrial,
                        field: "stress".into(),
                        delta: -delta,
                        description: format!(
                            "Sanction relief reduced economic stress by {:.4}",
                            delta
                        ),
                    });
                }
            }
            ActionType::MilitaryDeploy => {
                if let Some(layer) = self.state.layers.get_mut(&DomainLayer::Kinetic) {
                    let stress_delta = intensity * 0.15;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    layer.activity_level = (layer.activity_level + intensity * 0.2).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::Kinetic,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!(
                            "Military deployment increased kinetic stress by {:.4}",
                            stress_delta
                        ),
                    });
                    effects.push(Effect {
                        layer: DomainLayer::Kinetic,
                        field: "activity_level".into(),
                        delta: intensity * 0.2,
                        description: "Military deployment increased activity".into(),
                    });
                }
            }
            ActionType::NavalBlockade => {
                if let Some(layer) = self.state.layers.get_mut(&DomainLayer::MaritimeLogistics) {
                    let stress_delta = intensity * 0.14;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    layer.friction = (layer.friction + intensity * 0.1).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::MaritimeLogistics,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!(
                            "Naval blockade increased maritime stress by {:.4}",
                            stress_delta
                        ),
                    });
                }
                // Also affects energy
                if let Some(layer) = self.state.layers.get_mut(&DomainLayer::Energy) {
                    let delta = intensity * 0.06;
                    layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::Energy,
                        field: "stress".into(),
                        delta,
                        description: format!(
                            "Naval blockade energy spillover: stress +{:.4}",
                            delta
                        ),
                    });
                }
            }
            ActionType::SpaceAssetDeploy => {
                if let Some(layer) = self.state.layers.get_mut(&DomainLayer::SpacePnt) {
                    let stress_delta = intensity * 0.08;
                    layer.stress = (layer.stress + stress_delta).clamp(0.0, 1.0);
                    layer.activity_level =
                        (layer.activity_level + intensity * 0.15).clamp(0.0, 1.0);
                    // But also increases own resilience in space
                    let res_delta = intensity * 0.04;
                    layer.resilience = (layer.resilience + res_delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::SpacePnt,
                        field: "stress".into(),
                        delta: stress_delta,
                        description: format!("Space asset deployment: stress +{:.4}", stress_delta),
                    });
                    effects.push(Effect {
                        layer: DomainLayer::SpacePnt,
                        field: "resilience".into(),
                        delta: res_delta,
                        description: format!(
                            "Space asset deployment: resilience +{:.4}",
                            res_delta
                        ),
                    });
                }
            }
            ActionType::DomesticPolicyShift => {
                if let Some(layer) = self
                    .state
                    .layers
                    .get_mut(&DomainLayer::DomesticPoliticalFiscal)
                {
                    // Can either increase or decrease stress depending on direction
                    let direction = action.parameters.get("direction").copied().unwrap_or(1.0); // positive = hawkish, negative = dovish
                    let delta = intensity * direction.signum() * 0.06;
                    layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
                    let res_delta = intensity * 0.04;
                    layer.resilience = (layer.resilience + res_delta).clamp(0.0, 1.0);
                    effects.push(Effect {
                        layer: DomainLayer::DomesticPoliticalFiscal,
                        field: "stress".into(),
                        delta,
                        description: format!(
                            "Policy shift: domestic stress changed by {:.4}",
                            delta
                        ),
                    });
                    effects.push(Effect {
                        layer: DomainLayer::DomesticPoliticalFiscal,
                        field: "resilience".into(),
                        delta: res_delta,
                        description: format!("Policy shift: domestic resilience +{:.4}", res_delta),
                    });
                }
            }
        }

        effects
    }

    /// Advance the simulation by one turn.
    pub fn advance_turn(&mut self) -> TurnResult {
        self.state.turn += 1;
        let turn = self.state.turn;

        let mut all_effects = Vec::new();
        let mut fired_events = Vec::new();

        // 1. Generate and apply stochastic events
        let phase_multiplier = match self.state.phase {
            Phase::CompetitiveNormality => 1.0,
            Phase::HybridCoercion => 1.3,
            Phase::AcutePolycrisis => 1.6,
            Phase::WarTransition => 2.0,
            Phase::OvertInterstateWar => 2.5,
            Phase::GeneralizedBlocWar => 3.0,
        };

        for event_template in self.stochastic_events.clone() {
            let adjusted_prob = (event_template.probability * phase_multiplier).min(0.95);
            let roll: f64 = self.rng.gen();
            if roll < adjusted_prob {
                // Event fires
                let event = event_template.clone();
                if let Some(layer) = self.state.layers.get_mut(&event.affected_layer) {
                    layer.stress = (layer.stress + event.stress_delta).clamp(0.0, 1.0);
                    layer.resilience = (layer.resilience + event.resilience_delta).clamp(0.0, 1.0);
                    all_effects.push(Effect {
                        layer: event.affected_layer,
                        field: "stress".into(),
                        delta: event.stress_delta,
                        description: format!("Stochastic: {}", event.name),
                    });
                }

                let log_event = Event::StochasticEvent {
                    turn,
                    event: event.clone(),
                };
                self.state.events.push(log_event.clone());
                self.event_log.push(log_event);
                fired_events.push(event);
            }
        }

        // 2. Propagate stress through coupling matrix
        self.coupling_matrix
            .propagate_stress(&mut self.state.layers);

        // 3. Apply friction decay (stress naturally decays a bit each turn)
        for layer in self.state.layers.values_mut() {
            let decay = layer.friction * 0.02;
            layer.stress = (layer.stress - decay).clamp(0.0, 1.0);
        }

        // 4. Compute order parameter and determine phase
        let old_phase = self.state.phase;
        self.state.order_parameter = compute_order_parameter(&self.state.layers);
        self.state.phase = determine_phase(self.state.order_parameter, old_phase);

        let phase_transition = if self.state.phase != old_phase {
            let pt_event = Event::PhaseTransition {
                turn,
                from: old_phase,
                to: self.state.phase,
                order_parameter: self.state.order_parameter,
            };
            self.state.events.push(pt_event.clone());
            self.event_log.push(pt_event);
            self.state.phase_history.push((turn, self.state.phase));
            Some((old_phase, self.state.phase))
        } else {
            None
        };

        // 5. Permanent damage at Phase 4+
        if self.state.phase.index() >= 4 {
            for layer in self.state.layers.values_mut() {
                if layer.stress > 0.5 {
                    layer.resilience = (layer.resilience - 0.01).clamp(0.0, 1.0);
                }
            }
        }

        // 6. Natural resource recovery for all actors (small per-turn recovery)
        for actor in self.state.actors.iter_mut() {
            actor.resources = (actor.resources + 2.0).min(300.0);
        }

        // Log turn advancement
        let turn_event = Event::TurnAdvanced { turn };
        self.state.events.push(turn_event.clone());
        self.event_log.push(turn_event);

        TurnResult {
            turn,
            phase: self.state.phase,
            order_parameter: self.state.order_parameter,
            events_fired: fired_events,
            phase_transition,
            effects: all_effects,
        }
    }

    /// Take a snapshot of the current state.
    pub fn take_snapshot(&mut self) -> &WorldState {
        let snapshot_event = Event::SnapshotTaken {
            turn: self.state.turn,
        };
        self.state.events.push(snapshot_event.clone());
        self.event_log.push(snapshot_event);
        self.snapshots.push((self.state.turn, self.state.clone()));
        &self.state
    }

    /// Get the event log.
    pub fn get_event_log(&self) -> &[Event] {
        &self.event_log
    }

    /// Replay the simulation from scratch to a specific turn.
    /// Uses the same seed for deterministic replay.
    pub fn replay_to_turn(&self, turn: u32) -> Result<WorldState, EngineError> {
        if turn > self.state.turn {
            return Err(EngineError::InvalidTurn {
                requested: turn,
                max: self.state.turn,
            });
        }

        // Find the most recent snapshot at or before the target turn
        let snapshot = self
            .snapshots
            .iter()
            .filter(|(t, _)| *t <= turn)
            .max_by_key(|(t, _)| *t);

        if let Some((snap_turn, snap_state)) = snapshot {
            if *snap_turn == turn {
                return Ok(snap_state.clone());
            }
        }

        // Rebuild from the event log
        // We reconstruct by finding the initial scenario and replaying actions
        // For simplicity, we replay from the closest snapshot or from start
        let (start_turn, mut replay_state) = match snapshot {
            Some((t, s)) => (*t, s.clone()),
            None => {
                // Need to reconstruct from turn 0
                // Use the first state in the event log context
                let initial = WorldState {
                    turn: 0,
                    phase: Phase::CompetitiveNormality,
                    order_parameter: 0.0,
                    layers: self.state.layers.clone(), // This is imperfect for full replay
                    actors: self.state.actors.clone(),
                    roles: self.state.roles.clone(),
                    events: Vec::new(),
                    pending_actions: Vec::new(),
                    rng_seed: self.seed,
                    phase_history: vec![(0, Phase::CompetitiveNormality)],
                    max_turns: self.state.max_turns,
                };
                (0, initial)
            }
        };

        // Apply events from start_turn+1 to target turn
        let mut rng = ChaCha8Rng::seed_from_u64(self.seed);
        // Advance RNG to the right position
        for _ in 0..start_turn {
            let _: f64 = rng.gen();
        }

        for event in &self.event_log {
            match event {
                Event::ActionApplied {
                    turn: t,
                    action,
                    effects: _,
                } => {
                    if *t > start_turn && *t <= turn {
                        // Re-apply action effects (simplified: use stored effects)
                        replay_state.turn = *t;
                        // We apply the action logic directly
                        let intensity = action.intensity();
                        if let Some(layer) = replay_state.layers.get_mut(&action.target_layer) {
                            match action.action_type {
                                ActionType::Escalate => {
                                    let delta = intensity * (1.0 - layer.resilience) * 0.1;
                                    layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
                                }
                                ActionType::DeEscalate => {
                                    let delta = intensity * 0.05;
                                    layer.stress = (layer.stress - delta).clamp(0.0, 1.0);
                                }
                                _ => {} // Simplified replay for other types
                            }
                        }
                    }
                }
                Event::TurnAdvanced { turn: t } => {
                    if *t > start_turn && *t <= turn {
                        replay_state.turn = *t;
                    }
                }
                _ => {}
            }
        }

        replay_state.turn = turn;
        Ok(replay_state)
    }

    /// Get simulation metrics.
    pub fn get_metrics(&self) -> SimulationMetrics {
        let total_actions = self
            .event_log
            .iter()
            .filter(|e| matches!(e, Event::ActionApplied { .. }))
            .count();

        let phase_transitions: Vec<(u32, Phase, Phase)> = self
            .event_log
            .iter()
            .filter_map(|e| match e {
                Event::PhaseTransition { turn, from, to, .. } => Some((*turn, *from, *to)),
                _ => None,
            })
            .collect();

        let domain_stresses: Vec<(DomainLayer, f64)> = DomainLayer::ALL
            .iter()
            .map(|d| {
                (
                    *d,
                    self.state.layers.get(d).map(|l| l.stress).unwrap_or(0.0),
                )
            })
            .collect();

        let domain_resiliences: Vec<(DomainLayer, f64)> = DomainLayer::ALL
            .iter()
            .map(|d| {
                (
                    *d,
                    self.state
                        .layers
                        .get(d)
                        .map(|l| l.resilience)
                        .unwrap_or(0.0),
                )
            })
            .collect();

        SimulationMetrics {
            current_turn: self.state.turn,
            current_phase: self.state.phase,
            order_parameter: self.state.order_parameter,
            total_events: self.event_log.len(),
            total_actions_applied: total_actions,
            phase_transitions,
            domain_stresses,
            domain_resiliences,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scenario::baltic_flashpoint;

    #[test]
    fn test_engine_creation() {
        let scenario = baltic_flashpoint();
        let engine = SimulationEngine::new(scenario, 42);
        assert_eq!(engine.get_state().turn, 0);
        assert_eq!(engine.get_state().phase, Phase::CompetitiveNormality);
    }

    #[test]
    fn test_advance_turn() {
        let scenario = baltic_flashpoint();
        let mut engine = SimulationEngine::new(scenario, 42);
        let result = engine.advance_turn();
        assert_eq!(result.turn, 1);
        assert_eq!(engine.get_state().turn, 1);
    }

    #[test]
    fn test_submit_action() {
        let scenario = baltic_flashpoint();
        let mut engine = SimulationEngine::new(scenario, 42);
        let blue_id = Uuid::from_bytes([0x01; 16]);

        let action = Action {
            id: Uuid::new_v4(),
            actor_id: blue_id,
            role_id: "blue_commander".into(),
            action_type: ActionType::Escalate,
            target_layer: DomainLayer::Kinetic,
            target_actor_id: None,
            parameters: {
                let mut p = HashMap::new();
                p.insert("intensity".into(), 0.7);
                p
            },
            turn: 0,
        };

        let effects = engine.submit_action(action).unwrap();
        assert!(!effects.is_empty());
    }

    #[test]
    fn test_invalid_role_action() {
        let scenario = baltic_flashpoint();
        let engine = SimulationEngine::new(scenario, 42);
        let blue_id = Uuid::from_bytes([0x01; 16]);

        let action = Action {
            id: Uuid::new_v4(),
            actor_id: blue_id,
            role_id: "red_commander".into(), // Red can't control Blue
            action_type: ActionType::Escalate,
            target_layer: DomainLayer::Kinetic,
            target_actor_id: None,
            parameters: HashMap::new(),
            turn: 0,
        };

        assert!(engine.validate_action(&action).is_err());
    }

    #[test]
    fn test_phase_restriction() {
        let scenario = baltic_flashpoint();
        let engine = SimulationEngine::new(scenario, 42);
        let blue_id = Uuid::from_bytes([0x01; 16]);

        // MilitaryDeploy requires Phase 3+
        let action = Action {
            id: Uuid::new_v4(),
            actor_id: blue_id,
            role_id: "blue_commander".into(),
            action_type: ActionType::MilitaryDeploy,
            target_layer: DomainLayer::Kinetic,
            target_actor_id: None,
            parameters: HashMap::new(),
            turn: 0,
        };

        let err = engine.validate_action(&action);
        assert!(err.is_err());
        assert!(matches!(
            err.unwrap_err(),
            ActionError::PhaseRestriction(_, _, _)
        ));
    }

    #[test]
    fn test_role_visible_state() {
        let scenario = baltic_flashpoint();
        let engine = SimulationEngine::new(scenario, 42);

        let blue_state = engine.get_role_visible_state(&"blue_commander".into());
        let red_state = engine.get_role_visible_state(&"red_commander".into());

        // Blue should not see the Separatist Movement (RoleScoped to red_commander)
        assert!(
            !blue_state
                .visible_actors
                .iter()
                .any(|a| a.name == "Separatist Movement"),
            "Blue should not see the Separatist Movement"
        );

        // Red should see the Separatist Movement
        assert!(
            red_state
                .visible_actors
                .iter()
                .any(|a| a.name == "Separatist Movement"),
            "Red should see the Separatist Movement"
        );
    }

    #[test]
    fn test_legal_actions_derivation() {
        let scenario = baltic_flashpoint();
        let engine = SimulationEngine::new(scenario, 42);

        let actions = engine.derive_legal_actions(&"blue_commander".into());
        assert!(!actions.is_empty(), "Blue should have legal actions");

        // MilitaryDeploy should NOT be available at Phase 0
        assert!(
            !actions
                .iter()
                .any(|a| a.action_type == ActionType::MilitaryDeploy),
            "MilitaryDeploy should not be available at Phase 0"
        );

        // Escalate should be available
        assert!(
            actions
                .iter()
                .any(|a| a.action_type == ActionType::Escalate),
            "Escalate should be available at Phase 0"
        );

        let escalate = actions
            .iter()
            .find(|a| a.action_type == ActionType::Escalate)
            .expect("Escalate action should exist");
        assert!(
            !escalate.description.contains('[') && !escalate.description.contains(']'),
            "Description should not use debug-style list formatting: {}",
            escalate.description
        );
        assert!(
            !escalate.description.contains(" on ["),
            "Description should not use debug-style 'on [..]' formatting: {}",
            escalate.description
        );
        assert!(
            escalate.description.contains(" by ") && escalate.description.contains(" targeting "),
            "Description should be human-readable: {}",
            escalate.description
        );

        assert!(
            escalate.description.starts_with("Escalate by "),
            "Escalate description should use readable action wording: {}",
            escalate.description
        );
        assert!(
            !actions
                .iter()
                .any(|a| a.description.contains("CyberAttack")),
            "Description should not contain raw enum variant names: {}",
            actions
                .iter()
                .map(|a| a.description.as_str())
                .collect::<Vec<_>>()
                .join(" | ")
        );
    }

    #[test]
    fn test_deterministic_replay() {
        let scenario1 = baltic_flashpoint();
        let scenario2 = baltic_flashpoint();

        let mut engine1 = SimulationEngine::new(scenario1, 12345);
        let mut engine2 = SimulationEngine::new(scenario2, 12345);

        for _ in 0..10 {
            engine1.advance_turn();
            engine2.advance_turn();
        }

        // States should be identical
        assert_eq!(engine1.get_state().turn, engine2.get_state().turn);
        assert_eq!(engine1.get_state().phase, engine2.get_state().phase);
        assert!(
            (engine1.get_state().order_parameter - engine2.get_state().order_parameter).abs()
                < 1e-10,
            "Order parameters should be identical with same seed"
        );

        // Check all layer stresses match
        for domain in DomainLayer::ALL {
            let s1 = engine1.get_state().layers[&domain].stress;
            let s2 = engine2.get_state().layers[&domain].stress;
            assert!(
                (s1 - s2).abs() < 1e-10,
                "Stress for {:?} should match: {} vs {}",
                domain,
                s1,
                s2
            );
        }
    }

    #[test]
    fn test_different_seeds_differ() {
        let scenario1 = baltic_flashpoint();
        let scenario2 = baltic_flashpoint();

        let mut engine1 = SimulationEngine::new(scenario1, 111);
        let mut engine2 = SimulationEngine::new(scenario2, 222);

        for _ in 0..20 {
            engine1.advance_turn();
            engine2.advance_turn();
        }

        // With different seeds and stochastic events, states should diverge
        let s1: f64 = DomainLayer::ALL
            .iter()
            .map(|d| engine1.get_state().layers[d].stress)
            .sum();
        let s2: f64 = DomainLayer::ALL
            .iter()
            .map(|d| engine2.get_state().layers[d].stress)
            .sum();

        // They *could* be the same in theory but extremely unlikely over 20 turns
        // with stochastic events
        assert!(
            (s1 - s2).abs() > 1e-6,
            "Different seeds should produce different states (s1={}, s2={})",
            s1,
            s2
        );
    }

    #[test]
    fn test_snapshot_and_metrics() {
        let scenario = baltic_flashpoint();
        let mut engine = SimulationEngine::new(scenario, 42);

        engine.advance_turn();
        engine.take_snapshot();
        engine.advance_turn();

        let metrics = engine.get_metrics();
        assert_eq!(metrics.current_turn, 2);
        assert!(metrics.total_events > 0);
    }

    #[test]
    fn test_resource_deduction() {
        let scenario = baltic_flashpoint();
        let mut engine = SimulationEngine::new(scenario, 42);
        let blue_id = Uuid::from_bytes([0x01; 16]);

        let initial_resources = engine
            .get_state()
            .actors
            .iter()
            .find(|a| a.id == blue_id)
            .unwrap()
            .resources;

        let action = Action {
            id: Uuid::new_v4(),
            actor_id: blue_id,
            role_id: "blue_commander".into(),
            action_type: ActionType::Escalate,
            target_layer: DomainLayer::Kinetic,
            target_actor_id: None,
            parameters: HashMap::new(),
            turn: 0,
        };

        engine.submit_action(action).unwrap();

        let final_resources = engine
            .get_state()
            .actors
            .iter()
            .find(|a| a.id == blue_id)
            .unwrap()
            .resources;

        assert!(
            final_resources < initial_resources,
            "Resources should decrease after action"
        );
        let expected = initial_resources - ActionType::Escalate.resource_cost();
        assert!(
            (final_resources - expected).abs() < 1e-10,
            "Resources should be {} but got {}",
            expected,
            final_resources
        );
    }
}
