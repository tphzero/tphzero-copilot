import type { Measurement, SimulationResult } from '@tphzero/domain';
import { classifyBiopilaState } from '@tphzero/domain';
import { predictTPH } from './predictor';

export interface SimulationParams {
  humedadSueloPct?: number;
  temperaturaSueloC?: number;
  oxigenoPct?: number;
  fertilizanteN?: number;
  fertilizanteP?: number;
  fertilizanteK?: number;
  frecuenciaVolteoDias?: number;
}

/**
 * Simple what-if simulator: adjusts measurement variables and re-runs prediction.
 *
 * This is a heuristic approach: we modify the historical data points with
 * the delta between current and simulated values, then re-fit the prediction model.
 * This gives a rough estimate of how changes would affect the TPH curve.
 */
export function simulateScenario(
  measurements: Measurement[],
  params: SimulationParams,
  horizonDays: number = 360
): SimulationResult {
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

  const simulated = predictTPH(measurements, horizonDays);

  const adjustedTph = simulated.tphProjected.map((tph) => {
    const tphInitial = measurements[0]?.tphInicialMgkg ?? tph;
    const reduction = (tphInitial - tph) / tphInitial;
    const boostedReduction = Math.min(1, reduction * adjustmentFactor);
    return Math.max(0, tphInitial * (1 - boostedReduction));
  });

  const lastBaseline =
    baseline.tphProjected[baseline.tphProjected.length - 1] ?? 0;
  const lastSimulated = adjustedTph[adjustedTph.length - 1] ?? 0;
  const tphInitial = measurements[0]?.tphInicialMgkg ?? 1;

  const baselineReduction = (tphInitial - lastBaseline) / tphInitial;
  const simulatedReduction = (tphInitial - lastSimulated) / tphInitial;

  return {
    baseline: {
      tphProjected: baseline.tphProjected,
      days: baseline.daysProjected,
    },
    simulated: {
      tphProjected: adjustedTph,
      days: simulated.daysProjected,
    },
    deltaReductionPct:
      Math.round((simulatedReduction - baselineReduction) * 10000) / 100,
    estimatedTimeSavedDays:
      baseline.estimatedDaysTo90Pct && simulated.estimatedDaysTo90Pct
        ? baseline.estimatedDaysTo90Pct -
          Math.round(simulated.estimatedDaysTo90Pct / adjustmentFactor)
        : null,
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
