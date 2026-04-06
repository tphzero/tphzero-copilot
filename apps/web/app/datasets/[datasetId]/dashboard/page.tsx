'use client';

import { use } from 'react';
import { DashboardPageContent } from '@/components/dashboard/dashboard-page-content';

export default function DatasetDashboardPage({
  params,
}: {
  params: Promise<{ datasetId: string }>;
}) {
  const { datasetId } = use(params);
  return <DashboardPageContent datasetId={datasetId} />;
}
