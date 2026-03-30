export interface DomainLocale {
  label: string;
  description: string;
}

export interface ActionLocale {
  label: string;
  flavour: string;
}

export interface StochasticEventLocale {
  label: string;
  flavour: string;
}

export interface ScenarioLocale {
  scenario_id: string;
  display_name: string;
  theatre: string;
  setting_description: string;
  blue_faction_name: string;
  red_faction_name: string;
  actor_names: Record<string, string>;
  actor_flags: Record<string, string>;
  domains: Partial<Record<string, DomainLocale>>;
  // action_locales: role_id → action_type → ActionLocale
  action_locales: Record<string, Record<string, ActionLocale>>;
  stochastic_events: Record<string, StochasticEventLocale>;
  phase_flavour: Record<string, string>;
}
