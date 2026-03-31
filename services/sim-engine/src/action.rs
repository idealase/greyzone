use crate::actor::RoleId;
use crate::domain::DomainLayer;
use crate::phase::Phase;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;
use uuid::Uuid;

/// Types of actions available in the simulation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActionType {
    Escalate,
    DeEscalate,
    Reinforce,
    Disrupt,
    Mobilize,
    Negotiate,
    CyberAttack,
    InformationOp,
    SanctionImpose,
    SanctionRelief,
    MilitaryDeploy,
    NavalBlockade,
    SpaceAssetDeploy,
    DomesticPolicyShift,
}

impl ActionType {
    /// All action types.
    pub const ALL: [ActionType; 14] = [
        ActionType::Escalate,
        ActionType::DeEscalate,
        ActionType::Reinforce,
        ActionType::Disrupt,
        ActionType::Mobilize,
        ActionType::Negotiate,
        ActionType::CyberAttack,
        ActionType::InformationOp,
        ActionType::SanctionImpose,
        ActionType::SanctionRelief,
        ActionType::MilitaryDeploy,
        ActionType::NavalBlockade,
        ActionType::SpaceAssetDeploy,
        ActionType::DomesticPolicyShift,
    ];

    /// The minimum phase required for this action to be available.
    pub fn min_phase(&self) -> Phase {
        match self {
            ActionType::Escalate => Phase::CompetitiveNormality,
            ActionType::DeEscalate => Phase::CompetitiveNormality,
            ActionType::Reinforce => Phase::CompetitiveNormality,
            ActionType::Disrupt => Phase::HybridCoercion,
            ActionType::Mobilize => Phase::CompetitiveNormality,
            ActionType::Negotiate => Phase::CompetitiveNormality,
            ActionType::CyberAttack => Phase::HybridCoercion,
            ActionType::InformationOp => Phase::CompetitiveNormality,
            ActionType::SanctionImpose => Phase::HybridCoercion,
            ActionType::SanctionRelief => Phase::CompetitiveNormality,
            ActionType::MilitaryDeploy => Phase::WarTransition,
            ActionType::NavalBlockade => Phase::AcutePolycrisis,
            ActionType::SpaceAssetDeploy => Phase::AcutePolycrisis,
            ActionType::DomesticPolicyShift => Phase::CompetitiveNormality,
        }
    }

    /// The primary domain this action affects.
    pub fn primary_domain(&self) -> Option<DomainLayer> {
        match self {
            ActionType::CyberAttack => Some(DomainLayer::Cyber),
            ActionType::InformationOp => Some(DomainLayer::InformationCognitive),
            ActionType::SanctionImpose | ActionType::SanctionRelief => {
                Some(DomainLayer::GeoeconomicIndustrial)
            }
            ActionType::MilitaryDeploy => Some(DomainLayer::Kinetic),
            ActionType::NavalBlockade => Some(DomainLayer::MaritimeLogistics),
            ActionType::SpaceAssetDeploy => Some(DomainLayer::SpacePnt),
            ActionType::DomesticPolicyShift => Some(DomainLayer::DomesticPoliticalFiscal),
            _ => None, // generic actions work on any domain
        }
    }

    /// Resource cost for this action.
    pub fn resource_cost(&self) -> f64 {
        match self {
            ActionType::Escalate => 5.0,
            ActionType::DeEscalate => 3.0,
            ActionType::Reinforce => 8.0,
            ActionType::Disrupt => 10.0,
            ActionType::Mobilize => 7.0,
            ActionType::Negotiate => 4.0,
            ActionType::CyberAttack => 12.0,
            ActionType::InformationOp => 6.0,
            ActionType::SanctionImpose => 8.0,
            ActionType::SanctionRelief => 3.0,
            ActionType::MilitaryDeploy => 20.0,
            ActionType::NavalBlockade => 15.0,
            ActionType::SpaceAssetDeploy => 18.0,
            ActionType::DomesticPolicyShift => 5.0,
        }
    }
}

impl fmt::Display for ActionType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ActionType::Escalate => write!(f, "Escalate"),
            ActionType::DeEscalate => write!(f, "De-escalate"),
            ActionType::Reinforce => write!(f, "Reinforce"),
            ActionType::Disrupt => write!(f, "Disrupt"),
            ActionType::Mobilize => write!(f, "Mobilize"),
            ActionType::Negotiate => write!(f, "Negotiate"),
            ActionType::CyberAttack => write!(f, "Cyber Attack"),
            ActionType::InformationOp => write!(f, "Information Operation"),
            ActionType::SanctionImpose => write!(f, "Sanction Imposition"),
            ActionType::SanctionRelief => write!(f, "Sanction Relief"),
            ActionType::MilitaryDeploy => write!(f, "Military Deployment"),
            ActionType::NavalBlockade => write!(f, "Naval Blockade"),
            ActionType::SpaceAssetDeploy => write!(f, "Space Asset Deployment"),
            ActionType::DomesticPolicyShift => write!(f, "Domestic Policy Shift"),
        }
    }
}

/// A concrete action submitted by a player/AI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Action {
    pub id: Uuid,
    pub actor_id: Uuid,
    pub role_id: RoleId,
    pub action_type: ActionType,
    pub target_layer: DomainLayer,
    pub target_actor_id: Option<Uuid>,
    pub parameters: HashMap<String, f64>,
    pub turn: u32,
}

impl Action {
    /// Get the intensity parameter, defaulting to 0.5.
    pub fn intensity(&self) -> f64 {
        self.parameters
            .get("intensity")
            .copied()
            .unwrap_or(0.5)
            .clamp(0.0, 1.0)
    }
}

/// An effect produced by applying an action.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Effect {
    pub layer: DomainLayer,
    pub field: String,
    pub delta: f64,
    pub description: String,
}

/// A template describing an available action with parameter ranges.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionTemplate {
    pub action_type: ActionType,
    pub available_layers: Vec<DomainLayer>,
    pub actor_id: Uuid,
    pub parameter_ranges: HashMap<String, (f64, f64)>,
    pub resource_cost: f64,
    pub description: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_action_type_min_phase() {
        assert_eq!(
            ActionType::Escalate.min_phase(),
            Phase::CompetitiveNormality
        );
        assert_eq!(ActionType::MilitaryDeploy.min_phase(), Phase::WarTransition);
        assert_eq!(ActionType::CyberAttack.min_phase(), Phase::HybridCoercion);
    }

    #[test]
    fn test_action_intensity_default() {
        let action = Action {
            id: Uuid::new_v4(),
            actor_id: Uuid::new_v4(),
            role_id: "test".into(),
            action_type: ActionType::Escalate,
            target_layer: DomainLayer::Kinetic,
            target_actor_id: None,
            parameters: HashMap::new(),
            turn: 0,
        };
        assert_eq!(action.intensity(), 0.5);
    }

    #[test]
    fn test_action_intensity_custom() {
        let mut params = HashMap::new();
        params.insert("intensity".into(), 0.8);
        let action = Action {
            id: Uuid::new_v4(),
            actor_id: Uuid::new_v4(),
            role_id: "test".into(),
            action_type: ActionType::Escalate,
            target_layer: DomainLayer::Kinetic,
            target_actor_id: None,
            parameters: params,
            turn: 0,
        };
        assert_eq!(action.intensity(), 0.8);
    }

    #[test]
    fn test_resource_costs_positive() {
        for at in ActionType::ALL.iter() {
            assert!(at.resource_cost() > 0.0);
        }
    }

    #[test]
    fn test_action_type_display_is_human_readable() {
        assert_eq!(ActionType::CyberAttack.to_string(), "Cyber Attack");
        assert_eq!(ActionType::InformationOp.to_string(), "Information Operation");
        assert_eq!(
            ActionType::DomesticPolicyShift.to_string(),
            "Domestic Policy Shift"
        );
    }
}
