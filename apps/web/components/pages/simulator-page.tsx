'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import type { Measurement } from '@tphzero/domain';
import { ActiveModelPanel } from '@/components/simulator/active-model-panel';
import { ComparisonChart } from '@/components/simulator/comparison-chart';
import { LatexMarkdown } from '@/components/simulator/latex-markdown';
import { SimulatorExplanation } from '@/components/simulator/simulator-explanation';
import { SimulatorKineticsPanel } from '@/components/simulator/simulator-kinetics-panel';
import { VariableSliders } from '@/components/simulator/variable-sliders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapRow } from '@/lib/data/map-row';
import { useActiveDataset } from '@/lib/context/dataset-context';
import {
  getSimulatorModelById,
  recommendSimulatorModel,
  SIMULATOR_MODELS,
  SIMULATOR_MODELS_SELECTABLE,
} from '@/lib/models/simulator-models';
import { simulateScenario } from '@/lib/models/simulator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SimulatorValues = Record<string, number>;

const PARAM_KEYS = [
  'humedadSueloPct',
  'temperaturaSueloC',
  'oxigenoPct',
  'fertilizanteN',
  'fertilizanteP',
  'fertilizanteK',
  'frecuenciaVolteoDias',
] as const satisfies readonly (keyof SimulatorValues)[];

function getValuesFromMeasurement(measurement: Measurement): SimulatorValues {
  return {
    humedadSueloPct: measurement.humedadSueloPct,
    temperaturaSueloC: measurement.temperaturaSueloC,
    oxigenoPct: measurement.oxigenoPct,
    fertilizanteN: measurement.fertilizanteN,
    fertilizanteP: measurement.fertilizanteP,
    fertilizanteK: measurement.fertilizanteK,
    frecuenciaVolteoDias: measurement.frecuenciaVolteoDias,
  };
}

function getAdjustedParamKeys(
  values: SimulatorValues,
  base: Measurement | undefined
): string[] {
  if (!base) return [];
  const out: string[] = [];
  for (const key of PARAM_KEYS) {
    const v = values[key];
    const b = base[key as keyof Measurement];
    if (typeof v === 'number' && typeof b === 'number' && Math.abs(v - b) > 1e-5) {
      out.push(key);
    }
  }
  return out;
}

export function SimulatorPage() {
  const router = useRouter();
  const { activeDataset } = useActiveDataset();
  const [allMeasurements, setAllMeasurements] = useState<Measurement[]>([]);
  const [selectedBiopila, setSelectedBiopila] = useState('');
  const [values, setValues] = useState<SimulatorValues>({
    humedadSueloPct: 25,
    temperaturaSueloC: 20,
    oxigenoPct: 12,
    fertilizanteN: 30,
    fertilizanteP: 15,
    fertilizanteK: 20,
    frecuenciaVolteoDias: 30,
  });
  const [selectedModelId, setSelectedModelId] = useState('standard-360');
  const [explanationStale, setExplanationStale] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeDataset) {
      router.replace('/');
      return;
    }

    const datasetId = activeDataset.id;
    let active = true;

    async function loadSimulator() {
      try {
        const detailResponse = await fetch(`/api/data/${datasetId}`);
        const detailPayload = (await detailResponse.json()) as {
          measurements?: Record<string, unknown>[];
        };

        if (!active) return;

        const measurements = (detailPayload.measurements ?? []).map(mapRow);
        setAllMeasurements(measurements);

        const biopilaIds = [
          ...new Set(
            measurements
              .map((measurement) => measurement.biopilaId)
              .filter((biopilaId): biopilaId is string => Boolean(biopilaId))
          ),
        ];

        const initialBiopila = biopilaIds[0] ?? '';
        setSelectedBiopila(initialBiopila);

        if (initialBiopila) {
          const latestMeasurement = measurements
            .filter((measurement) => measurement.biopilaId === initialBiopila)
            .sort((a, b) => b.tiempoDias - a.tiempoDias)[0];

          if (latestMeasurement) {
            setValues(getValuesFromMeasurement(latestMeasurement));
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSimulator();

    return () => {
      active = false;
    };
  }, [activeDataset, router]);

  const biopilaIds = useMemo(
    () => [
      ...new Set(
        allMeasurements
          .map((measurement) => measurement.biopilaId)
          .filter((biopilaId): biopilaId is string => Boolean(biopilaId))
      ),
    ],
    [allMeasurements]
  );

  const selectedMeasurements = useMemo(
    () =>
      allMeasurements
        .filter((measurement) => measurement.biopilaId === selectedBiopila)
        .sort((a, b) => a.tiempoDias - b.tiempoDias),
    [allMeasurements, selectedBiopila]
  );

  const recommendation = useMemo(() => {
    if (selectedMeasurements.length < 2) {
      return { modelId: 'standard-360' as const, reason: '' };
    }
    return recommendSimulatorModel(selectedMeasurements);
  }, [selectedMeasurements]);

  useEffect(() => {
    if (!selectedBiopila) return;

    const latestMeasurement = selectedMeasurements[selectedMeasurements.length - 1];
    if (!latestMeasurement) return;

    setValues(getValuesFromMeasurement(latestMeasurement));
  }, [selectedBiopila, selectedMeasurements]);

  useEffect(() => {
    const scoped = allMeasurements
      .filter((measurement) => measurement.biopilaId === selectedBiopila)
      .sort((a, b) => a.tiempoDias - b.tiempoDias);
    if (scoped.length < 2) {
      return;
    }
    setSelectedModelId(recommendSimulatorModel(scoped).modelId);
  }, [selectedBiopila, activeDataset?.id, allMeasurements]);

  const result = useMemo(() => {
    if (selectedMeasurements.length < 2) return null;
    return simulateScenario(selectedMeasurements, values, { modelId: selectedModelId });
  }, [selectedMeasurements, values, selectedModelId]);

  useEffect(() => {
    setExplanationStale(true);
  }, [values, selectedModelId, selectedBiopila, activeDataset?.id, selectedMeasurements]);

  const latestMeasurement = selectedMeasurements[selectedMeasurements.length - 1];
  const adjustedParamKeys = useMemo(
    () => getAdjustedParamKeys(values, latestMeasurement),
    [values, latestMeasurement]
  );
  const modelMeta = getSimulatorModelById(selectedModelId) ?? SIMULATOR_MODELS[1]!;

  const resetValues = () => {
    if (!latestMeasurement) return;
    setValues(getValuesFromMeasurement(latestMeasurement));
    setExplanationStale(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Cargando datos...</p>
      </div>
    );
  }

  if (allMeasurements.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Sin datos para simular</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Carga un dataset para probar escenarios operativos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (biopilaIds.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Simulador disponible solo para datasets con biopila_id</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              El simulador requiere mediciones por biopila para comparar escenarios.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Simulador What-If</h1>
        <LatexMarkdown
          className="text-sm text-muted-foreground"
          content={
            'Modifica variables operativas y observa como cambia la proyeccion de $\\mathrm{TPH}$. ' +
            'La **linea base** usa solo el historial ($k$ desde $\\ln(\\mathrm{TPH}/\\mathrm{TPH}_0)$ vs $t$). ' +
            'El **escenario simulado** escala la tasa con $M = \\prod_i f_i$ (regla $Q_{10}$, Monod, humedad, volteo) ' +
            'respecto a la ultima medicion. Abre *Como se calcula el escenario simulado* para el detalle y limitaciones.'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-border bg-card xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Variables operativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Biopila</label>
              <Select
                value={selectedBiopila}
                onValueChange={(value) => setSelectedBiopila(value ?? '')}
              >
                <SelectTrigger className="w-full border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {biopilaIds.map((biopilaId) => (
                    <SelectItem key={biopilaId} value={biopilaId}>
                      {biopilaId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {latestMeasurement ? (
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              >
                Base: dia {latestMeasurement.tiempoDias} - {latestMeasurement.tipoHidrocarburo}
              </Badge>
            ) : null}

            <VariableSliders
              values={values}
              onChange={(key, value) =>
                setValues((currentValues) => ({ ...currentValues, [key]: value }))
              }
            />

            <div className="flex gap-2 pt-2">
              <Button
                onClick={resetValues}
                variant="outline"
                className="flex-1 border-border"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restablecer a ultima medicion
              </Button>
            </div>

            {selectedMeasurements.length < 2 ? (
              <p className="text-xs text-muted-foreground">
                Se necesitan al menos 2 mediciones para simular esta biopila.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          {selectedMeasurements.length >= 2 ? (
            <>
              <ActiveModelPanel
                models={SIMULATOR_MODELS_SELECTABLE}
                selectedId={selectedModelId}
                recommendedId={recommendation.modelId}
                recommendationReason={recommendation.reason}
                onModelChange={(id) => setSelectedModelId(id)}
              />

              {result ? <SimulatorKineticsPanel kinetics={result.kinetics} /> : null}

              {result ? (
                <>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Comparacion: linea base vs. simulado</CardTitle>
                      <LatexMarkdown
                        className="text-xs text-muted-foreground"
                        content={`**Horizonte extra de proyeccion:** $H = ${result.horizonDays}~\\mathrm{d}$ (variante \`${result.modelId}\`).`}
                      />
                    </CardHeader>
                    <CardContent>
                      <ComparisonChart result={result} measurements={selectedMeasurements} />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Card className="border-border bg-card">
                      <CardContent className="pt-6">
                        <LatexMarkdown
                          className="text-xs text-muted-foreground"
                          content="**Ventaja maxima en reduccion** (respecto a $\\mathrm{TPH}_0$)"
                        />
                        <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                          {result.deltaReductionPct >= 0 ? '+' : ''}
                          {result.deltaReductionPct.toFixed(1)} pp
                        </p>
                        <LatexMarkdown
                          className="mt-2 text-xs leading-snug text-muted-foreground"
                          content={
                            'Maximo a lo largo de la curva en **puntos porcentuales** del $\\mathrm{TPH}$ inicial; donde la proyeccion simulada mas se separa de la base.'
                          }
                        />
                      </CardContent>
                    </Card>
                    <Card className="border-border bg-card">
                      <CardContent className="pt-6">
                        <LatexMarkdown
                          className="text-xs text-muted-foreground"
                          content="**Tiempo ahorrado** (estimado, $\\mathrm{d}$)"
                        />
                        <p className="mt-1 font-mono text-2xl font-bold text-blue-400">
                          {result.estimatedTimeSavedDays !== null
                            ? `${result.estimatedTimeSavedDays} d`
                            : 'N/A'}
                        </p>
                        <LatexMarkdown
                          className="mt-2 text-xs leading-snug text-muted-foreground"
                          content={
                            '$\\Delta t$ hasta alcanzar el $90\\%$ de reduccion de $\\mathrm{TPH}$ respecto al inicial (meta del modelo), comparando curvas proyectadas.'
                          }
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {activeDataset ? (
                    <SimulatorExplanation
                      datasetId={activeDataset.id}
                      biopilaId={selectedBiopila}
                      modelMeta={modelMeta}
                      result={result}
                      adjustedParamKeys={adjustedParamKeys}
                      explanationStale={explanationStale}
                      onGenerationSuccess={() => setExplanationStale(false)}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <Card className="flex h-64 items-center justify-center border-border bg-card">
              <p className="max-w-md text-center text-muted-foreground">
                Se necesitan al menos dos mediciones para esta biopila.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
