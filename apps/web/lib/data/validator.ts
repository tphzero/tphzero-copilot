// Required columns for nivel 1
const REQUIRED_COLUMNS_NIVEL1 = [
  'tiempo_dias',
  'temperatura_suelo_C',
  'humedad_suelo_pct',
  'oxigeno_pct',
  'pH',
  'TPH_inicial_mgkg',
  'TPH_actual_mgkg',
  'tipo_hidrocarburo',
  'agua_aplicada_L_m3',
  'fertilizante_N',
  'fertilizante_P',
  'fertilizante_K',
  'tensioactivo',
  'enmienda',
  'frecuencia_volteo_dias',
  'temperatura_ambiente_C',
  'humedad_ambiente_pct',
  'precipitaciones_mm',
  'porcentaje_reduccion_TPH',
] as const;

// Additional columns for nivel 2
const OPTIONAL_COLUMNS_NIVEL2 = [
  'biopila_id',
  'conductividad_mScm',
  'estado_sistema',
  'recomendacion_operativa',
] as const;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  detectedLevel: 1 | 2;
  columnCount: number;
  rowCount: number;
}

export function validateColumns(headers: string[]): ValidationResult {
  const errors: string[] = [];
  const headerSet = new Set(headers);

  const missingRequired = REQUIRED_COLUMNS_NIVEL1.filter(
    (col) => !headerSet.has(col)
  );

  if (missingRequired.length > 0) {
    errors.push(
      `Columnas faltantes: ${missingRequired.join(', ')}`
    );
  }

  const hasNivel2 = OPTIONAL_COLUMNS_NIVEL2.every((col) =>
    headerSet.has(col)
  );

  return {
    valid: errors.length === 0,
    errors,
    detectedLevel: hasNivel2 ? 2 : 1,
    columnCount: headers.length,
    rowCount: 0, // set by caller
  };
}
