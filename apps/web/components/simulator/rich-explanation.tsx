'use client';

import { LatexMarkdown } from '@/components/simulator/latex-markdown';

interface RichExplanationProps {
  content: string;
  className?: string;
}

export function RichExplanation({ content, className }: RichExplanationProps) {
  return <LatexMarkdown className={className} content={content} />;
}
