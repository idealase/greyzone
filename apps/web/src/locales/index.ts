import type { ScenarioLocale } from "../types/scenario-locale";
import { balticFlashpointLocale } from "./baltic-flashpoint";
import { hormuzFlashpointLocale } from "./hormuz-flashpoint";

const LOCALE_REGISTRY: Record<string, ScenarioLocale> = {
  "baltic-flashpoint-v1": balticFlashpointLocale,
  "hormuz-flashpoint-v1": hormuzFlashpointLocale,
};

export function getScenarioLocale(scenarioId: string): ScenarioLocale | null {
  return LOCALE_REGISTRY[scenarioId] ?? null;
}

export function registerLocale(scenarioId: string, locale: ScenarioLocale): void {
  LOCALE_REGISTRY[scenarioId] = locale;
}

export { LOCALE_REGISTRY };
