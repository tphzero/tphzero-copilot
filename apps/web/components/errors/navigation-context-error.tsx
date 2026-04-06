'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const COPY = {
  obsolete: {
    title: 'Esta URL ya no es valida',
    description:
      'La navegacion del dashboard incluye ahora el identificador del dataset en la ruta. Usa el menu o el inicio para abrir un dataset desde la aplicacion.',
  },
  'dataset-not-found': {
    title: 'Dataset no encontrado',
    description:
      'No existe un dataset con este identificador o ya no esta disponible. Comprueba la URL o vuelve al inicio para cargar datos.',
  },
} as const;

export type NavigationContextErrorVariant = keyof typeof COPY;

export function NavigationContextError({
  variant,
}: {
  variant: NavigationContextErrorVariant;
}) {
  const { title, description } = COPY[variant];

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-lg border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">{description}</p>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: 'default' }),
              'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            Volver al inicio
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
