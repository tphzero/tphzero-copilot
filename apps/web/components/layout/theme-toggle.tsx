'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => {
    if (!mounted) return true;
    return resolvedTheme !== 'light';
  }, [mounted, resolvedTheme]);

  const label = isDark ? 'Modo oscuro' : 'Modo claro';

  return (
    <button
      type="button"
      role="switch"
      aria-label="Cambiar tema claro u oscuro"
      aria-checked={isDark}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex w-full items-center justify-center rounded-md border border-border px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70',
        'disabled:cursor-not-allowed disabled:opacity-70',
        'md:justify-between md:px-3',
        className
      )}
    >
      <span className="hidden text-xs md:inline">Tema</span>
      <span className="flex items-center gap-2">
        <Sun className={cn('h-4 w-4', !isDark ? 'text-amber-500' : 'text-muted-foreground')} />
        <span
          aria-hidden
          className={cn(
            'relative hidden h-5 w-9 rounded-full border transition-colors md:inline-flex',
            isDark ? 'border-border bg-muted' : 'border-border bg-secondary'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-foreground transition-transform',
              isDark ? 'translate-x-[1.05rem]' : 'translate-x-0.5'
            )}
          />
        </span>
        <Moon className={cn('h-4 w-4', isDark ? 'text-blue-400' : 'text-muted-foreground')} />
      </span>
    </button>
  );
}
