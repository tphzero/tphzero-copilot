'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { datasetDashboardPath, truncateDatasetId } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

export function DatasetBreadcrumbs({
  datasetId,
  datasetName,
}: {
  datasetId: string;
  datasetName: string | null;
}) {
  const pathname = usePathname();
  const idFallback = truncateDatasetId(datasetId);
  const primaryLabel = datasetName ?? idFallback;
  const titleAttr = datasetName ? `${datasetName} · ${datasetId}` : datasetId;
  const biopilaMatch = pathname.match(/\/biopila\/([^/]+)/);
  const biopilaSegment = biopilaMatch?.[1];
  const biopilaId = biopilaSegment ? decodeURIComponent(biopilaSegment) : null;
  const isDashboard = pathname.endsWith('/dashboard');

  return (
    <nav aria-label="Migas de pan" className="border-b border-zinc-800/80 px-4 py-3 md:px-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-zinc-400">
        <li>
          <Link href="/" className="hover:text-zinc-200">
            Inicio
          </Link>
        </li>
        <li className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
          <Link
            href={datasetDashboardPath(datasetId)}
            className={cn(
              'min-w-0 max-w-[min(100%,18rem)] truncate hover:text-zinc-200',
              datasetName ? 'font-medium text-zinc-200' : 'font-mono'
            )}
            title={titleAttr}
          >
            {primaryLabel}
          </Link>
        </li>
        <li className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
          {isDashboard ? (
            <span className={cn('text-zinc-100')}>Dashboard</span>
          ) : biopilaId ? (
            <>
              <span className="font-mono text-zinc-100" title={biopilaId}>
                Biopila {biopilaId}
              </span>
            </>
          ) : (
            <span className="text-zinc-100">Dashboard</span>
          )}
        </li>
      </ol>
    </nav>
  );
}
