'use client';

import { BiopilaDetailContent } from '@/components/dashboard/biopila-detail-content';

export function DatasetBiopilaPage({
  datasetId,
  biopilaId,
}: {
  datasetId: string;
  biopilaId: string;
}) {
  return <BiopilaDetailContent datasetId={datasetId} biopilaId={biopilaId} />;
}
