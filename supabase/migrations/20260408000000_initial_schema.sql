-- Datasets: metadata about uploaded files
create table datasets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_type text not null check (file_type in ('csv', 'xlsx')),
  row_count integer not null default 0,
  has_biopila_id boolean not null default false,
  created_at timestamptz not null default now()
);

-- Measurements: parsed rows from CSV/Excel
create table measurements (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  biopila_id text,
  tiempo_dias integer not null,
  temperatura_suelo_c real not null,
  humedad_suelo_pct real not null,
  oxigeno_pct real not null,
  ph real not null,
  conductividad_mscm real,
  tph_inicial_mgkg real not null,
  tph_actual_mgkg real not null,
  tipo_hidrocarburo text not null check (tipo_hidrocarburo in ('liviano', 'pesado')),
  agua_aplicada_l_m3 real not null,
  fertilizante_n real not null,
  fertilizante_p real not null,
  fertilizante_k real not null,
  tensioactivo integer not null check (tensioactivo in (0, 1)),
  enmienda text not null check (enmienda in ('biochar', 'diatomeas', 'ninguna')),
  frecuencia_volteo_dias integer not null,
  temperatura_ambiente_c real not null,
  humedad_ambiente_pct real not null,
  precipitaciones_mm real not null,
  porcentaje_reduccion_tph real not null,
  estado_sistema text,
  recomendacion_operativa text,
  created_at timestamptz not null default now()
);

create index idx_measurements_dataset on measurements(dataset_id);
create index idx_measurements_biopila on measurements(biopila_id);
