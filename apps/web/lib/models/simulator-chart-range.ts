export type TimeRangePreset = 'full' | 'last180' | 'last90' | 'last30';

/**
 * Recorta las series al intervalo de dias visible (vista); no altera el calculo del motor.
 * `full` muestra toda la proyeccion cargada (desde el primer dia hasta el ultimo).
 */
export function filterSeriesByTimePreset(
  days: number[],
  baseline: number[],
  simulated: number[],
  preset: TimeRangePreset
): { days: number[]; baseline: number[]; simulated: number[] } {
  if (days.length === 0) {
    return { days: [], baseline: [], simulated: [] };
  }

  const maxD = Math.max(...days);
  let minKeep = Math.min(...days);

  if (preset === 'last30') {
    minKeep = maxD - 30;
  } else if (preset === 'last90') {
    minKeep = maxD - 90;
  } else if (preset === 'last180') {
    minKeep = maxD - 180;
  }
  // full: desde el minimo observado en la serie (toda la proyeccion cargada)

  const outDays: number[] = [];
  const outB: number[] = [];
  const outS: number[] = [];

  for (let i = 0; i < days.length; i++) {
    const d = days[i]!;
    if (d >= minKeep) {
      outDays.push(d);
      outB.push(baseline[i] ?? 0);
      outS.push(simulated[i] ?? 0);
    }
  }

  return { days: outDays, baseline: outB, simulated: outS };
}
