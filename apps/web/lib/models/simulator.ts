import type { Measurement, SimulationResult } from '@tphzero/domain';
import { TPH_REDUCTION_TARGET } from '@tphzero/domain';
import { predictTPH } from './predictor';
import { firstDayWhereTphAtOrBelow } from './simulator-explain-metrics';
import { computeOperationalRateMultiplier } from './simulator-kinetics';
import type { OperationalSliderValues } from './simulator-kinetics';
import { resolveSimulationModelFromOptions } from './simulator-models';

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
  /**
   * Id de modelo registrado. Si solo se pasa `horizonDays`, se elige el modelo con ese
   * horizonte o `custom-horizon` si no hay coincidencia (evita `standard-360` con otro horizonte).
   */
  modelId?: string;
}

/**
 * What-if: k se estima del historial (predictTPH / regresion exponencial). La curva simulada
 * usa k_ef = k * M, donde M es un producto de factores (Q10, Monod, humedad, volteo) comparando
 * sliders con la ultima medicion. Ver `simulator-kinetics.ts` y textos del panel de modelo.
 */
export function simulateScenario(
  measurements: Measurement[],
  params: SimulationParams,
  options?: SimulateScenarioOptions
): SimulationResult {
  const { modelId, horizonDays } = resolveSimulationModelFromOptions(options);

  if (measurements.length === 0) {
    return {
      baseline: { tphProjected: [], days: [] },
      simulated: { tphProjected: [], days: [] },
      deltaReductionPct: 0,
      estimatedTimeSavedDays: null,
      modelId,
      horizonDays,
      kinetics: {
        kPerDay: 0,
        tphInitialMgkg: 0,
        effectiveRateMultiplier: 1,
        referenceTiempoDias: 0,
        factors: [],
      },
    };
  }

  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const reference = sorted[sorted.length - 1]!;

  const baseline = predictTPH(measurements, horizonDays);

  const sliderParams: OperationalSliderValues = params;

  const { multiplier: M, factors } = computeOperationalRateMultiplier(
    reference,
    sliderParams
  );

  const k = baseline.kFit?.kPerDay ?? 0;
  const tphInitial = baseline.kFit?.tphInicialMgkg ?? reference.tphInicialMgkg;

  if (!baseline.daysProjected.length || !baseline.kFit) {
    return {
      baseline: { tphProjected: [], days: [] },
      simulated: { tphProjected: [], days: [] },
      deltaReductionPct: 0,
      estimatedTimeSavedDays: null,
      modelId,
      horizonDays,
      kinetics: {
        kPerDay: 0,
        tphInitialMgkg: reference.tphInicialMgkg,
        effectiveRateMultiplier: M,
        referenceTiempoDias: reference.tiempoDias,
        factors,
      },
    };
  }

  const daysAligned = baseline.daysProjected;
  const baseTph = baseline.tphProjected;
  const simTph = daysAligned.map((d) =>
    Math.max(0, tphInitial * Math.exp(-k * M * d))
  );

  const len = Math.min(baseTph.length, simTph.length, daysAligned.length);

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
      tphProjected: simTph,
      days: daysAligned,
    },
    deltaReductionPct: Math.round(maxDeltaReductionPp * 10000) / 100,
    estimatedTimeSavedDays,
    modelId,
    horizonDays,
    kinetics: {
      kPerDay: k,
      tphInitialMgkg: tphInitial,
      effectiveRateMultiplier: M,
      referenceTiempoDias: reference.tiempoDias,
      factors,
    },
  };
}
