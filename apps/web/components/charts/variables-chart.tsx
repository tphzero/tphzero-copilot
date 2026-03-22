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
import type { Measurement } from '@tphzero/domain';

const VARIABLES = [
  { key: 'temperaturaSueloC', label: 'Temp. suelo (C)', color: '#ef4444' },
  { key: 'humedadSueloPct', label: 'Humedad (%)', color: '#3b82f6' },
  { key: 'oxigenoPct', label: 'Oxigeno (%)', color: '#10b981' },
  { key: 'ph', label: 'pH', color: '#f59e0b' },
] as const;

function formatVariableValue(
  value: number | string | readonly (number | string)[] | undefined,
  label: string
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  return [`${numericValue.toFixed(2)}`, label] as const;
}

export function VariablesChart({ measurements }: { measurements: Measurement[] }) {
  const data = [...measurements]
    .sort((a, b) => a.tiempoDias - b.tiempoDias)
    .map((measurement) => ({
      dia: measurement.tiempoDias,
      'Temp. suelo (C)': measurement.temperaturaSueloC,
      'Humedad (%)': measurement.humedadSueloPct,
      'Oxigeno (%)': measurement.oxigenoPct,
      pH: measurement.ph,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
        <XAxis dataKey="dia" stroke="#71717a" fontSize={12} />
        <YAxis stroke="#71717a" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
          }}
          labelFormatter={(value) => `Dia ${value}`}
          formatter={(value, name) => formatVariableValue(value, String(name))}
        />
        <Legend />
        {VARIABLES.map(({ label, color }) => (
          <Line
            key={label}
            type="monotone"
            dataKey={label}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
