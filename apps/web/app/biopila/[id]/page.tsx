'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import type { Measurement } from '@tphzero/domain';
import { classifyBiopilaState, reductionPercent } from '@tphzero/domain';
import { StatusIndicator } from '@/components/charts/status-indicator';
import { TPHTimeline } from '@/components/charts/tph-timeline';
import { VariablesChart } from '@/components/charts/variables-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

export default function BiopilaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadBiopila() {
      try {
        const datasetsResponse = await fetch('/api/data');
        const datasetsPayload = (await datasetsResponse.json()) as {
          datasets?: DatasetSummary[];
        };

        const latestDataset = datasetsPayload.datasets?.[0];
        if (!latestDataset) {
          return;
        }

        const detailResponse = await fetch(`/api/data/${latestDataset.id}`);
        const detailPayload = (await detailResponse.json()) as {
          measurements?: Record<string, unknown>[];
        };

        if (!active) return;

        const allMeasurements = (detailPayload.measurements ?? []).map(mapRow);
        setMeasurements(
          allMeasurements.filter((measurement) => measurement.biopilaId === id)
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">Cargando...</p>
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="p-6">
        <p className="text-zinc-500">No se encontraron datos para la biopila {id}</p>
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
      label: 'Reduccion',
      value: `${(reduction * 100).toFixed(1)}%`,
    },
    {
      label: 'Dia',
      value: latestMeasurement.tiempoDias,
    },
    {
      label: 'Enmienda',
      value: latestMeasurement.enmienda,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">{id}</h1>
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
            <CardTitle>Evolucion TPH</CardTitle>
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
                <TableHead className="font-mono text-xs">Dia</TableHead>
                <TableHead className="font-mono text-xs">TPH (mg/kg)</TableHead>
                <TableHead className="font-mono text-xs">Reduccion</TableHead>
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
