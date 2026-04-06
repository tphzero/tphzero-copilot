import { describe, expect, it } from 'vitest';
import type { Measurement } from '@tphzero/domain';
import { recommendSimulatorModel, resolveSimulationModelFromOptions } from './simulator-models';

function minimal(overrides: Partial<Measurement> = {}): Measurement {
  return {
    id: 'm',
    datasetId: 'ds',
    biopilaId: 'B1',
    tiempoDias: 0,
    temperaturaSueloC: 20,
    humedadSueloPct: 30,
    oxigenoPct: 12,
    ph: 7,
    conductividadMscm: null,
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

describe('resolveSimulationModelFromOptions', () => {
  it('sin opciones usa standard-360', () => {
    const r = resolveSimulationModelFromOptions();
    expect(r.modelId).toBe('standard-360');
    expect(r.horizonDays).toBe(360);
  });

  it('solo horizonDays que coincide con un modelo registrado usa ese id', () => {
    expect(resolveSimulationModelFromOptions({ horizonDays: 540 })).toEqual({
      modelId: 'extended-540',
      horizonDays: 540,
    });
  });

  it('solo horizonDays sin modelo registrado usa custom-horizon', () => {
    expect(resolveSimulationModelFromOptions({ horizonDays: 720 })).toEqual({
      modelId: 'custom-horizon',
      horizonDays: 720,
    });
  });

  it('modelId explicito conserva el id; horizonte puede sobreescribirse', () => {
    expect(
      resolveSimulationModelFromOptions({ modelId: 'standard-360', horizonDays: 720 })
    ).toEqual({ modelId: 'standard-360', horizonDays: 720 });
  });
});

describe('recommendSimulatorModel', () => {
  it('es determinista para las mismas mediciones', () => {
    const m = [
      minimal({ id: '1', tiempoDias: 0 }),
      minimal({ id: '2', tiempoDias: 10 }),
      minimal({ id: '3', tiempoDias: 20 }),
      minimal({ id: '4', tiempoDias: 30 }),
      minimal({ id: '5', tiempoDias: 50 }),
    ];
    const a = recommendSimulatorModel(m);
    const b = recommendSimulatorModel([...m].reverse().sort((x, y) => x.tiempoDias - y.tiempoDias));
    expect(a.modelId).toBe(b.modelId);
    expect(a.reason).toBe(b.reason);
  });

  it('recomienda conservador con pocas mediciones o cobertura corta', () => {
    const m = [minimal({ id: '1', tiempoDias: 0 }), minimal({ id: '2', tiempoDias: 10 })];
    const r = recommendSimulatorModel(m);
    expect(r.modelId).toBe('conservative-180');
  });

  it('recomienda conservador con menos de 5 puntos o cobertura corta', () => {
    const m = [
      minimal({ id: '1', tiempoDias: 0 }),
      minimal({ id: '2', tiempoDias: 10 }),
      minimal({ id: '3', tiempoDias: 20 }),
      minimal({ id: '4', tiempoDias: 25 }),
    ];
    const r = recommendSimulatorModel(m);
    expect(r.modelId).toBe('conservative-180');
  });
});
