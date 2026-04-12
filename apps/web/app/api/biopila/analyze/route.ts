import { generateText } from 'ai';
import { z } from 'zod';
import { classifyBiopilaState } from '@tphzero/domain';
import { chatModel } from '@/lib/ai/model';
import { detectAnomalies } from '@/lib/models/anomaly';
import { correlateWithReduction } from '@/lib/models/correlator';
import { predictTPH } from '@/lib/models/predictor';
import { mapRow } from '@/lib/data/map-row';
import { createServerClient } from '@/lib/data/supabase';

export const maxDuration = 30;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const datasetId = searchParams.get('datasetId');
  const biopilaId = searchParams.get('biopilaId');

  if (!datasetId || !biopilaId) {
    return Response.json({ error: 'Faltan parametros' }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: stored } = await supabase
    .from('biopila_analyses')
    .select('content, generated_at')
    .eq('dataset_id', datasetId)
    .eq('biopila_id', biopilaId)
    .single();

  if (!stored) {
    return Response.json({ analysis: null });
  }

  const { data: latestMeasurement } = await supabase
    .from('measurements')
    .select('created_at')
    .eq('dataset_id', datasetId)
    .eq('biopila_id', biopilaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isStale = latestMeasurement
    ? new Date(latestMeasurement.created_at) > new Date(stored.generated_at)
    : false;

  return Response.json({
    analysis: stored.content,
    generatedAt: stored.generated_at,
    isStale,
  });
}

const bodySchema = z.object({
  datasetId: z.string(),
  biopilaId: z.string(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: 'JSON invalido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: 'Payload invalido' }, { status: 400 });
  }

  const { datasetId, biopilaId } = parsed.data;

  const supabase = createServerClient();
  const { data: rows } = await supabase
    .from('measurements')
    .select('*')
    .eq('dataset_id', datasetId)
    .eq('biopila_id', biopilaId)
    .order('tiempo_dias');

  if (!rows || rows.length === 0) {
    return Response.json({ error: 'Sin mediciones para esta biopila' }, { status: 404 });
  }

  const measurements = rows.map(mapRow);
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const latest = sorted[sorted.length - 1]!;

  const state = classifyBiopilaState(latest);
  const anomalies = detectAnomalies(latest, measurements);
  const prediction = predictTPH(measurements);
  const correlations = correlateWithReduction(measurements);

  const structured = {
    biopila: biopilaId,
    totalMediciones: measurements.length,
    estadoActual: {
      clasificacion: state,
      variablesSuboptimas: anomalies.filter((a) => a.severity === 'advertencia').length,
      variablesCriticas: anomalies.filter((a) => a.severity === 'critico').length,
      ultimaMedicion: {
        dia: latest.tiempoDias,
        tphActualMgkg: Math.round(latest.tphActualMgkg),
        tphInicialMgkg: Math.round(latest.tphInicialMgkg),
        reduccionPct: Math.round(latest.porcentajeReduccionTph * 1000) / 10,
        temperaturaSueloC: latest.temperaturaSueloC,
        humedadSueloPct: latest.humedadSueloPct,
        oxigenoPct: latest.oxigenoPct,
        ph: latest.ph,
        enmienda: latest.enmienda,
        tipoHidrocarburo: latest.tipoHidrocarburo,
      },
    },
    anomalias: anomalies.map((a) => ({
      variable: a.variable,
      valor: a.value,
      zScore: a.zScore,
      rangoOptimo: a.optimalRange,
      severidad: a.severity,
    })),
    prediccion: {
      diasEstimadosA90Pct: prediction.estimatedDaysTo90Pct,
      confianza: prediction.confidence,
      tasaReduccionActualPctDia: Math.round(prediction.currentReductionRate * 1000) / 1000,
      kPorDia: prediction.kFit?.kPerDay ?? null,
    },
    correlaciones: correlations.slice(0, 6).map((c) => ({
      variable: c.variable,
      correlacion: c.correlation,
      fuerza: c.strength,
    })),
  };

  const system = `Eres un asistente tecnico experto en biorremediacion de suelos contaminados con hidrocarburos. Responde SIEMPRE en espanol.
Tu unica fuente de verdad son los datos del JSON proporcionado. No inventes cifras ni fechas.

GENERA UN ANALISIS ESTRUCTURADO en markdown con exactamente estas cuatro secciones:

## Evolucion del proceso
Describe el estado actual del proceso de biorremediacion: clasificacion del sistema, tendencia de reduccion de TPH, y comportamiento historico con los datos disponibles.

## Tiempo estimado de remediacion
Indica el tiempo estimado para alcanzar el objetivo del 90% de reduccion de TPH, basandote en el modelo de decaimiento exponencial. Menciona el nivel de confianza y sus implicaciones. Si no hay prediccion disponible, explicalo.

## Ajustes recomendados
Propone acciones operativas concretas (riego, nutrientes, aireacion, volteo, enmiendas) basadas en las anomalias detectadas y las correlaciones con la reduccion de TPH. Justifica cada recomendacion con los datos.

## Condiciones suboptimas
Lista las variables que estan fuera de rango optimo, indicando la severidad y el valor actual vs. rango optimo. Si no hay anomalias, indicalo positivamente.

REGLAS:
- Usa solo los datos del JSON. No inventes valores.
- Se conciso y directo. Cada seccion: 2-4 oraciones o una lista breve.
- Usa markdown: listas con guiones, **negrita** para terminos clave.
- Si "diasEstimadosA90Pct" es null, indica que no es posible calcular la estimacion con los datos actuales.
- Las correlaciones positivas fuertes sugieren que aumentar esa variable acelera la reduccion; negativas sugieren lo contrario.`;

  const prompt = `datos (JSON, unica fuente):\n${JSON.stringify(structured, null, 2)}`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system,
      prompt,
      temperature: 0.2,
    });

    const content = text.trim();
    const generatedAt = new Date().toISOString();

    await supabase.from('biopila_analyses').upsert(
      { dataset_id: datasetId, biopila_id: biopilaId, content, generated_at: generatedAt },
      { onConflict: 'dataset_id,biopila_id' }
    );

    return Response.json({ analysis: content, generatedAt, isStale: false });
  } catch {
    return Response.json(
      { error: 'No se pudo generar el analisis. Intentalo de nuevo.' },
      { status: 502 }
    );
  }
}
