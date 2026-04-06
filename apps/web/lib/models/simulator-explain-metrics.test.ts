import { describe, expect, it } from 'vitest';
import type { SimulationResult } from '@tphzero/domain';
import {
  buildSimulatorSeriesFacts,
  firstDayWhereTphAtOrBelow,
  TPH_CASI_CERO_MGKG,
} from './simulator-explain-metrics';

describe('firstDayWhereTphAtOrBelow', () => {
  it('devuelve el primer dia en que TPH <= umbral', () => {
    const days = [0, 100, 198, 250];
    const tph = [80000, 1000, 0, 0];
    expect(firstDayWhereTphAtOrBelow(days, tph, 0.5)).toBe(198);
  });

  it('devuelve null si nunca baja del umbral', () => {
    const days = [0, 100];
    const tph = [100, 50];
    expect(firstDayWhereTphAtOrBelow(days, tph, TPH_CASI_CERO_MGKG)).toBeNull();
  });
});

describe('buildSimulatorSeriesFacts', () => {
  it('extrae hechos alineados con el ultimo punto y el primer cruce a casi cero', () => {
    const result: SimulationResult = {
      baseline: {
        days: [0, 198, 900],
        tphProjected: [80000, 40000, 1000],
      },
      simulated: {
        days: [0, 198, 900],
        tphProjected: [80000, 0, 0],
      },
      deltaReductionPct: 0.06,
      estimatedTimeSavedDays: null,
      modelId: 'extended-540',
      horizonDays: 540,
      kinetics: {
        kPerDay: 0.01,
        tphInitialMgkg: 80000,
        effectiveRateMultiplier: 1.1,
        referenceTiempoDias: 30,
        factors: [],
      },
    };

    const f = buildSimulatorSeriesFacts(result);
    expect(f.ultimoDiaEnSerie).toBe(900);
    expect(f.tphFinalSimuladoMgkg).toBe(0);
    expect(f.primerDiaSimuladoTphCasiNulo).toBe(198);
    expect(f.deltaReduccionAcumuladaPpDelInicial).toBe(0.06);
  });

  it('con series vacias no inventa ceros en hechos de TPH/dia', () => {
    const empty: SimulationResult = {
      baseline: { days: [], tphProjected: [] },
      simulated: { days: [], tphProjected: [] },
      deltaReductionPct: 0,
      estimatedTimeSavedDays: null,
      modelId: 'standard-360',
      horizonDays: 360,
      kinetics: {
        kPerDay: 0,
        tphInitialMgkg: 1000,
        effectiveRateMultiplier: 1,
        referenceTiempoDias: 0,
        factors: [],
      },
    };
    const f = buildSimulatorSeriesFacts(empty);
    expect(f.tphInicialSerieMgkg).toBeNull();
    expect(f.ultimoDiaEnSerie).toBeNull();
    expect(f.tphFinalLineaBaseMgkg).toBeNull();
    expect(f.tphFinalSimuladoMgkg).toBeNull();
    expect(f.primerDiaSimuladoTphCasiNulo).toBeNull();
  });
});
