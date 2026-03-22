import { Activity, Droplets, Timer, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardsProps {
  totalBiopilas: number;
  avgReduction: number;
  optimalCount: number;
  criticalCount: number;
}

export function KPICards({
  totalBiopilas,
  avgReduction,
  optimalCount,
  criticalCount,
}: KPICardsProps) {
  const kpis = [
    {
      label: 'Biopilas activas',
      value: totalBiopilas,
      icon: Activity,
      color: 'text-blue-400',
    },
    {
      label: 'Reduccion promedio',
      value: `${(avgReduction * 100).toFixed(1)}%`,
      icon: TrendingDown,
      color: 'text-emerald-400',
    },
    {
      label: 'Estado optimo',
      value: optimalCount,
      icon: Droplets,
      color: 'text-emerald-400',
    },
    {
      label: 'Estado critico',
      value: criticalCount,
      icon: Timer,
      color: criticalCount > 0 ? 'text-red-400' : 'text-zinc-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className={`mt-1 font-mono text-2xl font-bold ${color}`}>
                  {value}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${color} opacity-30`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
