import type { ScenarioLocale } from "../types/scenario-locale";

const LOCALE_REGISTRY: Record<string, ScenarioLocale> = {};

export function getScenarioLocale(scenarioId: string): ScenarioLocale | null {
  return LOCALE_REGISTRY[scenarioId] ?? null;
}

export async function loadScenarioLocale(scenarioId: string): Promise<ScenarioLocale | null> {
  const cached = getScenarioLocale(scenarioId);
  if (cached) return cached;

  switch (scenarioId) {
    case "baltic-flashpoint-v1": {
      const { balticFlashpointLocale } = await import("./baltic-flashpoint");
      registerLocale(scenarioId, balticFlashpointLocale);
      return balticFlashpointLocale;
    }
    case "hormuz-flashpoint-v1": {
      const { hormuzFlashpointLocale } = await import("./hormuz-flashpoint");
      registerLocale(scenarioId, hormuzFlashpointLocale);
      return hormuzFlashpointLocale;
    }
    default:
      return null;
  }
}

export function registerLocale(scenarioId: string, locale: ScenarioLocale): void {
  LOCALE_REGISTRY[scenarioId] = locale;
}

export { LOCALE_REGISTRY };
