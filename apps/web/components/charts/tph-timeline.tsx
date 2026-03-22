'use client';

import {
  CartesianGrid,
  Legend,
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
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="dia"
            stroke="#71717a"
            fontSize={12}
            label={{ value: 'Dias', position: 'bottom', fill: '#71717a' }}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
            }}
            labelFormatter={(value) => `Dia ${value}`}
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="dia" stroke="#71717a" fontSize={12} />
        <YAxis
          stroke="#71717a"
          fontSize={12}
          tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
          }}
          labelFormatter={(value) => `Dia ${value}`}
          formatter={(value, name) => formatTooltipValue(value, String(name))}
        />
        <Legend />
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
  );
}
