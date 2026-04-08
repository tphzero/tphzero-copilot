import Link from 'next/link';
import type { BiopilaOverview } from '@tphzero/domain';
import { StatusIndicator } from '@/components/charts/status-indicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { datasetBiopilaPath } from '@/lib/navigation/routes';

export function BiopilaCard({
  datasetId,
  biopila,
}: {
  datasetId: string;
  biopila: BiopilaOverview;
}) {
  const measurement = biopila.latestMeasurement;

  return (
    <Link
      href={datasetBiopilaPath(datasetId, biopila.biopilaId)}
      aria-label={`Ver detalle de biopila ${biopila.biopilaId}`}
      className="group block h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="
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
          ">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-mono text-base">{biopila.biopilaId}</CardTitle>
          <StatusIndicator state={biopila.state} size="sm" /> 
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">TPH actual</p>
              <p className="font-mono font-medium">
                {Math.round(measurement.tphActualMgkg).toLocaleString()} mg/kg
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Reduccion</p>
              <p className="font-mono font-medium text-emerald-400">
                {(biopila.tphReductionPct * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Dia</p>
              <p className="font-mono">{biopila.tiempoDias}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-mono capitalize">{measurement.tipoHidrocarburo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
