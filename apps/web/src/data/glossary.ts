import { DomainLayer } from "../types/domain";

export interface GlossaryEntry {
  term: string;
  category: "domain" | "phase" | "action" | "metric" | "mechanic";
  definition: string;
}

export const DOMAIN_DESCRIPTIONS: Record<DomainLayer, { summary: string; highStress: string; resilience: string }> = {
  [DomainLayer.Kinetic]: {
    summary: "Conventional military forces, ground operations, and kinetic strike capabilities.",
    highStress: "High stress indicates active military confrontation or imminent armed conflict.",
    resilience: "Resilience reflects force readiness, logistics sustainment, and defensive posture.",
  },
  [DomainLayer.MaritimeLogistics]: {
    summary: "Sea lanes, port infrastructure, shipping routes, and naval logistics chains.",
    highStress: "High stress means disrupted shipping, blockaded ports, or contested sea lanes.",
    resilience: "Resilience reflects fleet availability, port redundancy, and convoy protection.",
  },
  [DomainLayer.Energy]: {
    summary: "Energy infrastructure, pipelines, power grids, fuel supplies, and energy markets.",
    highStress: "High stress signals energy shortages, pipeline disruptions, or grid instability.",
    resilience: "Resilience reflects supply diversification, strategic reserves, and grid redundancy.",
  },
  [DomainLayer.GeoeconomicIndustrial]: {
    summary: "Trade relationships, industrial supply chains, financial systems, and economic leverage.",
    highStress: "High stress indicates trade disruption, sanctions pressure, or supply chain breakdown.",
    resilience: "Resilience reflects economic diversification, trade agreements, and financial buffers.",
  },
  [DomainLayer.Cyber]: {
    summary: "Cyber operations, network security, digital infrastructure, and information systems.",
    highStress: "High stress means active cyber campaigns, compromised networks, or digital sabotage.",
    resilience: "Resilience reflects defensive cyber capabilities, patching, and incident response.",
  },
  [DomainLayer.SpacePnt]: {
    summary: "Space assets, satellite constellations, positioning/navigation/timing (PNT), and space control.",
    highStress: "High stress indicates threatened satellites, degraded PNT, or anti-satellite activity.",
    resilience: "Resilience reflects constellation redundancy, ground backups, and space situational awareness.",
  },
  [DomainLayer.InformationCognitive]: {
    summary: "Media narratives, public opinion, propaganda, psychological operations, and cognitive warfare.",
    highStress: "High stress means intense disinformation, eroding public trust, or narrative dominance by adversary.",
    resilience: "Resilience reflects media literacy, counter-narrative capability, and institutional trust.",
  },
  [DomainLayer.DomesticPoliticalFiscal]: {
    summary: "Internal politics, fiscal policy, government stability, public support, and domestic cohesion.",
    highStress: "High stress signals political instability, fiscal strain, or collapsing public support for the mission.",
    resilience: "Resilience reflects political consensus, fiscal reserves, and institutional stability.",
  },
};

export const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  action: "A player or AI submitted this action during the turn.",
  stochastic: "A random event that occurred based on probability and current conditions.",
  coupling_effect: "A cascading effect from one domain to another via the coupling matrix.",
  phase_transition: "The escalation level changed — the simulation entered a new phase.",
  ai_action: "The AI opponent executed this action.",
  narrative: "A situation report summarizing the current state.",
  intel: "Intelligence gathered about the adversary or the situation.",
  threat: "A threat assessment or warning about emerging risks.",
};

export const ACTION_TYPE_DESCRIPTIONS: Record<string, string> = {
  Escalate: "Increases pressure on a target domain. Higher intensity raises stress more but risks escalation.",
  DeEscalate: "Actively reduces tension in a domain. Lowers stress but may cost political capital.",
  Reinforce: "Strengthens defensive resilience in a domain, dampening future stress growth.",
  Disrupt: "Degrades adversary resilience in a domain, making it more vulnerable to stress.",
  Mobilize: "Activates domain resources, increasing activity and generating moderate stress.",
  Negotiate: "Diplomatic engagement to reduce stress. May have positive spillover to secondary domains.",
  CyberAttack: "Offensive cyber operations. Effectiveness scales with intensity and inversely with resilience.",
  InformationOp: "Information/psychological operations. Spills over to Domestic Political & Fiscal domain.",
  SanctionImpose: "Economic pressure via sanctions. Raises stress but causes blowback to Domestic domain.",
  SanctionRelief: "Easing sanctions to reduce stress and slightly restore resilience.",
  MilitaryDeploy: "Conventional force deployment. High stress and activity impact. Significant escalation risk.",
  NavalBlockade: "Maritime interdiction. High stress with spillover to Energy domain.",
  SpaceAssetDeploy: "Deploying space capabilities. Moderate stress with activity increase and resilience boost.",
  DomesticPolicyShift: "Internal policy adjustment. Moderate stress impact on Domestic domain.",
};

export const PHASE_DESCRIPTIONS: Record<string, { description: string; unlocks: string }> = {
  CompetitiveNormality: {
    description: "Baseline state. Low-level competition via diplomatic, economic, and information channels.",
    unlocks: "All non-kinetic actions available. Negotiate and De-escalate are most effective.",
  },
  HybridCoercion: {
    description: "Coercive pressure below the threshold of armed conflict. Cyber, economic, and information operations intensify.",
    unlocks: "CyberAttack, InformationOp, and SanctionImpose become more impactful. Escalation risk increases.",
  },
  AcutePolycrisis: {
    description: "Multiple domains under simultaneous stress. Cascading effects accelerate through the coupling matrix.",
    unlocks: "Cross-domain coupling effects intensify. De-escalation becomes harder. Mobilize becomes critical.",
  },
  WarTransition: {
    description: "The threshold between grey-zone conflict and overt warfare. Military options dominate.",
    unlocks: "MilitaryDeploy and NavalBlockade reach full effectiveness. Very high escalation risk on all actions.",
  },
  OvertInterstateWar: {
    description: "Open military conflict between state actors. All domains are under extreme stress.",
    unlocks: "All kinetic actions at maximum effect. De-escalation is extremely difficult.",
  },
  GeneralizedBlocWar: {
    description: "Systemic conflict involving multiple state blocs. The final and most dangerous phase.",
    unlocks: "Maximum escalation level. All domains near critical stress. Recovery is nearly impossible.",
  },
};

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  // Metrics
  { term: "Order Parameter (Ψ)", category: "metric", definition: "Measures how coordinated and intense the conflict system is. 0 = dispersed, 1 = fully synchronized escalation. Higher Ψ makes phase shifts more likely." },
  { term: "Stress", category: "metric", definition: "How much pressure a domain is under. Ranges 0–100%. Actions, stochastic events, and coupling effects all modify stress." },
  { term: "Resilience", category: "metric", definition: "A domain's defensive capacity to absorb and dampen stress. Higher resilience means stress grows more slowly and spillover is reduced." },
  { term: "Activity Level", category: "metric", definition: "How much operational activity is occurring in a domain. High activity often correlates with rising stress." },
  { term: "Resources (RP)", category: "metric", definition: "Resource points spent to execute actions. Each action has a cost. Regenerates at +2 RP per turn." },

  // Mechanics
  { term: "Coupling", category: "mechanic", definition: "Cross-domain connections that cause stress in one domain to cascade into others. Coupling strength ranges from 0 (none) to 1 (maximum). Visible in the coupling graph." },
  { term: "Spillover", category: "mechanic", definition: "When an action in one domain causes stress changes in a linked domain. Driven by the coupling matrix." },
  { term: "Friction", category: "mechanic", definition: "Random variation in outcomes. Higher friction means less predictable results from actions." },
  { term: "Intensity", category: "mechanic", definition: "How forcefully an action is executed (0.0–1.0). Higher intensity = greater effect but higher escalation risk." },
  { term: "Intensity Tiers", category: "mechanic", definition: "Probe (<0.30): light pressure. Assert (0.30–0.59): firm push. Coerce (0.60–0.79): compels behavior. Maximum Pressure (≥0.80): near-total effort." },
  { term: "Escalation Risk", category: "mechanic", definition: "The likelihood that an action triggers a phase transition. Depends on action type, intensity, and current phase." },
  { term: "Phase Transition", category: "mechanic", definition: "When Ψ crosses a threshold, the scenario escalates to the next phase. Each phase unlocks new dynamics and risks." },

  // Domains
  { term: "Kinetic", category: "domain", definition: "Conventional military forces and kinetic strike capabilities. The most directly escalatory domain." },
  { term: "Maritime & Logistics", category: "domain", definition: "Sea lanes, ports, shipping routes, and naval logistics. Critical for economic and military sustainment." },
  { term: "Energy", category: "domain", definition: "Energy infrastructure including pipelines, power grids, and fuel supplies. High coupling to economic domains." },
  { term: "Geoeconomic & Industrial", category: "domain", definition: "Trade, supply chains, and financial systems. Sanctions and trade disruption are primary levers." },
  { term: "Cyber", category: "domain", definition: "Digital infrastructure and cyber operations. Can target any domain but especially coupled to Space and Energy." },
  { term: "Space & PNT", category: "domain", definition: "Satellites, positioning/navigation/timing services. Disruption cascades to military and cyber domains." },
  { term: "Information & Cognitive", category: "domain", definition: "Media, propaganda, and psychological operations. Coupled to domestic politics and public opinion." },
  { term: "Domestic Political & Fiscal", category: "domain", definition: "Internal politics, fiscal policy, and public support. The foundation that sustains all other domain operations." },

  // Phases
  { term: "Phase 0: Competitive Normality", category: "phase", definition: "Baseline state. Low-level competition via diplomatic, economic, and information channels. Ψ < 0.15." },
  { term: "Phase 1: Hybrid Coercion", category: "phase", definition: "Coercive pressure below armed conflict threshold. Cyber, economic, and info ops intensify. Ψ 0.15–0.29." },
  { term: "Phase 2: Acute Polycrisis", category: "phase", definition: "Multiple domains under simultaneous stress. Cascading effects accelerate. Ψ 0.30–0.49." },
  { term: "Phase 3: War Transition", category: "phase", definition: "Threshold between grey-zone conflict and overt warfare. Military options dominate. Ψ 0.50–0.69." },
  { term: "Phase 4: Overt Interstate War", category: "phase", definition: "Open military conflict. All domains under extreme stress. Ψ 0.70–0.84." },
  { term: "Phase 5: Generalized / Bloc War", category: "phase", definition: "Systemic multi-bloc conflict. Maximum escalation. Recovery is nearly impossible. Ψ ≥ 0.85." },

  // Actions
  { term: "Escalate", category: "action", definition: "Increases pressure on a target domain. Stress impact scales with intensity and inversely with resilience." },
  { term: "De-escalate", category: "action", definition: "Actively reduces tension. Lowers stress proportional to intensity." },
  { term: "Reinforce", category: "action", definition: "Strengthens resilience in a domain, dampening future stress growth." },
  { term: "Disrupt", category: "action", definition: "Degrades adversary resilience, making the domain more vulnerable." },
  { term: "Mobilize", category: "action", definition: "Activates domain resources. Increases activity and generates moderate stress." },
  { term: "Negotiate", category: "action", definition: "Diplomatic engagement. Reduces stress with potential positive spillover." },
  { term: "Cyber Attack", category: "action", definition: "Offensive cyber operations. Scales with intensity, inversely with resilience. Reduces target resilience." },
  { term: "Information Operation", category: "action", definition: "Psychological/information warfare. Spills over to Domestic Political & Fiscal domain." },
  { term: "Sanction Imposition", category: "action", definition: "Economic pressure via sanctions. Causes stress but also domestic blowback." },
  { term: "Sanction Relief", category: "action", definition: "Easing sanctions to reduce stress and restore some resilience." },
  { term: "Military Deployment", category: "action", definition: "Conventional force deployment. Very high stress and activity. Maximum escalation risk." },
  { term: "Naval Blockade", category: "action", definition: "Maritime interdiction. High stress with significant Energy domain spillover." },
  { term: "Space Asset Deployment", category: "action", definition: "Deploying space capabilities. Moderate stress with activity and resilience boost." },
  { term: "Domestic Policy Shift", category: "action", definition: "Internal policy adjustment affecting the Domestic domain." },
];
