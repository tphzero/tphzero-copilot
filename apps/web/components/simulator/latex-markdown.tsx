'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

export const latexMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-relaxed text-zinc-300 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-zinc-300 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-5 text-sm text-zinc-300 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-100 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-100 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold text-zinc-200 first:mt-0">{children}</h4>
  ),
  code: ({ className, children, ...props }) => {
    const inline = !className?.includes('language-');
    if (inline) {
      return (
        <code
          className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-200"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn(
          'my-2 block overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-200',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-zinc-600 pl-3 text-zinc-400">{children}</blockquote>
  ),
};

interface LatexMarkdownProps {
  content: string;
  className?: string;
  /** En linea: los parrafos se renderizan como span (etiquetas en listas, celdas). */
  inline?: boolean;
}

const inlineParagraphComponents: Components = {
  ...latexMarkdownComponents,
  p: ({ children }) => (
    <span className="inline text-sm leading-relaxed text-zinc-300 [&_.katex]:!text-zinc-200">
      {children}
    </span>
  ),
};

/**
 * Parrafo o bloque con Markdown + LaTeX ($...$, $$...$$) via KaTeX.
 * Usar para textos con unidades, coeficientes y simbolos matematicos.
 */
export function LatexMarkdown({ content, className, inline }: LatexMarkdownProps) {
  const components = inline ? inlineParagraphComponents : latexMarkdownComponents;
  const Wrapper = inline ? 'span' : 'div';
  return (
    <Wrapper
      className={cn(
        'max-w-none [&_.katex]:!text-zinc-200 [&_.katex_html]:!text-zinc-200',
        !inline && '[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto',
        inline && 'inline align-baseline',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Wrapper>
  );
}
