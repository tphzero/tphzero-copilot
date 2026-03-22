'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}

interface DatasetSummary {
  id: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const datasetsResponse = await fetch('/api/data');
        const datasetsPayload = (await datasetsResponse.json()) as {
          datasets?: DatasetSummary[];
        };

        const latestDataset = datasetsPayload.datasets?.[0];
        if (!latestDataset) {
          router.replace('/');
          return;
        }

        const detailResponse = await fetch(`/api/data/${latestDataset.id}`);
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
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">Cargando datos...</p>
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Sin mediciones disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Vista general del ultimo dataset cargado y del estado operativo actual.
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
            {biopilas.map((biopila) => (
              <BiopilaCard key={biopila.biopilaId} biopila={biopila} />
            ))}
          </div>
          <OverviewCharts biopilas={biopilas} />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle>Evolucion de TPH</CardTitle>
            </CardHeader>
            <CardContent>
              <TPHTimeline data={measurements} />
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle>Dataset sin identificador de biopila</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
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
