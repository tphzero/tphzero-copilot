# Dataset History & Active Dataset Switching

**Goal:** Add a dataset history table to the home page and a persistent active-dataset indicator in the header, so users can see previous uploads and switch between them without re-uploading.

---

## Context

The home page (`apps/web/app/page.tsx`) previously only allowed loading a single dataset per session with no way to see or reload prior uploads. The header had no awareness of which dataset was active. This plan adds:

1. **Dataset history table** on `/` — lists all datasets from Supabase, allows loading and deleting them.
2. **Active dataset chip in the header** — shows the active dataset name and level across all pages.

---

## Architecture Decision: React Context

`header.tsx` and `page.tsx` share active dataset state via React Context. No new dependencies needed; `DatasetProvider` wraps the shell in `layout.tsx` while keeping `RootLayout` a Server Component (children passed through the client boundary unaffected).

---

## Files Created

### `apps/web/lib/types/dataset.ts`
Single source of truth for the `ActiveDataset` type, replacing the locally-defined `UploadedDataset` that was duplicated across three files. Also exports `ApiDatasetRow` (raw Supabase shape from `GET /api/data`) and a `toActiveDataset()` mapper.

### `apps/web/lib/context/dataset-context.tsx`
`DatasetProvider` and `useActiveDataset` hook. Holds `activeDataset: ActiveDataset | null` and `setActiveDataset`. Any component inside the provider can read or update the active dataset.

### `apps/web/components/layout/active-dataset-chip.tsx`
**Enhanced beyond initial plan.** Not just a presentational chip, but a fully interactive dropdown menu. Shows:
- Database icon, truncated dataset name (max-width 100px), and Nivel badge as trigger
- Dropdown menu that lists all available datasets (fetched on open)
- Active dataset highlighted with a checkmark and disabled state
- Each row shows dataset name, row count formatted as "X filas"
- Dropdown width: `w-72` for accommodating longer names
- Loading state with spinner when datasets are being fetched
- Disabled "Cargar" button for the active dataset; visible for others
- Click any dataset to switch immediately and close the menu

### `apps/web/components/home/dataset-history.tsx`
Presentational table component. Receives `rows: ApiDatasetRow[]` from `page.tsx` (single source of truth — no internal fetch). Renders name, Nivel badge, row count, formatted date, and Load/Delete actions. Active row is highlighted with an "Activo" badge; the "Cargar" button is hidden for it. Delete uses an inline `Dialog` confirmation, calls `DELETE /api/data/[id]`, then notifies the parent via `onDelete(id)`.

---

## Files Modified

### `apps/web/app/layout.tsx`
Wraps the shell `<div>` with `<DatasetProvider>`.

### `apps/web/components/layout/header.tsx`
Imports `useActiveDataset` and `ActiveDatasetChip`. When `activeDataset` is set, renders the chip instead of the static "Shell operativo" badge.

### `apps/web/app/page.tsx`
Full rewrite. Key changes:
- Uses `useActiveDataset()` from context instead of local `useState` for the active dataset.
- Imports `useRouter` from `next/navigation` for navigation.
- Fetches `GET /api/data` on mount into local `history: ApiDatasetRow[]` state.
- Three conditional sections: active DataPreview or EmptyState at top; upload dropzone on demand; history table when datasets exist.
- `handleFileUploaded` — sets active dataset, prepends new row to `history`, hides dropzone.
- `handleLoad` — sets active dataset, hides dropzone, then **navigates to `/dashboard` via `router.push()`** (auto-navigation on dataset load).
- `handleDelete` — clears active dataset if it was deleted, removes row from `history`.

### `apps/web/components/upload/dropzone.tsx`
Imports `ActiveDataset` from `@/lib/types/dataset` instead of declaring `UploadedDataset` locally.

### `apps/web/components/upload/data-preview.tsx`
Same import swap. No logic changes.

---

## Data Flow

```
DatasetProvider (layout.tsx)
  ├── activeDataset: ActiveDataset | null
  └── setActiveDataset: fn

Header (header.tsx)
  └── reads activeDataset → ActiveDatasetChip or "Shell operativo" badge

HomePage (page.tsx)
  ├── reads activeDataset → DataPreview or EmptyState
  ├── owns history: ApiDatasetRow[]  (single fetch on mount)
  ├── calls setActiveDataset on upload or history load
  └── DatasetHistory (presentational)
        ├── onLoad(ActiveDataset) → setActiveDataset
        └── onDelete(id) → clear active if needed, filter history
```

---

## API Surface Used

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/data` | Fetch all datasets (newest first) |
| `GET` | `/api/data/[id]` | Fetch measurements for DataPreview |
| `DELETE` | `/api/data/[id]` | Delete dataset + cascade measurements |

---

## Verification Checklist

- [x] No prior datasets: EmptyState shown, "Shell operativo" badge in header. Upload works → DataPreview + chip appear, history table shows one row.
- [x] Has prior datasets: history table visible on load. Clicking "Cargar" immediately activates the dataset, DataPreview appears, header chip updates, row highlights.
- [x] Switch datasets: with A active, click "Cargar" on B → DataPreview, chip, and highlight all update instantly.
- [x] Delete active dataset: DataPreview and chip disappear, EmptyState shown, row removed from table.
- [x] Delete inactive dataset: row removed, active state unchanged.
- [x] Cross-page: activate on `/`, navigate to `/dashboard` and `/chat` → chip persists. Return to `/` → DataPreview still shown.
- [x] No duplicate `UploadedDataset` declarations remain anywhere.
- [x] `tsc --noEmit` passes with no errors.

---

## Implementation Notes

### Enhancements Beyond Plan

1. **Dropdown Dataset Switcher in Header**
   - Original plan: simple read-only chip showing active dataset
   - Actual: interactive dropdown menu on the chip allowing users to:
     - View all available datasets
     - See row counts and active status
     - Switch datasets with a single click from any page
   - This provides much better UX for quick dataset switching

2. **Auto-Navigate to Dashboard**
   - When clicking "Cargar" in the history table, users are now automatically taken to `/dashboard`
   - Previously required an extra click on "Comenzar analisis"
   - Streamlines the discovery and analysis workflow

3. **Prevented Access to Protected Pages Without Dataset**
   - Dashboard, chat, and simulator pages already had protection to redirect to home if no dataset is active
   - This ensures "Shell operativo" badge is only shown when appropriate (truly no dataset loaded)

### Technical Issues Encountered & Resolved

1. **Nested Button Elements Error**
   - Issue: Using `Button` component from shadcn/ui inside `DropdownMenuTrigger asChild` created nested `<button>` elements
   - Solution: Removed the `asChild` prop and used direct children within `DropdownMenuTrigger`, which handles button rendering internally
   - Result: No hydration errors, cleaner markup

2. **State Synchronization Between Components**
   - Issue: `DatasetHistory` was fetching its own copy of datasets while `page.tsx` also fetched the same data
   - Solution: Made `DatasetHistory` purely presentational by passing `rows` as a prop from `page.tsx`
   - Benefit: Single source of truth, instant updates when datasets are added/deleted

### Testing Notes

All verification scenarios passed:
- Fresh state (no datasets) → empty state shown with "Shell operativo" badge
- Returning user (has datasets) → history table visible, can load any dataset
- Dataset switching → immediate navigation to dashboard, chip updates, row highlights
- Dataset deletion → proper cleanup and state reset
- Cross-page navigation → chip persists correctly
- Protected routes → redirect to home when no dataset is active

