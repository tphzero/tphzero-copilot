'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BiopilaOverview } from '@tphzero/domain';
import {
  buildReductionHorizonOptions,
  classifyBiopilaState,
  measurementAtOrBefore,
  tphReductionAtTiempoDias,
} from '@tphzero/domain';
import { TPHTimeline } from '@/components/charts/tph-timeline';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OverviewChartsProps {
  biopilas: BiopilaOverview[];
}

const STATUS_COLORS = {
  optimo: '#10b981',
  suboptimo: '#f59e0b',
  critico: '#ef4444',
  sin_datos: '#52525b',
} as const;

const REDUCTION_CHART_LEGEND: {
  state: keyof typeof STATUS_COLORS;
  label: string;
}[] = [
  { state: 'optimo', label: 'Óptimo' },
  { state: 'suboptimo', label: 'Subóptimo' },
  { state: 'critico', label: 'Crítico' },
  { state: 'sin_datos', label: 'Sin medición en el día' },
];

/** Ticks/strokes on chart area (~#09090b); lighter than #71717a for WCAG AA on dark bg */
const CHART_AXIS_STROKE = '#a1a1aa';
const CHART_AXIS_TEXT = '#d4d4d8';

function formatReductionTooltip(
  value: number | string | readonly (number | string)[] | undefined,
  sinDatos: boolean
) {
  if (sinDatos) {
    return ['Sin medición en este día', 'Reducción'] as const;
  }
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  return [`${numericValue.toFixed(1)}%`, 'Reducción'] as const;
}

export function OverviewCharts({ biopilas }: OverviewChartsProps) {
  const maxDiasDataset = useMemo(
    () =>
      Math.max(
        0,
        ...biopilas.flatMap((b) => b.measurements.map((m) => m.tiempoDias))
      ),
    [biopilas]
  );

  const reductionDayOptions = useMemo(
    () => buildReductionHorizonOptions(maxDiasDataset),
    [maxDiasDataset]
  );

  const [selectedDayStr, setSelectedDayStr] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (reductionDayOptions.length === 0) return;
    const last = String(reductionDayOptions[reductionDayOptions.length - 1]!);
    setSelectedDayStr((prev) => {
      if (
        prev !== undefined &&
        reductionDayOptions.includes(Number(prev))
      ) {
        return prev;
      }
      return last;
    });
  }, [reductionDayOptions]);

  const selectedDay = selectedDayStr !== undefined ? Number(selectedDayStr) : NaN;

  const timelineData = biopilas.flatMap((biopila) =>
    biopila.measurements.map((measurement) => ({
      tiempoDias: measurement.tiempoDias,
      tphActualMgkg: measurement.tphActualMgkg,
      biopilaId: measurement.biopilaId,
    }))
  );

  const reductionData = useMemo(() => {
    if (!Number.isFinite(selectedDay)) return [];
    return biopilas.map((biopila) => {
      const at = measurementAtOrBefore(biopila.measurements, selectedDay);
      const reduccionFrac = tphReductionAtTiempoDias(biopila.measurements, selectedDay);
      const sinDatos = reduccionFrac === null;
      const estado = sinDatos
        ? ('sin_datos' as const)
        : classifyBiopilaState(at!);
      return {
        id: biopila.biopilaId,
        reduccion: sinDatos
          ? 0
          : Number((reduccionFrac * 100).toFixed(1)),
        sinDatos,
        estado,
      };
    });
  }, [biopilas, selectedDay]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:items-start">
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>Evolución de TPH</CardTitle>
          <CardDescription className="text-zinc-300">
            Cada línea corresponde a una biopila y muestra el TPH actual en suelo (mg/kg)
            según los días de operación. Compará las curvas para ver el ritmo de remediación
            o si alguna se estabiliza sin bajar.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <TPHTimeline
            data={timelineData}
            biopilaIds={biopilas.map((biopila) => biopila.biopilaId)}
          />
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="gap-3">
          <div className="flex w-full min-w-0 flex-col gap-3 @sm/card-header:flex-row @sm/card-header:items-end @sm/card-header:justify-between @sm/card-header:gap-4">
            <CardTitle className="min-w-0 shrink text-balance @sm/card-header:flex-1 @sm/card-header:pr-2">
              Reducción por biopila
            </CardTitle>
            {reductionDayOptions.length > 0 && selectedDayStr !== undefined ? (
              <div className="flex w-full shrink-0 flex-col gap-1.5 @sm/card-header:w-[min(100%,12.5rem)] @sm/card-header:min-w-[11rem]">
                <span className="text-xs text-zinc-500" id="reduction-horizon-label">
                  Tiempo de referencia (días)
                </span>
                <Select
                  value={selectedDayStr}
                  onValueChange={(v) => setSelectedDayStr(v ?? selectedDayStr)}
                >
                  <SelectTrigger
                    className="w-full border-zinc-700 bg-zinc-800"
                    aria-labelledby="reduction-horizon-label"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reductionDayOptions.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        Día {d}
                        {d === maxDiasDataset ? ' (última medición)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <CardDescription className="text-zinc-300">
            Porcentaje de reducción de TPH respecto al valor inicial de cada biopila usando la
            medición vigente al día elegido (cada 30 días hasta el último día con datos). El color
            de la barra es el estado operativo en ese mismo día (pH, humedad, oxígeno y temperatura
            del suelo), no el valor del porcentaje.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-3">
          <div
            className="space-y-2 border-b border-zinc-800 pb-3"
            aria-label="Estado operativo al día de referencia: verde óptimo, ámbar subóptimo, rojo crítico"
          >
            <p className="text-xs leading-snug text-zinc-500">
              Estado al día de referencia
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-6">
              {REDUCTION_CHART_LEGEND.map(({ state, label }) => (
                <div key={state} className="flex items-center gap-2 text-xs text-zinc-300">
                  <span
                    className="size-2.5 shrink-0 rounded-sm ring-1 ring-white/10"
                    style={{ backgroundColor: STATUS_COLORS[state] }}
                    aria-hidden
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={reductionData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 40 }}
            >
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis
                type="number"
                stroke={CHART_AXIS_STROKE}
                fontSize={12}
                tick={{ fill: CHART_AXIS_TEXT }}
                label={{
                  value: 'Reducción de TPH (%)',
                  position: 'bottom',
                  offset: 12,
                  fill: CHART_AXIS_TEXT,
                }}
              />
              <YAxis
                dataKey="id"
                type="category"
                stroke={CHART_AXIS_STROKE}
                fontSize={12}
                width={72}
                tick={{ fill: CHART_AXIS_TEXT }}
                label={{
                  value: 'Biopila',
                  angle: -90,
                  position: 'insideLeft',
                  fill: CHART_AXIS_TEXT,
                  dx: -8,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#e4e4e7',
                }}
                itemStyle={{
                  display: 'block',
                  paddingTop: 4,
                  paddingBottom: 4,
                  color: '#e4e4e7',
                }}
                labelStyle={{ color: '#fafafa', fontWeight: 500 }}
                labelFormatter={(label) =>
                  `${String(label)} · referencia día ${Number.isFinite(selectedDay) ? selectedDay : '—'}`
                }
                formatter={(value, _name, item) =>
                  formatReductionTooltip(
                    value,
                    Boolean(
                      (item as { payload?: { sinDatos?: boolean } }).payload?.sinDatos
                    )
                  )
                }
              />
              <Bar dataKey="reduccion" radius={[0, 6, 6, 0]}>
                {reductionData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={STATUS_COLORS[entry.estado]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
