'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface KatexDisplayProps {
  /** LaTeX (KaTeX). */
  latex: string;
  /** true = bloque centrado; false = inline. */
  displayMode?: boolean;
  className?: string;
}

export function KatexDisplay({ latex, displayMode = true, className }: KatexDisplayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      katex.render(latex, el, {
        displayMode,
        throwOnError: false,
        errorColor: '#f87171',
        trust: false,
      });
    } catch {
      el.textContent = latex;
    }
  }, [latex, displayMode]);

  return (
    <div
      ref={ref}
      className={cn(
        '[&_.katex]:!text-foreground [&_.katex_html]:!text-foreground',
        displayMode && 'overflow-x-auto py-1',
        className
      )}
    />
  );
}
