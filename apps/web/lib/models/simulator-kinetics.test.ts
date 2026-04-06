import { describe, expect, it } from 'vitest';
import type { Measurement } from '@tphzero/domain';
import { computeOperationalRateMultiplier } from './simulator-kinetics';

const ref: Measurement = {
  id: '1',
  datasetId: 'd',
  biopilaId: 'B',
  tiempoDias: 30,
  temperaturaSueloC: 22,
  humedadSueloPct: 28,
  oxigenoPct: 14,
  ph: 7,
  conductividadMscm: 1,
  tphInicialMgkg: 5000,
  tphActualMgkg: 4000,
  tipoHidrocarburo: 'liviano',
  aguaAplicadaLM3: 0,
  fertilizanteN: 25,
  fertilizanteP: 10,
  fertilizanteK: 12,
  tensioactivo: 0,
  enmienda: 'ninguna',
  frecuenciaVolteoDias: 21,
  temperaturaAmbienteC: 20,
  humedadAmbientePct: 50,
  precipitacionesMm: 0,
  porcentajeReduccionTph: 0.2,
  estadoSistema: null,
  recomendacionOperativa: null,
};

describe('computeOperationalRateMultiplier', () => {
  it('devuelve M ~ 1 cuando los sliders coinciden con la referencia', () => {
    const { multiplier } = computeOperationalRateMultiplier(ref, {});
    expect(multiplier).toBeCloseTo(1, 2);
  });

  it('cambia M cuando se alejan variables operativas', () => {
    const { multiplier } = computeOperationalRateMultiplier(ref, {
      temperaturaSueloC: 5,
      humedadSueloPct: 5,
    });
    expect(multiplier).not.toBeCloseTo(1, 1);
  });
});
