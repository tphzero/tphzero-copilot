'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Upload },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat IA', icon: MessageSquare },
  { href: '/simulator', label: 'Simulador', icon: SlidersHorizontal },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-20 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/95 px-2 py-4 md:w-56 md:px-3">
      <div className="mb-8 px-2 md:px-3">
        <h1 className="font-mono text-lg font-bold tracking-tight text-emerald-400">
          TPHZero
        </h1>
        <p className="hidden font-mono text-xs text-zinc-500 md:block">Copilot</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors md:justify-start',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 md:block">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Estado
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          Plataforma lista para carga y análisis de datasets.
        </p>
      </div>
    </aside>
  );
}
