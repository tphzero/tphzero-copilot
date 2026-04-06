import type { ReactNode } from 'react';
import { DatasetLayoutShell } from '@/components/layout/dataset-layout-shell';
import { createServerClient } from '@/lib/data/supabase';

export default async function DatasetLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;
  const supabase = createServerClient();
  const { data: row } = await supabase
    .from('datasets')
    .select('name')
    .eq('id', datasetId)
    .maybeSingle();

  const datasetName = row?.name ?? null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DatasetLayoutShell datasetId={datasetId} datasetName={datasetName}>
        {children}
      </DatasetLayoutShell>
    </div>
  );
}
