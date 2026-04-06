'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import type { ActiveDataset } from '@/lib/types/dataset';

interface DatasetContextValue {
  activeDataset: ActiveDataset | null;
  setActiveDataset: (dataset: ActiveDataset | null) => void;
  /** Bumps when the dataset list from `/api/data` may have changed (upload/delete). */
  datasetCatalogVersion: number;
  bumpDatasetCatalog: () => void;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null);
  const [datasetCatalogVersion, setDatasetCatalogVersion] = useState(0);
  const bumpDatasetCatalog = useCallback(() => {
    setDatasetCatalogVersion((v) => v + 1);
  }, []);

  return (
    <DatasetContext.Provider
      value={{
        activeDataset,
        setActiveDataset,
        datasetCatalogVersion,
        bumpDatasetCatalog,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useActiveDataset(): DatasetContextValue {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useActiveDataset must be used within DatasetProvider');
  return ctx;
}

/** For consumers that must refetch when the dataset list changes; returns 0 outside provider. */
export function useDatasetCatalogVersion(): number {
  const ctx = useContext(DatasetContext);
  return ctx?.datasetCatalogVersion ?? 0;
}
