export enum ActionType {
  // Kinetic domain
  MilitaryPosture = "military_posture",
  AirDefenseActivation = "air_defense_activation",
  NavalPatrol = "naval_patrol",
  SpecialOperations = "special_operations",

  // Maritime & Logistics
  TradeRouteDisruption = "trade_route_disruption",
  PortSecurity = "port_security",
  LogisticsReinforcement = "logistics_reinforcement",

  // Energy
  EnergySupplyPressure = "energy_supply_pressure",
  PipelineInterdiction = "pipeline_interdiction",
  EnergyReserveRelease = "energy_reserve_release",

  // Geoeconomic & Industrial
  SanctionPackage = "sanction_package",
  TradeIncentive = "trade_incentive",
  IndustrialSabotage = "industrial_sabotage",
  SupplyChainDiversification = "supply_chain_diversification",

  // Cyber
  CyberIntrusion = "cyber_intrusion",
  CyberDefenseHardening = "cyber_defense_hardening",
  DdosAttack = "ddos_attack",

  // Space & PNT
  SatelliteInterference = "satellite_interference",
  PntSpoofing = "pnt_spoofing",
  SpaceSurveillance = "space_surveillance",

  // Information & Cognitive
  DisinformationCampaign = "disinformation_campaign",
  MediaCounterNarrative = "media_counter_narrative",
  StrategicLeaks = "strategic_leaks",

  // Domestic Political & Fiscal
  DomesticMobilization = "domestic_mobilization",
  FiscalStimulus = "fiscal_stimulus",
  PoliticalMessaging = "political_messaging",

  // Meta
  Deescalate = "deescalate",
  HoldSteady = "hold_steady",
}

export const DOMAINS = [
  "kinetic",
  "maritime_logistics",
  "energy",
  "geoeconomic_industrial",
  "cyber",
  "space_pnt",
  "information_cognitive",
  "domestic_political_fiscal",
] as const;

export type Domain = (typeof DOMAINS)[number];

export interface ActionPayload {
  actionType: ActionType | string;
  targetDomain: Domain | string;
  targetActorId?: string;
  intensity: number;
  rationale: string;
}

export const ACTION_DESCRIPTIONS: Record<string, string> = {
  [ActionType.MilitaryPosture]:
    "Adjust military readiness level in a region. Higher intensity signals greater force commitment.",
  [ActionType.AirDefenseActivation]:
    "Activate or reinforce air defense systems. Raises kinetic stress but improves resilience.",
  [ActionType.NavalPatrol]:
    "Deploy naval assets for patrol or show of force in maritime domain.",
  [ActionType.SpecialOperations]:
    "Covert military operations. High impact but risk of exposure and escalation.",
  [ActionType.TradeRouteDisruption]:
    "Disrupt maritime trade routes through blockade or harassment.",
  [ActionType.PortSecurity]:
    "Reinforce port security and logistics infrastructure.",
  [ActionType.LogisticsReinforcement]:
    "Strengthen supply chain and logistics capacity.",
  [ActionType.EnergySupplyPressure]:
    "Apply pressure on energy supply through export restrictions or pricing.",
  [ActionType.PipelineInterdiction]:
    "Target energy pipeline infrastructure.",
  [ActionType.EnergyReserveRelease]:
    "Release strategic energy reserves to stabilize markets.",
  [ActionType.SanctionPackage]:
    "Impose economic sanctions targeting specific sectors or entities.",
  [ActionType.TradeIncentive]:
    "Offer trade incentives to allies or neutral parties.",
  [ActionType.IndustrialSabotage]:
    "Covert sabotage of industrial capacity. High risk, high impact.",
  [ActionType.SupplyChainDiversification]:
    "Diversify supply chains to reduce dependency vulnerabilities.",
  [ActionType.CyberIntrusion]:
    "Conduct cyber intrusion operations against adversary networks.",
  [ActionType.CyberDefenseHardening]:
    "Harden cyber defenses and patch vulnerabilities.",
  [ActionType.DdosAttack]:
    "Launch distributed denial of service attack against adversary infrastructure.",
  [ActionType.SatelliteInterference]:
    "Interfere with adversary satellite communications or surveillance.",
  [ActionType.PntSpoofing]:
    "Spoof positioning, navigation, and timing signals.",
  [ActionType.SpaceSurveillance]:
    "Enhance space domain awareness and surveillance.",
  [ActionType.DisinformationCampaign]:
    "Launch coordinated disinformation campaign in information domain.",
  [ActionType.MediaCounterNarrative]:
    "Deploy counter-narrative through media channels to combat disinformation.",
  [ActionType.StrategicLeaks]:
    "Strategically leak information to shape public narrative.",
  [ActionType.DomesticMobilization]:
    "Mobilize domestic political support for current strategy.",
  [ActionType.FiscalStimulus]:
    "Deploy fiscal measures to support war effort or stabilize economy.",
  [ActionType.PoliticalMessaging]:
    "Shape domestic political narrative through targeted messaging.",
  [ActionType.Deescalate]:
    "Signal intent to de-escalate in the target domain. Reduces stress but may cede initiative.",
  [ActionType.HoldSteady]:
    "Maintain current posture without change. Preserves resources and avoids escalation.",
};
