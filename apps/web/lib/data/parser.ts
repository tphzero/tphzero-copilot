import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Measurement } from '@tphzero/domain';
import { validateColumns, type ValidationResult } from './validator';

export interface ParseResult {
  measurements: Omit<Measurement, 'id' | 'datasetId'>[];
  validation: ValidationResult;
}

export function parseCSV(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = parsed.meta.fields ?? [];
  const validation = validateColumns(headers);
  validation.rowCount = parsed.data.length;

  if (!validation.valid) {
    return { measurements: [], validation };
  }

  const measurements = parsed.data.map((row) => mapRowToMeasurement(row));
  return { measurements, validation };
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
  const headers = Object.keys(rows[0] ?? {});

  const validation = validateColumns(headers);
  validation.rowCount = rows.length;

  if (!validation.valid) {
    return { measurements: [], validation };
  }

  const measurements = rows.map((row) => mapRowToMeasurement(row));
  return { measurements, validation };
}

function mapRowToMeasurement(
  row: Record<string, string | number>
): Omit<Measurement, 'id' | 'datasetId'> {
  return {
    biopilaId: row['biopila_id'] ? String(row['biopila_id']) : null,
    tiempoDias: num(row['tiempo_dias']),
    temperaturaSueloC: num(row['temperatura_suelo_C']),
    humedadSueloPct: num(row['humedad_suelo_pct']),
    oxigenoPct: num(row['oxigeno_pct']),
    ph: num(row['pH']),
    conductividadMscm: row['conductividad_mScm']
      ? num(row['conductividad_mScm'])
      : null,
    tphInicialMgkg: num(row['TPH_inicial_mgkg']),
    tphActualMgkg: num(row['TPH_actual_mgkg']),
    tipoHidrocarburo: String(row['tipo_hidrocarburo']) as 'liviano' | 'pesado',
    aguaAplicadaLM3: num(row['agua_aplicada_L_m3']),
    fertilizanteN: num(row['fertilizante_N']),
    fertilizanteP: num(row['fertilizante_P']),
    fertilizanteK: num(row['fertilizante_K']),
    tensioactivo: num(row['tensioactivo']) as 0 | 1,
    enmienda: String(row['enmienda']) as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: num(row['frecuencia_volteo_dias']),
    temperaturaAmbienteC: num(row['temperatura_ambiente_C']),
    humedadAmbientePct: num(row['humedad_ambiente_pct']),
    precipitacionesMm: num(row['precipitaciones_mm']),
    porcentajeReduccionTph: num(row['porcentaje_reduccion_TPH']),
    estadoSistema: row['estado_sistema']
      ? (String(row['estado_sistema']) as 'optimo' | 'suboptimo' | 'critico')
      : null,
    recomendacionOperativa: row['recomendacion_operativa']
      ? String(row['recomendacion_operativa'])
      : null,
  };
}

function num(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  return parseFloat(String(val)) || 0;
}
