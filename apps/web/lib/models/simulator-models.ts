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

const KINETICS_CAPTION =
  'Linea base: k (1/d) se ajusta por regresion sobre ln(TPH/TPH0) vs t con el historial. Escenario simulado: se usa la misma TPH0 y el mismo k, pero la tasa efectiva es k M, con M = producto de factores adimensionales que comparan los sliders con la ultima medicion: temperatura (ley Q10 respecto a la referencia), humedad (campana alrededor de un optimo), oxigeno y nutrientes N-P-K (cinética tipo Monod / limitacion), y volteo (proxy de aeracion-mezcla con intervalos entre volteos). Los coeficientes (Q10, K de Monod, forma de humedad) son valores a priori calibrables; no sustituyen un ensayo de campo.';

export const SIMULATOR_MODELS: SimulatorModelMeta[] = [
  {
    id: 'conservative-180',
    name: 'Exponencial conservadora (180 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: KINETICS_CAPTION,
    hypothesis:
      'Cinética de primer orden en TPH en el historial; los factores f_i escalan la tasa segun variables operativas respecto a la ultima medicion (formulacion habitual en microbiologia de suelos y limitacion por sustrato).',
    limitations:
      'Horizonte corto para limitar extrapolacion; M es un modelo compacto: no captura todos los fenomenos (metabolitos, toxicidad, heterogeneidad espacial).',
    horizonDays: 180,
  },
  {
    id: 'standard-360',
    name: 'Exponencial estandar (360 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: KINETICS_CAPTION,
    hypothesis:
      'La trayectoria observada es compatible con una tasa efectiva constante en el tramo ajustado; M modula esa tasa segun hipotesis de Q10, Monod y disponibilidad de agua.',
    limitations:
      'Asume que el historial representa el regimen futuro; no garantiza plazos ni reemplaza validacion experimental.',
    horizonDays: 360,
  },
  {
    id: 'extended-540',
    name: 'Exponencial extendida (540 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: KINETICS_CAPTION,
    hypothesis:
      'Con historial suficiente, la misma forma exponencial puede proyectarse mas alla; M sigue interpretandose como escenario operativo frente a la ultima medicion.',
    limitations:
      'A mayor horizonte, mayor incertidumbre; la sensibilidad a sliders no implica precision absoluta del tiempo de remediacion.',
    horizonDays: 540,
  },
  {
    id: 'custom-horizon',
    name: 'Horizonte personalizado',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: `${KINETICS_CAPTION} El horizonte de dias de proyeccion se fija explicitamente cuando no coincide con un modelo predefinido.`,
    hypothesis:
      'Misma forma que los demas modelos; solo cambia el horizonte numerico de la rejilla temporal.',
    limitations:
      'Revisar coherencia entre horizonte elegido, datos disponibles y uso de la simulacion.',
    horizonDays: 360,
  },
];

/** Modelos elegibles en la UI (excluye variantes solo para API/herramientas). */
export const SIMULATOR_MODELS_SELECTABLE = SIMULATOR_MODELS.filter(
  (m) => m.id !== 'custom-horizon'
);

/** Opciones alineadas con `SimulateScenarioOptions` en simulator.ts. */
export function resolveSimulationModelFromOptions(options?: {
  modelId?: string;
  horizonDays?: number;
}): { modelId: string; horizonDays: number } {
  const explicitModelId = options?.modelId;
  const explicitHorizon = options?.horizonDays;

  if (explicitModelId) {
    const meta = getSimulatorModelById(explicitModelId);
    const normalizedId =
      meta != null ? explicitModelId : 'standard-360';
    const horizon =
      explicitHorizon ??
      meta?.horizonDays ??
      resolveSimulatorHorizonDays(normalizedId);
    return { modelId: normalizedId, horizonDays: horizon };
  }

  if (explicitHorizon != null) {
    const byHorizon = SIMULATOR_MODELS_SELECTABLE.find(
      (m) => m.horizonDays === explicitHorizon
    );
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
