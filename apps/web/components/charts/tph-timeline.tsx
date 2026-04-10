'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DataPoint {
  tiempoDias: number;
  tphActualMgkg: number;
  biopilaId?: string | null;
}

interface TPHTimelineProps {
  data: DataPoint[];
  biopilaIds?: string[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#14b8a6'];

/** Ticks on chart area (~#09090b); aligned with overview-charts bar chart */
const CHART_AXIS_STROKE = '#a1a1aa';
const CHART_AXIS_TEXT = '#d4d4d8';

/** Plot margins (leyenda multi-serie va fuera del SVG para no reservar margin.top grande) */
const MARGIN_SINGLE = { top: 6, right: 6, left: 48, bottom: 22 };
const MARGIN_MULTI = { top: 6, right: 6, left: 48, bottom: 22 };

const Y_AXIS_LABEL_PROPS = {
  value: 'TPH actual (mg/kg)' as const,
  angle: -90,
  position: 'left' as const,
  offset: 2,
  fill: CHART_AXIS_TEXT,
  style: { textAnchor: 'middle' as const },
};

const X_AXIS_LABEL_PROPS = {
  value: 'Tiempo de operación (días)' as const,
  position: 'bottom' as const,
  offset: 2,
  fill: CHART_AXIS_TEXT,
};

function formatTooltipValue(
  value: number | string | readonly (number | string)[] | undefined,
  label: string
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  return [`${numericValue.toLocaleString()} mg/kg`, label] as const;
}

export function TPHTimeline({ data, biopilaIds }: TPHTimelineProps) {
  if (!biopilaIds || biopilaIds.length === 0) {
    const chartData = [...data]
      .sort((a, b) => a.tiempoDias - b.tiempoDias)
      .map((point) => ({
        dia: point.tiempoDias,
        tph: Math.round(point.tphActualMgkg),
      }));

    return (
      <div className="h-[280px] w-full min-w-0 sm:h-[300px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={MARGIN_SINGLE}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="dia"
              stroke={CHART_AXIS_STROKE}
              fontSize={12}
              tick={{ fill: CHART_AXIS_TEXT }}
              label={X_AXIS_LABEL_PROPS}
            />
            <YAxis
              width={44}
              stroke={CHART_AXIS_STROKE}
              fontSize={12}
              tick={{ fill: CHART_AXIS_TEXT }}
              tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              label={Y_AXIS_LABEL_PROPS}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#e4e4e7',
              }}
              labelStyle={{ color: '#e4e4e7' }}
              labelFormatter={(value) => `Día ${value}`}
              formatter={(value) => formatTooltipValue(value, 'TPH')}
            />
            <Line
              type="monotone"
              dataKey="tph"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const grouped = new Map<string, DataPoint[]>();
  for (const id of biopilaIds) {
    grouped.set(
      id,
      data
        .filter((point) => point.biopilaId === id)
        .sort((a, b) => a.tiempoDias - b.tiempoDias)
    );
  }

  const allDays = [...new Set(data.map((point) => point.tiempoDias))].sort(
    (a, b) => a - b
  );

  const chartData = allDays.map((day) => {
    const entry: Record<string, number> = { dia: day };
    for (const id of biopilaIds) {
      const measurement = grouped.get(id)?.find((point) => point.tiempoDias === day);
      if (measurement) {
        entry[id] = Math.round(measurement.tphActualMgkg);
      }
    }
    return entry;
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <div
        className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-zinc-300"
        aria-label="Series por biopila"
      >
        {biopilaIds.map((id, index) => (
          <span key={id} className="inline-flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full ring-1 ring-white/10"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
              aria-hidden
            />
            {id}
          </span>
        ))}
      </div>
      <div className="h-[280px] w-full min-w-0 sm:h-[300px] md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={MARGIN_MULTI}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis
              dataKey="dia"
              stroke={CHART_AXIS_STROKE}
              fontSize={12}
              tick={{ fill: CHART_AXIS_TEXT }}
              label={X_AXIS_LABEL_PROPS}
            />
            <YAxis
              width={44}
              stroke={CHART_AXIS_STROKE}
              fontSize={12}
              tick={{ fill: CHART_AXIS_TEXT }}
              tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              label={Y_AXIS_LABEL_PROPS}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#e4e4e7',
              }}
              labelStyle={{ color: '#e4e4e7' }}
              labelFormatter={(value) => `Día ${value}`}
              formatter={(value, name) => formatTooltipValue(value, String(name))}
            />
            {biopilaIds.map((id, index) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
