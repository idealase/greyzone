export enum DomainLayer {
  Kinetic = "Kinetic",
  MaritimeLogistics = "MaritimeLogistics",
  Energy = "Energy",
  GeoeconomicIndustrial = "GeoeconomicIndustrial",
  Cyber = "Cyber",
  SpacePnt = "SpacePnt",
  InformationCognitive = "InformationCognitive",
  DomesticPoliticalFiscal = "DomesticPoliticalFiscal",
}

export interface LayerState {
  stress: number;
  resilience: number;
  friction: number;
  activity_level: number;
  variables: Record<string, number>;
}

export const DOMAIN_LABELS: Record<DomainLayer, string> = {
  [DomainLayer.Kinetic]: "Kinetic",
  [DomainLayer.MaritimeLogistics]: "Maritime & Logistics",
  [DomainLayer.Energy]: "Energy",
  [DomainLayer.GeoeconomicIndustrial]: "Geoeconomic & Industrial",
  [DomainLayer.Cyber]: "Cyber",
  [DomainLayer.SpacePnt]: "Space & PNT",
  [DomainLayer.InformationCognitive]: "Information & Cognitive",
  [DomainLayer.DomesticPoliticalFiscal]: "Domestic Political & Fiscal",
};

export const DOMAIN_COLORS: Record<DomainLayer, string> = {
  [DomainLayer.Kinetic]: "#ef4444",
  [DomainLayer.MaritimeLogistics]: "#3b82f6",
  [DomainLayer.Energy]: "#f59e0b",
  [DomainLayer.GeoeconomicIndustrial]: "#10b981",
  [DomainLayer.Cyber]: "#8b5cf6",
  [DomainLayer.SpacePnt]: "#6366f1",
  [DomainLayer.InformationCognitive]: "#ec4899",
  [DomainLayer.DomesticPoliticalFiscal]: "#78716c",
};

export const ALL_DOMAINS: DomainLayer[] = Object.values(DomainLayer);
