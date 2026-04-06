import type { Measurement, SimulationResult } from '@tphzero/domain';
import { classifyBiopilaState, TPH_REDUCTION_TARGET } from '@tphzero/domain';
import { predictTPH } from './predictor';
import { firstDayWhereTphAtOrBelow } from './simulator-explain-metrics';
import { resolveSimulatorHorizonDays } from './simulator-models';

export interface SimulationParams {
  humedadSueloPct?: number;
  temperaturaSueloC?: number;
  oxigenoPct?: number;
  fertilizanteN?: number;
  fertilizanteP?: number;
  fertilizanteK?: number;
  frecuenciaVolteoDias?: number;
}

export interface SimulateScenarioOptions {
  /** Horizonte en dias; si se omite, se deduce de `modelId`. */
  horizonDays?: number;
  /** Debe existir en el registro de modelos salvo que se pase `horizonDays` explicito. */
  modelId?: string;
}

/**
 * What-if: se sustituyen variables operativas en el historial y se vuelve a ajustar k
 * con predictTPH sobre esas mediciones modificadas. La linea base usa el historial original.
 * El factor de optimalidad escala la reduccion proyectada cuando el estado clasificado mejora
 * (mismo criterio que antes, pero aplicado sobre la proyeccion obtenida con datos modificados).
 */
export function simulateScenario(
  measurements: Measurement[],
  params: SimulationParams,
  options?: SimulateScenarioOptions
): SimulationResult {
  const modelId = options?.modelId ?? 'standard-360';
  const horizonDays =
    options?.horizonDays ?? resolveSimulatorHorizonDays(modelId);

  const baseline = predictTPH(measurements, horizonDays);

  const modified = measurements.map((m) => ({
    ...m,
    humedadSueloPct: params.humedadSueloPct ?? m.humedadSueloPct,
    temperaturaSueloC: params.temperaturaSueloC ?? m.temperaturaSueloC,
    oxigenoPct: params.oxigenoPct ?? m.oxigenoPct,
    fertilizanteN: params.fertilizanteN ?? m.fertilizanteN,
    fertilizanteP: params.fertilizanteP ?? m.fertilizanteP,
    fertilizanteK: params.fertilizanteK ?? m.fertilizanteK,
    frecuenciaVolteoDias: params.frecuenciaVolteoDias ?? m.frecuenciaVolteoDias,
  }));

  const adjustmentFactor = calculateOptimalityBoost(measurements, modified);

  const simulatedFromModified = predictTPH(modified, horizonDays);

  const adjustedTph = simulatedFromModified.tphProjected.map((tph) => {
    const tphInitial = measurements[0]?.tphInicialMgkg ?? tph;
    const reduction = (tphInitial - tph) / tphInitial;
    const boostedReduction = Math.min(1, reduction * adjustmentFactor);
    return Math.max(0, tphInitial * (1 - boostedReduction));
  });

  const tphInitial = measurements[0]?.tphInicialMgkg ?? 1;

  const baseTph = baseline.tphProjected;
  const simTph = adjustedTph;
  const daysAligned = simulatedFromModified.daysProjected;
  const len = Math.min(
    baseTph.length,
    simTph.length,
    daysAligned.length
  );

  /**
   * Ventaja maxima del simulado sobre la base: maximo en el tiempo de
   * (reduccion_sim - reduccion_base) en puntos porcentuales del TPH inicial.
   * Evita el artefacto de comparar solo el ultimo dia (donde ambas curvas suelen
   * converger cerca del 100% de reduccion y la diferencia es casi nula).
   */
  let maxDeltaReductionPp = 0;
  if (tphInitial > 0 && len > 0) {
    for (let i = 0; i < len; i++) {
      const b = baseTph[i] ?? 0;
      const s = simTph[i] ?? 0;
      const rb = (tphInitial - b) / tphInitial;
      const rs = (tphInitial - s) / tphInitial;
      maxDeltaReductionPp = Math.max(maxDeltaReductionPp, rs - rb);
    }
  }

  /**
   * Tiempo ahorrado: diferencia en dias hasta alcanzar el TPH objetivo de
   * "90% de reduccion" (TPH_REDUCTION_TARGET) sobre las curvas proyectadas.
   * El estimador exponencial estimatedDaysTo90Pct no sirve para what-if porque
   * k no cambia al mover sliders (solo cambia la curva ajustada por boost).
   */
  const targetTphMgkg =
    tphInitial > 0 ? tphInitial * (1 - TPH_REDUCTION_TARGET) : 0;
  const daysSlice = daysAligned.slice(0, len);
  const baseSlice = baseTph.slice(0, len);
  const simSlice = simTph.slice(0, len);

  const dayBaselineTarget =
    tphInitial > 0
      ? firstDayWhereTphAtOrBelow(daysSlice, baseSlice, targetTphMgkg)
      : null;
  const daySimulatedTarget =
    tphInitial > 0
      ? firstDayWhereTphAtOrBelow(daysSlice, simSlice, targetTphMgkg)
      : null;

  const estimatedTimeSavedDays =
    dayBaselineTarget != null && daySimulatedTarget != null
      ? Math.round(dayBaselineTarget - daySimulatedTarget)
      : null;

  return {
    baseline: {
      tphProjected: baseline.tphProjected,
      days: baseline.daysProjected,
    },
    simulated: {
      tphProjected: adjustedTph,
      days: simulatedFromModified.daysProjected,
    },
    deltaReductionPct:
      Math.round(maxDeltaReductionPp * 10000) / 100,
    estimatedTimeSavedDays,
    modelId,
    horizonDays,
  };
}

/**
 * Calculate how much closer to optimal the modified measurements are.
 * Returns a factor >= 1.0 (1.0 = no change, >1 = improvement).
 */
function calculateOptimalityBoost(
  original: Measurement[],
  modified: Measurement[]
): number {
  let originalScore = 0;
  let modifiedScore = 0;

  const stateScore = { optimo: 3, suboptimo: 2, critico: 1 };

  for (let i = 0; i < original.length; i++) {
    originalScore += stateScore[classifyBiopilaState(original[i])];
    modifiedScore += stateScore[classifyBiopilaState(modified[i])];
  }

  if (originalScore === 0) return 1;
  return Math.max(1, modifiedScore / originalScore);
}
