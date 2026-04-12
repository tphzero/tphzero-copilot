import Link from 'next/link';
import type { BiopilaOverview } from '@tphzero/domain';
import {
  primaryEnvironmentalDeviation,
  tphRemediationDynamics,
} from '@tphzero/domain';
import { TphSparkline } from '@/components/charts/tph-sparkline';
import { StatusIndicator } from '@/components/charts/status-indicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { datasetBiopilaPath } from '@/lib/navigation/routes';

function estadoEtiqueta(s: 'optimo' | 'suboptimo' | 'critico'): string {
  if (s === 'critico') return 'crítico';
  if (s === 'suboptimo') return 'subóptimo';
  return 'óptimo';
}

function formatMgKgPerWeek(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export function BiopilaCard({
  datasetId,
  biopila,
  tipoUniformeEnBiopila,
}: {
  datasetId: string;
  biopila: BiopilaOverview;
  /** Si todas las mediciones de la biopila comparten el mismo tipo, se relega a subtítulo. */
  tipoUniformeEnBiopila: boolean;
}) {
  const measurement = biopila.latestMeasurement;
  const deviation = primaryEnvironmentalDeviation(measurement);
  const dynamics = tphRemediationDynamics(biopila.measurements);

  return (
    <Link
      href={datasetBiopilaPath(datasetId, biopila.biopilaId)}
      aria-label={`Ver detalle de biopila ${biopila.biopilaId}`}
      className="group block h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        className="
          h-full
          border border-border
          ring-border/90
          bg-card
          transition-[ring-color,background-color,transform,box-shadow]
          duration-150
          hover:bg-card/95
          group-hover:-translate-y-0.5
          group-hover:ring-emerald-500/60
          group-hover:shadow-[0_10px_24px_-18px_rgba(52,211,153,0.55)]
          group-focus-visible:-translate-y-0.5
          group-focus-visible:ring-emerald-500/70
          group-focus-visible:shadow-[0_10px_24px_-18px_rgba(52,211,153,0.55)]
        "
      >
        <CardHeader className="space-y-1 pb-2">
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="font-mono text-base leading-tight">
                {biopila.biopilaId}
              </CardTitle>
              {tipoUniformeEnBiopila && (
                <p className="mt-0.5 truncate text-[10px] capitalize text-muted-foreground">
                  {measurement.tipoHidrocarburo}
                </p>
              )}
            </div>
            <StatusIndicator state={biopila.state} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[11px] text-zinc-500">
            TPH{' '}
            <span className="font-mono text-zinc-300">
              {Math.round(measurement.tphInicialMgkg).toLocaleString()}
            </span>
            {' → '}
            <span className="font-mono text-zinc-200">
              {Math.round(measurement.tphActualMgkg).toLocaleString()} mg/kg
            </span>
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">TPH actual</p>
              <p className="font-mono font-medium">
                {Math.round(measurement.tphActualMgkg).toLocaleString()} mg/kg
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Reducción</p>
              <p className="font-mono font-medium text-emerald-400">
                {(biopila.tphReductionPct * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tiempo de operación</p>
              <p className="font-mono font-medium">{biopila.tiempoDias} d</p>
            </div>
            <div className="flex min-h-[56px] flex-col justify-end gap-1">
              {biopila.state !== 'optimo' && deviation ? (
                <>
                  <div>
                    <p className="text-muted-foreground">Variable crítica</p>
                    <p className="font-mono text-[11px] font-medium leading-tight text-foreground">
                      {deviation.shortLabel}{' '}
                      {deviation.unit
                        ? `${deviation.value.toFixed(deviation.variableKey === 'ph' ? 2 : 1)}${deviation.unit}`
                        : deviation.value.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{estadoEtiqueta(deviation.status)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tendencia TPH</p>
                    <div className="flex justify-end">
                      <TphSparkline measurements={biopila.measurements} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">Tendencia TPH</p>
                  <div className="flex justify-end">
                    <TphSparkline measurements={biopila.measurements} />
                  </div>
                </>
              )}
            </div>
          </div>

          {dynamics.mgKgPerWeekRecent !== null && (
            <p className="text-[11px] text-zinc-500">
              Ritmo reciente:{' '}
              <span className="font-mono text-zinc-300">
                ≈ {formatMgKgPerWeek(dynamics.mgKgPerWeekRecent)} mg/kg·sem
              </span>
              {dynamics.recentVsPreviousRatio !== null && (
                <span>
                  {' · '}
                  {(() => {
                    const r = dynamics.recentVsPreviousRatio;
                    const pct = Math.round((r - 1) * 100);
                    if (pct === 0) return 'similar al período anterior';
                    if (pct > 0) return `${pct}% más rápido que el período anterior`;
                    return `${Math.abs(pct)}% más lento que el período anterior`;
                  })()}
                </span>
              )}
            </p>
          )}

          {!tipoUniformeEnBiopila && (
            <p className="text-[11px] text-zinc-500">
              Tipo:{' '}
              <span className="font-mono capitalize text-zinc-300">
                {measurement.tipoHidrocarburo}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
