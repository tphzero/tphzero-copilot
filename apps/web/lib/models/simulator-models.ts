import type { Measurement } from '@tphzero/domain';

export interface SimulatorModelMeta {
  id: string;
  name: string;
  /** Formula principal en notacion LaTeX (KaTeX), p. ej. exponencial. */
  equationLatex: string;
  /** Texto aclaratorio (Markdown + LaTeX $...$ / $$...$$). */
  equationCaption: string;
  /** Markdown + LaTeX. */
  hypothesis: string;
  /** Markdown + LaTeX. */
  limitations: string;
  /** Horizonte extra de proyeccion respecto al ultimo dia observado (dias). */
  horizonDays: number;
}

/** Texto de ecuacion compartido; unidades y simbolos en LaTeX. */
const KINETICS_CAPTION =
  '**Linea base:** el coeficiente $k$ con unidades $\\mathrm{d}^{-1}$ se ajusta por regresion sobre ' +
  '$\\ln(\\mathrm{TPH}/\\mathrm{TPH}_0)$ frente al tiempo $t$ (en $\\mathrm{d}$) con el historial.\n\n' +
  '**Escenario simulado:** se usa la misma $\\mathrm{TPH}_0$ y el mismo $k$, pero la tasa efectiva es ' +
  '$k \\cdot M$, con $M$ igual al **producto** de factores adimensionales que comparan los sliders con la ' +
  'ultima medicion: temperatura (ley $Q_{10}$ respecto a la referencia), humedad (campana alrededor de un ' +
  'optimo), oxigeno y nutrientes N, P, K (cinetica tipo Monod / limitacion), y volteo (proxy de ' +
  'aeracion-mezcla con intervalos entre volteos en $\\mathrm{d}$). Los coeficientes ($Q_{10}$, $K$ de Monod, ' +
  'forma de humedad) son valores **a priori** calibrables; no sustituyen un ensayo de campo.';

export const SIMULATOR_MODELS: SimulatorModelMeta[] = [
  {
    id: 'conservative-180',
    name: 'Exponencial conservadora (180 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: KINETICS_CAPTION,
    hypothesis:
      'Cinetica de **primer orden** en $\\mathrm{TPH}$ en el historial; los factores $f_i$ escalan la tasa segun variables operativas respecto a la ultima medicion (formulacion habitual en microbiologia de suelos y limitacion por sustrato).',
    limitations:
      'Horizonte corto ($H = 180~\\mathrm{d}$ extra) para limitar extrapolacion; $M$ es un modelo compacto: no captura todos los fenomenos (metabolitos, toxicidad, heterogeneidad espacial).',
    horizonDays: 180,
  },
  {
    id: 'standard-360',
    name: 'Exponencial estandar (360 d)',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: KINETICS_CAPTION,
    hypothesis:
      'La trayectoria observada es compatible con una tasa efectiva **constante** en el tramo ajustado; $M$ modula esa tasa segun hipotesis de $Q_{10}$, Monod y disponibilidad de agua.',
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
      'Con historial suficiente, la misma forma exponencial puede proyectarse mas alla; $M$ sigue interpretandose como escenario operativo frente a la ultima medicion.',
    limitations:
      'A mayor horizonte ($H = 540~\\mathrm{d}$ extra), mayor incertidumbre; la sensibilidad a sliders no implica precision absoluta del tiempo de remediacion.',
    horizonDays: 540,
  },
  {
    id: 'custom-horizon',
    name: 'Horizonte personalizado',
    equationLatex:
      String.raw`\mathrm{TPH}(t) = \mathrm{TPH}_0 \, e^{-k M t}, \quad M = \prod_i f_i \quad (\mathrm{mg/kg})`,
    equationCaption: `${KINETICS_CAPTION} El horizonte de dias de proyeccion $H$ se fija explicitamente cuando no coincide con un modelo predefinido.`,
    hypothesis:
      'Misma forma que los demas modelos; solo cambia el horizonte numerico $H$ ($\\mathrm{d}$) de la rejilla temporal.',
    limitations:
      'Revisar coherencia entre horizonte elegido $H$, datos disponibles y uso de la simulacion.',
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
    const metaResolved = getSimulatorModelById(normalizedId)!;
    const defaultHorizon = metaResolved.horizonDays;
    const horizon = explicitHorizon ?? defaultHorizon;
    /** Si el horizonte explicito no coincide con el del modelo registrado, usar id custom-horizon. */
    const modelIdOut =
      explicitHorizon != null && explicitHorizon !== defaultHorizon
        ? 'custom-horizon'
        : normalizedId;
    return { modelId: modelIdOut, horizonDays: horizon };
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
 * Textos con LaTeX ($...$) para unidades y horizontes.
 */
export function recommendSimulatorModel(
  measurements: Measurement[]
): { modelId: string; reason: string } {
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  if (sorted.length < 2) {
    return {
      modelId: 'standard-360',
      reason:
        'Menos de dos mediciones: se usa el horizonte estandar ($H = 360~\\mathrm{d}$ extra) por defecto.',
    };
  }

  const n = sorted.length;
  const span = sorted[sorted.length - 1]!.tiempoDias - sorted[0]!.tiempoDias;

  if (n < 5 || span < 45) {
    return {
      modelId: 'conservative-180',
      reason:
        'Pocas mediciones o cobertura temporal corta ($\\Delta t < 45~\\mathrm{d}$): se recomienda horizonte reducido ($H = 180~\\mathrm{d}$ extra) para limitar extrapolacion.',
    };
  }

  if (n >= 8 && span >= 120) {
    return {
      modelId: 'extended-540',
      reason:
        'Historial amplio ($n \\ge 8$) y buena cobertura ($\\Delta t \\ge 120~\\mathrm{d}$): se puede proyectar con horizonte extendido ($H = 540~\\mathrm{d}$ extra).',
    };
  }

  return {
    modelId: 'standard-360',
    reason: 'Historial adecuado para el horizonte de prediccion estandar ($H = 360~\\mathrm{d}$ extra).',
  };
}

export function resolveSimulatorHorizonDays(modelId: string | undefined): number {
  const meta = modelId ? getSimulatorModelById(modelId) : undefined;
  return meta?.horizonDays ?? 360;
}
