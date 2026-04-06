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
    <Link href={datasetBiopilaPath(datasetId, biopila.biopilaId)}>
      <Card className="h-full border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-mono text-base">{biopila.biopilaId}</CardTitle>
          <StatusIndicator state={biopila.state} size="sm" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-zinc-500">TPH actual</p>
              <p className="font-mono font-medium">
                {Math.round(measurement.tphActualMgkg).toLocaleString()} mg/kg
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Reduccion</p>
              <p className="font-mono font-medium text-emerald-400">
                {(biopila.tphReductionPct * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Dia</p>
              <p className="font-mono">{biopila.tiempoDias}</p>
            </div>
            <div>
              <p className="text-zinc-500">Tipo</p>
              <p className="font-mono capitalize">{measurement.tipoHidrocarburo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
