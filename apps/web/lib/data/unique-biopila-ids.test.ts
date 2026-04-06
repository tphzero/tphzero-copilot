import { describe, expect, it } from 'vitest';
import type { Measurement } from '@tphzero/domain';
import { uniqueBiopilaIds } from './unique-biopila-ids';

const base: Measurement = {
  id: '1',
  datasetId: 'ds',
  biopilaId: 'B2',
  tiempoDias: 1,
  temperaturaSueloC: 20,
  humedadSueloPct: 25,
  oxigenoPct: 15,
  ph: 7,
  conductividadMscm: 2,
  tphInicialMgkg: 100,
  tphActualMgkg: 50,
  tipoHidrocarburo: 'liviano',
  aguaAplicadaLM3: 1,
  fertilizanteN: 1,
  fertilizanteP: 1,
  fertilizanteK: 1,
  tensioactivo: 1,
  enmienda: 'biochar',
  frecuenciaVolteoDias: 1,
  temperaturaAmbienteC: 18,
  humedadAmbientePct: 50,
  precipitacionesMm: 0,
  porcentajeReduccionTph: 0.5,
  estadoSistema: null,
  recomendacionOperativa: null,
};

describe('uniqueBiopilaIds', () => {
  it('returns sorted unique ids', () => {
    const m: Measurement[] = [
      { ...base, id: 'a', biopilaId: 'B2' },
      { ...base, id: 'b', biopilaId: 'B1' },
      { ...base, id: 'c', biopilaId: 'B2' },
    ];
    expect(uniqueBiopilaIds(m)).toEqual(['B1', 'B2']);
  });

  it('filters empty biopila ids', () => {
    const m: Measurement[] = [
      { ...base, id: 'a', biopilaId: 'B1' },
      { ...base, id: 'b', biopilaId: '' as unknown as string },
    ];
    expect(uniqueBiopilaIds(m)).toEqual(['B1']);
  });
});
