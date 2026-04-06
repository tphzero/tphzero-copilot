import type { Measurement } from '@tphzero/domain';

/**
 * Valores de sliders del simulador (mismas claves que `SimulationParams` en simulator.ts).
 * Definido aqui para evitar dependencia circular con el motor.
 */
export interface OperationalSliderValues {
  humedadSueloPct?: number;
  temperaturaSueloC?: number;
  oxigenoPct?: number;
  fertilizanteN?: number;
  fertilizanteP?: number;
  fertilizanteK?: number;
  frecuenciaVolteoDias?: number;
}

export interface OperationalFactorBreakdown {
  id: string;
  label: string;
  /** f(sim) / f(ref): aportacion multiplicativa respecto a la ultima medicion. */
  ratio: number;
  /** Breve nota de la ley usada (para UI). */
  basis: string;
}

export interface OperationalRateMultiplierResult {
  /** Producto de ratios; k_sim = k_historial * multiplier (acotado). */
  multiplier: number;
  factors: OperationalFactorBreakdown[];
}

/** Regla Q10 habitual en ecologia del suelo (reactividad biologica ~ duplica cada 10 °C). */
const Q10 = 2;

/** Semisaturacion Monod para O2 en suelo (%). Orden de magnitud habitual en modelos de respiracion. */
const K_O2_PCT = 5;

/** Semisaturacion Monod para N, P, K (mg/kg) — orden de magnitud para biostimulacion. */
const K_N_MGKG = 22;
const K_P_MGKG = 8;
const K_K_MGKG = 10;

/** Centro y ancho de la campana de humedad (ventana optima tipo THRESHOLDS 20–35 %). */
const HUMEDAD_OPT_PCT = 27.5;
const HUMEDAD_SIGMA_PCT = 8;

/** Escala de volteo: dias caracteristicos (aeracion / mezcla). */
const VOLTEO_SCALE_DAYS = 21;

const MULT_MIN = 0.12;
const MULT_MAX = 3.2;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function monod(s: number, k: number): number {
  const d = k + s;
  return d > 0 ? s / d : 0;
}

/** Campana gaussiana en torno a humedad optima (limitacion por sequedad o encharcamiento). */
function moistureActivity(wPct: number): number {
  const z = (wPct - HUMEDAD_OPT_PCT) / HUMEDAD_SIGMA_PCT;
  return 0.08 + 0.92 * Math.exp(-0.5 * z * z);
}

/** Aeracion por frecuencia de volteo: intervalos mas cortos aumentan el factor. */
function turningActivity(daysBetween: number): number {
  const d = Math.max(1, daysBetween);
  return 1 / (1 + d / VOLTEO_SCALE_DAYS);
}

function ratioSafe(num: number, den: number, eps = 1e-9): number {
  if (den < eps) return num < eps ? 1 : MULT_MAX;
  return num / den;
}

/**
 * Compara el estado operativo "simulado" (sliders) frente a la ultima medicion (referencia)
 * y devuelve el multiplicador M tal que k_efectivo = k_historial * M.
 *
 * Formulacion (producto de factores adimensionales, cada uno con interpretacion en literatura):
 * - Temperatura: ley Q10 respecto a la referencia (microbiologia del suelo).
 * - Humedad: factor tipo campana alrededor de un optimo (disponibilidad de agua / aire).
 * - Oxigeno, N, P, K: cinética tipo Monod (limitacion por sustrato / nutriente).
 * - Volteo: proxy de aeracion/mezcla decreciente con el intervalo entre volteos.
 *
 * Los coeficientes son prior calibrables; la UI debe presentar esto como estimacion, no verdad de campo.
 */
export function computeOperationalRateMultiplier(
  reference: Measurement,
  simulated: OperationalSliderValues
): OperationalRateMultiplierResult {
  const Tref = reference.temperaturaSueloC;
  const Wref = reference.humedadSueloPct;
  const Oref = reference.oxigenoPct;
  const Nref = reference.fertilizanteN;
  const Pref = reference.fertilizanteP;
  const Kref = reference.fertilizanteK;
  const Vref = reference.frecuenciaVolteoDias;

  const T = simulated.temperaturaSueloC ?? Tref;
  const W = simulated.humedadSueloPct ?? Wref;
  const O = simulated.oxigenoPct ?? Oref;
  const N = simulated.fertilizanteN ?? Nref;
  const P = simulated.fertilizanteP ?? Pref;
  const K = simulated.fertilizanteK ?? Kref;
  const V = simulated.frecuenciaVolteoDias ?? Vref;

  const rT = Q10 ** ((T - Tref) / 10);
  const rTclamped = clamp(rT, 0.25, 2.8);

  const fW = moistureActivity(W);
  const fWref = moistureActivity(Wref);
  const rW = ratioSafe(fW, fWref);

  const fO = monod(O, K_O2_PCT);
  const fOref = monod(Oref, K_O2_PCT);
  const rO = ratioSafe(fO, fOref, 1e-6);

  const fN = monod(N, K_N_MGKG);
  const fNref = monod(Nref, K_N_MGKG);
  const rN = ratioSafe(fN, fNref, 1e-6);

  const fP = monod(P, K_P_MGKG);
  const fPref = monod(Pref, K_P_MGKG);
  const rP = ratioSafe(fP, fPref, 1e-6);

  const fK = monod(K, K_K_MGKG);
  const fKref = monod(Kref, K_K_MGKG);
  const rK = ratioSafe(fK, fKref, 1e-6);

  const fV = turningActivity(V);
  const fVref = turningActivity(Vref);
  const rVol = ratioSafe(fV, fVref, 1e-6);

  let M = rTclamped * rW * rO * rN * rP * rK * rVol;
  M = clamp(M, MULT_MIN, MULT_MAX);

  const factors: OperationalFactorBreakdown[] = [
    {
      id: 'temperatura',
      label: 'Temperatura (Q10)',
      ratio: rTclamped,
      basis: `Q10=${Q10}: factor ${rTclamped.toFixed(3)} respecto a la referencia`,
    },
    {
      id: 'humedad',
      label: 'Humedad (campana)',
      ratio: rW,
      basis: 'Campana alrededor del rango optimo de humedad',
    },
    {
      id: 'oxigeno',
      label: 'Oxigeno (Monod)',
      ratio: rO,
      basis: `Semisaturacion K=${K_O2_PCT}%`,
    },
    {
      id: 'n',
      label: 'N (Monod)',
      ratio: rN,
      basis: `K=${K_N_MGKG} mg/kg`,
    },
    {
      id: 'p',
      label: 'P (Monod)',
      ratio: rP,
      basis: `K=${K_P_MGKG} mg/kg`,
    },
    {
      id: 'k',
      label: 'K (Monod)',
      ratio: rK,
      basis: `K=${K_K_MGKG} mg/kg`,
    },
    {
      id: 'volteo',
      label: 'Volteo / mezcla',
      ratio: rVol,
      basis: `1/(1+d/${VOLTEO_SCALE_DAYS} d) con d = dias entre volteos`,
    },
  ];

  return { multiplier: M, factors };
}
