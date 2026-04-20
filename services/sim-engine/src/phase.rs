use crate::domain::{DomainLayer, LayerState};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Escalation phase of the battlespace.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Phase {
    CompetitiveNormality,
    HybridCoercion,
    AcutePolycrisis,
    WarTransition,
    OvertInterstateWar,
    GeneralizedBlocWar,
}

impl Phase {
    /// Numeric index for the phase (0-5).
    pub fn index(&self) -> u32 {
        match self {
            Phase::CompetitiveNormality => 0,
            Phase::HybridCoercion => 1,
            Phase::AcutePolycrisis => 2,
            Phase::WarTransition => 3,
            Phase::OvertInterstateWar => 4,
            Phase::GeneralizedBlocWar => 5,
        }
    }

    /// Create a Phase from its numeric index.
    pub fn from_index(idx: u32) -> Option<Phase> {
        match idx {
            0 => Some(Phase::CompetitiveNormality),
            1 => Some(Phase::HybridCoercion),
            2 => Some(Phase::AcutePolycrisis),
            3 => Some(Phase::WarTransition),
            4 => Some(Phase::OvertInterstateWar),
            5 => Some(Phase::GeneralizedBlocWar),
            _ => None,
        }
    }
}

impl std::fmt::Display for Phase {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Phase::CompetitiveNormality => write!(f, "Phase 0: Competitive Normality"),
            Phase::HybridCoercion => write!(f, "Phase 1: Hybrid Coercion"),
            Phase::AcutePolycrisis => write!(f, "Phase 2: Acute Polycrisis"),
            Phase::WarTransition => write!(f, "Phase 3: War Transition"),
            Phase::OvertInterstateWar => write!(f, "Phase 4: Overt Interstate War"),
            Phase::GeneralizedBlocWar => write!(f, "Phase 5: Generalized Bloc War"),
        }
    }
}

/// Default domain weights for the order parameter calculation.
/// All 8 domains weighted, summing to 1.0.
pub fn default_domain_weights() -> HashMap<DomainLayer, f64> {
    let mut w = HashMap::new();
    w.insert(DomainLayer::Kinetic, 0.20);
    w.insert(DomainLayer::MaritimeLogistics, 0.10);
    w.insert(DomainLayer::Energy, 0.12);
    w.insert(DomainLayer::GeoeconomicIndustrial, 0.10);
    w.insert(DomainLayer::Cyber, 0.12);
    w.insert(DomainLayer::SpacePnt, 0.08);
    w.insert(DomainLayer::InformationCognitive, 0.15);
    w.insert(DomainLayer::DomesticPoliticalFiscal, 0.13);
    w
}

/// Compute the composite order parameter Psi.
///
/// Psi = (sum(w_i * sigma_i)) * C_cross * M_mob / R_damp
pub fn compute_order_parameter(layers: &HashMap<DomainLayer, LayerState>) -> f64 {
    let weights = default_domain_weights();

    // Weighted stress sum
    let weighted_stress: f64 = DomainLayer::ALL
        .iter()
        .map(|d| {
            let w = weights.get(d).copied().unwrap_or(0.125);
            let sigma = layers.get(d).map(|l| l.stress).unwrap_or(0.0);
            w * sigma
        })
        .sum();

    // C_cross: cross-domain coupling intensity
    let domains_above_half = DomainLayer::ALL
        .iter()
        .filter(|d| layers.get(d).map(|l| l.stress).unwrap_or(0.0) > 0.5)
        .count() as f64;
    let c_cross = 1.0 + 0.5 * domains_above_half / 8.0;

    // M_mob: mobilization indicator = average of top-3 domain stresses
    let mut stresses: Vec<f64> = DomainLayer::ALL
        .iter()
        .map(|d| layers.get(d).map(|l| l.stress).unwrap_or(0.0))
        .collect();
    stresses.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));
    let m_mob = if stresses.len() >= 3 {
        (stresses[0] + stresses[1] + stresses[2]) / 3.0
    } else {
        stresses.iter().sum::<f64>() / stresses.len().max(1) as f64
    };

    // R_damp: average resilience, clamped to min 0.1
    let avg_resilience: f64 = DomainLayer::ALL
        .iter()
        .map(|d| layers.get(d).map(|l| l.resilience).unwrap_or(0.5))
        .sum::<f64>()
        / 8.0;
    let r_damp = avg_resilience.max(0.1);

    weighted_stress * c_cross * m_mob / r_damp
}

/// Phase transition thresholds with hysteresis.
/// Returns (enter_threshold, exit_threshold) for each phase.
fn phase_thresholds(phase: Phase) -> (f64, f64) {
    match phase {
        Phase::CompetitiveNormality => (0.0, 0.0), // always possible to be here
        Phase::HybridCoercion => (0.15, 0.09),
        Phase::AcutePolycrisis => (0.30, 0.24),
        Phase::WarTransition => (0.50, 0.44),
        Phase::OvertInterstateWar => (0.70, 0.64),
        Phase::GeneralizedBlocWar => (0.85, 0.79),
    }
}

/// Determine the current phase based on order parameter Psi and current phase (for hysteresis).
pub fn determine_phase(psi: f64, current_phase: Phase) -> Phase {
    let current_idx = current_phase.index();

    // Try to escalate: check phases above current
    for idx in (current_idx + 1..=5).rev() {
        let phase = Phase::from_index(idx).unwrap();
        let (enter, _) = phase_thresholds(phase);
        if psi >= enter {
            return phase;
        }
    }

    // Check if we stay in the current phase
    if current_idx > 0 {
        let (_, exit) = phase_thresholds(current_phase);
        if psi >= exit {
            return current_phase;
        }
    }

    // Try to de-escalate
    for idx in (1..current_idx).rev() {
        let phase = Phase::from_index(idx).unwrap();
        let (_, exit) = phase_thresholds(phase);
        if psi >= exit {
            return phase;
        }
    }

    Phase::CompetitiveNormality
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::LayerState;

    #[test]
    fn test_phase_index_roundtrip() {
        for idx in 0..=5 {
            let phase = Phase::from_index(idx).unwrap();
            assert_eq!(phase.index(), idx);
        }
    }

    #[test]
    fn test_phase_from_invalid_index() {
        assert_eq!(Phase::from_index(6), None);
    }

    #[test]
    fn test_order_parameter_low_stress() {
        let mut layers = HashMap::new();
        for d in DomainLayer::ALL {
            layers.insert(d, LayerState::new(0.05, 0.7, 0.1, 0.1));
        }
        let psi = compute_order_parameter(&layers);
        assert!(psi < 0.15, "Psi should be low with low stress, got {}", psi);
    }

    #[test]
    fn test_order_parameter_high_stress() {
        let mut layers = HashMap::new();
        for d in DomainLayer::ALL {
            layers.insert(d, LayerState::new(0.9, 0.2, 0.1, 0.8));
        }
        let psi = compute_order_parameter(&layers);
        assert!(
            psi > 0.5,
            "Psi should be high with high stress, got {}",
            psi
        );
    }

    #[test]
    fn test_phase_determination_escalation() {
        let phase = determine_phase(0.5, Phase::CompetitiveNormality);
        assert_eq!(phase, Phase::WarTransition);
    }

    #[test]
    fn test_phase_hysteresis_holds() {
        // At 0.26, should stay in AcutePolycrisis (exit is 0.24)
        let phase = determine_phase(0.26, Phase::AcutePolycrisis);
        assert_eq!(phase, Phase::AcutePolycrisis);
    }

    #[test]
    fn test_phase_hysteresis_drops() {
        // At 0.23, should drop below AcutePolycrisis (exit is 0.24)
        let phase = determine_phase(0.23, Phase::AcutePolycrisis);
        assert_eq!(phase, Phase::HybridCoercion);
    }

    #[test]
    fn test_default_weights_sum_to_one() {
        let w = default_domain_weights();
        let sum: f64 = w.values().sum();
        assert!(
            (sum - 1.0).abs() < 1e-10,
            "Weights should sum to 1.0, got {}",
            sum
        );
    }
}
