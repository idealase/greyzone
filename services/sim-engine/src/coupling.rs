use crate::domain::{DomainLayer, LayerState};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A single coupling entry for serialization.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct CouplingEntry {
    a: DomainLayer,
    b: DomainLayer,
    strength: f64,
}

/// Coupling matrix between domain layers.
/// Stored as a map from (DomainLayer, DomainLayer) to coupling strength (0.0-1.0).
/// Uses custom serialization to avoid tuple keys in JSON.
#[derive(Debug, Clone)]
pub struct CouplingMatrix {
    couplings: HashMap<(DomainLayer, DomainLayer), f64>,
    default_coupling: f64,
}

impl Serialize for CouplingMatrix {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        use serde::ser::SerializeStruct;
        let entries: Vec<CouplingEntry> = self
            .couplings
            .iter()
            .filter(|((a, b), _)| *a <= *b) // only one direction to avoid duplicates
            .map(|((a, b), &s)| CouplingEntry {
                a: *a,
                b: *b,
                strength: s,
            })
            .collect();
        let mut state = serializer.serialize_struct("CouplingMatrix", 2)?;
        state.serialize_field("couplings", &entries)?;
        state.serialize_field("default_coupling", &self.default_coupling)?;
        state.end()
    }
}

impl<'de> Deserialize<'de> for CouplingMatrix {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        #[derive(Deserialize)]
        struct CouplingMatrixHelper {
            couplings: Vec<CouplingEntry>,
            default_coupling: f64,
        }
        let helper = CouplingMatrixHelper::deserialize(deserializer)?;
        let mut matrix = CouplingMatrix::new(helper.default_coupling);
        for entry in helper.couplings {
            matrix.set(entry.a, entry.b, entry.strength);
        }
        Ok(matrix)
    }
}

impl CouplingMatrix {
    /// Create an empty coupling matrix with a default coupling value.
    pub fn new(default_coupling: f64) -> Self {
        Self {
            couplings: HashMap::new(),
            default_coupling,
        }
    }

    /// Set coupling between two domains (symmetric).
    pub fn set(&mut self, a: DomainLayer, b: DomainLayer, value: f64) {
        let v = value.clamp(0.0, 1.0);
        self.couplings.insert((a, b), v);
        self.couplings.insert((b, a), v);
    }

    /// Get coupling between two domains.
    pub fn get(&self, a: &DomainLayer, b: &DomainLayer) -> f64 {
        if a == b {
            return 0.0;
        }
        self.couplings
            .get(&(*a, *b))
            .copied()
            .unwrap_or(self.default_coupling)
    }

    /// Propagate stress between coupled domains.
    /// For each pair (i, j) with coupling c_ij:
    ///   if stress_i > 0.3: stress_j += c_ij * (stress_i - 0.3) * 0.05
    pub fn propagate_stress(&self, layers: &mut HashMap<DomainLayer, LayerState>) {
        // Collect stress deltas first to avoid borrow issues
        let mut deltas: HashMap<DomainLayer, f64> = HashMap::new();

        let domains = DomainLayer::ALL;
        for &source in &domains {
            let source_stress = layers.get(&source).map(|l| l.stress).unwrap_or(0.0);
            if source_stress > 0.3 {
                for &target in &domains {
                    if source == target {
                        continue;
                    }
                    let coupling = self.get(&source, &target);
                    let delta = coupling * (source_stress - 0.3) * 0.05;
                    *deltas.entry(target).or_insert(0.0) += delta;
                }
            }
        }

        // Apply deltas
        for (domain, delta) in deltas {
            if let Some(layer) = layers.get_mut(&domain) {
                layer.stress = (layer.stress + delta).clamp(0.0, 1.0);
            }
        }
    }
}

/// Create the default coupling matrix as specified.
pub fn default_coupling_matrix() -> CouplingMatrix {
    let mut m = CouplingMatrix::new(0.2);

    use DomainLayer::*;
    m.set(Kinetic, MaritimeLogistics, 0.7);
    m.set(Kinetic, Energy, 0.5);
    m.set(Kinetic, Cyber, 0.4);
    m.set(Energy, GeoeconomicIndustrial, 0.8);
    m.set(Energy, DomesticPoliticalFiscal, 0.6);
    m.set(Cyber, SpacePnt, 0.7);
    m.set(Cyber, InformationCognitive, 0.6);
    m.set(InformationCognitive, DomesticPoliticalFiscal, 0.8);
    m.set(MaritimeLogistics, Energy, 0.6);
    m.set(MaritimeLogistics, GeoeconomicIndustrial, 0.5);
    m.set(SpacePnt, Kinetic, 0.5);
    m.set(GeoeconomicIndustrial, DomesticPoliticalFiscal, 0.7);

    m
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coupling_symmetry() {
        let m = default_coupling_matrix();
        assert_eq!(
            m.get(&DomainLayer::Kinetic, &DomainLayer::MaritimeLogistics),
            m.get(&DomainLayer::MaritimeLogistics, &DomainLayer::Kinetic)
        );
    }

    #[test]
    fn test_coupling_self_zero() {
        let m = default_coupling_matrix();
        assert_eq!(m.get(&DomainLayer::Kinetic, &DomainLayer::Kinetic), 0.0);
    }

    #[test]
    fn test_coupling_default_value() {
        let m = default_coupling_matrix();
        // DomesticPolitical <-> SpacePnt is not explicitly set, should be 0.2
        assert_eq!(
            m.get(
                &DomainLayer::DomesticPoliticalFiscal,
                &DomainLayer::SpacePnt
            ),
            0.2
        );
    }

    #[test]
    fn test_stress_propagation() {
        let m = default_coupling_matrix();
        let mut layers = HashMap::new();
        // Set kinetic stress high
        layers.insert(DomainLayer::Kinetic, LayerState::new(0.8, 0.5, 0.1, 0.5));
        layers.insert(
            DomainLayer::MaritimeLogistics,
            LayerState::new(0.1, 0.5, 0.1, 0.2),
        );
        for d in DomainLayer::ALL {
            layers
                .entry(d)
                .or_insert_with(|| LayerState::new(0.0, 0.5, 0.1, 0.1));
        }

        let initial_maritime = layers[&DomainLayer::MaritimeLogistics].stress;
        m.propagate_stress(&mut layers);
        let final_maritime = layers[&DomainLayer::MaritimeLogistics].stress;

        assert!(
            final_maritime > initial_maritime,
            "Maritime stress should increase from kinetic coupling: {} -> {}",
            initial_maritime,
            final_maritime
        );
    }

    #[test]
    fn test_no_propagation_below_threshold() {
        let m = default_coupling_matrix();
        let mut layers = HashMap::new();
        for d in DomainLayer::ALL {
            layers.insert(d, LayerState::new(0.2, 0.5, 0.1, 0.1));
        }

        let initial: HashMap<DomainLayer, f64> =
            layers.iter().map(|(d, l)| (*d, l.stress)).collect();
        m.propagate_stress(&mut layers);

        for d in DomainLayer::ALL {
            assert_eq!(
                layers[&d].stress, initial[&d],
                "No propagation should occur when all stresses below 0.3"
            );
        }
    }

    #[test]
    fn test_coupling_matrix_serialization() {
        let m = default_coupling_matrix();
        let json = serde_json::to_string(&m).unwrap();
        let deser: CouplingMatrix = serde_json::from_str(&json).unwrap();
        assert_eq!(deser.get(&DomainLayer::Kinetic, &DomainLayer::Energy), 0.5);
    }
}
