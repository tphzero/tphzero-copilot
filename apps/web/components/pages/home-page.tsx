'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { DatasetHistory } from '@/components/home/dataset-history';
import { DataPreview } from '@/components/upload/data-preview';
import { Dropzone } from '@/components/upload/dropzone';
import { EmptyState } from '@/components/upload/empty-state';
import { Button } from '@/components/ui/button';
import { useActiveDataset } from '@/lib/context/dataset-context';
import { datasetDashboardPath } from '@/lib/navigation/routes';
import type { ActiveDataset, ApiDatasetRow } from '@/lib/types/dataset';

export function HomePage() {
  const router = useRouter();
  const { activeDataset, setActiveDataset, bumpDatasetCatalog } =
    useActiveDataset();
  const [showUpload, setShowUpload] = useState(false);
  const [history, setHistory] = useState<ApiDatasetRow[]>([]);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((data: { datasets?: ApiDatasetRow[] }) => {
        setHistory(data.datasets ?? []);
      })
      .catch(() => setHistory([]));
  }, []);

  function handleUploadClick() {
    setShowUpload(true);
    setTimeout(() => {
      dropzoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleFileUploaded(dataset: ActiveDataset) {
    setActiveDataset(dataset);
    bumpDatasetCatalog();
    setShowUpload(false);
    setHistory((prev) => [
      {
        id: dataset.id,
        name: dataset.name,
        file_type: '',
        row_count: dataset.rowCount,
        has_biopila_id: dataset.level === 2,
        created_at: new Date().toISOString(),
      },
      ...prev.filter((r) => r.id !== dataset.id),
    ]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleLoad(dataset: ActiveDataset) {
    setActiveDataset(dataset);
    setShowUpload(false);
    router.push(datasetDashboardPath(dataset.id));
  }

  function handleDelete(id: string) {
    if (activeDataset?.id === id) {
      setActiveDataset(null);
    }
    bumpDatasetCatalog();
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-12">
      {activeDataset ? (
        <DataPreview dataset={activeDataset} />
      ) : (
        <EmptyState onUploadClick={handleUploadClick} />
      )}

      {showUpload ? (
        <div ref={dropzoneRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Cargar datos</h2>
              <p className="text-sm text-muted-foreground">
                Selecciona un archivo CSV o Excel con los datos de biorremediacion
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowUpload(false)}
            >
              Cancelar
            </Button>
          </div>
          <Dropzone onFileUploaded={handleFileUploaded} />
        </div>
      ) : null}

      {history.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Datasets anteriores</h2>
            {!showUpload ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-border text-xs hover:border-border"
                onClick={handleUploadClick}
              >
                <Upload className="h-3.5 w-3.5" />
                Cargar nuevo
              </Button>
            ) : null}
          </div>
          <DatasetHistory
            rows={history}
            activeDatasetId={activeDataset?.id ?? null}
            onLoad={handleLoad}
            onDelete={handleDelete}
          />
        </section>
      ) : null}
    </div>
  );
}
