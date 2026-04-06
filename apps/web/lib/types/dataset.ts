export interface ActiveDataset {
  id: string;
  name: string;
  rowCount: number;
  level: 1 | 2;
}

export interface ApiDatasetRow {
  id: string;
  name: string;
  file_type: string;
  row_count: number;
  has_biopila_id: boolean;
  created_at: string;
}

export function toActiveDataset(row: ApiDatasetRow): ActiveDataset {
  return {
    id: row.id,
    name: row.name,
    rowCount: row.row_count,
    level: row.has_biopila_id ? 2 : 1,
  };
}
