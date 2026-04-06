'use client';

import { createContext, useContext, useState } from 'react';
import type { ActiveDataset } from '@/lib/types/dataset';

interface DatasetContextValue {
  activeDataset: ActiveDataset | null;
  setActiveDataset: (dataset: ActiveDataset | null) => void;
}

const DatasetContext = createContext<DatasetContextValue | null>(null);

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [activeDataset, setActiveDataset] = useState<ActiveDataset | null>(null);
  return (
    <DatasetContext.Provider value={{ activeDataset, setActiveDataset }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useActiveDataset(): DatasetContextValue {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useActiveDataset must be used within DatasetProvider');
  return ctx;
}
