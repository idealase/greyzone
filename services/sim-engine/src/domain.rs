use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

/// The 8 battlespace domain layers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum DomainLayer {
    Kinetic,
    MaritimeLogistics,
    Energy,
    GeoeconomicIndustrial,
    Cyber,
    SpacePnt,
    InformationCognitive,
    DomesticPoliticalFiscal,
}

impl DomainLayer {
    pub const ALL: [DomainLayer; 8] = [
        DomainLayer::Kinetic,
        DomainLayer::MaritimeLogistics,
        DomainLayer::Energy,
        DomainLayer::GeoeconomicIndustrial,
        DomainLayer::Cyber,
        DomainLayer::SpacePnt,
        DomainLayer::InformationCognitive,
        DomainLayer::DomesticPoliticalFiscal,
    ];
}

impl fmt::Display for DomainLayer {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DomainLayer::Kinetic => write!(f, "Kinetic"),
            DomainLayer::MaritimeLogistics => write!(f, "Maritime/Logistics"),
            DomainLayer::Energy => write!(f, "Energy"),
            DomainLayer::GeoeconomicIndustrial => write!(f, "Geoeconomic/Industrial"),
            DomainLayer::Cyber => write!(f, "Cyber"),
            DomainLayer::SpacePnt => write!(f, "Space/PNT"),
            DomainLayer::InformationCognitive => write!(f, "Information/Cognitive"),
            DomainLayer::DomesticPoliticalFiscal => write!(f, "Domestic Political/Fiscal"),
        }
    }
}

/// State of a single domain layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayerState {
    pub stress: f64,
    pub resilience: f64,
    pub friction: f64,
    pub activity_level: f64,
    pub variables: HashMap<String, f64>,
}

impl LayerState {
    pub fn new(stress: f64, resilience: f64, friction: f64, activity_level: f64) -> Self {
        Self {
            stress: stress.clamp(0.0, 1.0),
            resilience: resilience.clamp(0.0, 1.0),
            friction: friction.clamp(0.0, 1.0),
            activity_level: activity_level.clamp(0.0, 1.0),
            variables: HashMap::new(),
        }
    }

    pub fn with_variable(mut self, key: impl Into<String>, value: f64) -> Self {
        self.variables.insert(key.into(), value);
        self
    }

    /// Clamp all fields to valid ranges.
    pub fn clamp(&mut self) {
        self.stress = self.stress.clamp(0.0, 1.0);
        self.resilience = self.resilience.clamp(0.0, 1.0);
        self.friction = self.friction.clamp(0.0, 1.0);
        self.activity_level = self.activity_level.clamp(0.0, 1.0);
    }
}

impl Default for LayerState {
    fn default() -> Self {
        Self {
            stress: 0.1,
            resilience: 0.5,
            friction: 0.1,
            activity_level: 0.2,
            variables: HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_layer_state_clamping() {
        let mut ls = LayerState::new(1.5, -0.3, 0.5, 0.5);
        assert_eq!(ls.stress, 1.0);
        assert_eq!(ls.resilience, 0.0);
        ls.stress = 2.0;
        ls.clamp();
        assert_eq!(ls.stress, 1.0);
    }

    #[test]
    fn test_domain_layer_all() {
        assert_eq!(DomainLayer::ALL.len(), 8);
    }

    #[test]
    fn test_layer_state_with_variable() {
        let ls = LayerState::new(0.1, 0.5, 0.1, 0.2)
            .with_variable("troop_count", 1000.0);
        assert_eq!(ls.variables.get("troop_count"), Some(&1000.0));
    }

    #[test]
    fn test_domain_layer_serialization() {
        let layer = DomainLayer::Cyber;
        let json = serde_json::to_string(&layer).unwrap();
        let deserialized: DomainLayer = serde_json::from_str(&json).unwrap();
        assert_eq!(layer, deserialized);
    }
}
