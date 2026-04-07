import { describe, expect, it } from 'vitest';
import type { Measurement } from '@tphzero/domain';
import {
  collectObservedPoints,
  linearInterpolateObservedTph,
  piecewiseLinearValueAt,
} from './simulator-chart-observed';

function m(partial: Partial<Measurement> & Pick<Measurement, 'tiempoDias' | 'tphActualMgkg'>): Measurement {
  return {
    id: '1',
    datasetId: 'd',
    biopilaId: 'b',
    tiempoDias: partial.tiempoDias,
    temperaturaSueloC: 20,
    humedadSueloPct: 25,
    oxigenoPct: 12,
    ph: 7,
    conductividadMscm: null,
    tphInicialMgkg: 5000,
    tphActualMgkg: partial.tphActualMgkg,
    tipoHidrocarburo: 'liviano',
    aguaAplicadaLM3: 0,
    fertilizanteN: 30,
    fertilizanteP: 15,
    fertilizanteK: 20,
    tensioactivo: 0,
    enmienda: 'ninguna',
    frecuenciaVolteoDias: 30,
    temperaturaAmbienteC: 20,
    humedadAmbientePct: 50,
    precipitacionesMm: 0,
    porcentajeReduccionTph: 0,
    estadoSistema: null,
    recomendacionOperativa: null,
  };
}

describe('collectObservedPoints', () => {
  it('filtra TPH no positivo y ordena por tiempo', () => {
    const pts = collectObservedPoints([
      m({ tiempoDias: 20, tphActualMgkg: 400 }),
      m({ tiempoDias: 10, tphActualMgkg: 0 }),
      m({ tiempoDias: 10, tphActualMgkg: 500 }),
    ]);
    expect(pts).toEqual([
      { t: 10, y: 500 },
      { t: 20, y: 400 },
    ]);
  });
});

describe('piecewiseLinearValueAt', () => {
  it('interpola entre dos puntos', () => {
    const pts = [
      { t: 0, y: 1000 },
      { t: 100, y: 500 },
    ];
    expect(piecewiseLinearValueAt(0, pts)).toBe(1000);
    expect(piecewiseLinearValueAt(100, pts)).toBe(500);
    expect(piecewiseLinearValueAt(50, pts)).toBe(750);
  });

  it('sin extrapolacion fuera del tramo', () => {
    const pts = [
      { t: 10, y: 100 },
      { t: 50, y: 80 },
    ];
    expect(piecewiseLinearValueAt(5, pts)).toBeNull();
    expect(piecewiseLinearValueAt(60, pts)).toBeNull();
  });

  it('un solo punto: solo en t exacto', () => {
    const pts = [{ t: 47, y: 300 }];
    expect(piecewiseLinearValueAt(47, pts)).toBe(300);
    expect(piecewiseLinearValueAt(45, pts)).toBeNull();
  });
});

describe('linearInterpolateObservedTph', () => {
  it('alinea marcadores al dia mas cercano dentro del umbral', () => {
    const measurements = [
      m({ tiempoDias: 0, tphActualMgkg: 1000 }),
      m({ tiempoDias: 100, tphActualMgkg: 500 }),
    ];
    const days = [0, 50, 100];
    const { interpolated, markerAtIndex, markerValue } = linearInterpolateObservedTph(
      days,
      measurements
    );
    expect(interpolated).toEqual([1000, 750, 500]);
    expect(markerAtIndex).toEqual([true, false, true]);
    expect(markerValue[0]).toBe(1000);
    expect(markerValue[2]).toBe(500);
    expect(markerValue[1]).toBeNull();
  });

  it('sin mediciones devuelve todo null', () => {
    const r = linearInterpolateObservedTph([0, 10], []);
    expect(r.interpolated.every((v) => v === null)).toBe(true);
    expect(r.markerAtIndex.every((v) => v === false)).toBe(true);
  });
});
