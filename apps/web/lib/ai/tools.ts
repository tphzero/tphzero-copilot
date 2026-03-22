import { tool } from 'ai';
import { z } from 'zod';
import type { Measurement } from '@tphzero/domain';
import { createServerClient } from '@/lib/data/supabase';
import { detectAnomalies } from '@/lib/models/anomaly';
import { classifyMeasurement } from '@/lib/models/classifier';
import { correlateWithReduction } from '@/lib/models/correlator';
import { predictTPH } from '@/lib/models/predictor';
import { simulateScenario } from '@/lib/models/simulator';

function mapRow(row: Record<string, unknown>): Measurement {
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

async function getLatestMeasurements(biopilaId?: string): Promise<Measurement[]> {
  const supabase = createServerClient();
  const { data: datasets } = await supabase
    .from('datasets')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  const latestDataset = datasets?.[0];
  if (!latestDataset) return [];

  let query = supabase
    .from('measurements')
    .select('*')
    .eq('dataset_id', latestDataset.id)
    .order('tiempo_dias');

  if (biopilaId) {
    query = query.eq('biopila_id', biopilaId);
  }

  const { data } = await query;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

const optionalBiopilaSchema = z.object({
  biopilaId: z
    .string()
    .optional()
    .describe('ID de la biopila, por ejemplo B1. Si no se envia, usa el ultimo dato disponible.'),
});

export const aiTools = {
  classify_state: tool({
    description:
      'Clasifica el estado actual de una biopila en optimo, suboptimo o critico segun sus variables mas recientes.',
    inputSchema: optionalBiopilaSchema,
    execute: async ({ biopilaId }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length === 0) {
        return { error: 'No hay datos disponibles para analizar.' };
      }

      return classifyMeasurement(measurements[measurements.length - 1]!);
    },
  }),

  get_correlations: tool({
    description:
      'Calcula correlaciones entre variables operativas y la reduccion de TPH para una biopila o el dataset completo.',
    inputSchema: optionalBiopilaSchema,
    execute: async ({ biopilaId }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length < 3) {
        return { error: 'Datos insuficientes: se requieren al menos 3 mediciones.' };
      }

      return correlateWithReduction(measurements);
    },
  }),

  detect_anomalies: tool({
    description:
      'Detecta anomalias en la medicion mas reciente comparandola con el dataset y los rangos optimos.',
    inputSchema: optionalBiopilaSchema,
    execute: async ({ biopilaId }) => {
      const allMeasurements = await getLatestMeasurements();
      if (allMeasurements.length === 0) {
        return { error: 'No hay datos cargados.' };
      }

      const scopedMeasurements = biopilaId
        ? allMeasurements.filter((measurement) => measurement.biopilaId === biopilaId)
        : allMeasurements;

      if (scopedMeasurements.length === 0) {
        return { error: 'No hay datos para la biopila solicitada.' };
      }

      return detectAnomalies(
        scopedMeasurements[scopedMeasurements.length - 1]!,
        allMeasurements
      );
    },
  }),

  predict_tph: tool({
    description:
      'Predice la evolucion futura del TPH usando un modelo de decaimiento exponencial y estima el tiempo al objetivo de 90%.',
    inputSchema: z.object({
      biopilaId: z.string().describe('ID de la biopila, por ejemplo B1.'),
      horizonDays: z
        .number()
        .int()
        .positive()
        .max(720)
        .default(360)
        .describe('Horizonte de prediccion en dias.'),
    }),
    execute: async ({ biopilaId, horizonDays }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length < 2) {
        return { error: 'Se necesitan al menos 2 mediciones para predecir.' };
      }

      return predictTPH(measurements, horizonDays);
    },
  }),

  simulate_scenario: tool({
    description:
      'Simula un escenario operativo alternativo modificando variables de una biopila y estima su efecto sobre el TPH.',
    inputSchema: z.object({
      biopilaId: z.string().describe('ID de la biopila.'),
      humedadSueloPct: z.number().optional().describe('Nueva humedad del suelo (%).'),
      temperaturaSueloC: z.number().optional().describe('Nueva temperatura del suelo (C).'),
      oxigenoPct: z.number().optional().describe('Nuevo nivel de oxigeno (%).'),
      fertilizanteN: z.number().optional().describe('Nuevo fertilizante N.'),
      fertilizanteP: z.number().optional().describe('Nuevo fertilizante P.'),
      fertilizanteK: z.number().optional().describe('Nuevo fertilizante K.'),
      frecuenciaVolteoDias: z.number().optional().describe('Nueva frecuencia de volteo en dias.'),
    }),
    execute: async ({ biopilaId, ...params }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length < 2) {
        return { error: 'Datos insuficientes para simular.' };
      }

      return simulateScenario(measurements, params);
    },
  }),

  get_dataset_summary: tool({
    description:
      'Obtiene un resumen del dataset mas reciente: cantidad de mediciones, biopilas, rango temporal, hidrocarburos y enmiendas.',
    inputSchema: z.object({}),
    execute: async () => {
      const measurements = await getLatestMeasurements();
      if (measurements.length === 0) {
        return { error: 'No hay datos cargados.' };
      }

      const biopilaIds = [
        ...new Set(
          measurements
            .map((measurement) => measurement.biopilaId)
            .filter((biopilaId): biopilaId is string => Boolean(biopilaId))
        ),
      ];
      const dias = measurements.map((measurement) => measurement.tiempoDias);
      const tiposHidrocarburo = [
        ...new Set(measurements.map((measurement) => measurement.tipoHidrocarburo)),
      ];
      const enmiendas = [
        ...new Set(measurements.map((measurement) => measurement.enmienda)),
      ];

      return {
        totalMediciones: measurements.length,
        biopilas: biopilaIds,
        totalBiopilas: biopilaIds.length,
        rangoDias: {
          min: Math.min(...dias),
          max: Math.max(...dias),
        },
        tiposHidrocarburo,
        enmiendas,
      };
    },
  }),
};
