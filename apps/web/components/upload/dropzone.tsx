'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertTriangle, FileCheck, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActiveDataset } from '@/lib/types/dataset';

interface DropzoneProps {
  onFileUploaded: (dataset: ActiveDataset) => void;
}

export function Dropzone({ onFileUploaded }: DropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = (await res.json()) as {
          error?: string;
          details?: string | string[];
          dataset?: ActiveDataset;
        };

        if (!res.ok || !data.dataset) {
          const details = Array.isArray(data.details)
            ? data.details.join('. ')
            : data.details;

          setError(details ?? data.error ?? 'No se pudo procesar el archivo');
          return;
        }

        onFileUploaded(data.dataset);
      } catch {
        setError('Error de conexion al subir el archivo');
      } finally {
        setUploading(false);
      }
    },
    [onFileUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors',
          isDragActive
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-border hover:border-foreground/30',
          uploading && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        ) : isDragActive ? (
          <FileCheck className="h-8 w-8 text-emerald-400" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-center text-sm text-muted-foreground">
          {uploading
            ? 'Procesando archivo...'
            : isDragActive
              ? 'Soltar archivo aqui'
              : 'Arrastra un archivo CSV o Excel, o haz clic para seleccionar'}
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
