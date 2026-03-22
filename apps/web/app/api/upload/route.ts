import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, parseExcel } from '@/lib/data/parser';
import { createServerClient } from '@/lib/data/supabase';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'No se proporcionó archivo' },
      { status: 400 }
    );
  }

  const fileName = file.name.toLowerCase();
  const isCSV = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  if (!isCSV && !isExcel) {
    return NextResponse.json(
      { error: 'Formato no soportado. Use CSV o Excel (.xlsx)' },
      { status: 400 }
    );
  }

  let result;
  if (isCSV) {
    const text = await file.text();
    result = parseCSV(text);
  } else {
    const buffer = await file.arrayBuffer();
    result = parseExcel(buffer);
  }

  if (!result.validation.valid) {
    return NextResponse.json(
      {
        error: 'Archivo inválido',
        details: result.validation.errors,
      },
      { status: 422 }
    );
  }

  const supabase = createServerClient();

  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .insert({
      name: file.name,
      file_type: isCSV ? 'csv' : 'xlsx',
      row_count: result.measurements.length,
      has_biopila_id: result.validation.detectedLevel === 2,
    })
    .select()
    .single();

  if (datasetError) {
    return NextResponse.json(
      { error: 'Error al guardar dataset', details: datasetError.message },
      { status: 500 }
    );
  }

  // Insert measurements in batches
  const BATCH_SIZE = 50;
  const rows = result.measurements.map((m) => ({
    dataset_id: dataset.id,
    biopila_id: m.biopilaId,
    tiempo_dias: m.tiempoDias,
    temperatura_suelo_c: m.temperaturaSueloC,
    humedad_suelo_pct: m.humedadSueloPct,
    oxigeno_pct: m.oxigenoPct,
    ph: m.ph,
    conductividad_mscm: m.conductividadMscm,
    tph_inicial_mgkg: m.tphInicialMgkg,
    tph_actual_mgkg: m.tphActualMgkg,
    tipo_hidrocarburo: m.tipoHidrocarburo,
    agua_aplicada_l_m3: m.aguaAplicadaLM3,
    fertilizante_n: m.fertilizanteN,
    fertilizante_p: m.fertilizanteP,
    fertilizante_k: m.fertilizanteK,
    tensioactivo: m.tensioactivo,
    enmienda: m.enmienda,
    frecuencia_volteo_dias: m.frecuenciaVolteoDias,
    temperatura_ambiente_c: m.temperaturaAmbienteC,
    humedad_ambiente_pct: m.humedadAmbientePct,
    precipitaciones_mm: m.precipitacionesMm,
    porcentaje_reduccion_tph: m.porcentajeReduccionTph,
    estado_sistema: m.estadoSistema,
    recomendacion_operativa: m.recomendacionOperativa,
  }));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('measurements').insert(batch);
    if (error) {
      await supabase.from('datasets').delete().eq('id', dataset.id);
      return NextResponse.json(
        { error: 'Error al guardar mediciones', details: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    dataset: {
      id: dataset.id,
      name: dataset.name,
      rowCount: result.measurements.length,
      level: result.validation.detectedLevel,
    },
  });
}
