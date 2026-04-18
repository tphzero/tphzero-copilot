'use client';

import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';

export function DatasetDashboardPage({ datasetId }: { datasetId: string }) {
  return <DashboardPageContent datasetId={datasetId} />;
}
