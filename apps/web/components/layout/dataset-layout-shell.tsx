'use client';

import type { ReactNode } from 'react';
import { DatasetBreadcrumbs } from '@/components/layout/dataset-breadcrumbs';
import { DatasetNavTree } from '@/components/layout/dataset-nav-tree';

export function DatasetLayoutShell({
  datasetId,
  children,
}: {
  datasetId: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DatasetBreadcrumbs datasetId={datasetId} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row md:items-start md:gap-6 md:p-6">
        <aside className="w-full shrink-0 md:sticky md:top-0 md:w-56 md:self-start">
          <DatasetNavTree datasetId={datasetId} />
        </aside>
        <div className="min-w-0 flex-1 pb-4 md:pb-6">{children}</div>
      </div>
    </div>
  );
}
