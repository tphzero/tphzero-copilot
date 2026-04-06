'use client';

import { use } from 'react';
import { BiopilaDetailContent } from '@/components/dashboard/biopila-detail-content';

export default function DatasetBiopilaPage({
  params,
}: {
  params: Promise<{ datasetId: string; biopilaId: string }>;
}) {
  const { datasetId, biopilaId } = use(params);
  return (
    <BiopilaDetailContent datasetId={datasetId} biopilaId={biopilaId} />
  );
}
