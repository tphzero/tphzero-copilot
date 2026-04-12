import type { Measurement, SystemState } from './types';
import { classifyValue, THRESHOLDS } from './thresholds';

const VARIABLE_KEYS = [
  'temperatura_suelo_c',
  'humedad_suelo_pct',
  'oxigeno_pct',
  'ph',
] as const;

export type EnvironmentalVariableKey = (typeof VARIABLE_KEYS)[number];

export interface EnvironmentalDeviation {
  variableKey: EnvironmentalVariableKey;
  label: string;
  shortLabel: string;
  value: number;
  unit: string;
  status: SystemState;
}

const SHORT_LABELS: Record<EnvironmentalVariableKey, string> = {
  temperatura_suelo_c: 'T° suelo',
  humedad_suelo_pct: 'Humedad',
  oxigeno_pct: 'O₂',
  ph: 'pH',
};

function measurementValue(m: Measurement, key: EnvironmentalVariableKey): number {
  switch (key) {
    case 'temperatura_suelo_c':
      return m.temperaturaSueloC;
    case 'humedad_suelo_pct':
      return m.humedadSueloPct;
    case 'oxigeno_pct':
      return m.oxigenoPct;
    case 'ph':
      return m.ph;
  }
}

/** Distance from the optimal band; 0 inside optimal. */
function distanceFromOptimal(key: EnvironmentalVariableKey, value: number): number {
  const range = THRESHOLDS[key];
  const [lo, hi] = range.optimal;
  if (value >= lo && value <= hi) return 0;
  if (value < lo) return lo - value;
  return value - hi;
}

function severityRank(s: SystemState): number {
  if (s === 'critico') return 2;
  if (s === 'suboptimo') return 1;
  return 0;
}

/**
 * The environmental variable that best explains non-optimal state: highest severity
 * (critico > suboptimo), then largest distance from the optimal range.
 * Returns null when all four variables are optimal.
 */
export function primaryEnvironmentalDeviation(m: Measurement): EnvironmentalDeviation | null {
  let best: EnvironmentalDeviation | null = null;
  let bestRank = -1;
  let bestDistance = -1;

  for (const key of VARIABLE_KEYS) {
    const value = measurementValue(m, key);
    const status = classifyValue(key, value) as SystemState;
    if (status === 'optimo') continue;

    const dist = distanceFromOptimal(key, value);
    const rank = severityRank(status);
    if (
      rank > bestRank ||
      (rank === bestRank && dist > bestDistance)
    ) {
      bestRank = rank;
      bestDistance = dist;
      const meta = THRESHOLDS[key];
      best = {
        variableKey: key,
        label: meta.label,
        shortLabel: SHORT_LABELS[key],
        value,
        unit: meta.unit,
        status,
      };
    }
  }

  return best;
}
