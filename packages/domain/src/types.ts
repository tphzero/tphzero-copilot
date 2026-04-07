export interface Measurement {
  id: string;
  datasetId: string;
  biopilaId: string | null;
  tiempoDias: number;
  temperaturaSueloC: number;
  humedadSueloPct: number;
  oxigenoPct: number;
  ph: number;
  conductividadMscm: number | null;
  tphInicialMgkg: number;
  tphActualMgkg: number;
  tipoHidrocarburo: 'liviano' | 'pesado';
  aguaAplicadaLM3: number;
  fertilizanteN: number;
  fertilizanteP: number;
  fertilizanteK: number;
  tensioactivo: 0 | 1;
  enmienda: 'biochar' | 'diatomeas' | 'ninguna';
  frecuenciaVolteoDias: number;
  temperaturaAmbienteC: number;
  humedadAmbientePct: number;
  precipitacionesMm: number;
  porcentajeReduccionTph: number;
  estadoSistema: 'optimo' | 'suboptimo' | 'critico' | null;
  recomendacionOperativa: string | null;
}

export interface Dataset {
  id: string;
  name: string;
  fileType: 'csv' | 'xlsx';
  rowCount: number;
  hasBiopilaId: boolean;
  createdAt: string;
}

export type SystemState = 'optimo' | 'suboptimo' | 'critico';

export interface BiopilaOverview {
  biopilaId: string;
  latestMeasurement: Measurement;
  measurements: Measurement[];
  state: SystemState;
  tphReductionPct: number;
  tiempoDias: number;
}

export interface PredictionResult {
  daysProjected: number[];
  tphProjected: number[];
  estimatedDaysTo90Pct: number | null;
  currentReductionRate: number;
  confidence: 'alta' | 'media' | 'baja';
  /** Si el ajuste exponencial TPH ~ exp(-k t) convergio, expone k y TPH0 usados. */
  kFit?: { kPerDay: number; tphInicialMgkg: number };
}

/** Trazabilidad del multiplicador operativo k_sim = k_historial * M (motor what-if). */
export interface SimulationKineticsInfo {
  /** k (1/d) ajustado al historial (TPH ~ exp(-k t)). */
  kPerDay: number;
  tphInitialMgkg: number;
  /** M: factor global; curva simulada usa k*M. */
  effectiveRateMultiplier: number;
  /** Dia de la medicion de referencia (ultima del historial ordenado). */
  referenceTiempoDias: number;
  factors: {
    id: string;
    label: string;
    ratio: number;
    basis: string;
  }[];
}

export interface SimulationResult {
  baseline: { tphProjected: number[]; days: number[] };
  simulated: { tphProjected: number[]; days: number[] };
  deltaReductionPct: number;
  estimatedTimeSavedDays: number | null;
  /** Identificador del modelo de simulacion usado (registro en cliente). */
  modelId: string;
  /** Horizonte de proyeccion en dias (alineado con el modelo seleccionado). */
  horizonDays: number;
  /** Como se combinan datos historicos y parametros operativos (transparencia). */
  kinetics: SimulationKineticsInfo;
}

export interface CorrelationResult {
  variable: string;
  correlation: number;
  strength: 'fuerte' | 'moderada' | 'débil';
}

export interface AnomalyResult {
  variable: string;
  value: number;
  zScore: number;
  optimalRange: [number, number];
  severity: 'advertencia' | 'critico';
}
