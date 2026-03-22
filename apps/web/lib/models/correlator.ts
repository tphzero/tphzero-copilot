import type { Measurement, CorrelationResult } from '@tphzero/domain';
import { pearsonCorrelation } from '@tphzero/domain';

const NUMERIC_VARIABLES: Array<{ key: keyof Measurement; label: string }> = [
  { key: 'temperaturaSueloC', label: 'Temperatura del suelo' },
  { key: 'humedadSueloPct', label: 'Humedad del suelo' },
  { key: 'oxigenoPct', label: 'Oxigeno' },
  { key: 'ph', label: 'pH' },
  { key: 'aguaAplicadaLM3', label: 'Agua aplicada' },
  { key: 'fertilizanteN', label: 'Fertilizante N' },
  { key: 'fertilizanteP', label: 'Fertilizante P' },
  { key: 'fertilizanteK', label: 'Fertilizante K' },
  { key: 'frecuenciaVolteoDias', label: 'Frecuencia de volteo' },
  { key: 'temperaturaAmbienteC', label: 'Temperatura ambiente' },
  { key: 'humedadAmbientePct', label: 'Humedad ambiente' },
  { key: 'precipitacionesMm', label: 'Precipitaciones' },
];

function strengthLabel(r: number): 'fuerte' | 'moderada' | 'débil' {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'fuerte';
  if (abs >= 0.4) return 'moderada';
  return 'débil';
}

export function correlateWithReduction(
  measurements: Measurement[]
): CorrelationResult[] {
  const reductions = measurements.map((m) => m.porcentajeReduccionTph);

  return NUMERIC_VARIABLES.map(({ key, label }) => {
    const values = measurements.map((m) => m[key] as number);
    const correlation = pearsonCorrelation(values, reductions);
    return {
      variable: label,
      correlation: Math.round(correlation * 1000) / 1000,
      strength: strengthLabel(correlation),
    };
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}
