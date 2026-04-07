'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Measurement, SimulationResult } from '@tphzero/domain';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  filterSeriesByTimePreset,
  type TimeRangePreset,
} from '@/lib/models/simulator-chart-range';
import { linearInterpolateObservedTph } from '@/lib/models/simulator-chart-observed';
import { LatexMarkdown } from '@/components/simulator/latex-markdown';

function formatTooltipValue(
  value: number | string | readonly (number | string)[] | undefined,
  label: string
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  const n = Math.round(numericValue).toLocaleString('es');
  return [`${n} (TPH, mg/kg)`, label] as const;
}

function formatYTick(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return `${Math.round(value)}`;
}

const PRESET_LABELS: { id: TimeRangePreset; label: string }[] = [
  { id: 'full', label: 'Todo el horizonte proyectado' },
  { id: 'last180', label: 'Ultimos 180 dias' },
  { id: 'last90', label: 'Ultimos 90 dias' },
  { id: 'last30', label: 'Ultimos 30 dias' },
];

/** Línea observada (sky): distinta de baseline zinc y simulado emerald. */
const OBSERVADO_STROKE = '#38bdf8';
const OBSERVADO_DOT_STROKE = '#0ea5e9';

export function ComparisonChart({
  result,
  measurements,
}: {
  result: SimulationResult;
  measurements: Measurement[];
}) {
  const [preset, setPreset] = useState<TimeRangePreset>('full');
  const [showBaseline, setShowBaseline] = useState(true);
  const [showSimulated, setShowSimulated] = useState(true);
  const [showObserved, setShowObserved] = useState(true);

  const filtered = useMemo(() => {
    return filterSeriesByTimePreset(
      result.baseline.days,
      result.baseline.tphProjected,
      result.simulated.tphProjected,
      preset
    );
  }, [result, preset]);

  const observedSeries = useMemo(() => {
    return linearInterpolateObservedTph(filtered.days, measurements);
  }, [filtered, measurements]);

  const data = useMemo(() => {
    return filtered.days.map((day, index) => {
      const o = observedSeries.interpolated[index];
      const mv = observedSeries.markerValue[index];
      return {
        dia: day,
        baseline: Math.round(filtered.baseline[index] ?? 0),
        simulado: Math.round(filtered.simulated[index] ?? 0),
        observado: o == null ? null : Math.round(o),
        observadoMarcador: mv == null ? null : Math.round(mv),
      };
    });
  }, [filtered, observedSeries]);

  const empty = data.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-500">Rango temporal (vista)</Label>
          <Select
            value={preset}
            onValueChange={(v) => setPreset((v as TimeRangePreset) ?? 'full')}
          >
            <SelectTrigger className="w-full border-zinc-700 bg-zinc-800 sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESET_LABELS.map(({ id, label }) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
              checked={showBaseline}
              onChange={(e) => setShowBaseline(e.target.checked)}
            />
            <span
              className="h-0 w-8 shrink-0 border-t-2 border-dashed border-zinc-400"
              aria-hidden
            />
            <span>Linea base</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
              checked={showSimulated}
              onChange={(e) => setShowSimulated(e.target.checked)}
            />
            <span className="h-0 w-8 shrink-0 border-t-2 border-emerald-400" aria-hidden />
            <span>Proyeccion simulada</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
              checked={showObserved}
              onChange={(e) => setShowObserved(e.target.checked)}
            />
            <span
              className="h-0 w-8 shrink-0 border-t border-sky-400 opacity-90"
              style={{ borderTopWidth: 1.5 }}
              aria-hidden
            />
            <span>Mediciones (interpolado)</span>
          </label>
        </div>
      </div>

      {empty ? (
        <div className="flex h-[280px] items-center justify-center rounded border border-dashed border-zinc-700 bg-zinc-950/50">
          <p className="text-sm text-zinc-500">No hay puntos en este rango.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
          >
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="dia"
              stroke="#71717a"
              fontSize={12}
              tickMargin={8}
              height={52}
              label={{
                value: 't (d)',
                position: 'insideBottom',
                fill: '#a1a1aa',
                offset: -4,
              }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              tickFormatter={formatYTick}
              label={{
                value: 'TPH',
                angle: -90,
                position: 'insideLeft',
                fill: '#71717a',
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
              }}
              labelFormatter={(value) => `t = ${value} d`}
              formatter={(value, name) => {
                if (value === null || value === undefined) return null;
                const n = Number(value);
                if (!Number.isFinite(n)) return null;
                return formatTooltipValue(value, String(name));
              }}
            />
            {showBaseline ? (
              <Line
                type="monotone"
                dataKey="baseline"
                name="Linea base"
                stroke="#a1a1aa"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
            {showSimulated ? (
              <Line
                type="monotone"
                dataKey="simulado"
                name="Proyeccion simulada"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
            {showObserved ? (
              <Line
                type="linear"
                dataKey="observado"
                name="TPH observado (interpolado)"
                stroke={OBSERVADO_STROKE}
                strokeWidth={1.25}
                strokeOpacity={0.85}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ) : null}
            {showObserved ? (
              <Line
                type="linear"
                dataKey="observadoMarcador"
                name="TPH medido"
                stroke="transparent"
                strokeWidth={0}
                dot={{
                  r: 3.5,
                  fill: OBSERVADO_STROKE,
                  stroke: OBSERVADO_DOT_STROKE,
                  strokeWidth: 1,
                }}
                activeDot={{ r: 5 }}
                legendType="none"
                isAnimationActive={false}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      )}
      {!empty ? (
        <LatexMarkdown
          className="text-center text-xs text-zinc-500"
          content={
            'Ejes: tiempo $t$ desde el inicio ($\\mathrm{d}$); eje vertical: $\\mathrm{TPH}$ ' +
            '($\\mathrm{mg\\,kg}^{-1}$). **Observado:** mediciones reales; tramo en azul = interpolacion lineal ' +
            'solo entre el primer y ultimo dia medido (sin extrapolacion). Tooltip: valores redondeados.'
          }
        />
      ) : null}
    </div>
  );
}
