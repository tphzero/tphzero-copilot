import type { Measurement } from '@tphzero/domain';

export function uniqueBiopilaIds(measurements: Measurement[]): string[] {
  const ids = measurements
    .map((m) => m.biopilaId)
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}
