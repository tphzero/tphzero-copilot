import type { Metadata } from 'next';
import { DatasetBiopilaPage } from '@/components/pages/dataset-biopila-page';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ datasetId: string; biopilaId: string }>;
}): Promise<Metadata> {
  const { biopilaId } = await params;

  return {
    title: `Biopila ${biopilaId}`,
    description:
      `Consulta la evolucion, las alertas y el detalle operativo de la biopila ${biopilaId} dentro del dataset activo.`,
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ datasetId: string; biopilaId: string }>;
}) {
  const { datasetId, biopilaId } = await params;
  return <DatasetBiopilaPage datasetId={datasetId} biopilaId={biopilaId} />;
}
