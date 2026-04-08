'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { useActiveDataset } from '@/lib/context/dataset-context';
import { useLatestDatasetId } from '@/hooks/use-latest-dataset-id';
import { datasetDashboardPath, datasetIdFromPathname } from '@/lib/navigation/routes';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const STATIC_NAV = [
  {
    href: '/',
    label: 'Carga de Datos',
    icon: Upload,
    match: (p: string) => p === '/',
  },
  {
    href: '/chat',
    label: 'Chat IA',
    icon: MessageSquare,
    match: (p: string) => p.startsWith('/chat'),
  },
  {
    href: '/simulator',
    label: 'Simulador',
    icon: SlidersHorizontal,
    match: (p: string) => p.startsWith('/simulator'),
  },
] as const;

export function SidebarNav() {
  const pathname = usePathname();
  const { activeDataset } = useActiveDataset();
  const { latestDatasetId, loading } = useLatestDatasetId();

  const datasetIdFromUrl = datasetIdFromPathname(pathname);
  const dashboardTargetId =
    datasetIdFromUrl ?? activeDataset?.id ?? latestDatasetId;

  return (
    <aside className="flex h-full w-20 shrink-0 flex-col border-r border-border bg-background/95 px-2 py-4 md:w-56 md:px-3">
      <div className="mb-8 px-2 md:px-3">
        <h1 className="font-mono text-lg font-bold tracking-tight text-emerald-400">
          TPHZero
        </h1>
        <p className="hidden font-mono text-xs text-muted-foreground md:block">Copilot</p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {STATIC_NAV.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors md:justify-start',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}

        {!loading && dashboardTargetId ? (
          <Link
            href={datasetDashboardPath(dashboardTargetId)}
            className={cn(
              'flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors md:justify-start',
              pathname.startsWith(`/datasets/${dashboardTargetId}/`)
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>
        ) : !loading ? (
          <span
            className="flex cursor-not-allowed items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground/60 md:justify-start"
            title="Selecciona o carga un dataset desde Carga de Datos para abrir el dashboard"
            aria-disabled
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </span>
        ) : (
          <span className="flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground/60 md:justify-start">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </span>
        )}
      </nav>

      <div className="hidden rounded-lg border border-border bg-card/60 p-3 md:block">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Estado
        </p>
        <p className="mt-2 text-sm text-foreground/85">
          Plataforma lista para carga y análisis de datasets.
        </p>
      </div>
    </aside>
  );
}
