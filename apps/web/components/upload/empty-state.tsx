import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="rounded-full bg-muted p-6">
        <FileSpreadsheet className="h-12 w-12 text-emerald-400" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-semibold">Bienvenido a TPHZero Copilot</h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Carga un archivo CSV o Excel con datos de tus biopilas para comenzar
          el analisis inteligente de biorremediacion.
        </p>
      </div>

      <Button
        size="lg"
        onClick={onUploadClick}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        Cargar datos
      </Button>

      <details className="mt-4 max-w-lg text-sm text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          Que formato necesito?
        </summary>
        <div className="mt-2 rounded-md border border-border bg-card p-4 font-mono text-xs">
          <p className="mb-2 text-muted-foreground">Columnas requeridas:</p>
          <p>
            tiempo_dias, temperatura_suelo_C, humedad_suelo_pct, oxigeno_pct,
            pH, TPH_inicial_mgkg, TPH_actual_mgkg, tipo_hidrocarburo,
            agua_aplicada_L_m3, fertilizante_N, fertilizante_P, fertilizante_K,
            tensioactivo, enmienda, frecuencia_volteo_dias,
            temperatura_ambiente_C, humedad_ambiente_pct, precipitaciones_mm,
            porcentaje_reduccion_TPH
          </p>
          <p className="mt-2 text-muted-foreground">Columnas opcionales (nivel 2):</p>
          <p>
            biopila_id, conductividad_mScm, estado_sistema,
            recomendacion_operativa
          </p>
        </div>
      </details>
    </div>
  );
}
