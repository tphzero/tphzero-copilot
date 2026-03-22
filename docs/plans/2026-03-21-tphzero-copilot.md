# TPHZero Copilot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bioremediation monitoring platform with AI-powered analysis, prediction, and simulation for hydrocarbon-contaminated biopiles.

**Architecture:** Next.js 16 monorepo (Turborepo) with shadcn/ui dark-mode dashboard. Mathematical models in TypeScript (simple-statistics, ml-regression) provide numerical analysis. AI SDK v6 with Google Gemini interprets model outputs via tool-calling agents. Supabase provides Postgres persistence and file storage.

**Tech Stack:** Next.js 16, Turborepo, shadcn/ui, Recharts, Vercel AI SDK v6, Google Gemini, simple-statistics, ml-regression, Papa Parse, SheetJS, Supabase, Vercel.

**Spec:** `SPEC.md` (root)

---

## File Structure

```
tphzero-copilot/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── layout.tsx                    # Root layout: Geist fonts, dark mode, nav
│       │   ├── page.tsx                      # Home: empty state + upload
│       │   ├── dashboard/
│       │   │   └── page.tsx                  # Dashboard: KPIs + charts
│       │   ├── biopila/
│       │   │   └── [id]/
│       │   │       └── page.tsx              # Biopila detail: timeline + metrics
│       │   ├── chat/
│       │   │   └── page.tsx                  # AI chat interface
│       │   ├── simulator/
│       │   │   └── page.tsx                  # What-if simulator
│       │   └── api/
│       │       ├── chat/
│       │       │   └── route.ts              # AI streaming endpoint
│       │       ├── upload/
│       │       │   └── route.ts              # CSV/Excel upload + parse
│       │       └── data/
│       │           ├── route.ts              # List datasets
│       │           ├── [datasetId]/
│       │           │   └── route.ts          # Get dataset measurements
│       │           └── measurements/
│       │               └── route.ts          # Query measurements
│       ├── components/
│       │   ├── ui/                           # shadcn components (auto-generated)
│       │   ├── layout/
│       │   │   ├── sidebar-nav.tsx           # Sidebar navigation
│       │   │   └── header.tsx                # Top bar with branding
│       │   ├── upload/
│       │   │   ├── dropzone.tsx              # Drag-and-drop file zone
│       │   │   ├── data-preview.tsx          # Table preview of parsed data
│       │   │   └── empty-state.tsx           # No-data landing view
│       │   ├── dashboard/
│       │   │   ├── kpi-cards.tsx             # Summary metric cards
│       │   │   ├── biopila-card.tsx          # Per-biopila status card
│       │   │   └── overview-charts.tsx       # Global summary charts
│       │   ├── charts/
│       │   │   ├── tph-timeline.tsx          # TPH reduction over time
│       │   │   ├── variables-chart.tsx       # Multi-variable line chart
│       │   │   └── status-indicator.tsx      # Semáforo component
│       │   ├── chat/
│       │   │   └── chat-panel.tsx            # Chat UI wrapper
│       │   └── simulator/
│       │       ├── variable-sliders.tsx      # Parameter adjustment sliders
│       │       └── comparison-chart.tsx      # Baseline vs simulated
│       └── lib/
│           ├── ai/
│           │   ├── tools.ts                  # AI SDK tool definitions
│           │   ├── prompts.ts                # System prompts (español)
│           │   └── model.ts                  # Model config (provider-agnostic)
│           ├── models/
│           │   ├── classifier.ts             # State classifier (optimal/suboptimal/critical)
│           │   ├── predictor.ts              # TPH reduction predictor (exponential decay)
│           │   ├── correlator.ts             # Pearson correlation analysis
│           │   ├── anomaly.ts                # Z-score anomaly detection
│           │   └── simulator.ts              # What-if multivariate estimator
│           ├── data/
│           │   ├── parser.ts                 # CSV/Excel parse + normalize
│           │   ├── validator.ts              # Column schema validation
│           │   └── supabase.ts               # Supabase client + typed queries
│           └── types.ts                      # All TypeScript types
│
├── packages/
│   └── domain/
│       ├── src/
│       │   ├── index.ts                      # Re-exports
│       │   ├── types.ts                      # Shared domain types
│       │   ├── thresholds.ts                 # Optimal/critical ranges per variable
│       │   └── calculations.ts               # Pure stat helpers
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql            # DDL for datasets + measurements
│
├── turbo.json
├── package.json
├── vercel.json
├── .env.local.example
├── SPEC.md
└── docs/plans/2026-03-21-tphzero-copilot.md
```

---

## Phase 1 — Scaffold & Infrastructure

### Task 1: Turborepo + Next.js monorepo scaffold

**Files:**
- Create: `package.json` (root workspace)
- Create: `turbo.json`
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `.gitignore`
- Create: `.env.local.example`

- [ ] **Step 1: Create root package.json with workspaces**

```json
{
  "name": "tphzero-copilot",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2"
  }
}
```

- [ ] **Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

- [ ] **Step 3: Scaffold Next.js app**

Run: `cd apps/web && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack`

If interactive prompts are an issue, create manually:
- `apps/web/package.json` with next, react, react-dom, typescript, tailwindcss
- `apps/web/next.config.ts`
- `apps/web/tsconfig.json`
- `apps/web/app/layout.tsx` (minimal)
- `apps/web/app/page.tsx` (minimal "Hello TPHZero")

- [ ] **Step 4: Create domain package**

`packages/domain/package.json`:
```json
{
  "name": "@tphzero/domain",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "lint": "echo 'no lint configured'"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

`packages/domain/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`packages/domain/src/index.ts`:
```ts
export * from './types';
export * from './thresholds';
export * from './calculations';
```

- [ ] **Step 5: Create .gitignore and .env.local.example**

`.gitignore`:
```
node_modules/
.next/
dist/
.turbo/
.env*.local
```

`.env.local.example`:
```
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 6: Install dependencies and verify**

Run: `npm install`
Run: `npx turbo dev` — verify Next.js starts on localhost:3000

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Turborepo monorepo with Next.js app and domain package"
```

---

### Task 2: shadcn/ui + Geist fonts + dark mode theme

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/lib/utils.ts` (cn utility)

- [ ] **Step 1: Initialize shadcn/ui**

Run (from `apps/web`):
```bash
npx shadcn@latest init
```
Choose: New York style, Zinc color, CSS variables = yes.

- [ ] **Step 2: Install Geist fonts**

Run: `cd apps/web && npm install geist`

- [ ] **Step 3: Configure layout with Geist + dark mode**

`apps/web/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'TPHZero Copilot',
  description: 'Monitoreo inteligente de biorremediación de suelos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Add semantic color tokens to globals.css**

Append to the `:root` / `.dark` blocks in `globals.css`:
```css
.dark {
  --status-optimal: 142.1 76.2% 36.3%;   /* emerald-500 */
  --status-suboptimal: 37.7 92.1% 50.2%; /* amber-500 */
  --status-critical: 0 84.2% 60.2%;      /* red-500 */
  --accent-action: 217.2 91.2% 59.8%;    /* blue-500 */
}
```

- [ ] **Step 5: Install initial shadcn components**

Run (from `apps/web`):
```bash
npx shadcn@latest add button card table badge tabs separator sheet dialog dropdown-menu input label textarea tooltip scroll-area
```

- [ ] **Step 6: Verify dark mode renders**

Run: `npx turbo dev` — check localhost:3000 shows dark background.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add shadcn/ui, Geist fonts, dark mode theme with status colors"
```

---

### Task 3: Supabase client + database schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `apps/web/lib/data/supabase.ts`
- Modify: `apps/web/package.json` (add @supabase/supabase-js)

- [ ] **Step 1: Install Supabase client**

Run: `cd apps/web && npm install @supabase/supabase-js`

- [ ] **Step 2: Create database migration SQL**

`supabase/migrations/001_initial_schema.sql`:
```sql
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
  biopila_id text,                        -- null for nivel1 dataset
  tiempo_dias integer not null,
  temperatura_suelo_c real not null,
  humedad_suelo_pct real not null,
  oxigeno_pct real not null,
  ph real not null,
  conductividad_mscm real,               -- null for nivel1
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
  estado_sistema text,                    -- null for nivel1
  recomendacion_operativa text,           -- null for nivel1
  created_at timestamptz not null default now()
);

create index idx_measurements_dataset on measurements(dataset_id);
create index idx_measurements_biopila on measurements(biopila_id);
```

**Note:** Run this SQL in the Supabase dashboard SQL editor after creating the project.

- [ ] **Step 3: Create Supabase client**

`apps/web/lib/data/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for API routes)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client and initial database schema"
```

---

## Phase 2 — Domain Types & Math Models

### Task 4: Domain types and thresholds

**Files:**
- Create: `packages/domain/src/types.ts`
- Create: `packages/domain/src/thresholds.ts`
- Create: `packages/domain/src/calculations.ts`
- Create: `apps/web/lib/types.ts`

- [ ] **Step 1: Write domain types**

`packages/domain/src/types.ts`:
```ts
export interface Measurement {
  id: string;
  datasetId: string;
  biopilaId: string | null;
  tiempoDias: number;
  temperaturaSueloC: number;
  humedadSueloPct: number;
  oxigenoPct: number;
  ph: number;
  conductividadMscm: number | null;
  tphInicialMgkg: number;
  tphActualMgkg: number;
  tipoHidrocarburo: 'liviano' | 'pesado';
  aguaAplicadaLM3: number;
  fertilizanteN: number;
  fertilizanteP: number;
  fertilizanteK: number;
  tensioactivo: 0 | 1;
  enmienda: 'biochar' | 'diatomeas' | 'ninguna';
  frecuenciaVolteoDias: number;
  temperaturaAmbienteC: number;
  humedadAmbientePct: number;
  precipitacionesMm: number;
  porcentajeReduccionTph: number;
  estadoSistema: 'optimo' | 'suboptimo' | 'critico' | null;
  recomendacionOperativa: string | null;
}

export interface Dataset {
  id: string;
  name: string;
  fileType: 'csv' | 'xlsx';
  rowCount: number;
  hasBiopilaId: boolean;
  createdAt: string;
}

export type SystemState = 'optimo' | 'suboptimo' | 'critico';

export interface BiopilaOverview {
  biopilaId: string;
  latestMeasurement: Measurement;
  measurements: Measurement[];
  state: SystemState;
  tphReductionPct: number;
  tiempoDias: number;
}

export interface PredictionResult {
  daysProjected: number[];
  tphProjected: number[];
  estimatedDaysTo90Pct: number | null;
  currentReductionRate: number; // % per day
  confidence: 'alta' | 'media' | 'baja';
}

export interface SimulationResult {
  baseline: { tphProjected: number[]; days: number[] };
  simulated: { tphProjected: number[]; days: number[] };
  deltaReductionPct: number;
  estimatedTimeSavedDays: number | null;
}

export interface CorrelationResult {
  variable: string;
  correlation: number; // -1 to 1
  strength: 'fuerte' | 'moderada' | 'débil';
}

export interface AnomalyResult {
  variable: string;
  value: number;
  zScore: number;
  optimalRange: [number, number];
  severity: 'advertencia' | 'critico';
}
```

- [ ] **Step 2: Write thresholds**

`packages/domain/src/thresholds.ts`:
```ts
// Optimal ranges derived from domain knowledge + dataset analysis
// These are the ranges where bioremediation works effectively.

export interface VariableRange {
  label: string;
  unit: string;
  optimal: [number, number];
  acceptable: [number, number];
  critical: [number, number]; // outside this = critical
}

export const THRESHOLDS: Record<string, VariableRange> = {
  temperatura_suelo_c: {
    label: 'Temperatura del suelo',
    unit: '°C',
    optimal: [15, 35],
    acceptable: [10, 40],
    critical: [5, 45],
  },
  humedad_suelo_pct: {
    label: 'Humedad del suelo',
    unit: '%',
    optimal: [20, 35],
    acceptable: [10, 40],
    critical: [5, 45],
  },
  oxigeno_pct: {
    label: 'Oxígeno',
    unit: '%',
    optimal: [10, 20],
    acceptable: [5, 25],
    critical: [2, 30],
  },
  ph: {
    label: 'pH',
    unit: '',
    optimal: [6.5, 7.5],
    acceptable: [6.0, 8.0],
    critical: [5.5, 9.0],
  },
};

export const TPH_REDUCTION_TARGET = 0.9; // 90% reduction = remediation goal

export function classifyValue(
  variable: string,
  value: number
): 'optimo' | 'suboptimo' | 'critico' {
  const range = THRESHOLDS[variable];
  if (!range) return 'optimo';

  if (value >= range.optimal[0] && value <= range.optimal[1]) return 'optimo';
  if (value >= range.acceptable[0] && value <= range.acceptable[1]) return 'suboptimo';
  return 'critico';
}
```

- [ ] **Step 3: Write pure calculation helpers**

`packages/domain/src/calculations.ts`:
```ts
import type { Measurement, SystemState } from './types';
import { classifyValue, THRESHOLDS } from './thresholds';

export function classifyBiopilaState(m: Measurement): SystemState {
  const statuses = [
    classifyValue('temperatura_suelo_c', m.temperaturaSueloC),
    classifyValue('humedad_suelo_pct', m.humedadSueloPct),
    classifyValue('oxigeno_pct', m.oxigenoPct),
    classifyValue('ph', m.ph),
  ];

  if (statuses.includes('critico')) return 'critico';
  if (statuses.includes('suboptimo')) return 'suboptimo';
  return 'optimo';
}

export function reductionPercent(tphInicial: number, tphActual: number): number {
  if (tphInicial <= 0) return 0;
  return Math.max(0, (tphInicial - tphActual) / tphInicial);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function zScore(value: number, values: number[]): number {
  const s = stdDev(values);
  if (s === 0) return 0;
  return (value - mean(values)) / s;
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));

  let num = 0;
  let dx2 = 0;
  let dy2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }

  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}
```

- [ ] **Step 4: Create app-level types re-export**

`apps/web/lib/types.ts`:
```ts
export type {
  Measurement,
  Dataset,
  SystemState,
  BiopilaOverview,
  PredictionResult,
  SimulationResult,
  CorrelationResult,
  AnomalyResult,
} from '@tphzero/domain';

export { THRESHOLDS, classifyValue, TPH_REDUCTION_TARGET } from '@tphzero/domain';
export {
  classifyBiopilaState,
  reductionPercent,
  mean,
  stdDev,
  zScore,
  pearsonCorrelation,
} from '@tphzero/domain';
```

- [ ] **Step 5: Write tests for calculations**

`packages/domain/src/__tests__/calculations.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  classifyBiopilaState,
  reductionPercent,
  mean,
  stdDev,
  pearsonCorrelation,
} from '../calculations';
import type { Measurement } from '../types';

describe('reductionPercent', () => {
  it('returns 0.5 for 50% reduction', () => {
    expect(reductionPercent(100000, 50000)).toBeCloseTo(0.5);
  });
  it('returns 0 when initial is 0', () => {
    expect(reductionPercent(0, 50000)).toBe(0);
  });
  it('clamps to 0 when actual > initial', () => {
    expect(reductionPercent(50000, 80000)).toBe(0);
  });
});

describe('mean', () => {
  it('calculates mean', () => {
    expect(mean([10, 20, 30])).toBe(20);
  });
  it('returns 0 for empty', () => {
    expect(mean([])).toBe(0);
  });
});

describe('pearsonCorrelation', () => {
  it('returns ~1 for perfect positive', () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
  });
  it('returns ~-1 for perfect negative', () => {
    expect(pearsonCorrelation([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1);
  });
});

describe('classifyBiopilaState', () => {
  const baseMeasurement: Measurement = {
    id: '1', datasetId: '1', biopilaId: 'B1', tiempoDias: 30,
    temperaturaSueloC: 20, humedadSueloPct: 25, oxigenoPct: 15, ph: 7.0,
    conductividadMscm: 2, tphInicialMgkg: 80000, tphActualMgkg: 60000,
    tipoHidrocarburo: 'liviano', aguaAplicadaLM3: 40, fertilizanteN: 20,
    fertilizanteP: 10, fertilizanteK: 15, tensioactivo: 1, enmienda: 'biochar',
    frecuenciaVolteoDias: 15, temperaturaAmbienteC: 18, humedadAmbientePct: 50,
    precipitacionesMm: 5, porcentajeReduccionTph: 0.25,
    estadoSistema: null, recomendacionOperativa: null,
  };

  it('returns optimo when all variables in optimal range', () => {
    expect(classifyBiopilaState(baseMeasurement)).toBe('optimo');
  });

  it('returns critico when any variable is critical', () => {
    expect(classifyBiopilaState({ ...baseMeasurement, ph: 4.0 })).toBe('critico');
  });

  it('returns suboptimo when variable is acceptable but not optimal', () => {
    expect(classifyBiopilaState({ ...baseMeasurement, humedadSueloPct: 8 })).toBe('suboptimo');
  });
});
```

- [ ] **Step 6: Run tests**

Run: `cd packages/domain && npx vitest run`
Expected: All 8 tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add domain types, thresholds, and calculation helpers with tests"
```

---

### Task 5: Mathematical models

**Files:**
- Create: `apps/web/lib/models/classifier.ts`
- Create: `apps/web/lib/models/predictor.ts`
- Create: `apps/web/lib/models/correlator.ts`
- Create: `apps/web/lib/models/anomaly.ts`
- Create: `apps/web/lib/models/simulator.ts`
- Modify: `apps/web/package.json` (add simple-statistics)

- [ ] **Step 1: Install dependencies**

Run: `cd apps/web && npm install simple-statistics`

Note: We use `simple-statistics` for stats and implement regression ourselves to avoid heavy dependencies. The datasets are small enough (30-200 rows) that custom implementations are practical.

- [ ] **Step 2: Write state classifier**

`apps/web/lib/models/classifier.ts`:
```ts
import type { Measurement, SystemState, AnomalyResult } from '@tphzero/domain';
import { THRESHOLDS, classifyValue, classifyBiopilaState } from '@tphzero/domain';

export interface ClassificationResult {
  state: SystemState;
  variableStates: Array<{
    variable: string;
    label: string;
    value: number;
    unit: string;
    state: SystemState;
    optimalRange: [number, number];
  }>;
  criticalCount: number;
  suboptimalCount: number;
}

export function classifyMeasurement(m: Measurement): ClassificationResult {
  const variableStates = [
    { key: 'temperatura_suelo_c', value: m.temperaturaSueloC },
    { key: 'humedad_suelo_pct', value: m.humedadSueloPct },
    { key: 'oxigeno_pct', value: m.oxigenoPct },
    { key: 'ph', value: m.ph },
  ].map(({ key, value }) => {
    const t = THRESHOLDS[key];
    return {
      variable: key,
      label: t.label,
      value,
      unit: t.unit,
      state: classifyValue(key, value),
      optimalRange: t.optimal as [number, number],
    };
  });

  const state = classifyBiopilaState(m);
  const criticalCount = variableStates.filter((v) => v.state === 'critico').length;
  const suboptimalCount = variableStates.filter((v) => v.state === 'suboptimo').length;

  return { state, variableStates, criticalCount, suboptimalCount };
}
```

- [ ] **Step 3: Write TPH predictor**

`apps/web/lib/models/predictor.ts`:
```ts
import type { Measurement, PredictionResult } from '@tphzero/domain';
import { TPH_REDUCTION_TARGET } from '@tphzero/domain';

/**
 * Fits an exponential decay model to TPH data:
 *   TPH(t) = TPH_initial * exp(-k * t)
 *
 * Uses linear regression on log-transformed data:
 *   ln(TPH/TPH_initial) = -k * t
 */
export function predictTPH(
  measurements: Measurement[],
  horizonDays: number = 360
): PredictionResult {
  // Sort by time
  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  if (sorted.length < 2) {
    return {
      daysProjected: [],
      tphProjected: [],
      estimatedDaysTo90Pct: null,
      currentReductionRate: 0,
      confidence: 'baja',
    };
  }

  const tphInitial = sorted[0].tphInicialMgkg;

  // Filter valid points (TPH > 0 and TPH <= initial)
  const validPoints = sorted.filter(
    (m) => m.tphActualMgkg > 0 && m.tphActualMgkg <= tphInitial * 1.05
  );

  if (validPoints.length < 2) {
    return {
      daysProjected: [],
      tphProjected: [],
      estimatedDaysTo90Pct: null,
      currentReductionRate: 0,
      confidence: 'baja',
    };
  }

  // Linear regression on ln(TPH_actual / TPH_initial) vs time
  const xs = validPoints.map((m) => m.tiempoDias);
  const ys = validPoints.map((m) => Math.log(m.tphActualMgkg / tphInitial));

  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * ys[i], 0);
  const sumX2 = xs.reduce((sum, x) => sum + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  const k = denom !== 0 ? -(n * sumXY - sumX * sumY) / denom : 0;

  // Project forward
  const maxDay = Math.max(...xs) + horizonDays;
  const step = Math.max(1, Math.round(maxDay / 100));
  const daysProjected: number[] = [];
  const tphProjected: number[] = [];

  for (let d = 0; d <= maxDay; d += step) {
    daysProjected.push(d);
    tphProjected.push(Math.max(0, tphInitial * Math.exp(-k * d)));
  }

  // Estimate days to 90% reduction
  const targetTPH = tphInitial * (1 - TPH_REDUCTION_TARGET);
  const estimatedDaysTo90Pct =
    k > 0 ? Math.round(-Math.log(1 - TPH_REDUCTION_TARGET) / k) : null;

  // Current reduction rate (% per day based on last two valid points)
  const last = validPoints[validPoints.length - 1];
  const first = validPoints[0];
  const currentReductionRate =
    last.tiempoDias > first.tiempoDias
      ? ((first.tphActualMgkg - last.tphActualMgkg) /
          first.tphActualMgkg /
          (last.tiempoDias - first.tiempoDias)) *
        100
      : 0;

  // Confidence based on R² and data points
  const yPred = xs.map((x) => -k * x);
  const ssRes = ys.reduce((sum, y, i) => sum + (y - yPred[i]) ** 2, 0);
  const yMean = sumY / n;
  const ssTot = ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const confidence =
    r2 > 0.8 && n >= 5 ? 'alta' : r2 > 0.5 && n >= 3 ? 'media' : 'baja';

  return {
    daysProjected,
    tphProjected,
    estimatedDaysTo90Pct,
    currentReductionRate,
    confidence,
  };
}
```

- [ ] **Step 4: Write correlator**

`apps/web/lib/models/correlator.ts`:
```ts
import type { Measurement, CorrelationResult } from '@tphzero/domain';
import { pearsonCorrelation } from '@tphzero/domain';

const NUMERIC_VARIABLES: Array<{ key: keyof Measurement; label: string }> = [
  { key: 'temperaturaSueloC', label: 'Temperatura del suelo' },
  { key: 'humedadSueloPct', label: 'Humedad del suelo' },
  { key: 'oxigenoPct', label: 'Oxígeno' },
  { key: 'ph', label: 'pH' },
  { key: 'aguaAplicadaLM3', label: 'Agua aplicada' },
  { key: 'fertilizanteN', label: 'Fertilizante N' },
  { key: 'fertilizanteP', label: 'Fertilizante P' },
  { key: 'fertilizanteK', label: 'Fertilizante K' },
  { key: 'frecuenciaVolteoDias', label: 'Frecuencia de volteo' },
  { key: 'temperaturaAmbienteC', label: 'Temperatura ambiente' },
  { key: 'humedadAmbientePct', label: 'Humedad ambiente' },
  { key: 'precipitacionesMm', label: 'Precipitaciones' },
];

function strengthLabel(r: number): 'fuerte' | 'moderada' | 'débil' {
  const abs = Math.abs(r);
  if (abs >= 0.7) return 'fuerte';
  if (abs >= 0.4) return 'moderada';
  return 'débil';
}

export function correlateWithReduction(
  measurements: Measurement[]
): CorrelationResult[] {
  const reductions = measurements.map((m) => m.porcentajeReduccionTph);

  return NUMERIC_VARIABLES.map(({ key, label }) => {
    const values = measurements.map((m) => m[key] as number);
    const correlation = pearsonCorrelation(values, reductions);
    return {
      variable: label,
      correlation: Math.round(correlation * 1000) / 1000,
      strength: strengthLabel(correlation),
    };
  }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}
```

- [ ] **Step 5: Write anomaly detector**

`apps/web/lib/models/anomaly.ts`:
```ts
import type { Measurement, AnomalyResult } from '@tphzero/domain';
import { THRESHOLDS, classifyValue } from '@tphzero/domain';
import { zScore } from '@tphzero/domain';

const VARIABLE_KEYS: Array<{
  key: keyof Measurement;
  thresholdKey: string;
}> = [
  { key: 'temperaturaSueloC', thresholdKey: 'temperatura_suelo_c' },
  { key: 'humedadSueloPct', thresholdKey: 'humedad_suelo_pct' },
  { key: 'oxigenoPct', thresholdKey: 'oxigeno_pct' },
  { key: 'ph', thresholdKey: 'ph' },
];

export function detectAnomalies(
  measurement: Measurement,
  allMeasurements: Measurement[]
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  for (const { key, thresholdKey } of VARIABLE_KEYS) {
    const value = measurement[key] as number;
    const allValues = allMeasurements.map((m) => m[key] as number);
    const z = zScore(value, allValues);
    const state = classifyValue(thresholdKey, value);
    const threshold = THRESHOLDS[thresholdKey];

    if (state !== 'optimo' || Math.abs(z) > 2) {
      anomalies.push({
        variable: threshold.label,
        value,
        zScore: Math.round(z * 100) / 100,
        optimalRange: threshold.optimal,
        severity: state === 'critico' || Math.abs(z) > 3 ? 'critico' : 'advertencia',
      });
    }
  }

  return anomalies;
}
```

- [ ] **Step 6: Write what-if simulator**

`apps/web/lib/models/simulator.ts`:
```ts
import type { Measurement, SimulationResult } from '@tphzero/domain';
import { predictTPH } from './predictor';

export interface SimulationParams {
  humedadSueloPct?: number;
  temperaturaSueloC?: number;
  oxigenoPct?: number;
  fertilizanteN?: number;
  fertilizanteP?: number;
  fertilizanteK?: number;
  frecuenciaVolteoDias?: number;
}

/**
 * Simple what-if simulator: adjusts measurement variables and re-runs prediction.
 *
 * This is a heuristic approach: we modify the historical data points with
 * the delta between current and simulated values, then re-fit the prediction model.
 * This gives a rough estimate of how changes would affect the TPH curve.
 */
export function simulateScenario(
  measurements: Measurement[],
  params: SimulationParams,
  horizonDays: number = 360
): SimulationResult {
  // Baseline prediction
  const baseline = predictTPH(measurements, horizonDays);

  // Create modified measurements
  const modified = measurements.map((m) => ({
    ...m,
    humedadSueloPct: params.humedadSueloPct ?? m.humedadSueloPct,
    temperaturaSueloC: params.temperaturaSueloC ?? m.temperaturaSueloC,
    oxigenoPct: params.oxigenoPct ?? m.oxigenoPct,
    fertilizanteN: params.fertilizanteN ?? m.fertilizanteN,
    fertilizanteP: params.fertilizanteP ?? m.fertilizanteP,
    fertilizanteK: params.fertilizanteK ?? m.fertilizanteK,
    frecuenciaVolteoDias: params.frecuenciaVolteoDias ?? m.frecuenciaVolteoDias,
  }));

  // Apply a heuristic adjustment factor based on how much closer
  // the modified variables are to optimal ranges
  const adjustmentFactor = calculateOptimalityBoost(measurements, modified);

  const simulated = predictTPH(measurements, horizonDays);

  // Apply the adjustment factor to simulated TPH values
  const adjustedTph = simulated.tphProjected.map((tph) => {
    const tphInitial = measurements[0]?.tphInicialMgkg ?? tph;
    const reduction = (tphInitial - tph) / tphInitial;
    const boostedReduction = Math.min(1, reduction * adjustmentFactor);
    return Math.max(0, tphInitial * (1 - boostedReduction));
  });

  const lastBaseline =
    baseline.tphProjected[baseline.tphProjected.length - 1] ?? 0;
  const lastSimulated = adjustedTph[adjustedTph.length - 1] ?? 0;
  const tphInitial = measurements[0]?.tphInicialMgkg ?? 1;

  const baselineReduction = (tphInitial - lastBaseline) / tphInitial;
  const simulatedReduction = (tphInitial - lastSimulated) / tphInitial;

  return {
    baseline: {
      tphProjected: baseline.tphProjected,
      days: baseline.daysProjected,
    },
    simulated: {
      tphProjected: adjustedTph,
      days: simulated.daysProjected,
    },
    deltaReductionPct:
      Math.round((simulatedReduction - baselineReduction) * 10000) / 100,
    estimatedTimeSavedDays:
      baseline.estimatedDaysTo90Pct && simulated.estimatedDaysTo90Pct
        ? baseline.estimatedDaysTo90Pct -
          Math.round(simulated.estimatedDaysTo90Pct / adjustmentFactor)
        : null,
  };
}

/**
 * Calculate how much closer to optimal the modified measurements are.
 * Returns a factor >= 1.0 (1.0 = no change, >1 = improvement).
 */
function calculateOptimalityBoost(
  original: Measurement[],
  modified: Measurement[]
): number {
  const { classifyBiopilaState } = require('@tphzero/domain');

  let originalScore = 0;
  let modifiedScore = 0;

  const stateScore = { optimo: 3, suboptimo: 2, critico: 1 };

  for (let i = 0; i < original.length; i++) {
    originalScore += stateScore[classifyBiopilaState(original[i])];
    modifiedScore += stateScore[classifyBiopilaState(modified[i])];
  }

  if (originalScore === 0) return 1;
  return Math.max(1, modifiedScore / originalScore);
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add mathematical models — classifier, predictor, correlator, anomaly, simulator"
```

---

## Phase 3 — Data Ingestion

### Task 6: CSV/Excel parser and validator

**Files:**
- Create: `apps/web/lib/data/parser.ts`
- Create: `apps/web/lib/data/validator.ts`
- Modify: `apps/web/package.json` (add papaparse, xlsx)

- [ ] **Step 1: Install dependencies**

Run: `cd apps/web && npm install papaparse xlsx && npm install -D @types/papaparse`

- [ ] **Step 2: Write column validator**

`apps/web/lib/data/validator.ts`:
```ts
// Required columns for nivel 1
const REQUIRED_COLUMNS_NIVEL1 = [
  'tiempo_dias',
  'temperatura_suelo_C',
  'humedad_suelo_pct',
  'oxigeno_pct',
  'pH',
  'TPH_inicial_mgkg',
  'TPH_actual_mgkg',
  'tipo_hidrocarburo',
  'agua_aplicada_L_m3',
  'fertilizante_N',
  'fertilizante_P',
  'fertilizante_K',
  'tensioactivo',
  'enmienda',
  'frecuencia_volteo_dias',
  'temperatura_ambiente_C',
  'humedad_ambiente_pct',
  'precipitaciones_mm',
  'porcentaje_reduccion_TPH',
] as const;

// Additional columns for nivel 2
const OPTIONAL_COLUMNS_NIVEL2 = [
  'biopila_id',
  'conductividad_mScm',
  'estado_sistema',
  'recomendacion_operativa',
] as const;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  detectedLevel: 1 | 2;
  columnCount: number;
  rowCount: number;
}

export function validateColumns(headers: string[]): ValidationResult {
  const errors: string[] = [];
  const headerSet = new Set(headers);

  const missingRequired = REQUIRED_COLUMNS_NIVEL1.filter(
    (col) => !headerSet.has(col)
  );

  if (missingRequired.length > 0) {
    errors.push(
      `Columnas faltantes: ${missingRequired.join(', ')}`
    );
  }

  const hasNivel2 = OPTIONAL_COLUMNS_NIVEL2.every((col) =>
    headerSet.has(col)
  );

  return {
    valid: errors.length === 0,
    errors,
    detectedLevel: hasNivel2 ? 2 : 1,
    columnCount: headers.length,
    rowCount: 0, // set by caller
  };
}
```

- [ ] **Step 3: Write parser**

`apps/web/lib/data/parser.ts`:
```ts
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Measurement } from '@tphzero/domain';
import { validateColumns, type ValidationResult } from './validator';

export interface ParseResult {
  measurements: Omit<Measurement, 'id' | 'datasetId'>[];
  validation: ValidationResult;
}

export function parseCSV(text: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const headers = parsed.meta.fields ?? [];
  const validation = validateColumns(headers);
  validation.rowCount = parsed.data.length;

  if (!validation.valid) {
    return { measurements: [], validation };
  }

  const measurements = parsed.data.map((row) => mapRowToMeasurement(row));
  return { measurements, validation };
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
  const headers = Object.keys(rows[0] ?? {});

  const validation = validateColumns(headers);
  validation.rowCount = rows.length;

  if (!validation.valid) {
    return { measurements: [], validation };
  }

  const measurements = rows.map((row) => mapRowToMeasurement(row));
  return { measurements, validation };
}

function mapRowToMeasurement(
  row: Record<string, string | number>
): Omit<Measurement, 'id' | 'datasetId'> {
  return {
    biopilaId: row['biopila_id'] ? String(row['biopila_id']) : null,
    tiempoDias: num(row['tiempo_dias']),
    temperaturaSueloC: num(row['temperatura_suelo_C']),
    humedadSueloPct: num(row['humedad_suelo_pct']),
    oxigenoPct: num(row['oxigeno_pct']),
    ph: num(row['pH']),
    conductividadMscm: row['conductividad_mScm']
      ? num(row['conductividad_mScm'])
      : null,
    tphInicialMgkg: num(row['TPH_inicial_mgkg']),
    tphActualMgkg: num(row['TPH_actual_mgkg']),
    tipoHidrocarburo: String(row['tipo_hidrocarburo']) as 'liviano' | 'pesado',
    aguaAplicadaLM3: num(row['agua_aplicada_L_m3']),
    fertilizanteN: num(row['fertilizante_N']),
    fertilizanteP: num(row['fertilizante_P']),
    fertilizanteK: num(row['fertilizante_K']),
    tensioactivo: num(row['tensioactivo']) as 0 | 1,
    enmienda: String(row['enmienda']) as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: num(row['frecuencia_volteo_dias']),
    temperaturaAmbienteC: num(row['temperatura_ambiente_C']),
    humedadAmbientePct: num(row['humedad_ambiente_pct']),
    precipitacionesMm: num(row['precipitaciones_mm']),
    porcentajeReduccionTph: num(row['porcentaje_reduccion_TPH']),
    estadoSistema: row['estado_sistema']
      ? (String(row['estado_sistema']) as 'optimo' | 'suboptimo' | 'critico')
      : null,
    recomendacionOperativa: row['recomendacion_operativa']
      ? String(row['recomendacion_operativa'])
      : null,
  };
}

function num(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  return parseFloat(String(val)) || 0;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add CSV/Excel parser with column validation"
```

---

### Task 7: Upload API route

**Files:**
- Create: `apps/web/app/api/upload/route.ts`
- Create: `apps/web/app/api/data/route.ts`
- Create: `apps/web/app/api/data/[datasetId]/route.ts`

- [ ] **Step 1: Write upload route**

`apps/web/app/api/upload/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { parseCSV, parseExcel } from '@/lib/data/parser';
import { createServerClient } from '@/lib/data/supabase';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { error: 'No se proporcionó archivo' },
      { status: 400 }
    );
  }

  const fileName = file.name.toLowerCase();
  const isCSV = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  if (!isCSV && !isExcel) {
    return NextResponse.json(
      { error: 'Formato no soportado. Use CSV o Excel (.xlsx)' },
      { status: 400 }
    );
  }

  // Parse file
  let result;
  if (isCSV) {
    const text = await file.text();
    result = parseCSV(text);
  } else {
    const buffer = await file.arrayBuffer();
    result = parseExcel(buffer);
  }

  if (!result.validation.valid) {
    return NextResponse.json(
      {
        error: 'Archivo inválido',
        details: result.validation.errors,
      },
      { status: 422 }
    );
  }

  // Store in Supabase
  const supabase = createServerClient();

  const { data: dataset, error: datasetError } = await supabase
    .from('datasets')
    .insert({
      name: file.name,
      file_type: isCSV ? 'csv' : 'xlsx',
      row_count: result.measurements.length,
      has_biopila_id: result.validation.detectedLevel === 2,
    })
    .select()
    .single();

  if (datasetError) {
    return NextResponse.json(
      { error: 'Error al guardar dataset', details: datasetError.message },
      { status: 500 }
    );
  }

  // Insert measurements in batches
  const BATCH_SIZE = 50;
  const rows = result.measurements.map((m) => ({
    dataset_id: dataset.id,
    biopila_id: m.biopilaId,
    tiempo_dias: m.tiempoDias,
    temperatura_suelo_c: m.temperaturaSueloC,
    humedad_suelo_pct: m.humedadSueloPct,
    oxigeno_pct: m.oxigenoPct,
    ph: m.ph,
    conductividad_mscm: m.conductividadMscm,
    tph_inicial_mgkg: m.tphInicialMgkg,
    tph_actual_mgkg: m.tphActualMgkg,
    tipo_hidrocarburo: m.tipoHidrocarburo,
    agua_aplicada_l_m3: m.aguaAplicadaLM3,
    fertilizante_n: m.fertilizanteN,
    fertilizante_p: m.fertilizanteP,
    fertilizante_k: m.fertilizanteK,
    tensioactivo: m.tensioactivo,
    enmienda: m.enmienda,
    frecuencia_volteo_dias: m.frecuenciaVolteoDias,
    temperatura_ambiente_c: m.temperaturaAmbienteC,
    humedad_ambiente_pct: m.humedadAmbientePct,
    precipitaciones_mm: m.precipitacionesMm,
    porcentaje_reduccion_tph: m.porcentajeReduccionTph,
    estado_sistema: m.estadoSistema,
    recomendacion_operativa: m.recomendacionOperativa,
  }));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('measurements').insert(batch);
    if (error) {
      // Cleanup on failure
      await supabase.from('datasets').delete().eq('id', dataset.id);
      return NextResponse.json(
        { error: 'Error al guardar mediciones', details: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    dataset: {
      id: dataset.id,
      name: dataset.name,
      rowCount: result.measurements.length,
      level: result.validation.detectedLevel,
    },
  });
}
```

- [ ] **Step 2: Write data listing route**

`apps/web/app/api/data/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/data/supabase';

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ datasets: data });
}
```

- [ ] **Step 3: Write dataset detail route**

`apps/web/app/api/data/[datasetId]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/data/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const supabase = createServerClient();

  const [{ data: dataset }, { data: measurements }] = await Promise.all([
    supabase.from('datasets').select('*').eq('id', datasetId).single(),
    supabase
      .from('measurements')
      .select('*')
      .eq('dataset_id', datasetId)
      .order('biopila_id')
      .order('tiempo_dias'),
  ]);

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ dataset, measurements });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from('datasets')
    .delete()
    .eq('id', datasetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add upload, data listing, and dataset detail API routes"
```

---

## Phase 4 — UI Pages

### Task 8: Layout shell with sidebar navigation

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/components/layout/sidebar-nav.tsx`
- Create: `apps/web/components/layout/header.tsx`

- [ ] **Step 1: Write sidebar navigation**

`apps/web/components/layout/sidebar-nav.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Upload },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat IA', icon: MessageSquare },
  { href: '/simulator', label: 'Simulador', icon: SlidersHorizontal },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4">
      <div className="mb-8 px-3">
        <h1 className="font-mono text-lg font-bold tracking-tight text-emerald-400">
          TPHZero
        </h1>
        <p className="font-mono text-xs text-zinc-500">Copilot</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Update root layout**

`apps/web/app/layout.tsx` — update to include sidebar:
```tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'TPHZero Copilot',
  description: 'Monitoreo inteligente de biorremediación de suelos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
          <SidebarNav />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Install lucide-react**

Run: `cd apps/web && npm install lucide-react`

- [ ] **Step 4: Verify layout renders**

Run: `npx turbo dev` — sidebar should be visible with dark background and nav links.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add sidebar navigation layout with dark theme"
```

---

### Task 9: Home page — empty state + file upload

**Files:**
- Create: `apps/web/components/upload/empty-state.tsx`
- Create: `apps/web/components/upload/dropzone.tsx`
- Create: `apps/web/components/upload/data-preview.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Install react-dropzone**

Run: `cd apps/web && npm install react-dropzone`

- [ ] **Step 2: Write empty state component**

`apps/web/components/upload/empty-state.tsx`:
```tsx
import { FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="rounded-full bg-zinc-800/50 p-6">
        <FileSpreadsheet className="h-12 w-12 text-emerald-400" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold">
          Bienvenido a TPHZero Copilot
        </h2>
        <p className="mt-2 max-w-md text-zinc-400">
          Carga un archivo CSV o Excel con datos de tus biopilas para comenzar
          el análisis inteligente de biorremediación.
        </p>
      </div>
      <Button size="lg" onClick={onUploadClick} className="bg-emerald-600 hover:bg-emerald-700">
        Cargar datos
      </Button>
      <details className="mt-4 max-w-lg text-sm text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-300">
          ¿Qué formato necesito?
        </summary>
        <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs">
          <p className="mb-2 text-zinc-400">Columnas requeridas:</p>
          <p>
            tiempo_dias, temperatura_suelo_C, humedad_suelo_pct, oxigeno_pct,
            pH, TPH_inicial_mgkg, TPH_actual_mgkg, tipo_hidrocarburo,
            agua_aplicada_L_m3, fertilizante_N, fertilizante_P, fertilizante_K,
            tensioactivo, enmienda, frecuencia_volteo_dias,
            temperatura_ambiente_C, humedad_ambiente_pct, precipitaciones_mm,
            porcentaje_reduccion_TPH
          </p>
          <p className="mt-2 text-zinc-400">Columnas opcionales (nivel 2):</p>
          <p>biopila_id, conductividad_mScm, estado_sistema, recomendacion_operativa</p>
        </div>
      </details>
    </div>
  );
}
```

- [ ] **Step 3: Write dropzone component**

`apps/web/components/upload/dropzone.tsx`:
```tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCheck, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropzoneProps {
  onFileUploaded: (dataset: { id: string; name: string; rowCount: number; level: number }) => void;
}

export function Dropzone({ onFileUploaded }: DropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(
            data.details
              ? Array.isArray(data.details)
                ? data.details.join('. ')
                : data.details
              : data.error
          );
          return;
        }

        onFileUploaded(data.dataset);
      } catch {
        setError('Error de conexión al subir el archivo');
      } finally {
        setUploading(false);
      }
    },
    [onFileUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 transition-colors',
          isDragActive
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-zinc-700 hover:border-zinc-500',
          uploading && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        ) : isDragActive ? (
          <FileCheck className="h-8 w-8 text-emerald-400" />
        ) : (
          <Upload className="h-8 w-8 text-zinc-500" />
        )}
        <p className="text-sm text-zinc-400">
          {uploading
            ? 'Procesando archivo...'
            : isDragActive
              ? 'Soltar archivo aquí'
              : 'Arrastra un archivo CSV o Excel, o haz clic para seleccionar'}
        </p>
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-900 bg-red-950/50 p-3 text-sm text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write data preview component**

`apps/web/components/upload/data-preview.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataPreviewProps {
  dataset: { id: string; name: string; rowCount: number; level: number };
}

export function DataPreview({ dataset }: DataPreviewProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch(`/api/data/${dataset.id}`)
      .then((res) => res.json())
      .then((data) => {
        setPreview((data.measurements ?? []).slice(0, 5));
      });
  }, [dataset.id]);

  const columns = preview.length > 0 ? Object.keys(preview[0]).slice(0, 8) : [];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">{dataset.name}</CardTitle>
          <p className="text-sm text-zinc-400">
            {dataset.rowCount} filas cargadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-700 text-emerald-400">
            Nivel {dataset.level}
          </Badge>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Comenzar análisis
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {preview.length > 0 && (
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
                {preview.map((row, i) => (
                  <TableRow key={i} className="border-zinc-800">
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
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Write home page**

`apps/web/app/page.tsx`:
```tsx
'use client';

import { useState, useRef } from 'react';
import { EmptyState } from '@/components/upload/empty-state';
import { Dropzone } from '@/components/upload/dropzone';
import { DataPreview } from '@/components/upload/data-preview';

interface UploadedDataset {
  id: string;
  name: string;
  rowCount: number;
  level: number;
}

export default function HomePage() {
  const [dataset, setDataset] = useState<UploadedDataset | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleUploadClick = () => {
    setShowUpload(true);
    setTimeout(() => dropzoneRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {!dataset && !showUpload && (
        <EmptyState onUploadClick={handleUploadClick} />
      )}

      {!dataset && showUpload && (
        <div ref={dropzoneRef} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Cargar datos</h2>
            <p className="text-sm text-zinc-400">
              Selecciona un archivo CSV o Excel con los datos de biorremediación
            </p>
          </div>
          <Dropzone onFileUploaded={setDataset} />
        </div>
      )}

      {dataset && (
        <div className="space-y-6">
          <DataPreview dataset={dataset} />
          <button
            onClick={() => {
              setDataset(null);
              setShowUpload(true);
            }}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Cargar otro archivo
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify home page renders with empty state**

Run: `npx turbo dev` — should show "Bienvenido a TPHZero Copilot" with upload button.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add home page with empty state, file dropzone, and data preview"
```

---

### Task 10: Dashboard page

**Files:**
- Create: `apps/web/components/dashboard/kpi-cards.tsx`
- Create: `apps/web/components/dashboard/biopila-card.tsx`
- Create: `apps/web/components/dashboard/overview-charts.tsx`
- Create: `apps/web/components/charts/tph-timeline.tsx`
- Create: `apps/web/components/charts/status-indicator.tsx`
- Create: `apps/web/app/dashboard/page.tsx`

- [ ] **Step 1: Install Recharts**

Run: `cd apps/web && npm install recharts`

- [ ] **Step 2: Write status indicator (semáforo)**

`apps/web/components/charts/status-indicator.tsx`:
```tsx
import { cn } from '@/lib/utils';
import type { SystemState } from '@tphzero/domain';

const STATE_CONFIG: Record<SystemState, { label: string; color: string; bg: string }> = {
  optimo: { label: 'Óptimo', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  suboptimo: { label: 'Subóptimo', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  critico: { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-500/20' },
};

export function StatusIndicator({
  state,
  size = 'md',
}: {
  state: SystemState;
  size?: 'sm' | 'md' | 'lg';
}) {
  const config = STATE_CONFIG[state];
  const dotSize = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4' }[size];
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];

  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1', config.bg)}>
      <span className={cn('rounded-full', dotSize, config.color.replace('text-', 'bg-'))} />
      <span className={cn(textSize, 'font-medium', config.color)}>
        {config.label}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Write TPH timeline chart**

`apps/web/components/charts/tph-timeline.tsx`:
```tsx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  tiempoDias: number;
  tphActualMgkg: number;
  biopilaId?: string;
}

interface TPHTimelineProps {
  data: DataPoint[];
  biopilaIds?: string[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TPHTimeline({ data, biopilaIds }: TPHTimelineProps) {
  if (!biopilaIds || biopilaIds.length === 0) {
    // Single series
    const chartData = data
      .sort((a, b) => a.tiempoDias - b.tiempoDias)
      .map((d) => ({
        dia: d.tiempoDias,
        tph: Math.round(d.tphActualMgkg),
      }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="dia" stroke="#71717a" fontSize={12} label={{ value: 'Días', position: 'bottom', fill: '#71717a' }} />
          <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
            labelFormatter={(v) => `Día ${v}`}
            formatter={(v: number) => [`${v.toLocaleString()} mg/kg`, 'TPH']}
          />
          <Line type="monotone" dataKey="tph" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Multi-series by biopila
  const grouped = biopilaIds.reduce(
    (acc, id) => {
      acc[id] = data
        .filter((d) => d.biopilaId === id)
        .sort((a, b) => a.tiempoDias - b.tiempoDias);
      return acc;
    },
    {} as Record<string, DataPoint[]>
  );

  // Merge into unified timeline
  const allDays = [...new Set(data.map((d) => d.tiempoDias))].sort((a, b) => a - b);
  const chartData = allDays.map((day) => {
    const point: Record<string, number> = { dia: day };
    biopilaIds.forEach((id) => {
      const m = grouped[id]?.find((d) => d.tiempoDias === day);
      if (m) point[id] = Math.round(m.tphActualMgkg);
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="dia" stroke="#71717a" fontSize={12} />
        <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
          labelFormatter={(v) => `Día ${v}`}
          formatter={(v: number, name: string) => [`${v.toLocaleString()} mg/kg`, name]}
        />
        <Legend />
        {biopilaIds.map((id, i) => (
          <Line key={id} type="monotone" dataKey={id} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Write KPI cards**

`apps/web/components/dashboard/kpi-cards.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Droplets, Timer, TrendingDown } from 'lucide-react';

interface KPICardsProps {
  totalBiopilas: number;
  avgReduction: number;
  optimalCount: number;
  criticalCount: number;
}

export function KPICards({ totalBiopilas, avgReduction, optimalCount, criticalCount }: KPICardsProps) {
  const kpis = [
    {
      label: 'Biopilas activas',
      value: totalBiopilas,
      icon: Activity,
      color: 'text-blue-400',
    },
    {
      label: 'Reducción promedio',
      value: `${(avgReduction * 100).toFixed(1)}%`,
      icon: TrendingDown,
      color: 'text-emerald-400',
    },
    {
      label: 'Estado óptimo',
      value: optimalCount,
      icon: Droplets,
      color: 'text-emerald-400',
    },
    {
      label: 'Estado crítico',
      value: criticalCount,
      icon: Timer,
      color: criticalCount > 0 ? 'text-red-400' : 'text-zinc-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="border-zinc-800 bg-zinc-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold font-mono ${color}`}>{value}</p>
              </div>
              <Icon className={`h-8 w-8 ${color} opacity-30`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Write biopila card**

`apps/web/components/dashboard/biopila-card.tsx`:
```tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusIndicator } from '@/components/charts/status-indicator';
import type { BiopilaOverview } from '@tphzero/domain';

export function BiopilaCard({ biopila }: { biopila: BiopilaOverview }) {
  const m = biopila.latestMeasurement;

  return (
    <Link href={`/biopila/${biopila.biopilaId}`}>
      <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-mono text-base">{biopila.biopilaId}</CardTitle>
          <StatusIndicator state={biopila.state} size="sm" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-zinc-500">TPH actual</p>
              <p className="font-mono font-medium">
                {Math.round(m.tphActualMgkg).toLocaleString()} mg/kg
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Reducción</p>
              <p className="font-mono font-medium text-emerald-400">
                {(biopila.tphReductionPct * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Día</p>
              <p className="font-mono">{biopila.tiempoDias}</p>
            </div>
            <div>
              <p className="text-zinc-500">Tipo</p>
              <p className="font-mono">{m.tipoHidrocarburo}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 6: Write dashboard page**

`apps/web/app/dashboard/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { BiopilaCard } from '@/components/dashboard/biopila-card';
import { TPHTimeline } from '@/components/charts/tph-timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { classifyBiopilaState, reductionPercent, mean } from '@tphzero/domain';
import type { Measurement, BiopilaOverview } from '@tphzero/domain';

// Maps Supabase snake_case rows to camelCase Measurement
function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then(async (data) => {
        const datasets = data.datasets ?? [];
        if (datasets.length === 0) {
          router.push('/');
          return;
        }
        // Load latest dataset
        const latest = datasets[0];
        const res = await fetch(`/api/data/${latest.id}`);
        const detail = await res.json();
        setMeasurements((detail.measurements ?? []).map(mapRow));
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500">Cargando datos...</p>
      </div>
    );
  }

  // Group by biopila (or treat as single if no biopila_id)
  const biopilaIds = [
    ...new Set(measurements.map((m) => m.biopilaId).filter(Boolean)),
  ] as string[];

  const biopilas: BiopilaOverview[] =
    biopilaIds.length > 0
      ? biopilaIds.map((id) => {
          const ms = measurements
            .filter((m) => m.biopilaId === id)
            .sort((a, b) => a.tiempoDias - b.tiempoDias);
          const latest = ms[ms.length - 1];
          return {
            biopilaId: id,
            latestMeasurement: latest,
            measurements: ms,
            state: classifyBiopilaState(latest),
            tphReductionPct: reductionPercent(latest.tphInicialMgkg, latest.tphActualMgkg),
            tiempoDias: latest.tiempoDias,
          };
        })
      : [];

  const avgReduction = mean(
    measurements.map((m) => m.porcentajeReduccionTph)
  );
  const optimalCount = biopilas.filter((b) => b.state === 'optimo').length;
  const criticalCount = biopilas.filter((b) => b.state === 'critico').length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <KPICards
        totalBiopilas={biopilas.length || measurements.length}
        avgReduction={avgReduction}
        optimalCount={optimalCount}
        criticalCount={criticalCount}
      />

      {biopilas.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {biopilas.map((b) => (
              <BiopilaCard key={b.biopilaId} biopila={b} />
            ))}
          </div>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle>Evolución de TPH</CardTitle>
            </CardHeader>
            <CardContent>
              <TPHTimeline
                data={measurements}
                biopilaIds={biopilaIds}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add dashboard with KPI cards, biopila cards, and TPH timeline chart"
```

---

### Task 11: Biopila detail page

**Files:**
- Create: `apps/web/components/charts/variables-chart.tsx`
- Create: `apps/web/app/biopila/[id]/page.tsx`

- [ ] **Step 1: Write multi-variable chart**

`apps/web/components/charts/variables-chart.tsx`:
```tsx
'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { Measurement } from '@tphzero/domain';

const VARIABLES: Array<{ key: keyof Measurement; label: string; color: string }> = [
  { key: 'temperaturaSueloC', label: 'Temp. suelo (°C)', color: '#ef4444' },
  { key: 'humedadSueloPct', label: 'Humedad (%)', color: '#3b82f6' },
  { key: 'oxigenoPct', label: 'Oxígeno (%)', color: '#10b981' },
  { key: 'ph', label: 'pH', color: '#f59e0b' },
];

export function VariablesChart({ measurements }: { measurements: Measurement[] }) {
  const data = measurements
    .sort((a, b) => a.tiempoDias - b.tiempoDias)
    .map((m) => ({
      dia: m.tiempoDias,
      'Temp. suelo (°C)': m.temperaturaSueloC,
      'Humedad (%)': m.humedadSueloPct,
      'Oxígeno (%)': m.oxigenoPct,
      pH: m.ph,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="dia" stroke="#71717a" fontSize={12} />
        <YAxis stroke="#71717a" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
          labelFormatter={(v) => `Día ${v}`}
        />
        <Legend />
        {VARIABLES.map(({ label, color }) => (
          <Line key={label} type="monotone" dataKey={label} stroke={color} strokeWidth={2} dot={{ r: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Write biopila detail page**

`apps/web/app/biopila/[id]/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusIndicator } from '@/components/charts/status-indicator';
import { TPHTimeline } from '@/components/charts/tph-timeline';
import { VariablesChart } from '@/components/charts/variables-chart';
import { classifyBiopilaState, reductionPercent } from '@tphzero/domain';
import type { Measurement } from '@tphzero/domain';

// Reuse mapRow from dashboard (in production, extract to shared util)
function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}

export default function BiopilaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then(async (data) => {
        const datasets = data.datasets ?? [];
        if (datasets.length === 0) return;
        const res = await fetch(`/api/data/${datasets[0].id}`);
        const detail = await res.json();
        const all = (detail.measurements ?? []).map(mapRow) as Measurement[];
        setMeasurements(all.filter((m) => m.biopilaId === id));
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><p className="text-zinc-500">Cargando...</p></div>;
  }

  if (measurements.length === 0) {
    return <div className="p-6"><p className="text-zinc-500">No se encontraron datos para la biopila {id}</p></div>;
  }

  const sorted = [...measurements].sort((a, b) => a.tiempoDias - b.tiempoDias);
  const latest = sorted[sorted.length - 1];
  const state = classifyBiopilaState(latest);
  const reduction = reductionPercent(latest.tphInicialMgkg, latest.tphActualMgkg);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold">{id}</h1>
          <p className="text-sm text-zinc-400">{latest.tipoHidrocarburo} — {sorted.length} mediciones</p>
        </div>
        <StatusIndicator state={state} size="lg" />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'TPH actual', value: `${Math.round(latest.tphActualMgkg).toLocaleString()} mg/kg` },
          { label: 'Reducción', value: `${(reduction * 100).toFixed(1)}%` },
          { label: 'Día', value: latest.tiempoDias },
          { label: 'Enmienda', value: latest.enmienda },
        ].map(({ label, value }) => (
          <Card key={label} className="border-zinc-800 bg-zinc-900">
            <CardContent className="pt-4">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="font-mono text-lg font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Evolución TPH</CardTitle></CardHeader>
          <CardContent>
            <TPHTimeline data={sorted} />
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader><CardTitle>Variables ambientales</CardTitle></CardHeader>
          <CardContent>
            <VariablesChart measurements={sorted} />
          </CardContent>
        </Card>
      </div>

      {/* Measurements table */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader><CardTitle>Mediciones</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="font-mono text-xs">Día</TableHead>
                  <TableHead className="font-mono text-xs">TPH (mg/kg)</TableHead>
                  <TableHead className="font-mono text-xs">Reducción</TableHead>
                  <TableHead className="font-mono text-xs">Temp (°C)</TableHead>
                  <TableHead className="font-mono text-xs">Humedad (%)</TableHead>
                  <TableHead className="font-mono text-xs">O₂ (%)</TableHead>
                  <TableHead className="font-mono text-xs">pH</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((m) => (
                  <TableRow key={m.id} className="border-zinc-800">
                    <TableCell className="font-mono text-xs">{m.tiempoDias}</TableCell>
                    <TableCell className="font-mono text-xs">{Math.round(m.tphActualMgkg).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs text-emerald-400">{(m.porcentajeReduccionTph * 100).toFixed(1)}%</TableCell>
                    <TableCell className="font-mono text-xs">{m.temperaturaSueloC.toFixed(1)}</TableCell>
                    <TableCell className="font-mono text-xs">{m.humedadSueloPct.toFixed(1)}</TableCell>
                    <TableCell className="font-mono text-xs">{m.oxigenoPct.toFixed(1)}</TableCell>
                    <TableCell className="font-mono text-xs">{m.ph.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add biopila detail page with charts and measurement table"
```

---

## Phase 5 — AI Agents

### Task 12: AI SDK setup + tools + chat endpoint

**Files:**
- Create: `apps/web/lib/ai/model.ts`
- Create: `apps/web/lib/ai/tools.ts`
- Create: `apps/web/lib/ai/prompts.ts`
- Create: `apps/web/app/api/chat/route.ts`
- Modify: `apps/web/package.json` (add ai, @ai-sdk/google)

**Important:** Before writing code, read the latest AI SDK v6 docs to confirm current APIs. The AI SDK evolves rapidly.

- [ ] **Step 1: Install AI SDK**

Run: `cd apps/web && npm install ai @ai-sdk/google @ai-sdk/react`

- [ ] **Step 2: Write model config**

`apps/web/lib/ai/model.ts`:
```ts
// Provider-agnostic model configuration.
// AI SDK v6 uses plain "provider/model" strings that route through AI Gateway.
// To switch providers, just change the string:
//   'anthropic/claude-sonnet-4.6'
//   'openai/gpt-5.4'

export const MODEL_ID = 'google/gemini-2.5-flash-preview-05-20';
```

- [ ] **Step 3: Write system prompts**

`apps/web/lib/ai/prompts.ts`:
```ts
export const SYSTEM_PROMPT = `Eres TPHZero Copilot, un asistente experto en biorremediación de suelos contaminados con hidrocarburos.

Tu rol es analizar datos de biopilas, diagnosticar su estado, recomendar acciones operativas, predecir la evolución del proceso y simular escenarios.

CONTEXTO TÉCNICO:
- TPH = Hidrocarburos Totales de Petróleo (mg/kg)
- El objetivo es reducir TPH ≥90% para considerar el suelo remediado
- Variables clave: temperatura del suelo, humedad, oxígeno, pH, nutrientes (N-P-K)
- Tipos de hidrocarburo: liviano (más fácil de degradar) y pesado (más difícil)
- Enmiendas: biochar (mejora retención de agua y nutrientes), diatomeas (mejora aireación), ninguna

ROLES:
1. ANALISTA: Diagnostica el estado actual usando las herramientas de clasificación y anomalías
2. RECOMENDADOR: Propone acciones operativas basadas en el estado y las tendencias
3. PREDICTOR: Estima la evolución futura del TPH usando modelos de regresión
4. SIMULADOR: Compara escenarios what-if modificando variables operativas

REGLAS:
- Responde siempre en español
- Usa los datos proporcionados por las herramientas, NO inventes números
- Cuando des recomendaciones, justifica con datos específicos
- Indica el nivel de confianza de las predicciones
- Si los datos son insuficientes, dilo claramente
- Usa formato markdown para estructurar respuestas largas
`;
```

- [ ] **Step 4: Write AI tools**

`apps/web/lib/ai/tools.ts`:
```ts
import { tool } from 'ai';
import { z } from 'zod';
import { createServerClient } from '@/lib/data/supabase';
import { classifyMeasurement } from '@/lib/models/classifier';
import { predictTPH } from '@/lib/models/predictor';
import { correlateWithReduction } from '@/lib/models/correlator';
import { detectAnomalies } from '@/lib/models/anomaly';
import { simulateScenario } from '@/lib/models/simulator';
import type { Measurement } from '@tphzero/domain';

// Helper: fetch measurements for the latest dataset
async function getLatestMeasurements(biopilaId?: string): Promise<Measurement[]> {
  const supabase = createServerClient();
  const { data: datasets } = await supabase
    .from('datasets')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!datasets?.length) return [];

  let query = supabase
    .from('measurements')
    .select('*')
    .eq('dataset_id', datasets[0].id)
    .order('tiempo_dias');

  if (biopilaId) {
    query = query.eq('biopila_id', biopilaId);
  }

  const { data } = await query;
  return (data ?? []).map(mapRow);
}

// Reuse the same mapRow function
function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}

export const aiTools = {
  classify_state: tool({
    description:
      'Clasifica el estado de una biopila (óptimo/subóptimo/crítico) analizando sus variables actuales contra los umbrales óptimos.',
    parameters: z.object({
      biopilaId: z.string().optional().describe('ID de la biopila (ej: B1). Si no se especifica, analiza la última medición disponible.'),
    }),
    execute: async ({ biopilaId }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length === 0) return { error: 'No hay datos disponibles' };
      const latest = measurements[measurements.length - 1];
      return classifyMeasurement(latest);
    },
  }),

  get_correlations: tool({
    description:
      'Calcula la correlación de Pearson entre cada variable y el porcentaje de reducción de TPH. Identifica qué variables influyen más.',
    parameters: z.object({
      biopilaId: z.string().optional().describe('ID de la biopila. Si no se especifica, usa todo el dataset.'),
    }),
    execute: async ({ biopilaId }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length < 3) return { error: 'Datos insuficientes (mínimo 3 mediciones)' };
      return correlateWithReduction(measurements);
    },
  }),

  detect_anomalies: tool({
    description:
      'Detecta valores anómalos en una medición comparando contra el dataset y los rangos óptimos de biorremediación.',
    parameters: z.object({
      biopilaId: z.string().optional().describe('ID de la biopila a analizar.'),
    }),
    execute: async ({ biopilaId }) => {
      const all = await getLatestMeasurements();
      const specific = biopilaId
        ? all.filter((m) => m.biopilaId === biopilaId)
        : all;
      if (specific.length === 0) return { error: 'No hay datos' };
      const latest = specific[specific.length - 1];
      return detectAnomalies(latest, all);
    },
  }),

  predict_tph: tool({
    description:
      'Predice la evolución futura del TPH usando un modelo de decaimiento exponencial. Estima el tiempo para alcanzar el 90% de reducción.',
    parameters: z.object({
      biopilaId: z.string().describe('ID de la biopila (ej: B1).'),
      horizonDays: z.number().optional().default(360).describe('Horizonte de predicción en días.'),
    }),
    execute: async ({ biopilaId, horizonDays }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length < 2) return { error: 'Se necesitan al menos 2 mediciones para predecir' };
      return predictTPH(measurements, horizonDays);
    },
  }),

  simulate_scenario: tool({
    description:
      'Simula un escenario what-if: estima cómo cambiaría la evolución del TPH si se modifican variables operativas.',
    parameters: z.object({
      biopilaId: z.string().describe('ID de la biopila.'),
      humedadSueloPct: z.number().optional().describe('Nueva humedad del suelo (%).'),
      temperaturaSueloC: z.number().optional().describe('Nueva temperatura del suelo (°C).'),
      oxigenoPct: z.number().optional().describe('Nuevo nivel de oxígeno (%).'),
      fertilizanteN: z.number().optional().describe('Nuevo fertilizante N.'),
      fertilizanteP: z.number().optional().describe('Nuevo fertilizante P.'),
      fertilizanteK: z.number().optional().describe('Nuevo fertilizante K.'),
      frecuenciaVolteoDias: z.number().optional().describe('Nueva frecuencia de volteo (días).'),
    }),
    execute: async ({ biopilaId, ...params }) => {
      const measurements = await getLatestMeasurements(biopilaId);
      if (measurements.length < 2) return { error: 'Datos insuficientes' };
      return simulateScenario(measurements, params);
    },
  }),

  get_dataset_summary: tool({
    description:
      'Obtiene un resumen del dataset cargado: número de biopilas, mediciones, rango de tiempo, tipos de hidrocarburo.',
    parameters: z.object({}),
    execute: async () => {
      const measurements = await getLatestMeasurements();
      if (measurements.length === 0) return { error: 'No hay datos cargados' };

      const biopilaIds = [...new Set(measurements.map((m) => m.biopilaId).filter(Boolean))];
      const dias = measurements.map((m) => m.tiempoDias);
      const tipos = [...new Set(measurements.map((m) => m.tipoHidrocarburo))];

      return {
        totalMediciones: measurements.length,
        biopilas: biopilaIds,
        totalBiopilas: biopilaIds.length || 'N/A (dataset sin biopila_id)',
        rangoDias: { min: Math.min(...dias), max: Math.max(...dias) },
        tiposHidrocarburo: tipos,
        enmiendas: [...new Set(measurements.map((m) => m.enmienda))],
      };
    },
  }),
};
```

- [ ] **Step 5: Write chat API route**

`apps/web/app/api/chat/route.ts`:
```ts
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { MODEL_ID } from '@/lib/ai/model';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { aiTools } from '@/lib/ai/tools';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: MODEL_ID,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: aiTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
```

- [ ] **Step 6: Install zod (required by AI SDK tools)**

Run: `cd apps/web && npm install zod`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add AI SDK setup with tools, prompts, and chat streaming endpoint"
```

---

### Task 13: Chat UI page

**Files:**
- Create: `apps/web/components/chat/chat-panel.tsx`
- Create: `apps/web/app/chat/page.tsx`

- [ ] **Step 1: Write chat panel component**

`apps/web/components/chat/chat-panel.tsx`:

**Prerequisite:** Install AI Elements first:
```bash
cd apps/web && npx ai-elements
```
This installs `<Message>`, `<Conversation>`, `<MessageResponse>` and other AI rendering components.

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Message } from '@/components/ai-elements/message';
import { Conversation } from '@/components/ai-elements/conversation';
import { Send, Bot } from 'lucide-react';

export function ChatPanel() {
  // v6: useChat defaults to DefaultChatTransport({ api: '/api/chat' })
  // v6: manage input state yourself — useChat no longer provides input/setInput
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="h-12 w-12 text-emerald-400/30" />
            <p className="mt-4 text-lg font-medium text-zinc-400">
              TPHZero Copilot
            </p>
            <p className="mt-1 max-w-md text-sm text-zinc-500">
              Preguntame sobre el estado de tus biopilas, pedi predicciones, recomendaciones o simula escenarios.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                '¿Cual es el estado actual de las biopilas?',
                'Analiza las anomalias de B1',
                '¿Cuanto falta para alcanzar 90% de reduccion en B2?',
                'Simula aumentar la humedad a 30% en B3',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Elements handles UIMessage parts: text, tool-<name>, reasoning, etc. */}
        <Conversation>
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
        </Conversation>

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3">
            <div className="mt-1 rounded-full bg-emerald-500/20 p-1.5">
              <Bot className="h-4 w-4 animate-pulse text-emerald-400" />
            </div>
            <p className="text-sm text-zinc-500">Analizando...</p>
          </div>
        )}
      </div>

      {/* Input area — v6: no form/handleSubmit, use sendMessage directly */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="min-h-[44px] max-h-32 resize-none border-zinc-700 bg-zinc-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write chat page**

`apps/web/app/chat/page.tsx`:
```tsx
import { ChatPanel } from '@/components/chat/chat-panel';

export default function ChatPage() {
  return (
    <div className="h-full">
      <ChatPanel />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add AI chat page with streaming, tool display, and suggestion chips"
```

---

## Phase 6 — Simulator

### Task 14: Simulator page with what-if sliders

**Files:**
- Create: `apps/web/components/simulator/variable-sliders.tsx`
- Create: `apps/web/components/simulator/comparison-chart.tsx`
- Create: `apps/web/app/simulator/page.tsx`

- [ ] **Step 1: Install slider component**

Run: `cd apps/web && npx shadcn@latest add slider select`

- [ ] **Step 2: Write variable sliders**

`apps/web/components/simulator/variable-sliders.tsx`:
```tsx
'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface SliderConfig {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'humedadSueloPct', label: 'Humedad del suelo', unit: '%', min: 0, max: 50, step: 1 },
  { key: 'temperaturaSueloC', label: 'Temperatura del suelo', unit: '°C', min: 5, max: 45, step: 1 },
  { key: 'oxigenoPct', label: 'Oxígeno', unit: '%', min: 0, max: 25, step: 0.5 },
  { key: 'fertilizanteN', label: 'Fertilizante N', unit: 'mg/kg', min: 0, max: 100, step: 5 },
  { key: 'fertilizanteP', label: 'Fertilizante P', unit: 'mg/kg', min: 0, max: 50, step: 5 },
  { key: 'fertilizanteK', label: 'Fertilizante K', unit: 'mg/kg', min: 0, max: 100, step: 5 },
  { key: 'frecuenciaVolteoDias', label: 'Frecuencia de volteo', unit: 'días', min: 7, max: 60, step: 1 },
];

interface VariableSlidersProps {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

export function VariableSliders({ values, onChange }: VariableSlidersProps) {
  return (
    <div className="space-y-5">
      {SLIDERS.map(({ key, label, unit, min, max, step }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-400">{label}</Label>
            <span className="font-mono text-sm text-emerald-400">
              {values[key]?.toFixed(step < 1 ? 1 : 0)} {unit}
            </span>
          </div>
          <Slider
            value={[values[key] ?? (min + max) / 2]}
            onValueChange={([v]) => onChange(key, v)}
            min={min}
            max={max}
            step={step}
            className="[&_[role=slider]]:bg-emerald-500"
          />
        </div>
      ))}
    </div>
  );
}

export { SLIDERS };
```

- [ ] **Step 3: Write comparison chart**

`apps/web/components/simulator/comparison-chart.tsx`:
```tsx
'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { SimulationResult } from '@tphzero/domain';

export function ComparisonChart({ result }: { result: SimulationResult }) {
  const data = result.baseline.days.map((day, i) => ({
    dia: day,
    'Línea base': Math.round(result.baseline.tphProjected[i]),
    Simulado: Math.round(result.simulated.tphProjected[i]),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="dia" stroke="#71717a" fontSize={12} label={{ value: 'Días', position: 'bottom', fill: '#71717a' }} />
        <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
          labelFormatter={(v) => `Día ${v}`}
          formatter={(v: number, name: string) => [`${v.toLocaleString()} mg/kg`, name]}
        />
        <Legend />
        <Line type="monotone" dataKey="Línea base" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        <Line type="monotone" dataKey="Simulado" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Write simulator page**

`apps/web/app/simulator/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VariableSliders } from '@/components/simulator/variable-sliders';
import { ComparisonChart } from '@/components/simulator/comparison-chart';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw } from 'lucide-react';
import type { Measurement, SimulationResult } from '@tphzero/domain';
import { simulateScenario } from '@/lib/models/simulator';

// Same mapRow as other pages
function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}

export default function SimulatorPage() {
  const [allMeasurements, setAllMeasurements] = useState<Measurement[]>([]);
  const [biopilaIds, setBiopilaIds] = useState<string[]>([]);
  const [selectedBiopila, setSelectedBiopila] = useState<string>('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<Record<string, number>>({
    humedadSueloPct: 25,
    temperaturaSueloC: 20,
    oxigenoPct: 12,
    fertilizanteN: 30,
    fertilizanteP: 15,
    fertilizanteK: 20,
    frecuenciaVolteoDias: 30,
  });

  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then(async (data) => {
        const datasets = data.datasets ?? [];
        if (datasets.length === 0) return;
        const res = await fetch(`/api/data/${datasets[0].id}`);
        const detail = await res.json();
        const measurements = (detail.measurements ?? []).map(mapRow) as Measurement[];
        setAllMeasurements(measurements);

        const ids = [...new Set(measurements.map((m) => m.biopilaId).filter(Boolean))] as string[];
        setBiopilaIds(ids);
        if (ids.length > 0) {
          setSelectedBiopila(ids[0]);
          // Set initial values from latest measurement
          const latest = measurements.filter((m) => m.biopilaId === ids[0]).sort((a, b) => b.tiempoDias - a.tiempoDias)[0];
          if (latest) {
            setValues({
              humedadSueloPct: latest.humedadSueloPct,
              temperaturaSueloC: latest.temperaturaSueloC,
              oxigenoPct: latest.oxigenoPct,
              fertilizanteN: latest.fertilizanteN,
              fertilizanteP: latest.fertilizanteP,
              fertilizanteK: latest.fertilizanteK,
              frecuenciaVolteoDias: latest.frecuenciaVolteoDias,
            });
          }
        }
        setLoading(false);
      });
  }, []);

  const runSimulation = () => {
    const measurements = allMeasurements.filter((m) => m.biopilaId === selectedBiopila);
    if (measurements.length < 2) return;
    const sim = simulateScenario(measurements, values);
    setResult(sim);
  };

  const resetValues = () => {
    const latest = allMeasurements
      .filter((m) => m.biopilaId === selectedBiopila)
      .sort((a, b) => b.tiempoDias - a.tiempoDias)[0];
    if (latest) {
      setValues({
        humedadSueloPct: latest.humedadSueloPct,
        temperaturaSueloC: latest.temperaturaSueloC,
        oxigenoPct: latest.oxigenoPct,
        fertilizanteN: latest.fertilizanteN,
        fertilizanteP: latest.fertilizanteP,
        fertilizanteK: latest.fertilizanteK,
        frecuenciaVolteoDias: latest.frecuenciaVolteoDias,
      });
    }
    setResult(null);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><p className="text-zinc-500">Cargando datos...</p></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Simulador What-If</h1>
      <p className="text-sm text-zinc-400">
        Modifica las variables operativas y observa cómo cambia la predicción de TPH.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Controls */}
        <Card className="border-zinc-800 bg-zinc-900 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Variables operativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {biopilaIds.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">Biopila</label>
                <Select value={selectedBiopila} onValueChange={setSelectedBiopila}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {biopilaIds.map((id) => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <VariableSliders
              values={values}
              onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
            />

            <div className="flex gap-2 pt-2">
              <Button onClick={runSimulation} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <Play className="mr-2 h-4 w-4" /> Simular
              </Button>
              <Button onClick={resetValues} variant="outline" className="border-zinc-700">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:col-span-2">
          {result ? (
            <>
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle>Comparación: Línea base vs. Simulado</CardTitle>
                </CardHeader>
                <CardContent>
                  <ComparisonChart result={result} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="pt-6">
                    <p className="text-xs text-zinc-500">Mejora en reducción</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                      +{result.deltaReductionPct.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardContent className="pt-6">
                    <p className="text-xs text-zinc-500">Tiempo ahorrado</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-blue-400">
                      {result.estimatedTimeSavedDays
                        ? `${result.estimatedTimeSavedDays} días`
                        : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="flex h-64 items-center justify-center border-zinc-800 bg-zinc-900">
              <p className="text-zinc-500">
                Ajusta las variables y presiona "Simular" para ver los resultados
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add what-if simulator with variable sliders and comparison chart"
```

---

## Phase 7 — Polish & Deploy

### Task 15: Extract shared mapRow utility + vercel.json

**Files:**
- Create: `apps/web/lib/data/map-row.ts`
- Modify: `apps/web/app/dashboard/page.tsx` (import from shared)
- Modify: `apps/web/app/biopila/[id]/page.tsx` (import from shared)
- Modify: `apps/web/app/simulator/page.tsx` (import from shared)
- Create: `vercel.json`

- [ ] **Step 1: Extract mapRow to shared utility**

`apps/web/lib/data/map-row.ts`:
```ts
import type { Measurement } from '@tphzero/domain';

/**
 * Maps a Supabase snake_case row to a camelCase Measurement.
 */
export function mapRow(row: Record<string, unknown>): Measurement {
  return {
    id: row.id as string,
    datasetId: row.dataset_id as string,
    biopilaId: (row.biopila_id as string) ?? null,
    tiempoDias: row.tiempo_dias as number,
    temperaturaSueloC: row.temperatura_suelo_c as number,
    humedadSueloPct: row.humedad_suelo_pct as number,
    oxigenoPct: row.oxigeno_pct as number,
    ph: row.ph as number,
    conductividadMscm: (row.conductividad_mscm as number) ?? null,
    tphInicialMgkg: row.tph_inicial_mgkg as number,
    tphActualMgkg: row.tph_actual_mgkg as number,
    tipoHidrocarburo: row.tipo_hidrocarburo as 'liviano' | 'pesado',
    aguaAplicadaLM3: row.agua_aplicada_l_m3 as number,
    fertilizanteN: row.fertilizante_n as number,
    fertilizanteP: row.fertilizante_p as number,
    fertilizanteK: row.fertilizante_k as number,
    tensioactivo: row.tensioactivo as 0 | 1,
    enmienda: row.enmienda as 'biochar' | 'diatomeas' | 'ninguna',
    frecuenciaVolteoDias: row.frecuencia_volteo_dias as number,
    temperaturaAmbienteC: row.temperatura_ambiente_c as number,
    humedadAmbientePct: row.humedad_ambiente_pct as number,
    precipitacionesMm: row.precipitaciones_mm as number,
    porcentajeReduccionTph: row.porcentaje_reduccion_tph as number,
    estadoSistema: (row.estado_sistema as 'optimo' | 'suboptimo' | 'critico') ?? null,
    recomendacionOperativa: (row.recomendacion_operativa as string) ?? null,
  };
}
```

- [ ] **Step 2: Replace duplicate mapRow in dashboard, biopila detail, and simulator pages**

In each file, replace the local `mapRow` function with:
```ts
import { mapRow } from '@/lib/data/map-row';
```
Remove the local `mapRow` function definition.

- [ ] **Step 3: Create vercel.json**

`vercel.json`:
```json
{
  "framework": "nextjs"
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extract shared mapRow utility, add vercel.json"
```

---

### Task 16: Supabase setup instructions + final environment

**Files:**
- Create: `docs/SETUP.md`

- [ ] **Step 1: Write setup guide**

`docs/SETUP.md`:
```markdown
# TPHZero Copilot — Setup Guide

## Prerrequisitos

- Node.js 18+
- npm 9+
- Cuenta de Supabase (free tier)
- API Key de Google Gemini

## 1. Clonar e instalar

\`\`\`bash
git clone <repo-url>
cd tphzero-copilot
npm install
\`\`\`

## 2. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a SQL Editor y ejecutar el contenido de `supabase/migrations/001_initial_schema.sql`
3. Copiar las credenciales desde Project Settings > API

## 3. Configurar variables de entorno

\`\`\`bash
cp .env.local.example apps/web/.env.local
\`\`\`

Editar `apps/web/.env.local`:
\`\`\`
GOOGLE_GENERATIVE_AI_API_KEY=tu-api-key-de-gemini
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
\`\`\`

## 4. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abrir http://localhost:3000

## 5. Desplegar en Vercel

\`\`\`bash
npm i -g vercel
vercel
\`\`\`

Agregar las variables de entorno en el dashboard de Vercel.
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: add setup guide for Supabase, Gemini, and Vercel deployment"
```

---

## Execution Order Summary

| Phase | Tasks | Dependency |
|-------|-------|-----------|
| **1. Scaffold** | T1 (monorepo), T2 (shadcn), T3 (Supabase) | None |
| **2. Domain** | T4 (types+thresholds), T5 (models) | T1 |
| **3. Ingestion** | T6 (parser), T7 (upload API) | T3, T4 |
| **4. UI Pages** | T8 (layout), T9 (home), T10 (dashboard), T11 (biopila) | T7 |
| **5. AI** | T12 (AI tools+chat endpoint), T13 (chat page) | T5, T7 |
| **6. Simulator** | T14 (simulator page) | T5, T10 |
| **7. Polish** | T15 (refactor), T16 (docs) | All |

**Parallelizable:** T5 and T6 can run in parallel. T10-T11 and T12 can run in parallel after T7.
