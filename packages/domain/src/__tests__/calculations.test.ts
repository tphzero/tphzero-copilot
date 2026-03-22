import { describe, it, expect } from 'vitest';
import {
  classifyBiopilaState,
  reductionPercent,
  mean,
  stdDev,
  pearsonCorrelation,
} from '../calculations';
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
