import { describe, expect, it } from 'vitest';
import type { Measurement } from '@tphzero/domain';
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
  it('con mediciones vacias no lanza y devuelve series vacias (Codex: sin reference)', () => {
    expect(() => simulateScenario([], {}, { modelId: 'standard-360' })).not.toThrow();
    const r = simulateScenario([], {}, { modelId: 'standard-360' });
    expect(r.baseline.days).toEqual([]);
    expect(r.baseline.tphProjected).toEqual([]);
    expect(r.simulated.days).toEqual([]);
    expect(r.simulated.tphProjected).toEqual([]);
    expect(r.modelId).toBe('standard-360');
    expect(r.horizonDays).toBe(360);
    expect(r.kinetics.factors).toEqual([]);
    expect(r.kinetics.effectiveRateMultiplier).toBe(1);
  });

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

  it('con parametros distintos a la referencia, el multiplicador operativo y la curva cambian', () => {
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

    const base = simulateScenario([m0, m1], {}, { modelId: 'standard-360' });
    const moved = simulateScenario(
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

    expect(moved.kinetics.effectiveRateMultiplier).not.toBe(
      base.kinetics.effectiveRateMultiplier
    );
    const lastB = base.simulated.tphProjected.at(-1) ?? 0;
    const lastS = moved.simulated.tphProjected.at(-1) ?? 0;
    expect(Math.abs(lastB - lastS)).toBeGreaterThan(1);
  });

  it('expone horizonDays segun el modelo registrado', () => {
    const m0 = baseMeasurement({ id: 'a', tiempoDias: 0, tphActualMgkg: 1000 });
    const m1 = baseMeasurement({ id: 'b', tiempoDias: 30, tphActualMgkg: 800 });
    const r = simulateScenario([m0, m1], {}, { modelId: 'conservative-180' });
    expect(r.horizonDays).toBe(180);
    expect(r.modelId).toBe('conservative-180');
  });
});
