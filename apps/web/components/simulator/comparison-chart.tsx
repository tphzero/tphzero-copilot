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
import type { SimulationResult } from '@tphzero/domain';

function formatTooltipValue(
  value: number | string | readonly (number | string)[] | undefined,
  label: string
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  return [`${numericValue.toLocaleString()} mg/kg`, label] as const;
}

export function ComparisonChart({ result }: { result: SimulationResult }) {
  const data = result.baseline.days.map((day, index) => ({
    dia: day,
    'Linea base': Math.round(result.baseline.tphProjected[index] ?? 0),
    Simulado: Math.round(result.simulated.tphProjected[index] ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
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
          formatter={(value, name) => formatTooltipValue(value, String(name))}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Linea base"
          stroke="#71717a"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Simulado"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
