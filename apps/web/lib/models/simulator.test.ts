import { describe, expect, it, vi } from 'vitest';
import type { Measurement } from '@tphzero/domain';
import * as predictor from './predictor';
import { simulateScenario } from './simulator';

function baseMeasurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    id: 'm1',
    datasetId: 'ds',
    biopilaId: 'B1',
    tiempoDias: 0,
    temperaturaSueloC: 22,
    humedadSueloPct: 30,
    oxigenoPct: 15,
    ph: 7,
    conductividadMscm: 1,
    tphInicialMgkg: 1000,
    tphActualMgkg: 900,
    tipoHidrocarburo: 'liviano',
    aguaAplicadaLM3: 0,
    fertilizanteN: 20,
    fertilizanteP: 10,
    fertilizanteK: 15,
    tensioactivo: 0,
    enmienda: 'ninguna',
    frecuenciaVolteoDias: 30,
    temperaturaAmbienteC: 20,
    humedadAmbientePct: 50,
    precipitacionesMm: 0,
    porcentajeReduccionTph: 10,
    estadoSistema: 'optimo',
    recomendacionOperativa: null,
    ...overrides,
  };
}

describe('simulateScenario', () => {
  it('sin cambios de parametros, linea base y simulado coinciden aproximadamente', () => {
    const m0 = baseMeasurement({
      id: 'a',
      tiempoDias: 0,
      tphActualMgkg: 1000,
    });
    const m1 = baseMeasurement({
      id: 'b',
      tiempoDias: 30,
      tphActualMgkg: 800,
    });

    const r = simulateScenario([m0, m1], {}, { modelId: 'standard-360' });

    const lastB = r.baseline.tphProjected.at(-1) ?? 0;
    const lastS = r.simulated.tphProjected.at(-1) ?? 0;
    expect(Math.abs(lastB - lastS)).toBeLessThan(1);
  });

  it('la segunda llamada a predictTPH usa mediciones modificadas (no el mismo array que la base)', () => {
    const m0 = baseMeasurement({
      id: 'a',
      tiempoDias: 0,
      tphActualMgkg: 1000,
    });
    const m1 = baseMeasurement({
      id: 'b',
      tiempoDias: 30,
      tphActualMgkg: 800,
    });

    const spy = vi.spyOn(predictor, 'predictTPH');

    simulateScenario(
      [m0, m1],
      {
        humedadSueloPct: 5,
        temperaturaSueloC: 45,
        oxigenoPct: 22,
        fertilizanteN: 90,
        fertilizanteP: 40,
        fertilizanteK: 90,
        frecuenciaVolteoDias: 7,
      },
      { modelId: 'standard-360' }
    );

    expect(spy).toHaveBeenCalledTimes(2);
    const firstArg = spy.mock.calls[0]?.[0];
    const secondArg = spy.mock.calls[1]?.[0];
    expect(firstArg).not.toBe(secondArg);
    expect(secondArg?.[0]?.humedadSueloPct).toBe(5);
    spy.mockRestore();
  });

  it('expone horizonDays segun el modelo registrado', () => {
    const m0 = baseMeasurement({ id: 'a', tiempoDias: 0, tphActualMgkg: 1000 });
    const m1 = baseMeasurement({ id: 'b', tiempoDias: 30, tphActualMgkg: 800 });
    const r = simulateScenario([m0, m1], {}, { modelId: 'conservative-180' });
    expect(r.horizonDays).toBe(180);
    expect(r.modelId).toBe('conservative-180');
  });
});
