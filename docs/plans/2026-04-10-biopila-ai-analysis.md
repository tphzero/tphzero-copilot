# Biopile Detail — AI Analysis Panel

**Date:** 2026-04-10

---

## Problem

The biopile detail view showed KPI cards, TPH/environmental charts, and a raw measurements table. Operators had no AI-generated interpretation: no prediction of process evolution, no estimated remediation timeline, no detection of suboptimal conditions, and no operational recommendations.

A first pass auto-generated the analysis on page load, but this was slow and wasteful — the AI call happens every time the page is opened even when nothing has changed.

---

## Solution

A persistent AI analysis panel in the biopile detail view:

- **Manual trigger** — operators click "Generar análisis" to run the AI, avoiding unwanted waits on every page load.
- **Stored result** — the analysis is saved to a new `biopila_analyses` table (one row per dataset/biopile pair). On subsequent visits it loads instantly from the database.
- **Staleness detection** — if new measurements have been uploaded since the analysis was generated, a warning banner prompts the operator to regenerate.

The analysis covers four areas: process evolution, remediation time estimate, recommended adjustments, and detected suboptimal conditions.

---

## Architecture

All existing analytical models run server-side before the AI call:

- `predictTPH()` — exponential decay model (`lib/models/predictor.ts`)
- `detectAnomalies()` — z-score + threshold violations (`lib/models/anomaly.ts`)
- `classifyBiopilaState()` — optimo/suboptimo/critico (`@tphzero/domain`)
- `correlateWithReduction()` — Pearson correlations (`lib/models/correlator.ts`)

**Staleness logic:** `MAX(measurements.created_at)` for the biopile is compared against `biopila_analyses.generated_at`. If any measurement was added after the last generation, the analysis is marked stale.

---

## Files Changed

| File | Action |
| ---- | ------ |
| `supabase/migrations/20260410000000_biopila_analyses.sql` | Created — `biopila_analyses` table |
| `apps/web/app/api/biopila/analyze/route.ts` | Edited — added GET (fetch stored + staleness), POST now upserts to DB |
| `apps/web/components/dashboard/biopila-analysis.tsx` | Edited — manual trigger, instant load from DB, staleness warning |
| `apps/web/app/api/biopila/analyze/route.ts` | Created (previous session) — initial POST endpoint |
| `apps/web/components/dashboard/biopila-analysis.tsx` | Created (previous session) — initial component |
| `apps/web/components/dashboard/biopila-detail-content.tsx` | Edited (previous session) — added `<BiopilaAnalysis>` between charts and table |
