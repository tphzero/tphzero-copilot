import { describe, it, expect } from 'vitest';
import {
  classifyBiopilaState,
  reductionPercent,
  mean,
  stdDev,
  pearsonCorrelation,
  measurementAtOrBefore,
  buildReductionHorizonOptions,
  tphReductionAtTiempoDias,
  tphRemediationDynamics,
} from '../calculations';
import { primaryEnvironmentalDeviation } from '../state-explanation';
import { classifyValue } from '../thresholds';
import type { Measurement } from '../types';

const baseMeasurement: Measurement = {
  id: '1', datasetId: '1', biopilaId: 'B1', tiempoDias: 30,
  temperaturaSueloC: 20, humedadSueloPct: 25, oxigenoPct: 15, ph: 7.0,
  conductividadMscm: 2, tphInicialMgkg: 80000, tphActualMgkg: 60000,
  tipoHidrocarburo: 'liviano', aguaAplicadaLM3: 40, fertilizanteN: 20,
  fertilizanteP: 10, fertilizanteK: 15, tensioactivo: 1, enmienda: 'biochar',
  frecuenciaVolteoDias: 15, temperaturaAmbienteC: 18, humedadAmbientePct: 50,
  precipitacionesMm: 5, porcentajeReduccionTph: 0.25,
  estadoSistema: null, recomendacionOperativa: null,
};

describe('measurementAtOrBefore', () => {
  it('returns last measurement at or before target', () => {
    const m0 = { ...baseMeasurement, tiempoDias: 0, tphActualMgkg: 80000 };
    const m30 = { ...baseMeasurement, tiempoDias: 30, tphActualMgkg: 60000 };
    const m90 = { ...baseMeasurement, tiempoDias: 90, tphActualMgkg: 40000 };
    expect(measurementAtOrBefore([m30, m0, m90], 45)?.tiempoDias).toBe(30);
    expect(measurementAtOrBefore([m30, m0, m90], 90)?.tiempoDias).toBe(90);
  });
  it('returns null for empty measurements', () => {
    expect(measurementAtOrBefore([], 30)).toBeNull();
  });
});

describe('buildReductionHorizonOptions', () => {
  it('adds steps of 30 and last day', () => {
    expect(buildReductionHorizonOptions(360)).toEqual([30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360]);
    expect(buildReductionHorizonOptions(45)).toEqual([30, 45]);
    expect(buildReductionHorizonOptions(15)).toEqual([15]);
  });
  it('returns [0] for non-positive max', () => {
    expect(buildReductionHorizonOptions(0)).toEqual([0]);
  });
});

describe('tphReductionAtTiempoDias', () => {
  it('uses measurement at or before target and initial TPH from first row', () => {
    const m0 = { ...baseMeasurement, tiempoDias: 0, tphActualMgkg: 80000 };
    const m60 = { ...baseMeasurement, tiempoDias: 60, tphActualMgkg: 40000 };
    expect(tphReductionAtTiempoDias([m0, m60], 60)).toBeCloseTo(0.5);
    expect(tphReductionAtTiempoDias([m0, m60], 45)).toBeCloseTo(
      reductionPercent(80000, 80000)
    );
  });
});

describe('reductionPercent', () => {
  it('returns 0.5 for 50% reduction', () => {
    expect(reductionPercent(100000, 50000)).toBeCloseTo(0.5);
  });
  it('returns 0 when initial is 0', () => {
    expect(reductionPercent(0, 50000)).toBe(0);
  });
  it('clamps to 0 when actual > initial', () => {
    expect(reductionPercent(50000, 80000)).toBe(0);
  });
});

describe('mean', () => {
  it('calculates mean', () => {
    expect(mean([10, 20, 30])).toBe(20);
  });
  it('returns 0 for empty', () => {
    expect(mean([])).toBe(0);
  });
});

describe('stdDev', () => {
  it('calculates sample std dev', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
  });
  it('returns 0 for single value', () => {
    expect(stdDev([5])).toBe(0);
  });
});

describe('pearsonCorrelation', () => {
  it('returns ~1 for perfect positive', () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
  });
  it('returns ~-1 for perfect negative', () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
  });
  it('returns 0 for insufficient data', () => {
    expect(pearsonCorrelation([1], [2])).toBe(0);
  });
});

describe('classifyValue', () => {
  it('classifies optimal pH', () => {
    expect(classifyValue('ph', 7.0)).toBe('optimo');
  });
  it('classifies suboptimal pH', () => {
    expect(classifyValue('ph', 6.2)).toBe('suboptimo');
  });
  it('classifies critical pH', () => {
    expect(classifyValue('ph', 4.0)).toBe('critico');
  });
});

describe('classifyBiopilaState', () => {
  it('returns optimo when all in optimal range', () => {
    expect(classifyBiopilaState(baseMeasurement)).toBe('optimo');
  });
  it('returns critico when any variable is critical', () => {
    expect(classifyBiopilaState({ ...baseMeasurement, ph: 4.0 })).toBe('critico');
  });
  it('returns suboptimo when variable is acceptable not optimal', () => {
    expect(classifyBiopilaState({ ...baseMeasurement, humedadSueloPct: 15 })).toBe('suboptimo');
  });
});

describe('primaryEnvironmentalDeviation', () => {
  it('returns null when all variables optimal', () => {
    expect(primaryEnvironmentalDeviation(baseMeasurement)).toBeNull();
  });
  it('returns pH when critical', () => {
    const d = primaryEnvironmentalDeviation({ ...baseMeasurement, ph: 4.0 });
    expect(d?.variableKey).toBe('ph');
    expect(d?.status).toBe('critico');
  });
  it('returns humedad when suboptimal', () => {
    const d = primaryEnvironmentalDeviation({ ...baseMeasurement, humedadSueloPct: 15 });
    expect(d?.variableKey).toBe('humedad_suelo_pct');
    expect(d?.status).toBe('suboptimo');
  });
});

describe('tphRemediationDynamics', () => {
  it('returns nulls when fewer than two measurements', () => {
    expect(tphRemediationDynamics([baseMeasurement])).toEqual({
      mgKgPerWeekRecent: null,
      mgKgPerWeekPrevious: null,
      recentVsPreviousRatio: null,
    });
    expect(tphRemediationDynamics([])).toEqual({
      mgKgPerWeekRecent: null,
      mgKgPerWeekPrevious: null,
      recentVsPreviousRatio: null,
    });
  });

  it('computes parallel slopes and ratio ~1 for linear decline', () => {
    const m0 = { ...baseMeasurement, id: 'a', tiempoDias: 0, tphActualMgkg: 100_000 };
    const m60 = { ...baseMeasurement, id: 'b', tiempoDias: 60, tphActualMgkg: 80_000 };
    const m120 = { ...baseMeasurement, id: 'c', tiempoDias: 120, tphActualMgkg: 60_000 };
    const r = tphRemediationDynamics([m0, m60, m120], { recentDays: 60 });
    expect(r.mgKgPerWeekRecent).toBeCloseTo((80_000 - 60_000) / (60 / 7));
    expect(r.mgKgPerWeekPrevious).toBeCloseTo((100_000 - 80_000) / (60 / 7));
    expect(r.recentVsPreviousRatio).toBeCloseTo(1);
  });
});
