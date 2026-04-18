import type { Metadata } from 'next';
import { DatasetDashboardPage } from '@/components/pages/dataset-dashboard-page';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}): Promise<Metadata> {
  const { datasetId } = await params;

  return {
    title: `Dashboard dataset ${datasetId.slice(0, 8)}`,
    description:
      'Analiza metricas, tendencias y recomendaciones operativas del dataset seleccionado en TPHZero Copilot.',
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = await params;
  return <DatasetDashboardPage datasetId={datasetId} />;
}
