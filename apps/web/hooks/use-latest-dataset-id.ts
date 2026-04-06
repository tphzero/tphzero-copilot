'use client';

import { useEffect, useState } from 'react';
import { useDatasetCatalogVersion } from '@/lib/context/dataset-context';

interface DatasetSummary {
  id: string;
}

export function useLatestDatasetId(): {
  latestDatasetId: string | null;
  loading: boolean;
} {
  const catalogVersion = useDatasetCatalogVersion();

  const [latestDatasetId, setLatestDatasetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      try {
        const res = await fetch('/api/data');
        const data = (await res.json()) as { datasets?: DatasetSummary[] };
        const id = data.datasets?.[0]?.id ?? null;
        if (active) setLatestDatasetId(id);
      } catch {
        if (active) setLatestDatasetId(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [catalogVersion]);

  return { latestDatasetId, loading };
}
