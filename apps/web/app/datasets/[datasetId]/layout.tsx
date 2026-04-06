import type { ReactNode } from 'react';
import { DatasetLayoutShell } from '@/components/layout/dataset-layout-shell';

export default async function DatasetLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DatasetLayoutShell datasetId={datasetId}>{children}</DatasetLayoutShell>
    </div>
  );
}
