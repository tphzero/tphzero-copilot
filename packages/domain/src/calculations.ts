import type { Measurement, SystemState } from './types';
import { classifyValue } from './thresholds';

export function classifyBiopilaState(m: Measurement): SystemState {
  const statuses = [
    classifyValue('temperatura_suelo_c', m.temperaturaSueloC),
    classifyValue('humedad_suelo_pct', m.humedadSueloPct),
    classifyValue('oxigeno_pct', m.oxigenoPct),
    classifyValue('ph', m.ph),
  ];
  if (statuses.includes('critico')) return 'critico';
  if (statuses.includes('suboptimo')) return 'suboptimo';
  return 'optimo';
}

export function reductionPercent(tphInicial: number, tphActual: number): number {
  if (tphInicial <= 0) return 0;
  return Math.max(0, (tphInicial - tphActual) / tphInicial);
}

/** Última medición con tiempoDias <= targetDias, o null si todas son posteriores a targetDias. */
export function measurementAtOrBefore(
  measurements: Measurement[],
  targetDias: number
): Measurement | null {
  if (measurements.length === 0) return null;
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  let best: Measurement | null = null;
  for (const m of sorted) {
    if (m.tiempoDias <= targetDias) best = m;
    else break;
  }
  return best;
}

/**
 * Opciones de horizonte: cada 30 días hasta maxDias, más el día de la última medición si no coincide.
 */
export function buildReductionHorizonOptions(maxDias: number): number[] {
  if (maxDias <= 0) return [0];
  const out = new Set<number>();
  for (let d = 30; d <= maxDias; d += 30) {
    out.add(d);
  }
  out.add(maxDias);
  return [...out].sort((a, b) => a - b);
}

/** Reducción vs TPH inicial usando la medición vigente al instante targetDias; null si no hay medición en o antes de ese día. */
export function tphReductionAtTiempoDias(
  measurements: Measurement[],
  targetDias: number
): number | null {
  if (measurements.length === 0) return null;
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const at = measurementAtOrBefore(measurements, targetDias);
  if (!at) return null;
  const tphInicial = sorted[0]!.tphInicialMgkg;
  return reductionPercent(tphInicial, at.tphActualMgkg);
}

const EPS_DIAS = 1e-6;

/** Pendiente de TPH reciente vs ventana anterior (misma duración en días). */
export interface TphRemediationDynamics {
  /** Reducción de TPH por semana en la ventana reciente (últimos `recentDays` días hasta la última medición). */
  mgKgPerWeekRecent: number | null;
  /** Misma métrica en el período inmediatamente anterior (misma longitud en días). */
  mgKgPerWeekPrevious: number | null;
  /** `mgKgPerWeekRecent / mgKgPerWeekPrevious` cuando ambos son válidos y el denominador ≠ 0. */
  recentVsPreviousRatio: number | null;
}

const DEFAULT_REMEDIATION_WINDOW_DAYS = 60;

/**
 * Ritmo de remediación a partir de TPH actual vs tiempo: pendiente mg/kg por semana
 * en la ventana reciente y en la ventana previa (p. ej. 60 días cada una).
 */
export function tphRemediationDynamics(
  measurements: Measurement[],
  opts?: { recentDays?: number }
): TphRemediationDynamics {
  const W = opts?.recentDays ?? DEFAULT_REMEDIATION_WINDOW_DAYS;
  const empty: TphRemediationDynamics = {
    mgKgPerWeekRecent: null,
    mgKgPerWeekPrevious: null,
    recentVsPreviousRatio: null,
  };
  if (measurements.length < 2) return empty;

  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const last = sorted[sorted.length - 1]!;
  const tLast = last.tiempoDias;

  const atWindowStart = measurementAtOrBefore(sorted, tLast - W);
  if (!atWindowStart || atWindowStart.tiempoDias >= last.tiempoDias) return empty;

  const deltaDaysRecent = last.tiempoDias - atWindowStart.tiempoDias;
  if (deltaDaysRecent <= EPS_DIAS) return empty;

  const weeksRecent = deltaDaysRecent / 7;
  const mgKgPerWeekRecent =
    (atWindowStart.tphActualMgkg - last.tphActualMgkg) / weeksRecent;

  const atPrevWindowStart = measurementAtOrBefore(sorted, tLast - 2 * W);
  if (!atPrevWindowStart) {
    return { mgKgPerWeekRecent, mgKgPerWeekPrevious: null, recentVsPreviousRatio: null };
  }

  const deltaDaysPrev = atWindowStart.tiempoDias - atPrevWindowStart.tiempoDias;
  if (deltaDaysPrev <= EPS_DIAS) {
    return { mgKgPerWeekRecent, mgKgPerWeekPrevious: null, recentVsPreviousRatio: null };
  }

  const weeksPrev = deltaDaysPrev / 7;
  const mgKgPerWeekPrevious =
    (atPrevWindowStart.tphActualMgkg - atWindowStart.tphActualMgkg) / weeksPrev;

  let recentVsPreviousRatio: number | null = null;
  if (
    mgKgPerWeekPrevious !== 0 &&
    Number.isFinite(mgKgPerWeekPrevious) &&
    Number.isFinite(mgKgPerWeekRecent)
  ) {
    recentVsPreviousRatio = mgKgPerWeekRecent / mgKgPerWeekPrevious;
  }

  return { mgKgPerWeekRecent, mgKgPerWeekPrevious, recentVsPreviousRatio };
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function zScore(value: number, values: number[]): number {
  const s = stdDev(values);
  if (s === 0) return 0;
  return (value - mean(values)) / s;
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}
