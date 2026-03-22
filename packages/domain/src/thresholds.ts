export interface VariableRange {
  label: string;
  unit: string;
  optimal: [number, number];
  acceptable: [number, number];
  critical: [number, number];
}

export const THRESHOLDS: Record<string, VariableRange> = {
  temperatura_suelo_c: {
    label: 'Temperatura del suelo',
    unit: '°C',
    optimal: [15, 35],
    acceptable: [10, 40],
    critical: [5, 45],
  },
  humedad_suelo_pct: {
    label: 'Humedad del suelo',
    unit: '%',
    optimal: [20, 35],
    acceptable: [10, 40],
    critical: [5, 45],
  },
  oxigeno_pct: {
    label: 'Oxígeno',
    unit: '%',
    optimal: [10, 20],
    acceptable: [5, 25],
    critical: [2, 30],
  },
  ph: {
    label: 'pH',
    unit: '',
    optimal: [6.5, 7.5],
    acceptable: [6.0, 8.0],
    critical: [5.5, 9.0],
  },
};

export const TPH_REDUCTION_TARGET = 0.9;

export function classifyValue(
  variable: string,
  value: number
): 'optimo' | 'suboptimo' | 'critico' {
  const range = THRESHOLDS[variable];
  if (!range) return 'optimo';
  if (value >= range.optimal[0] && value <= range.optimal[1]) return 'optimo';
  if (value >= range.acceptable[0] && value <= range.acceptable[1]) return 'suboptimo';
  return 'critico';
}
