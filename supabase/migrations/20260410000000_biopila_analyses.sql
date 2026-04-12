-- AI-generated analyses for biopiles: one row per (dataset, biopile) pair
create table biopila_analyses (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  biopila_id text not null,
  content text not null,
  generated_at timestamptz not null default now(),
  unique(dataset_id, biopila_id)
);
