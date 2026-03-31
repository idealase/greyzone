import { useEffect, useState } from "react";
import { getScenarioLocale, loadScenarioLocale } from "../locales";
import type { ScenarioLocale, DomainLocale, ActionLocale } from "../types/scenario-locale";
import { useRunStore } from "../stores/runStore";

export function useScenarioLocale(): ScenarioLocale | null {
  const run = useRunStore((state) => state.run);
  const scenarioId = run?.scenario_id;
  const [locale, setLocale] = useState<ScenarioLocale | null>(() =>
    scenarioId ? getScenarioLocale(scenarioId) : null
  );

  useEffect(() => {
    if (!scenarioId) {
      setLocale(null);
      return;
    }

    const cachedLocale = getScenarioLocale(scenarioId);
    setLocale(cachedLocale);
    if (cachedLocale) return;

    let cancelled = false;
    loadScenarioLocale(scenarioId)
      .then((loadedLocale) => {
        if (!cancelled) setLocale(loadedLocale);
      })
      .catch((error) => {
        console.error(
          `Failed to load locale for scenario '${scenarioId}'. The scenario may not be supported or there was a network/import error.`,
          { scenarioId, error }
        );
        if (!cancelled) {
          setLocale(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  return locale;
}

export function useLocaleDomain(domainKey: string): DomainLocale | null {
  const locale = useScenarioLocale();
  return locale?.domains[domainKey] ?? null;
}

export function useLocaleAction(roleId: string, actionType: string): ActionLocale | null {
  const locale = useScenarioLocale();
  return locale?.action_locales[roleId]?.[actionType] ?? null;
}

export function useLocaleActor(actorId: string): { name: string; flags: string } | null {
  const locale = useScenarioLocale();
  if (!locale) return null;
  const name = locale.actor_names[actorId];
  const flags = locale.actor_flags[actorId];
  if (!name) return null;
  return { name, flags: flags ?? "" };
}
