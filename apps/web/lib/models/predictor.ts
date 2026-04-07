import type { Measurement, PredictionResult } from '@tphzero/domain';
import { TPH_REDUCTION_TARGET } from '@tphzero/domain';

export interface ExponentialDecayFit {
  /** Constante de degradacion aparente k (1/dia), orden uno sobre TPH. */
  kPerDay: number;
  tphInicialMgkg: number;
  validPointCount: number;
  /** Puntos (t, ln(TPH/TPH0)) usados en el ajuste (para metricas de confianza). */
  xs: number[];
  ys: number[];
}

/**
 * Ajuste exponencial TPH(t) = TPH0 * exp(-k t) por regresion lineal en ln(TPH/TPH0) vs t.
 * Devuelve null si no hay puntos suficientes o el ajuste no es usable.
 */
export function fitExponentialDecayRate(
  measurements: Measurement[]
): ExponentialDecayFit | null {
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  if (sorted.length < 2) return null;

  const tphInitial = sorted[0].tphInicialMgkg;

  const validPoints = sorted.filter(
    (m) => m.tphActualMgkg > 0 && m.tphActualMgkg <= tphInitial * 1.05
  );

  if (validPoints.length < 2) return null;

  const xs = validPoints.map((m) => m.tiempoDias);
  const ys = validPoints.map((m) => Math.log(m.tphActualMgkg / tphInitial));

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  let k = denom !== 0 ? -(n * sumXY - sumX * sumY) / denom : 0;
  if (!Number.isFinite(k)) {
    return null;
  }
  /** Sin decaimiento (ajuste plano o pendiente >= 0): no forzar k artificial. */
  if (k <= 0) {
    k = 0;
  }

  return { kPerDay: k, tphInicialMgkg: tphInitial, validPointCount: n, xs, ys };
}

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
  const fit = fitExponentialDecayRate(measurements);
  if (!fit) {
    return {
      daysProjected: [],
      tphProjected: [],
      estimatedDaysTo90Pct: null,
      currentReductionRate: 0,
      confidence: 'baja',
      kFit: undefined,
    };
  }

  const { kPerDay: k, tphInicialMgkg: tphInitial, xs, ys } = fit;
  const n = xs.length;
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const validPoints = sorted.filter(
    (m) => m.tphActualMgkg > 0 && m.tphActualMgkg <= tphInitial * 1.05
  );

  const maxDay = Math.max(...xs) + horizonDays;
  const step = Math.max(1, Math.round(maxDay / 100));
  const daysProjected: number[] = [];
  const tphProjected: number[] = [];

  for (let d = 0; d <= maxDay; d += step) {
    daysProjected.push(d);
    tphProjected.push(Math.max(0, tphInitial * Math.exp(-k * d)));
  }

  const estimatedDaysTo90Pct =
    k > 1e-15
      ? Math.round(-Math.log(1 - TPH_REDUCTION_TARGET) / k)
      : null;

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
  const sumY = ys.reduce((a, b) => a + b, 0);
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
    kFit: { kPerDay: k, tphInicialMgkg: tphInitial },
  };
}
