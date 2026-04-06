# Plan de implementación: navegación del dashboard (dataset + biopila)

**Estado:** acordado (2026-04-04)  
**Especificación de producto:** [../specs/2026-04-04-dashboard-navigation-context.md](../specs/2026-04-04-dashboard-navigation-context.md)  
**Alcance:** mismo que la spec (rutas canónicas, sidebar, breadcrumbs, atrás, errores; sin listado global de datasets ni prev/sig entre biopilas).

---

## 1. Decisiones de arquitectura (cerradas en refinamiento)

| Tema | Decisión |
|------|----------|
| Rutas canónicas | `/datasets/[datasetId]/dashboard`, `/datasets/[datasetId]/biopila/[biopilaId]` |
| Layout compartido | **Opción A:** `app/datasets/[datasetId]/layout.tsx` para breadcrumbs + bloque de árbol del dataset; rutas sin `/datasets/...` no usan este layout |
| Ítem «Dashboard» en sidebar | Solo hacia el **último dataset conocido** (o el seleccionado en una historia futura). Sin dataset: estado por defecto en **Inicio** (`/`). El ítem Dashboard no debe apuntar a rutas legacy ni inventar ids |
| Lista de biopilas en sidebar | **Cliente:** ids únicos derivados de `measurements` de `GET /api/data/[datasetId]` (misma fuente que el grid). Sin cambios de API en esta historia salvo mínimos necesarios |
| Tests automatizados | **Vitest** (unit + component testing en `apps/web`). **Playwright** queda para más adelante |
| Rutas obsoletas | Mensaje descriptivo + CTA solo a `/`. **Sin** redirección automática a URLs nuevas |
| Dataset inválido en URL | Misma línea de error + CTA a `/` que rutas obsoletas |

---

## 2. Contexto del código actual (punto de partida)

- Shell: `SidebarNav` + `Header` en `app/layout.tsx`; enlaces legacy a `/dashboard` y rutas bajo `/biopila/[id]`.
- `app/dashboard/page.tsx` y `app/biopila/[id]/page.tsx` cargan el «último» dataset vía `GET /api/data` + `GET /api/data/{id}` sin `datasetId` en la URL.
- `GET /api/data/[datasetId]` ya responde **404** si el dataset no existe.
- `apps/web` no define aún `npm run test`; el monorepo usa `turbo test` y `packages/domain` ya usa Vitest.

---

## 3. Fases de implementación (incremental)

### Fase 0 — Infraestructura de tests (`apps/web`)

1. Añadir Vitest (+ opcional `@testing-library/react` para componentes) y script `test` en `apps/web`.
2. Configurar Vitest para TypeScript/JSX alineado con Next (alias `@/` si aplica).
3. Asegurar que `turbo test` ejecute el paquete `web` (script `test` en el workspace).

**Tests iniciales (TDD / red-first donde aplique):**

- Helpers puros: rutas canónicas, truncado de `datasetId` para UI, parsing de segmentos desde `pathname` si se centraliza.

---

### Fase 1 — Módulo de rutas y formato de ids

1. Crear p. ej. `lib/navigation/routes.ts` (o equivalente) con funciones para construir **solo** URLs canónicas; evitar strings sueltos en componentes.
2. Definir constante(s) para longitud máxima de truncado + sufijo `…` (breadcrumbs y sidebar).
3. Tests unitarios para rutas y truncado.

---

### Fase 2 — Rutas nuevas y layout anidado (Opción A)

1. Crear `app/datasets/[datasetId]/layout.tsx` (stub con `{children}` → completar en fases posteriores con breadcrumbs + árbol).
2. Añadir:
   - `app/datasets/[datasetId]/dashboard/page.tsx`
   - `app/datasets/[datasetId]/biopila/[biopilaId]/page.tsx`
3. Refactorizar extrayendo contenido reutilizable de las páginas actuales (p. ej. componentes que reciban `datasetId` y, en biopila, `biopilaId`), usando `fetch(\`/api/data/${datasetId}\`)` en lugar del patrón «último dataset».

---

### Fase 3 — Entradas al flujo (Inicio / subida)

1. Tras carga exitosa o cuando se conozca el id del dataset, navegar a `/datasets/{id}/dashboard` (usar módulo de rutas).
2. Actualizar `DataPreview` y cualquier otro `router.push` / `Link` hacia `/dashboard` o `/biopila/...`.

---

### Fase 4 — Sidebar global + contexto dataset

1. **Inicio** (`/`): comportamiento por defecto cuando no hay contexto de dataset; mantener flujo de carga (vacío + CTA, etc.). Opcional: bloque «Ir al último dataset» si `GET /api/data` devuelve al menos un dataset (atajo, no listado global).
2. **Dashboard** en el nav: solo si existe último dataset conocido; `href` = ruta canónica de ese id. Si no hay dataset: ocultar, deshabilitar con tooltip, o equivalente — **nunca** enlazar a `/dashboard` legacy.
3. **Chat / Simulador:** sin cambios de alcance salvo imports rotos.
4. En el **layout** `datasets/[datasetId]`: árbol lateral (dataset truncado + tooltip con id completo; hijo Dashboard; hijos biopila con enlaces canónicos). Lista de biopilas: **ids únicos** desde `measurements` del mismo fetch que usa el dashboard. Resaltar ruta activa.

---

### Fase 5 — Breadcrumbs

1. Componente reutilizable bajo el header o debajo del header global, dentro del layout del dataset (según diseño visual existente).
2. Cadenas: `Inicio` → `[Dataset truncado]` → `Dashboard` o `Biopila [id/etiqueta]`; `Inicio` → `/`; segmentos intermedios clicables según spec §6.2.

---

### Fase 6 — Header y botón «Atrás» en biopila

1. Ajustar `Header` (o meta en layout del dataset) para títulos/subtítulos coherentes con breadcrumbs (evitar redundancia).
2. En **solo** la ruta de detalle de biopila: control «Atrás» accesible → `/datasets/[datasetId]/dashboard`.
3. En detalle: priorizar legibilidad del **id completo** de biopila en título o bloque principal (spec §7).

---

### Fase 7 — Rutas obsoletas

1. Reemplazar contenido de `app/dashboard/page.tsx` y `app/biopila/[id]/page.tsx` por vista de error compartida: texto explícito (URL ya no válida / contexto en la ruta) + botón **Volver al inicio** → `/`.
2. No usar `redirect()` a rutas nuevas.

---

### Fase 8 — Errores: dataset inválido y biopila desconocida

1. **Dataset 404:** al cargar datos para `[datasetId]`, si la API devuelve 404, mostrar página de error alineada con Fase 7 (mensaje + solo CTA a `/`).
2. **Biopila sin mediciones en dataset válido:** mensaje explícito y no silencioso (unificar copy con el comportamiento actual de lista vacía si aplica).

---

### Fase 9 — Verificación

1. Recorrer [criterios de aceptación §10 de la spec](../specs/2026-04-04-dashboard-navigation-context.md).
2. `npm run lint` / `npm run build` en `apps/web` y `turbo test` en raíz.

---

## 4. Mapeo rápido: criterios de aceptación (spec §10)

| # | Criterio | Comprobación principal |
|---|----------|-------------------------|
| 1 | No enlaces UI a `/dashboard` ni `/biopila/...` sin dataset | Grep + prueba manual |
| 2 | Desde grid, URL `/datasets/{id}/biopila/{biopilaId}` | Flujo biopila + barra de direcciones |
| 3 | Mismo dataset (truncado + tooltip) en dashboard y biopila | UI + tooltip/title |
| 4 | «Atrás» → dashboard del mismo `datasetId` | Click + URL |
| 5 | URL obsoleta → mensaje + solo inicio | Rutas legacy |
| 6 | `datasetId` inexistente → error + solo inicio | URL manual |

---

## 5. Riesgos y notas

- **Último dataset:** definir fuente única (p. ej. primer elemento de `GET /api/data` o persistencia tras upload) para el `href` del ítem Dashboard y evitar inconsistencias.
- **Fetch duplicado:** layout vs páginas pueden repetir `GET /api/data/[datasetId]`; valorar React `cache` en Server Components o un proveedor cliente si el layout pasa a ser cliente; si no, documentar duplicación aceptable en esta historia.
- **Archivo previo:** existe un plan genérico del proyecto en [2026-03-21-tphzero-copilot.md](./2026-03-21-tphzero-copilot.md); **este** documento es el plan **detallado final** para la historia de navegación del dashboard.

---

## 6. Referencias

- Especificación: [../specs/2026-04-04-dashboard-navigation-context.md](../specs/2026-04-04-dashboard-navigation-context.md)
- Plan monorepo histórico (no sustituye este documento para esta historia): [./2026-03-21-tphzero-copilot.md](./2026-03-21-tphzero-copilot.md)
