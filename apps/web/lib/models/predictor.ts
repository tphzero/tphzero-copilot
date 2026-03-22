import type { Measurement, PredictionResult } from '@tphzero/domain';
import { TPH_REDUCTION_TARGET } from '@tphzero/domain';

/**
 * Fits an exponential decay model to TPH data:
 *   TPH(t) = TPH_initial * exp(-k * t)
 *
 * Uses linear regression on log-transformed data:
 *   ln(TPH/TPH_initial) = -k * t
 */
export function predictTPH(
  measurements: Measurement[],
  horizonDays: number = 360
): PredictionResult {
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  if (sorted.length < 2) {
    return {
      daysProjected: [],
      tphProjected: [],
      estimatedDaysTo90Pct: null,
      currentReductionRate: 0,
      confidence: 'baja',
    };
  }

  const tphInitial = sorted[0].tphInicialMgkg;

  const validPoints = sorted.filter(
    (m) => m.tphActualMgkg > 0 && m.tphActualMgkg <= tphInitial * 1.05
  );

  if (validPoints.length < 2) {
    return {
      daysProjected: [],
      tphProjected: [],
      estimatedDaysTo90Pct: null,
      currentReductionRate: 0,
      confidence: 'baja',
    };
  }

  const xs = validPoints.map((m) => m.tiempoDias);
  const ys = validPoints.map((m) => Math.log(m.tphActualMgkg / tphInitial));

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  const k = denom !== 0 ? -(n * sumXY - sumX * sumY) / denom : 0;

  const maxDay = Math.max(...xs) + horizonDays;
  const step = Math.max(1, Math.round(maxDay / 100));
  const daysProjected: number[] = [];
  const tphProjected: number[] = [];

  for (let d = 0; d <= maxDay; d += step) {
    daysProjected.push(d);
    tphProjected.push(Math.max(0, tphInitial * Math.exp(-k * d)));
  }

  const estimatedDaysTo90Pct =
    k > 0 ? Math.round(-Math.log(1 - TPH_REDUCTION_TARGET) / k) : null;

  const last = validPoints[validPoints.length - 1];
  const first = validPoints[0];
  const currentReductionRate =
    last.tiempoDias > first.tiempoDias
      ? ((first.tphActualMgkg - last.tphActualMgkg) /
          first.tphActualMgkg /
          (last.tiempoDias - first.tiempoDias)) *
        100
      : 0;

  const yPred = xs.map((x) => -k * x);
  const ssRes = ys.reduce((sum, y, i) => sum + (y - yPred[i]) ** 2, 0);
  const yMean = sumY / n;
  const ssTot = ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const confidence =
    r2 > 0.8 && n >= 5 ? 'alta' : r2 > 0.5 && n >= 3 ? 'media' : 'baja';

  return {
    daysProjected,
    tphProjected,
    estimatedDaysTo90Pct,
    currentReductionRate,
    confidence,
  };
}
