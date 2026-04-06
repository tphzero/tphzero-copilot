'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Measurement } from '@tphzero/domain';
import { mapRow } from '@/lib/data/map-row';
import { uniqueBiopilaIds } from '@/lib/data/unique-biopila-ids';
import {
  datasetBiopilaPath,
  datasetDashboardPath,
  truncateDatasetId,
} from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';

export function DatasetNavTree({
  datasetId,
  datasetName,
}: {
  datasetId: string;
  datasetName: string | null;
}) {
  const pathname = usePathname();
  const [biopilaIds, setBiopilaIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch(`/api/data/${datasetId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        measurements?: Record<string, unknown>[];
      };
      if (!active) return;
      const measurements = (data.measurements ?? []).map(mapRow) as Measurement[];
      setBiopilaIds(uniqueBiopilaIds(measurements));
    }

    void load();
    return () => {
      active = false;
    };
  }, [datasetId]);

  const dashPath = datasetDashboardPath(datasetId);
  const dashActive = pathname === dashPath || pathname.endsWith('/dashboard');

  const idFallback = truncateDatasetId(datasetId);
  const heading = datasetName ?? idFallback;
  const headingTitle = datasetName ? `${datasetName} · ${datasetId}` : datasetId;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <p
        className={cn(
          'mb-2 text-xs font-medium text-zinc-300',
          datasetName ? '' : 'font-mono',
          'min-w-0 truncate'
        )}
        title={headingTitle}
      >
        {heading}
      </p>
      <ul className="space-y-1">
        <li>
          <Link
            href={dashPath}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
              dashActive
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Dashboard
          </Link>
        </li>
        {biopilaIds.map((id) => {
          const href = datasetBiopilaPath(datasetId, id);
          const active = pathname === href;
          return (
            <li key={id}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                )}
              >
                <Leaf className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate font-mono text-xs" title={id}>
                  {id}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
