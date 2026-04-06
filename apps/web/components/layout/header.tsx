'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActiveDatasetChip } from '@/components/layout/active-dataset-chip';
import { buttonVariants } from '@/components/ui/button';
import { useActiveDataset } from '@/lib/context/dataset-context';
import { datasetDashboardPath, safeDecodePathSegment } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Centro de control',
    subtitle: 'Carga datasets y prepara la línea base operativa.',
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

function getPageMeta(pathname: string): { title: string; subtitle: string } {
  const datasetDashboard = pathname.match(/^\/datasets\/[^/]+\/dashboard\/?$/);
  if (datasetDashboard) {
    return {
      title: 'Dashboard',
      subtitle: 'Vista general del dataset y del estado operativo de las biopilas.',
    };
  }

  const biopilaDetail = pathname.match(/^\/datasets\/[^/]+\/biopila\/([^/]+)\/?$/);
  if (biopilaDetail) {
    const biopilaId = safeDecodePathSegment(biopilaDetail[1]!);
    return {
      title: biopilaId,
      subtitle: 'Mediciones, evolución temporal y variables ambientales.',
    };
  }

  if (pathname.startsWith('/chat')) {
    return PAGE_META['/chat']!;
  }
  if (pathname.startsWith('/simulator')) {
    return PAGE_META['/simulator']!;
  }

  return PAGE_META[pathname] ?? PAGE_META['/']!;
}

export function Header() {
  const pathname = usePathname();
  const params = useParams();
  const meta = getPageMeta(pathname);
  const { activeDataset } = useActiveDataset();

  const datasetId =
    typeof params.datasetId === 'string' ? params.datasetId : undefined;
  const biopilaId =
    typeof params.biopilaId === 'string' ? params.biopilaId : undefined;
  const showBack = Boolean(datasetId && biopilaId);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {showBack && datasetId ? (
            <Link
              href={datasetDashboardPath(datasetId)}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'w-fit shrink-0 border-zinc-700'
              )}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Atras
            </Link>
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              TPHZero Copilot
            </p>
            <div>
              <h2
                className={cn(
                  'text-xl font-semibold tracking-tight text-zinc-100',
                  pathname.includes('/biopila/') && 'font-mono'
                )}
              >
                {meta.title}
              </h2>
              <p className="text-sm text-zinc-400">{meta.subtitle}</p>
            </div>
          </div>
        </div>

        {activeDataset ? (
          <ActiveDatasetChip />
        ) : (
          <Badge
            variant="outline"
            className="w-fit shrink-0 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300"
          >
            Shell operativo
          </Badge>
        )}
      </div>
    </header>
  );
}
