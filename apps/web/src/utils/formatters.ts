import { Phase, PHASE_LABELS } from "../types/phase";
import { DomainLayer, DOMAIN_LABELS } from "../types/domain";

export function formatPhase(phase: Phase): string {
  return PHASE_LABELS[phase] ?? phase;
}

export function formatDomain(domain: DomainLayer): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatOrderParameter(psi: number): string {
  return `\u03A8 = ${psi.toFixed(3)}`;
}
