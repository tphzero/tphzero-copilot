'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichExplanation } from '@/components/simulator/rich-explanation';

interface AnalysisState {
  analysis: string;
  generatedAt: string;
  isStale: boolean;
}

interface BiopilaAnalysisProps {
  datasetId: string;
  biopilaId: string;
}

export function BiopilaAnalysis({ datasetId, biopilaId }: BiopilaAnalysisProps) {
  const [stored, setStored] = useState<AnalysisState | null>(null);
  const [loadingStored, setLoadingStored] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchStored() {
      try {
        const res = await fetch(
          `/api/biopila/analyze?datasetId=${encodeURIComponent(datasetId)}&biopilaId=${encodeURIComponent(biopilaId)}`
        );
        const data = (await res.json()) as {
          analysis?: string | null;
          generatedAt?: string;
          isStale?: boolean;
          error?: string;
        };
        if (active && data.analysis) {
          setStored({
            analysis: data.analysis,
            generatedAt: data.generatedAt ?? '',
            isStale: data.isStale ?? false,
          });
        }
      } finally {
        if (active) setLoadingStored(false);
      }
    }

    void fetchStored();
    return () => { active = false; };
  }, [datasetId, biopilaId]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/biopila/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, biopilaId }),
      });
      const data = (await res.json()) as {
        analysis?: string;
        generatedAt?: string;
        isStale?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'No se pudo generar el analisis.');
        return;
      }
      setStored({
        analysis: data.analysis ?? '',
        generatedAt: data.generatedAt ?? new Date().toISOString(),
        isStale: false,
      });
    } catch {
      setError('Error de red al solicitar el analisis.');
    } finally {
      setGenerating(false);
    }
  }, [datasetId, biopilaId]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Analisis del Copilot</CardTitle>
        {stored && !generating && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-foreground"
            onClick={() => void generate()}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Regenerar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingStored && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Cargando...</span>
          </div>
        )}

        {!loadingStored && !stored && !generating && !error && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Genera un analisis con IA para esta biopila: evolucion del proceso, tiempo estimado de
              remediacion, condiciones suboptimas y ajustes recomendados.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-fit border-border"
              onClick={() => void generate()}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generar analisis
            </Button>
          </div>
        )}

        {generating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analizando...</span>
          </div>
        )}

        {error && !generating && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-red-400">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-red-300"
              onClick={() => void generate()}
            >
              Reintentar
            </Button>
          </div>
        )}

        {stored && !generating && (
          <>
            {stored.isStale && (
              <div className="flex items-start gap-2 rounded-md border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Hay nuevas mediciones desde el ultimo analisis. Regenera para obtener un analisis
                  actualizado.
                </span>
              </div>
            )}
            <RichExplanation content={stored.analysis} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
