import type { Measurement } from '@tphzero/domain';

const W = 40;
const H = 16;
const PAD = 1;

/**
 * Mini tendencia TPH vs tiempo (SVG fijo, sin Recharts por tarjeta).
 */
export function TphSparkline({ measurements }: { measurements: Measurement[] }) {
  if (measurements.length < 2) return null;

  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const tphs = sorted.map((m) => m.tphActualMgkg);
  const min = Math.min(...tphs);
  const max = Math.max(...tphs);
  const range = max - min || 1;
  const t0 = sorted[0]!.tiempoDias;
  const t1 = sorted[sorted.length - 1]!.tiempoDias;
  const tSpan = t1 - t0 || 1;

  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;

  const points = sorted
    .map((m) => {
      const x = PAD + ((m.tiempoDias - t0) / tSpan) * innerW;
      const y = PAD + innerH - ((m.tphActualMgkg - min) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0 text-emerald-400/90"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
