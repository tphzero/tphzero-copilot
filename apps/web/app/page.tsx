'use client';

import { useRef, useState } from 'react';
import { DataPreview } from '@/components/upload/data-preview';
import { Dropzone } from '@/components/upload/dropzone';
import { EmptyState } from '@/components/upload/empty-state';

interface UploadedDataset {
  id: string;
  name: string;
  rowCount: number;
  level: number;
}

export default function HomePage() {
  const [dataset, setDataset] = useState<UploadedDataset | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleUploadClick = () => {
    setShowUpload(true);

    setTimeout(() => {
      dropzoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {!dataset && !showUpload ? (
        <EmptyState onUploadClick={handleUploadClick} />
      ) : null}

      {!dataset && showUpload ? (
        <div ref={dropzoneRef} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Cargar datos</h2>
            <p className="text-sm text-zinc-400">
              Selecciona un archivo CSV o Excel con los datos de biorremediacion
            </p>
          </div>
          <Dropzone onFileUploaded={setDataset} />
        </div>
      ) : null}

      {dataset ? (
        <div className="space-y-6">
          <DataPreview dataset={dataset} />
          <button
            type="button"
            onClick={() => {
              setDataset(null);
              setShowUpload(true);
            }}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Cargar otro archivo
          </button>
        </div>
      ) : null}
    </div>
  );
}
