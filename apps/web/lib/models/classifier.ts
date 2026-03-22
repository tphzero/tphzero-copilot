import type { Measurement, SystemState } from '@tphzero/domain';
import { THRESHOLDS, classifyValue, classifyBiopilaState } from '@tphzero/domain';

export interface ClassificationResult {
  state: SystemState;
  variableStates: Array<{
    variable: string;
    label: string;
    value: number;
    unit: string;
    state: SystemState;
    optimalRange: [number, number];
  }>;
  criticalCount: number;
  suboptimalCount: number;
}

export function classifyMeasurement(m: Measurement): ClassificationResult {
  const variableStates = [
    { key: 'temperatura_suelo_c', value: m.temperaturaSueloC },
    { key: 'humedad_suelo_pct', value: m.humedadSueloPct },
    { key: 'oxigeno_pct', value: m.oxigenoPct },
    { key: 'ph', value: m.ph },
  ].map(({ key, value }) => {
    const t = THRESHOLDS[key];
    return {
      variable: key,
      label: t.label,
      value,
      unit: t.unit,
      state: classifyValue(key, value),
      optimalRange: t.optimal as [number, number],
    };
  });

  const state = classifyBiopilaState(m);
  const criticalCount = variableStates.filter((v) => v.state === 'critico').length;
  const suboptimalCount = variableStates.filter((v) => v.state === 'suboptimo').length;

  return { state, variableStates, criticalCount, suboptimalCount };
}
