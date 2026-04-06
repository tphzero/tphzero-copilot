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
    };

    const f = buildSimulatorSeriesFacts(result);
    expect(f.ultimoDiaEnSerie).toBe(900);
    expect(f.tphFinalSimuladoMgkg).toBe(0);
    expect(f.primerDiaSimuladoTphCasiNulo).toBe(198);
    expect(f.deltaReduccionAcumuladaPpDelInicial).toBe(0.06);
  });
});
