import type { Metadata } from 'next';
import { NavigationContextError } from '@/components/errors/navigation-context-error';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Biopila legado ${id}`,
    description:
      `Vista legado para la biopila ${id}. Usa la navegacion por dataset para acceder al detalle operativo actualizado.`,
  };
}

export default function LegacyBiopilaPage() {
  return <NavigationContextError variant="obsolete" />;
}
