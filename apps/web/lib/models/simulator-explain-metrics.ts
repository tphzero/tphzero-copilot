import type { SimulationResult } from '@tphzero/domain';

/** Umbral para considerar TPH "casi nulo" en la serie proyectada (mg/kg). */
export const TPH_CASI_CERO_MGKG = 0.5;

/**
 * Primer día (eje X) en que la serie simulada queda por debajo o igual al umbral.
 * Si nunca ocurre, null.
 */
export function firstDayWhereTphAtOrBelow(
  days: number[],
  tphMgkg: number[],
  thresholdMgkg: number
): number | null {
  if (days.length !== tphMgkg.length || days.length === 0) {
    return null;
  }
  for (let i = 0; i < days.length; i++) {
    const v = tphMgkg[i] ?? 0;
    if (v <= thresholdMgkg) {
      return days[i] ?? null;
    }
  }
  return null;
}

export interface SimulatorSeriesFacts {
  /** null si no hay puntos en la proyeccion (evita inventar ceros). */
  tphInicialSerieMgkg: number | null;
  ultimoDiaEnSerie: number | null;
  tphFinalLineaBaseMgkg: number | null;
  tphFinalSimuladoMgkg: number | null;
  /** Primer día con TPH simulado ≤ umbral (p. ej. primera vez que toca ~0 en el gráfico). */
  primerDiaSimuladoTphCasiNulo: number | null;
  umbralTphCasiNuloMgkg: number;
  /**
   * Ventaja máxima del simulado sobre la base (pp del TPH inicial): máximo a lo largo
   * de la proyección de (reducción simulada − reducción base).
   */
  deltaReduccionAcumuladaPpDelInicial: number;
  definicionDeltaReduccion: string;
  diasTiempoAhorradoEstimado: number | null;
  horizonteExtraModeloDias: number;
}

const DEFINICION_DELTA =
  'Ventaja máxima del escenario simulado frente a la línea base, en puntos porcentuales (pp) del TPH inicial: en cada punto del tiempo se calcula la reducción acumulada (1 − TPH/TPH inicial) y se toma el máximo de (reducción simulada − reducción base) a lo largo de toda la curva. Así se reflejan diferencias fuertes en medio del horizonte aunque al último día ambas curvas estén casi degradadas.';

/**
 * Hechos derivados solo de las series y del resultado numérico (fuente única para la IA).
 */
export function buildSimulatorSeriesFacts(result: SimulationResult): SimulatorSeriesFacts {
  const daysB = result.baseline.days;
  const daysS = result.simulated.days;
  const baseTph = result.baseline.tphProjected;
  const simTph = result.simulated.tphProjected;

  const len = Math.min(
    daysB.length,
    daysS.length,
    baseTph.length,
    simTph.length
  );

  const daysSSlice = daysS.slice(0, len);
  const simTphSlice = simTph.slice(0, len);

  const idxLast = len > 0 ? len - 1 : 0;
  const ultimoDiaEnSerie =
    len > 0 ? (daysS[idxLast] ?? daysB[idxLast] ?? null) : null;
  const tphFinalLineaBaseMgkg =
    len > 0 ? (baseTph[idxLast] ?? null) : null;
  const tphFinalSimuladoMgkg =
    len > 0 ? (simTph[idxLast] ?? null) : null;
  const tphInicialSerieMgkg =
    len > 0 ? (baseTph[0] ?? simTph[0] ?? null) : null;

  const primerDiaSimuladoTphCasiNulo =
    len > 0
      ? firstDayWhereTphAtOrBelow(daysSSlice, simTphSlice, TPH_CASI_CERO_MGKG)
      : null;

  return {
    tphInicialSerieMgkg,
    ultimoDiaEnSerie,
    tphFinalLineaBaseMgkg,
    tphFinalSimuladoMgkg,
    primerDiaSimuladoTphCasiNulo,
    umbralTphCasiNuloMgkg: TPH_CASI_CERO_MGKG,
    deltaReduccionAcumuladaPpDelInicial: result.deltaReductionPct,
    definicionDeltaReduccion: DEFINICION_DELTA,
    diasTiempoAhorradoEstimado: result.estimatedTimeSavedDays,
    horizonteExtraModeloDias: result.horizonDays,
  };
}
