'use client';

import { useEffect, useState } from 'react';
import type { BiopilaOverview, Measurement } from '@tphzero/domain';
import {
  classifyBiopilaState,
  mean,
  reductionPercent,
} from '@tphzero/domain';
import { BiopilaCard } from '@/components/dashboard/biopila-card';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { OverviewCharts } from '@/components/dashboard/overview-charts';
import { TPHTimeline } from '@/components/charts/tph-timeline';
import { NavigationContextError } from '@/components/errors/navigation-context-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapRow } from '@/lib/data/map-row';

export function DashboardPageContent({ datasetId }: { datasetId: string }) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
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
        setMeasurements((detailPayload.measurements ?? []).map(mapRow));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [datasetId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (notFound) {
    return <NavigationContextError variant="dataset-not-found" />;
  }

  if (measurements.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Sin mediciones disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Carga un dataset para visualizar el dashboard de biopilas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const biopilaIds = [
    ...new Set(
      measurements
        .map((measurement) => measurement.biopilaId)
        .filter((biopilaId): biopilaId is string => Boolean(biopilaId))
    ),
  ];

  const biopilas: BiopilaOverview[] = biopilaIds.map((id) => {
    const biopilaMeasurements = measurements
      .filter((measurement) => measurement.biopilaId === id)
      .sort((a, b) => a.tiempoDias - b.tiempoDias);

    const latestMeasurement = biopilaMeasurements[biopilaMeasurements.length - 1]!;

    return {
      biopilaId: id,
      latestMeasurement,
      measurements: biopilaMeasurements,
      state: classifyBiopilaState(latestMeasurement),
      tphReductionPct: reductionPercent(
        latestMeasurement.tphInicialMgkg,
        latestMeasurement.tphActualMgkg
      ),
      tiempoDias: latestMeasurement.tiempoDias,
    };
  });

  const avgReduction = mean(
    measurements.map((measurement) => measurement.porcentajeReduccionTph)
  );
  const optimalCount = biopilas.filter((biopila) => biopila.state === 'optimo').length;
  const criticalCount = biopilas.filter((biopila) => biopila.state === 'critico').length;
  const totalBiopilas = biopilas.length > 0 ? biopilas.length : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Vista general del dataset actual y del estado operativo.
        </p>
      </div>

      <KPICards
        totalBiopilas={totalBiopilas}
        avgReduction={avgReduction}
        optimalCount={optimalCount}
        criticalCount={criticalCount}
      />

      {biopilas.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {biopilas.map((biopila) => {
              const tipoUniformeEnBiopila = biopila.measurements.every(
                (m) => m.tipoHidrocarburo === biopila.latestMeasurement.tipoHidrocarburo
              );
              return (
                <BiopilaCard
                  key={biopila.biopilaId}
                  datasetId={datasetId}
                  biopila={biopila}
                  tipoUniformeEnBiopila={tipoUniformeEnBiopila}
                />
              );
            })}
          </div>
          <OverviewCharts biopilas={biopilas} />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Evolucion de TPH</CardTitle>
            </CardHeader>
            <CardContent>
              <TPHTimeline data={measurements} />
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Dataset sin identificador de biopila</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                El dataset cargado no incluye `biopila_id`, por lo que el detalle
                por biopila se habilitara cuando se carguen mediciones de nivel 2.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
