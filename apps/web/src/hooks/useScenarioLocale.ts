import { getScenarioLocale } from "../locales";
import type { ScenarioLocale, DomainLocale, ActionLocale } from "../types/scenario-locale";
import { useRunStore } from "../stores/runStore";

export function useScenarioLocale(): ScenarioLocale | null {
  const run = useRunStore((state) => state.run);
  if (!run?.scenario_id) return null;
  return getScenarioLocale(run.scenario_id);
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
