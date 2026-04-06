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
    <div className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-900/80 p-4">
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

      <div className="space-y-2">
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
        <p className="text-xs text-zinc-500">{recommendationReason}</p>
      </div>

      {active ? (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium text-zinc-500">Forma del modelo</dt>
            <dd className="mt-2 space-y-2">
              <KatexDisplay latex={active.equationLatex} />
              <p className="text-sm leading-relaxed text-zinc-400">{active.equationCaption}</p>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Hipotesis</dt>
            <dd className="mt-0.5 text-zinc-400">{active.hypothesis}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Limitaciones</dt>
            <dd className="mt-0.5 text-zinc-400">{active.limitations}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
