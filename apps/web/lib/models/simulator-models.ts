import type { Measurement } from '@tphzero/domain';

export interface SimulatorModelMeta {
  id: string;
  name: string;
  /** Formula principal en notacion LaTeX (KaTeX), p. ej. exponencial. */
  equationLatex: string;
  /** Texto aclaratorio tras la formula (texto plano). */
  equationCaption: string;
  hypothesis: string;
  limitations: string;
  /** Horizonte extra de proyeccion respecto al ultimo dia observado (dias). */
  horizonDays: number;
}

export const SIMULATOR_MODELS: SimulatorModelMeta[] = [
  {
    id: 'conservative-180',
    name: 'Exponencial conservadora (180 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k t} \quad (\mathrm{mg/kg})`,
    equationCaption:
      'k se estima por regresion lineal sobre ln(TPH/TPH0) frente al tiempo t (dias), con datos del historial.',
    hypothesis:
      'La degradacion sigue una ley exponencial; el horizonte corto reduce el riesgo de extrapolacion con pocos datos.',
    limitations:
      'Menos precision a largo plazo; no modela cambios bruscos de regimen ni eventos puntuales no reflejados en el historial.',
    horizonDays: 180,
  },
  {
    id: 'standard-360',
    name: 'Exponencial estandar (360 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k t} \quad (\mathrm{mg/kg})`,
    equationCaption:
      'k se estima por regresion lineal sobre ln(TPH/TPH0) frente al tiempo t (dias), con datos del historial.',
    hypothesis:
      'La reduccion de TPH es aproximadamente exponencial en el tiempo con parametros estables en el rango observado.',
    limitations:
      'Asume continuidad del proceso; no sustituye mediciones de campo ni garantiza el cumplimiento de plazos.',
    horizonDays: 360,
  },
  {
    id: 'extended-540',
    name: 'Exponencial extendida (540 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k t} \quad (\mathrm{mg/kg})`,
    equationCaption:
      'k se estima por regresion lineal sobre ln(TPH/TPH0) frente al tiempo t (dias), con datos del historial.',
    hypothesis:
      'Con historial suficiente, la misma forma exponencial puede proyectarse mas alla del horizonte estandar.',
    limitations:
      'A mayor horizonte, mayor incertidumbre; revisar coherencia con limites operativos y nuevas mediciones.',
    horizonDays: 540,
  },
  {
    id: 'custom-horizon',
    name: 'Horizonte personalizado',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k t} \quad (\mathrm{mg/kg})`,
    equationCaption:
      'k se estima por regresion lineal sobre ln(TPH/TPH0) frente al tiempo t (dias). El numero de dias de horizonte se fija explicitamente (p. ej. desde la herramienta de chat) cuando no coincide con un modelo predefinido.',
    hypothesis:
      'Misma forma exponencial que los demas modelos; el horizonte de dias es el indicado en la simulacion.',
    limitations:
      'Revisar que el horizonte elegido sea coherente con los datos y con el uso previsto del escenario.',
    horizonDays: 360,
  },
];

/** Opciones alineadas con `SimulateScenarioOptions` en simulator.ts. */
export function resolveSimulationModelFromOptions(options?: {
  modelId?: string;
  horizonDays?: number;
}): { modelId: string; horizonDays: number } {
  const explicitModelId = options?.modelId;
  const explicitHorizon = options?.horizonDays;

  if (explicitModelId) {
    const meta = getSimulatorModelById(explicitModelId);
    const horizon =
      explicitHorizon ??
      meta?.horizonDays ??
      resolveSimulatorHorizonDays(explicitModelId);
    return { modelId: explicitModelId, horizonDays: horizon };
  }

  if (explicitHorizon != null) {
    const byHorizon = SIMULATOR_MODELS.find((m) => m.horizonDays === explicitHorizon);
    if (byHorizon) {
      return { modelId: byHorizon.id, horizonDays: explicitHorizon };
    }
    return { modelId: 'custom-horizon', horizonDays: explicitHorizon };
  }

  return {
    modelId: 'standard-360',
    horizonDays: resolveSimulatorHorizonDays('standard-360'),
  };
}

export function getSimulatorModelById(id: string): SimulatorModelMeta | undefined {
  return SIMULATOR_MODELS.find((m) => m.id === id);
}

/**
 * Misma entrada -> mismo modelo recomendado (reglas fijas; ver comentarios).
 * Criterios: numero de puntos y cobertura temporal (dias entre primera y ultima medicion).
 */
export function recommendSimulatorModel(
  measurements: Measurement[]
): { modelId: string; reason: string } {
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  if (sorted.length < 2) {
    return {
      modelId: 'standard-360',
      reason: 'Menos de dos mediciones: se usa el horizonte estandar por defecto.',
    };
  }

  const n = sorted.length;
  const span = sorted[sorted.length - 1]!.tiempoDias - sorted[0]!.tiempoDias;

  if (n < 5 || span < 45) {
    return {
      modelId: 'conservative-180',
      reason:
        'Pocas mediciones o cobertura temporal corta: se recomienda un horizonte reducido para limitar extrapolacion.',
    };
  }

  if (n >= 8 && span >= 120) {
    return {
      modelId: 'extended-540',
      reason:
        'Historial amplio y buena cobertura temporal: se puede proyectar con un horizonte extendido.',
    };
  }

  return {
    modelId: 'standard-360',
    reason: 'Historial adecuado para el horizonte de prediccion estandar.',
  };
}

export function resolveSimulatorHorizonDays(modelId: string | undefined): number {
  const meta = modelId ? getSimulatorModelById(modelId) : undefined;
  return meta?.horizonDays ?? 360;
}
