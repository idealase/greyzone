use crate::domain::DomainLayer;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

pub type RoleId = String;

/// Visibility determines who can see a piece of information.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Visibility {
    Public,
    RoleScoped(Vec<RoleId>),
    Hidden,
}

impl Visibility {
    /// Check if a given role can see this item.
    pub fn visible_to(&self, role_id: &str) -> bool {
        match self {
            Visibility::Public => true,
            Visibility::RoleScoped(roles) => roles.iter().any(|r| r == role_id),
            Visibility::Hidden => false,
        }
    }
}

/// The kind of actor in the simulation.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActorKind {
    State,
    Alliance,
    ProxyNonState,
    InfrastructureOperator,
    StrategicFirm,
    PoliticalBody,
}

/// An actor participating in the battlespace.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Actor {
    pub id: Uuid,
    pub name: String,
    pub kind: ActorKind,
    pub capabilities: HashMap<DomainLayer, f64>,
    pub resources: f64,
    pub morale: f64,
    pub visibility: Visibility,
}

impl Actor {
    pub fn new(name: impl Into<String>, kind: ActorKind) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: name.into(),
            kind,
            capabilities: HashMap::new(),
            resources: 100.0,
            morale: 0.7,
            visibility: Visibility::Public,
        }
    }

    pub fn with_id(mut self, id: Uuid) -> Self {
        self.id = id;
        self
    }

    pub fn with_capability(mut self, domain: DomainLayer, level: f64) -> Self {
        self.capabilities.insert(domain, level.clamp(0.0, 1.0));
        self
    }

    pub fn with_resources(mut self, resources: f64) -> Self {
        self.resources = resources;
        self
    }

    pub fn with_morale(mut self, morale: f64) -> Self {
        self.morale = morale.clamp(0.0, 1.0);
        self
    }

    pub fn with_visibility(mut self, visibility: Visibility) -> Self {
        self.visibility = visibility;
        self
    }

    /// Get capability in a given domain, defaulting to 0.0.
    pub fn capability(&self, domain: &DomainLayer) -> f64 {
        self.capabilities.get(domain).copied().unwrap_or(0.0)
    }
}

/// A role that a player/AI can assume, controlling one or more actors.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: RoleId,
    pub name: String,
    pub controlled_actor_ids: Vec<Uuid>,
    pub allied_actor_ids: Vec<Uuid>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_visibility_public() {
        let v = Visibility::Public;
        assert!(v.visible_to("anyone"));
    }

    #[test]
    fn test_visibility_role_scoped() {
        let v = Visibility::RoleScoped(vec!["blue_commander".into()]);
        assert!(v.visible_to("blue_commander"));
        assert!(!v.visible_to("red_commander"));
    }

    #[test]
    fn test_visibility_hidden() {
        let v = Visibility::Hidden;
        assert!(!v.visible_to("anyone"));
    }

    #[test]
    fn test_actor_creation() {
        let actor = Actor::new("TestActor", ActorKind::State)
            .with_capability(DomainLayer::Kinetic, 0.8)
            .with_resources(200.0);
        assert_eq!(actor.name, "TestActor");
        assert_eq!(actor.capability(&DomainLayer::Kinetic), 0.8);
        assert_eq!(actor.capability(&DomainLayer::Cyber), 0.0);
        assert_eq!(actor.resources, 200.0);
    }

    #[test]
    fn test_actor_serialization() {
        let actor = Actor::new("Test", ActorKind::Alliance)
            .with_capability(DomainLayer::Cyber, 0.5);
        let json = serde_json::to_string(&actor).unwrap();
        let deser: Actor = serde_json::from_str(&json).unwrap();
        assert_eq!(deser.name, "Test");
    }
}
