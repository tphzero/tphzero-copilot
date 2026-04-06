'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { datasetDashboardPath } from '@/lib/navigation/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ActiveDataset } from '@/lib/types/dataset';

interface DataPreviewProps {
  dataset: ActiveDataset;
}

export function DataPreview({ dataset }: DataPreviewProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let active = true;

    fetch(`/api/data/${dataset.id}`)
      .then((res) => res.json())
      .then((data: { measurements?: Record<string, unknown>[] }) => {
        if (!active) return;
        setPreview((data.measurements ?? []).slice(0, 5));
      })
      .catch(() => {
        if (!active) return;
        setPreview([]);
      });

    return () => {
      active = false;
    };
  }, [dataset.id]);

  const columns = preview.length > 0 ? Object.keys(preview[0]!).slice(0, 8) : [];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg">{dataset.name}</CardTitle>
          <p className="text-sm text-zinc-400">{dataset.rowCount} filas cargadas</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-700 text-emerald-400"
          >
            Nivel {dataset.level}
          </Badge>
          <Button
            onClick={() => router.push(datasetDashboardPath(dataset.id))}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Comenzar analisis
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {preview.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  {columns.map((col) => (
                    <TableHead key={col} className="font-mono text-xs text-zinc-500">
                      {col}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs text-zinc-500">...</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, index) => (
                  <TableRow key={index} className="border-zinc-800">
                    {columns.map((col) => (
                      <TableCell key={col} className="font-mono text-xs">
                        {typeof row[col] === 'number'
                          ? (row[col] as number).toFixed(2)
                          : String(row[col] ?? '')}
                      </TableCell>
                    ))}
                    <TableCell className="text-zinc-500">...</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-zinc-500">
              Mostrando primeras 5 filas de {dataset.rowCount}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            El dataset se cargo correctamente. La vista previa estara disponible
            cuando existan mediciones recuperables desde la API.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
