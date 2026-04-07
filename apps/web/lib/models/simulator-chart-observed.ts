import type { Measurement } from '@tphzero/domain';

/** Tolerancia para igualdad de tiempos (días) y coincidencia día–medición. */
const TIME_EPS = 1e-6;

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= TIME_EPS;
}

export interface ObservedPoint {
  t: number;
  y: number;
}

/**
 * Mediciones con TPH > 0, ordenadas por tiempo; si hay duplicado de `t`, gana la última.
 */
export function collectObservedPoints(measurements: Measurement[]): ObservedPoint[] {
  const raw = measurements
    .filter((m) => m.tphActualMgkg > 0 && Number.isFinite(m.tiempoDias))
    .map((m) => ({ t: m.tiempoDias, y: m.tphActualMgkg }))
    .sort((a, b) => a.t - b.t);

  const out: ObservedPoint[] = [];
  for (const p of raw) {
    if (out.length > 0 && nearlyEqual(out[out.length - 1]!.t, p.t)) {
      out[out.length - 1] = p;
    } else {
      out.push(p);
    }
  }
  return out;
}

/**
 * Valor interpolado linealmente en `d` sobre la polilínea (t_i, y_i).
 * Sin extrapolación: `null` si `d` está fuera de [t_0, t_{n-1}].
 */
export function piecewiseLinearValueAt(d: number, pts: ObservedPoint[]): number | null {
  if (pts.length === 0) return null;
  if (pts.length === 1) {
    const p0 = pts[0]!;
    return nearlyEqual(d, p0.t) ? p0.y : null;
  }

  const t0 = pts[0]!.t;
  const tN = pts[pts.length - 1]!.t;
  if (d < t0 - TIME_EPS || d > tN + TIME_EPS) return null;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (d < a.t - TIME_EPS) return null;
    if (d > b.t + TIME_EPS) continue;

    if (nearlyEqual(d, a.t)) return a.y;
    if (nearlyEqual(d, b.t)) return b.y;
    if (d > a.t && d < b.t) {
      return a.y + ((b.y - a.y) * (d - a.t)) / (b.t - a.t);
    }
  }

  if (nearlyEqual(d, tN)) return pts[pts.length - 1]!.y;
  return null;
}

/**
 * Para cada día del eje (ya filtrado por preset), valor TPH observado interpolado
 * linealmente entre mediciones consecutivas, solo en [t_min, t_max] de las observaciones.
 * `markerAtIndex`: día alineado con una medición (para dibujar marcador).
 */
export function linearInterpolateObservedTph(
  days: number[],
  measurements: Measurement[]
): {
  interpolated: (number | null)[];
  markerAtIndex: boolean[];
  markerValue: (number | null)[];
} {
  const pts = collectObservedPoints(measurements);
  const n = days.length;
  const interpolated: (number | null)[] = new Array(n);
  const markerAtIndex: boolean[] = new Array(n).fill(false);
  const markerValue: (number | null)[] = new Array(n).fill(null);

  if (pts.length === 0) {
    for (let i = 0; i < n; i++) {
      interpolated[i] = null;
    }
    return { interpolated, markerAtIndex, markerValue };
  }

  for (let i = 0; i < n; i++) {
    const d = days[i]!;
    interpolated[i] = piecewiseLinearValueAt(d, pts);
  }

  for (const m of measurements) {
    if (!(m.tphActualMgkg > 0 && Number.isFinite(m.tiempoDias))) continue;
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(days[i]! - m.tiempoDias);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && bestDist < 0.51) {
      markerAtIndex[bestIdx] = true;
      markerValue[bestIdx] = m.tphActualMgkg;
    }
  }

  return { interpolated, markerAtIndex, markerValue };
}
