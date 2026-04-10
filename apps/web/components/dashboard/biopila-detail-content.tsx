'use client';

import { useEffect, useState } from 'react';
import type { Measurement } from '@tphzero/domain';
import { classifyBiopilaState, reductionPercent } from '@tphzero/domain';
import { StatusIndicator } from '@/components/charts/status-indicator';
import { TPHTimeline } from '@/components/charts/tph-timeline';
import { VariablesChart } from '@/components/charts/variables-chart';
import { NavigationContextError } from '@/components/errors/navigation-context-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapRow } from '@/lib/data/map-row';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function BiopilaDetailContent({
  datasetId,
  biopilaId,
}: {
  datasetId: string;
  biopilaId: string;
}) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBiopila() {
      try {
        const detailResponse = await fetch(`/api/data/${datasetId}`);
        if (detailResponse.status === 404) {
          if (active) setNotFound(true);
          return;
        }

        const detailPayload = (await detailResponse.json()) as {
          measurements?: Record<string, unknown>[];
        };

        if (!active) return;

        const allMeasurements = (detailPayload.measurements ?? []).map(mapRow);
        setMeasurements(
          allMeasurements.filter((measurement) => measurement.biopilaId === biopilaId)
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBiopila();

    return () => {
      active = false;
    };
  }, [datasetId, biopilaId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (notFound) {
    return <NavigationContextError variant="dataset-not-found" />;
  }

  if (measurements.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="font-mono text-lg">Sin mediciones para esta biopila</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">
              No hay mediciones para la biopila{' '}
              <span className="font-mono text-zinc-200">{biopilaId}</span> en este dataset.
              Comprueba el identificador o vuelve al dashboard para ver las biopilas disponibles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedMeasurements = [...measurements].sort(
    (a, b) => a.tiempoDias - b.tiempoDias
  );
  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1]!;
  const state = classifyBiopilaState(latestMeasurement);
  const reduction = reductionPercent(
    latestMeasurement.tphInicialMgkg,
    latestMeasurement.tphActualMgkg
  );

  const kpis = [
    {
      label: 'TPH actual',
      value: `${Math.round(latestMeasurement.tphActualMgkg).toLocaleString()} mg/kg`,
    },
    {
      label: 'Reducción',
      value: `${(reduction * 100).toFixed(1)}%`,
    },
    {
      label: 'Tiempo de operación (días)',
      value: String(latestMeasurement.tiempoDias),
    },
    {
      label: 'Enmienda',
      value: latestMeasurement.enmienda,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">{biopilaId}</h1>
          <p className="text-sm text-zinc-400">
            {latestMeasurement.tipoHidrocarburo} - {sortedMeasurements.length} mediciones
          </p>
        </div>
        <StatusIndicator state={state} size="lg" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value }) => (
          <Card key={label} className="border-zinc-800 bg-zinc-900">
            <CardContent className="pt-4">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="font-mono text-lg font-bold capitalize">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Evolución de TPH</CardTitle>
          </CardHeader>
          <CardContent>
            <TPHTimeline data={sortedMeasurements} />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Variables ambientales</CardTitle>
          </CardHeader>
          <CardContent>
            <VariablesChart measurements={sortedMeasurements} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Mediciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="font-mono text-xs">Día</TableHead>
                <TableHead className="font-mono text-xs">TPH (mg/kg)</TableHead>
                <TableHead className="font-mono text-xs">Reducción</TableHead>
                <TableHead className="font-mono text-xs">Temp (C)</TableHead>
                <TableHead className="font-mono text-xs">Humedad (%)</TableHead>
                <TableHead className="font-mono text-xs">O2 (%)</TableHead>
                <TableHead className="font-mono text-xs">pH</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMeasurements.map((measurement) => (
                <TableRow key={measurement.id} className="border-zinc-800">
                  <TableCell className="font-mono text-xs">
                    {measurement.tiempoDias}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {Math.round(measurement.tphActualMgkg).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-emerald-400">
                    {(measurement.porcentajeReduccionTph * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {measurement.temperaturaSueloC.toFixed(1)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {measurement.humedadSueloPct.toFixed(1)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {measurement.oxigenoPct.toFixed(1)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {measurement.ph.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
