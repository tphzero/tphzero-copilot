import { generateText } from 'ai';
import { z } from 'zod';
import { chatModel } from '@/lib/ai/model';
import { buildSimulatorSeriesFacts } from '@/lib/models/simulator-explain-metrics';
import { labelSimulatorParam } from '@/lib/models/simulator-param-labels';

export const maxDuration = 30;

const simulationResultSchema = z.object({
  baseline: z.object({
    tphProjected: z.array(z.number()),
    days: z.array(z.number()),
  }),
  simulated: z.object({
    tphProjected: z.array(z.number()),
    days: z.array(z.number()),
  }),
  deltaReductionPct: z.number(),
  estimatedTimeSavedDays: z.number().nullable(),
  modelId: z.string(),
  horizonDays: z.number(),
  kinetics: z.object({
    kPerDay: z.number(),
    tphInitialMgkg: z.number(),
    effectiveRateMultiplier: z.number(),
    referenceTiempoDias: z.number(),
    factors: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        ratio: z.number(),
        basis: z.string(),
      })
    ),
  }),
});

const bodySchema = z.object({
  datasetId: z.string(),
  biopilaId: z.string(),
  model: z.object({
    id: z.string(),
    name: z.string(),
  }),
  horizonDays: z.number(),
  result: simulationResultSchema,
  adjustedParamKeys: z.array(z.string()),
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

  const { datasetId, biopilaId, model, horizonDays, result, adjustedParamKeys } =
    parsed.data;

  const facts = buildSimulatorSeriesFacts(result);

  const parametrosAjustadosEtiquetados = adjustedParamKeys.map((clave) => {
    const { etiqueta, unidad } = labelSimulatorParam(clave);
    return { nombreParaUsuario: etiqueta, unidad };
  });

  const structured = {
    contexto: {
      datasetId,
      biopilaId,
      modelo: { id: model.id, nombre: model.name },
    },
    horizonteExtraProyeccionModeloDias: horizonDays,
    notaHorizonte:
      'El horizonte extra del modelo (días) amplía la ventana numérica de predicción; NO es el día en que el TPH alcanza un valor concreto. Para el cruce a valores casi nulos usa primerDiaSimuladoTphCasiNulo.',
    series: {
      tphInicialSerieMgkg: facts.tphInicialSerieMgkg,
      ultimoDiaEnSerie: facts.ultimoDiaEnSerie,
      tphFinalLineaBaseMgkg: facts.tphFinalLineaBaseMgkg,
      tphFinalSimuladoMgkg: facts.tphFinalSimuladoMgkg,
      primerDiaSimuladoTphCasiNulo: facts.primerDiaSimuladoTphCasiNulo,
      umbralTphCasiNuloMgkg: facts.umbralTphCasiNuloMgkg,
    },
    metricas: {
      deltaReduccionAcumuladaPpDelInicial: facts.deltaReduccionAcumuladaPpDelInicial,
      definicionDeltaReduccion: facts.definicionDeltaReduccion,
      diasTiempoAhorradoEstimado: facts.diasTiempoAhorradoEstimado,
    },
    parametrosAjustadosEtiquetados,
    cineticaWhatIf: {
      kHistorialPorDia: result.kinetics.kPerDay,
      tphInicialSerieMgkg: result.kinetics.tphInitialMgkg,
      multiplicadorOperativoM: result.kinetics.effectiveRateMultiplier,
      medicionReferenciaDia: result.kinetics.referenceTiempoDias,
      factoresMultiplicativosVsReferencia: result.kinetics.factors.map((f) => ({
        variable: f.label,
        ratio: f.ratio,
        nota: f.basis,
      })),
      notaInterpretacion:
        'M resume el efecto de los sliders frente a la ultima medicion (Q10, Monod, humedad, volteo). No es un resultado experimental.',
    },
  };

  const system = `Eres un asistente tecnico para remediacion de suelos. Responde SIEMPRE en espanol.
Tu fuente de verdad son EXCLUSIVAMENTE los numeros y textos del JSON "datos". No inventes cifras ni fechas.

CONTRADICCIONES A EVITAR:
- NO confundas "horizonteExtraProyeccionModeloDias" con el dia en que el TPH simulado baja a casi cero. El primero es un parametro del modelo; el cruce a casi cero esta en "series.primerDiaSimuladoTphCasiNulo" (primer dia donde TPH simulado <= umbral).
- "tphFinalSimuladoMgkg" y "tphFinalLineaBaseMgkg" son los valores en el ULTIMO dia de la serie ("ultimoDiaEnSerie"), es decir el final del eje X del grafico, no un dia arbitrario igual al horizonte del modelo.
- Si "primerDiaSimuladoTphCasiNulo" es un numero (ej. 198) y el horizonte del modelo es otro (ej. 540), debes explicar ambos sin igualarlos.

DELTA DE REDUCCION:
- Usa solo el valor "metricas.deltaReduccionAcumuladaPpDelInicial" y el texto literal de "metricas.definicionDeltaReduccion". Esa definicion es la fuente de verdad: describe el maximo a lo largo de la curva (no solo el ultimo punto). No reinterpretes el delta como "solo al final de la serie" ni digas "magnitud no especificada".

PARAMETROS AJUSTADOS:
- Lista solo entradas de "parametrosAjustadosEtiquetados" usando "nombreParaUsuario" y "unidad". No escribas claves internas tipo oxigenoPct ni fragmentes letras en matematicas.

CINETICA WHAT-IF:
- Usa "cineticaWhatIf" para explicar como el modelo combina k del historial con el multiplicador M y los factores listados. No inventes coeficientes distintos a los implicitos en esos numeros.

TIEMPO AHORRADO:
- Si "metricas.diasTiempoAhorradoEstimado" es null, di que no hay estimacion (no inventes dias).

FORMATO DE SALIDA:
- Markdown (parrafos, listas con guiones). **Negrita** para terminos clave.
- Cifras y unidades en texto normal: "50,2 mg/kg", "198 dias". Usa LaTeX $...$ solo para formulas breves si aportan claridad, NO para nombres de variables ni para listar parametros.
- No encierres palabras sueltas en $...$.

TONO: breve, tecnico y alineado con el grafico.`;

  const prompt = `datos (JSON, unica fuente):\n${JSON.stringify(structured, null, 2)}`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system,
      prompt,
      temperature: 0.15,
    });

    return Response.json({ explanation: text.trim() });
  } catch {
    return Response.json(
      { error: 'No se pudo generar la explicacion. Intentalo de nuevo.' },
      { status: 502 }
    );
  }
}
