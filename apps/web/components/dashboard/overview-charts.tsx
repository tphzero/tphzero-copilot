'use client';

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
import { TPHTimeline } from '@/components/charts/tph-timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OverviewChartsProps {
  biopilas: BiopilaOverview[];
}

const STATUS_COLORS = {
  optimo: '#10b981',
  suboptimo: '#f59e0b',
  critico: '#ef4444',
};

function formatReductionValue(
  value: number | string | readonly (number | string)[] | undefined
) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? 0);
  return [`${numericValue.toFixed(1)}%`, 'Reduccion'] as const;
}

export function OverviewCharts({ biopilas }: OverviewChartsProps) {
  const timelineData = biopilas.flatMap((biopila) =>
    biopila.measurements.map((measurement) => ({
      tiempoDias: measurement.tiempoDias,
      tphActualMgkg: measurement.tphActualMgkg,
      biopilaId: measurement.biopilaId,
    }))
  );

  const reductionData = biopilas.map((biopila) => ({
    id: biopila.biopilaId,
    reduccion: Number((biopila.tphReductionPct * 100).toFixed(1)),
    estado: biopila.state,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Evolucion de TPH</CardTitle>
        </CardHeader>
        <CardContent>
          <TPHTimeline
            data={timelineData}
            biopilaIds={biopilas.map((biopila) => biopila.biopilaId)}
          />
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Reduccion por biopila</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reductionData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} unit="%" />
              <YAxis
                dataKey="id"
                type="category"
                stroke="var(--muted-foreground)"
                fontSize={12}
                width={72}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(value) => formatReductionValue(value)}
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
