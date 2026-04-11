'use client';

import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const CONTRAST_PRESET_KEY = 'tphzero-contrast-preset';
const FIELD_PRESET = 'field';

function applyFieldContrast(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle('field-hc', enabled);
  if (enabled) {
    root.setAttribute('data-contrast-preset', FIELD_PRESET);
  } else {
    root.removeAttribute('data-contrast-preset');
  }
}

export function ContrastPresetToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(CONTRAST_PRESET_KEY);
      const nextEnabled = saved === FIELD_PRESET;
      setEnabled(nextEnabled);
      applyFieldContrast(nextEnabled);
    } catch {
      setEnabled(false);
    }
  }, []);

  const togglePreset = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    applyFieldContrast(nextEnabled);
    try {
      if (nextEnabled) {
        window.localStorage.setItem(CONTRAST_PRESET_KEY, FIELD_PRESET);
      } else {
        window.localStorage.removeItem(CONTRAST_PRESET_KEY);
      }
    } catch {
      // no-op
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-label="Activar preset de alto contraste para campo"
      aria-checked={enabled}
      title={enabled ? 'Alto contraste activo' : 'Alto contraste inactivo'}
      disabled={!mounted}
      onClick={togglePreset}
      className={cn(
        'flex w-full items-center justify-center rounded-md border border-border px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70',
        'disabled:cursor-not-allowed disabled:opacity-70 md:justify-between md:px-3',
        className
      )}
    >
      <span className="hidden text-xs md:inline">Alto contraste</span>
      <span className="flex items-center gap-2">
        <Eye className={cn('h-4 w-4', enabled ? 'text-emerald-500' : 'text-muted-foreground')} />
        <span
          aria-hidden
          className={cn(
            'relative hidden h-5 w-9 rounded-full border transition-colors md:inline-flex',
            enabled ? 'border-emerald-500/40 bg-emerald-500/15' : 'border-border bg-secondary'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-foreground transition-transform',
              enabled ? 'translate-x-[1.05rem]' : 'translate-x-0.5'
            )}
          />
        </span>
      </span>
    </button>
  );
}
