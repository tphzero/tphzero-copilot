import type { Measurement } from '@tphzero/domain';

/**
 * Maps a Supabase snake_case row to a camelCase Measurement.
 */
export function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}
