import type { ScenarioLocale } from "../types/scenario-locale";

const LOCALE_REGISTRY: Record<string, ScenarioLocale> = {};
const LOCALE_LOADERS: Record<string, () => Promise<ScenarioLocale>> = {
  "baltic-flashpoint-v1": async () => {
    const { balticFlashpointLocale } = await import("./baltic-flashpoint");
    return balticFlashpointLocale;
  },
  "hormuz-flashpoint-v1": async () => {
    const { hormuzFlashpointLocale } = await import("./hormuz-flashpoint");
    return hormuzFlashpointLocale;
  },
};

export function getScenarioLocale(scenarioId: string): ScenarioLocale | null {
  return LOCALE_REGISTRY[scenarioId] ?? null;
}

export async function loadScenarioLocale(scenarioId: string): Promise<ScenarioLocale | null> {
  const cached = getScenarioLocale(scenarioId);
  if (cached) return cached;

  const loadLocale = LOCALE_LOADERS[scenarioId];
  if (!loadLocale) return null;

  const locale = await loadLocale();
  registerLocale(scenarioId, locale);
  return locale;
}

export function registerLocale(scenarioId: string, locale: ScenarioLocale): void {
  LOCALE_REGISTRY[scenarioId] = locale;
}

export function clearLocaleCache(): void {
  Object.keys(LOCALE_REGISTRY).forEach((key) => {
    delete LOCALE_REGISTRY[key];
  });
}
