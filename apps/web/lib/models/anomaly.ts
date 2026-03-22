import type { Measurement, AnomalyResult } from '@tphzero/domain';
import { THRESHOLDS, classifyValue } from '@tphzero/domain';
import { zScore } from '@tphzero/domain';

const VARIABLE_KEYS: Array<{
  key: keyof Measurement;
  thresholdKey: string;
}> = [
  { key: 'temperaturaSueloC', thresholdKey: 'temperatura_suelo_c' },
  { key: 'humedadSueloPct', thresholdKey: 'humedad_suelo_pct' },
  { key: 'oxigenoPct', thresholdKey: 'oxigeno_pct' },
  { key: 'ph', thresholdKey: 'ph' },
];

export function detectAnomalies(
  measurement: Measurement,
  allMeasurements: Measurement[]
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  for (const { key, thresholdKey } of VARIABLE_KEYS) {
    const value = measurement[key] as number;
    const allValues = allMeasurements.map((m) => m[key] as number);
    const z = zScore(value, allValues);
    const state = classifyValue(thresholdKey, value);
    const threshold = THRESHOLDS[thresholdKey];

    if (state !== 'optimo' || Math.abs(z) > 2) {
      anomalies.push({
        variable: threshold.label,
        value,
        zScore: Math.round(z * 100) / 100,
        optimalRange: threshold.optimal,
        severity: state === 'critico' || Math.abs(z) > 3 ? 'critico' : 'advertencia',
      });
    }
  }

  return anomalies;
}
