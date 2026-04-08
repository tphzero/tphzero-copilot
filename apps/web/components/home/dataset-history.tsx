'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ActiveDataset, ApiDatasetRow } from '@/lib/types/dataset';
import { toActiveDataset } from '@/lib/types/dataset';

interface DatasetHistoryProps {
  rows: ApiDatasetRow[];
  activeDatasetId: string | null;
  onLoad: (dataset: ActiveDataset) => void;
  onDelete: (id: string) => void;
}

const fmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function DatasetHistory({
  rows,
  activeDatasetId,
  onLoad,
  onDelete,
}: DatasetHistoryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/data/${confirmDeleteId}`, { method: 'DELETE' });
      onDelete(confirmDeleteId);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs text-muted-foreground">Nivel</TableHead>
              <TableHead className="text-xs text-muted-foreground">Filas</TableHead>
              <TableHead className="text-xs text-muted-foreground">Fecha</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isActive = row.id === activeDatasetId;
              const dataset = toActiveDataset(row);
              return (
                <TableRow
                  key={row.id}
                  className={
                    isActive
                      ? 'border-border bg-muted/60'
                      : 'border-border'
                  }
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {row.name}
                      {isActive && (
                        <Badge
                          variant="outline"
                          className="border-emerald-700/60 px-1.5 py-0 text-[10px] text-emerald-400"
                        >
                          Activo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground"
                    >
                      Nivel {dataset.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.row_count.toLocaleString('es-MX')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmt.format(new Date(row.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-border text-xs hover:border-foreground/30"
                          onClick={() => onLoad(dataset)}
                        >
                          Cargar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => setConfirmDeleteId(row.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Eliminar dataset</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta accion es irreversible. Se eliminaran el dataset y todas sus
              mediciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
