/** Max visible characters for dataset id in breadcrumbs / compact UI (before ellipsis). */
export const DATASET_ID_MAX_VISIBLE = 12;

function segment(s: string): string {
  return encodeURIComponent(s);
}

export function datasetDashboardPath(datasetId: string): string {
  return `/datasets/${segment(datasetId)}/dashboard`;
}

export function datasetBiopilaPath(datasetId: string, biopilaId: string): string {
  return `/datasets/${segment(datasetId)}/biopila/${segment(biopilaId)}`;
}

export function truncateDatasetId(
  id: string,
  maxChars: number = DATASET_ID_MAX_VISIBLE
): string {
  if (id.length <= maxChars) return id;
  return `${id.slice(0, maxChars)}…`;
}
