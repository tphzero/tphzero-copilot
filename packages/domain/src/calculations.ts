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

/** Última medición con tiempoDias <= targetDias; si no hay, la primera del historial. */
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
  return best ?? sorted[0]!;
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

/** Reducción vs TPH inicial de la biopila usando la medición vigente al instante targetDias. */
export function tphReductionAtTiempoDias(
  measurements: Measurement[],
  targetDias: number
): number {
  if (measurements.length === 0) return 0;
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const at = measurementAtOrBefore(measurements, targetDias)!;
  const tphInicial = sorted[0]!.tphInicialMgkg;
  return reductionPercent(tphInicial, at.tphActualMgkg);
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
