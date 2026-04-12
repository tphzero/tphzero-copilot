'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface KatexInlineProps {
  latex: string;
  className?: string;
}

/** Expresion LaTeX en linea (KaTeX), alineada con el texto. */
export function KatexInline({ latex, className }: KatexInlineProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      katex.render(latex, el, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#f87171',
        trust: false,
      });
    } catch {
      el.textContent = latex;
    }
  }, [latex]);

  return (
    <span
      ref={ref}
      className={cn(
        'inline-block align-baseline [&_.katex]:!text-[0.95em] [&_.katex]:!text-foreground',
        className
      )}
    />
  );
}
