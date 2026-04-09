import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Database, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useActiveDataset } from '@/lib/context/dataset-context';
import { datasetDashboardPath } from '@/lib/navigation/routes';
import type { ActiveDataset, ApiDatasetRow } from '@/lib/types/dataset';
import { toActiveDataset } from '@/lib/types/dataset';

export function ActiveDatasetChip() {
  const router = useRouter();
  const { activeDataset, setActiveDataset } = useActiveDataset();
  const [isOpen, setIsOpen] = useState(false);
  const [datasets, setDatasets] = useState<ApiDatasetRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetch('/api/data')
      .then((r) => r.json())
      .then((data: { datasets?: ApiDatasetRow[] }) => {
        setDatasets(data.datasets ?? []);
      })
      .catch(() => setDatasets([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!activeDataset) return null;

  const handleSelectDataset = (dataset: ActiveDataset) => {
    setActiveDataset(dataset);
    setIsOpen(false);
    router.push(datasetDashboardPath(dataset.id));
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card/80 px-3 py-1.5 text-xs transition-colors hover:border-foreground/30 hover:bg-card">
        <Database className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
        <div className="flex flex-col items-start gap-0.5">
          <span className="max-w-[100px] truncate font-medium text-foreground/90">
            {activeDataset.name}
          </span>
          <Badge
            variant="outline"
            className="border-emerald-700/60 px-1 py-0 text-[10px] text-emerald-400"
          >
            Nivel {activeDataset.level}
          </Badge>
        </div>
        <ChevronDown className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 border-border bg-card">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cambiar dataset
          </p>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Cargando...
          </div>
        ) : datasets.length === 0 ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">No hay datasets</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {datasets.map((row) => {
              const dataset = toActiveDataset(row);
              const isActive = row.id === activeDataset.id;
              return (
                <DropdownMenuItem
                  key={row.id}
                  onClick={() => handleSelectDataset(dataset)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-xs ${
                    isActive
                      ? 'bg-muted text-emerald-500'
                      : 'text-foreground/85 hover:bg-muted'
                  }`}
                  disabled={isActive}
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate font-medium">{row.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {row.row_count.toLocaleString('es-MX')} filas
                    </span>
                  </div>
                  {isActive && <span className="text-emerald-400">✓</span>}
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
