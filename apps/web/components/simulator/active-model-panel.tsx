'use client';

import type { SimulatorModelMeta } from '@/lib/models/simulator-models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KatexDisplay } from '@/components/simulator/katex-display';
import { LatexMarkdown } from '@/components/simulator/latex-markdown';
import { ChevronDown } from 'lucide-react';

interface ActiveModelPanelProps {
  models: SimulatorModelMeta[];
  selectedId: string;
  recommendedId: string;
  recommendationReason: string;
  onModelChange: (id: string) => void;
}

export function ActiveModelPanel({
  models,
  selectedId,
  recommendedId,
  recommendationReason,
  onModelChange,
}: ActiveModelPanelProps) {
  const active = models.find((m) => m.id === selectedId) ?? models[0];

  return (
    <details className="group rounded-lg border border-zinc-700 bg-zinc-900/80 open:bg-zinc-900/30">
      <summary className="cursor-pointer list-none px-4 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">Modelo activo</h2>
              {selectedId === recommendedId ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                >
                  Recomendado
                </Badge>
              ) : null}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180" />
          </div>
          <div
            className="space-y-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <label className="text-xs text-zinc-500">Variante de proyeccion</label>
            <Select value={selectedId} onValueChange={(v) => onModelChange(v ?? selectedId)}>
              <SelectTrigger className="w-full border-zinc-700 bg-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </summary>

      <div className="space-y-4 border-t border-zinc-800 px-4 pb-4 pt-2 text-sm">
        {recommendationReason.trim() ? (
          <LatexMarkdown className="text-xs text-zinc-500" content={recommendationReason} />
        ) : null}

        {active ? (
          <dl className="space-y-4 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
            <div>
              <dt className="text-xs font-medium text-zinc-500">Forma del modelo</dt>
              <dd className="mt-2 space-y-3">
                <KatexDisplay latex={active.equationLatex} />
                <LatexMarkdown className="text-sm text-zinc-400" content={active.equationCaption} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Hipotesis</dt>
              <dd className="mt-1">
                <LatexMarkdown className="text-sm text-zinc-400" content={active.hypothesis} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Limitaciones</dt>
              <dd className="mt-1">
                <LatexMarkdown className="text-sm text-zinc-400" content={active.limitations} />
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </details>
  );
}
