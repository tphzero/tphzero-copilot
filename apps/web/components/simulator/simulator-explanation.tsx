'use client';

import { useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import type { SimulationResult } from '@tphzero/domain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LatexMarkdown } from '@/components/simulator/latex-markdown';
import { RichExplanation } from '@/components/simulator/rich-explanation';
import type { SimulatorModelMeta } from '@/lib/models/simulator-models';

export interface ExplainRequestBody {
  datasetId: string;
  biopilaId: string;
  model: { id: string; name: string };
  horizonDays: number;
  result: SimulationResult;
  /** Claves de SimulationParams tocadas respecto a la ultima medicion base. */
  adjustedParamKeys: string[];
}

interface SimulatorExplanationProps {
  datasetId: string;
  biopilaId: string;
  modelMeta: SimulatorModelMeta;
  result: SimulationResult;
  adjustedParamKeys: string[];
  explanationStale: boolean;
  onGenerationSuccess: () => void;
}

const EXPLAIN_INTRO =
  'La explicacion usa **solo** los numeros del simulador y el modelo indicado ($k$, $M$, series de $\\mathrm{TPH}$); **no** sustituye mediciones ni garantiza resultados en campo.';

/** Firma estable del cuerpo enviado a explain; si cambia el contexto durante el fetch, no aplicamos la respuesta. */
function explainPayloadSignature(body: ExplainRequestBody): string {
  return JSON.stringify({
    datasetId: body.datasetId,
    biopilaId: body.biopilaId,
    model: body.model,
    horizonDays: body.horizonDays,
    adjustedParamKeys: [...body.adjustedParamKeys].sort(),
    result: body.result,
  });
}

export function SimulatorExplanation({
  datasetId,
  biopilaId,
  modelMeta,
  result,
  adjustedParamKeys,
  explanationStale,
  onGenerationSuccess,
}: SimulatorExplanationProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestRef = useRef({
    datasetId,
    biopilaId,
    modelMeta,
    result,
    adjustedParamKeys,
  });
  latestRef.current = { datasetId, biopilaId, modelMeta, result, adjustedParamKeys };

  const hasValidText = Boolean(text) && !explanationStale;

  const runExplain = async () => {
    setLoading(true);
    setError(null);
    try {
      const body: ExplainRequestBody = {
        datasetId,
        biopilaId,
        model: { id: modelMeta.id, name: modelMeta.name },
        horizonDays: result.horizonDays,
        result,
        adjustedParamKeys,
      };
      const signatureAtSend = explainPayloadSignature(body);
      const res = await fetch('/api/simulator/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { explanation?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'No se pudo generar la explicacion.');
        return;
      }
      const cur = latestRef.current;
      const bodyNow: ExplainRequestBody = {
        datasetId: cur.datasetId,
        biopilaId: cur.biopilaId,
        model: { id: cur.modelMeta.id, name: cur.modelMeta.name },
        horizonDays: cur.result.horizonDays,
        result: cur.result,
        adjustedParamKeys: cur.adjustedParamKeys,
      };
      if (explainPayloadSignature(bodyNow) !== signatureAtSend) {
        return;
      }
      setText(data.explanation ?? '');
      onGenerationSuccess();
    } catch {
      setError('Error de red al solicitar la explicacion.');
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = hasValidText ? 'Actualizar explicacion' : 'Generar explicacion';

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-base">Interpretacion (IA)</CardTitle>
        <LatexMarkdown className="text-xs text-zinc-500 [&_p]:text-xs" content={EXPLAIN_INTRO} />
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="border-zinc-600"
          disabled={loading}
          onClick={() => void runExplain()}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {buttonLabel}
        </Button>

        {error ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-red-400">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-red-300"
              onClick={() => void runExplain()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {hasValidText && text ? <RichExplanation content={text} /> : null}
      </CardContent>
    </Card>
  );
}
