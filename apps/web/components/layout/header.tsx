'use client';

import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ActiveDatasetChip } from '@/components/layout/active-dataset-chip';
import { useActiveDataset } from '@/lib/context/dataset-context';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Centro de control',
    subtitle: 'Carga datasets y prepara la línea base operativa.',
  },
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Sigue el desempeño general de las biopilas activas.',
  },
  '/chat': {
    title: 'Chat IA',
    subtitle: 'Consulta hallazgos, correlaciones y recomendaciones.',
  },
  '/simulator': {
    title: 'Simulador',
    subtitle: 'Evalúa escenarios base y ajustados para variables críticas.',
  },
};

function getPageMeta(pathname: string) {
  if (pathname.startsWith('/biopila/')) {
    return {
      title: 'Detalle de biopila',
      subtitle: 'Inspecciona la evolución temporal y las métricas clave.',
    };
  }

  return PAGE_META[pathname] ?? PAGE_META['/'];
}

export function Header() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);
  const { activeDataset } = useActiveDataset();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            TPHZero Copilot
          </p>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
              {meta.title}
            </h2>
            <p className="text-sm text-zinc-400">{meta.subtitle}</p>
          </div>
        </div>

        {activeDataset ? (
          <ActiveDatasetChip />
        ) : (
          <Badge
            variant="outline"
            className="w-fit border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300"
          >
            Shell operativo
          </Badge>
        )}
      </div>
    </header>
  );
}
