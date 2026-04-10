# Plan de implementación: gráficos del dashboard (TPH-8)

> **Para workers agenticos:** sub-skill recomendada: `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar este plan tarea a tarea. Los pasos usan sintaxis de checklist (`- [ ]`) para seguimiento.

**Objetivo:** Cumplir [TPH-8](https://linear.app/tphzero-team/issue/TPH-8/dashboard-mejorar-los-graficos-mostrados) en la ruta `/datasets/[datasetId]/dashboard`: ejes con nombre y unidades, `CardDescription` con copy aprobado en español, y contraste WCAG 2.1 AA en texto de cards, ejes y tooltips, sin cambiar contratos de API ni el alcance fuera de `OverviewCharts`.

**Arquitectura:** Los dos bloques viven en `OverviewCharts`, que delega la línea temporal en `TPHTimeline` y el de barras inline en Recharts. El plan añade etiquetas de eje vía `label` en `XAxis`/`YAxis` de Recharts, copy estático en `CardHeader` con `CardDescription` importado del design system, y constantes de color compartidas o alineadas para ticks/labels sobre fondo `#09090b` del área del chart. No se toca `BiopilaCard` ni rutas de biopila según la spec.

**Stack:** Next.js (App Router), React, Recharts, Tailwind, componentes UI en `apps/web/components/ui/card.tsx`.

**Referencia normativa:** `docs/specs/2026-04-10-dashboard-biopila-charts-and-kpis.md`

---

## 1. Mapa de archivos

| Archivo | Responsabilidad en esta historia |
|---------|----------------------------------|
| `apps/web/components/dashboard/overview-charts.tsx` | Importar `CardDescription`; títulos con ortografía de §7; descripciones §7.1 y §7.2; `BarChart` vertical: etiquetas de ejes Y (categorías) y X (valores %), márgenes, tooltip “Reducción”, quitar dependencia de `unit` como sustituto de etiqueta legible. |
| `apps/web/components/charts/tph-timeline.tsx` | Modo una serie y multi-serie: `label` en X e Y; `labelFormatter` del tooltip con “Día” (tilde); leyenda legible en multi-serie; ticks/grid alineados a contraste §6. |
| `apps/web/components/ui/card.tsx` | **Solo lectura** salvo que `text-muted-foreground` en `CardDescription` falle ratio 4.5:1 sobre `bg-zinc-900`: entonces preferir `className` en cada `CardDescription` en `overview-charts.tsx` antes que cambiar el componente global. |

**Fuera de alcance:** `biopila-card.tsx`, `dashboard-page-content.tsx` (salvo verificación visual de que no hay regresión), `packages/domain`.

---

## 2. Constantes y copy (bloquear antes de codificar)

- Textos exactos de **§7** de la spec para `CardDescription` (Evolución de TPH y Reducción por biopila).
- Etiquetas de ejes:
  - Timeline X: **“Tiempo de operación (días)”** (o **“Tiempo (días)”** en viewport muy estrecho si se implementa condicional).
  - Timeline Y: **“TPH actual (mg/kg)”**.
  - Barras Y (categorías): **“Biopila”** o **“Identificador de biopila”**.
  - Barras X (valores): **“Reducción de TPH (%)”** vía `label` del eje, no solo `unit`.

---

## 3. Tareas e implementación

### Tarea 1: `OverviewCharts` — cards, copy y gráfico de barras

**Archivos:**

- Modificar: `apps/web/components/dashboard/overview-charts.tsx`

- [ ] **Paso 1:** Importar `CardDescription` desde `@/components/ui/card`.
- [ ] **Paso 2:** Unificar títulos con la spec: **“Evolución de TPH”** y **“Reducción por biopila”** (mayúsculas y tildes como §7).
- [ ] **Paso 3:** Debajo de cada `CardTitle`, añadir `CardDescription` con el párrafo de **§7.1** y **§7.2** respectivamente. Si el contraste de `text-muted-foreground` sobre `bg-zinc-900` no alcanza 4.5:1, añadir clase explícita (p. ej. `text-zinc-300` o token verificado) solo en estas instancias.
- [ ] **Paso 4:** En el `BarChart` con `layout="vertical"`:
  - Añadir `label` al `XAxis` con texto **“Reducción de TPH (%)”** (posición inferior o la que evite solapamiento con ticks).
  - Añadir `label` al `YAxis` para **“Biopila”** (u “Identificador de biopila”); ajustar `margin` (p. ej. `left`, `bottom`) si las etiquetas se recortan.
  - No usar solo `unit="%"` como sustituto de etiqueta visible.
- [ ] **Paso 5:** Corregir el formatter del tooltip: segunda parte **“Reducción”** (con tilde), coherente con la spec.
- [ ] **Paso 6:** Alinear colores de `stroke`, `tick` y `label.fill` de ejes con §6 (sustituir `#71717a` si el ratio sobre el fondo del chart es insuficiente; documentar el hex elegido en comentario mínimo solo si el equipo lo pide).
- [ ] **Paso 7 (opcional TPH-8):** Si cabe sin romper el tope de ~2 líneas de descripción + altura de card, añadir una línea breve bajo la descripción: *Verde = óptimo, ámbar = subóptimo, rojo = crítico*. Si no cabe, el copy de §7.2 ya cubre el significado del color; no añadir la línea extra.

**Verificación manual:**

- Vista desktop ≥1280px: descripciones sin scroll interno en la card.
- Ejes del gráfico de barras legibles; tooltip con `%` y una decimal.

---

### Tarea 2: `TPHTimeline` — ejes, tooltip y leyenda

**Archivos:**

- Modificar: `apps/web/components/charts/tph-timeline.tsx`

- [ ] **Paso 1 — modo una sola serie** (`!biopilaIds || length === 0`): Sustituir la etiqueta actual **“Dias”** en el eje X por **“Tiempo de operación (días)”** (o variante corta acordada). Añadir en **Y** la etiqueta **“TPH actual (mg/kg)”**.
- [ ] **Paso 2:** En `labelFormatter` del tooltip, usar **“Día X”** con tilde en “Día”.
- [ ] **Paso 3 — modo multi-serie:** Añadir `label` a `XAxis` y `YAxis` con los mismos criterios de nombre + unidad que el modo simple. El eje X usa `dataKey="dia"`; la etiqueta debe reflejar tiempo en días.
- [ ] **Paso 4:** Ajustar `Legend`: `wrapperStyle` / color de texto para contraste AA sobre el fondo del chart (`#09090b` o el real del contenedor).
- [ ] **Paso 5:** Revisar `tickFormatter` del eje Y (notación `k`): mantener si la etiqueta del eje deja claro mg/kg; si genera ambigüedad, preferir valores completos localizados según §5.1.
- [ ] **Paso 6:** Unificar colores de ticks/labels con los mismos tokens que en `overview-charts` si se extraen constantes compartidas (opcional: constante `CHART_AXIS` en un solo archivo solo si reduce duplicación real; YAGNI si son 2–3 líneas).

**Verificación manual:**

- Con varias biopilas: leyenda legible; tooltips con mg/kg y “Día n”.
- Con una sola serie: mismos requisitos de ejes.

---

### Tarea 3: Accesibilidad y contraste

- [ ] **Paso 1:** Con DevTools o [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/), comprobar ≥4.5:1 para: `CardTitle`, `CardDescription`, etiquetas de ejes, ticks, texto de leyenda, contenido del tooltip.
- [ ] **Paso 2:** Si dos series línea adyacentes se confunden solo por color, valorar **grosor** o **dash** en una línea **solo** si no desvirtúa el diseño (§6).

---

### Tarea 4: Regresión y calidad

- [ ] **Paso 1:** Ejecutar lint/typecheck del paquete web (`pnpm`/`npm` según el monorepo; desde repo root el script habitual del proyecto).
- [ ] **Paso 2:** Navegar a `/datasets/[datasetId]/dashboard` con datos de prueba: ambos gráficos visibles, orden de biopilas sin cambio (§8).
- [ ] **Paso 3:** Recorrer checklist de **§9** de la spec (criterios de aceptación) y marcar el issue QA.

---

## 4. Pruebas automatizadas

No hay tests existentes para estos componentes. **Opcional (no bloqueante TPH-8):** test de React Testing Library que renderice `OverviewCharts` con datos mínimos mock y aserte presencia de substrings de `CardDescription` y de etiquetas de eje (si Recharts expone texto en DOM en el entorno de test). Si el árbol DOM de Recharts es frágil para asserts, priorizar checklist manual §9.

---

## 5. Commits sugeridos

1. `feat(dashboard): CardDescription y ejes en OverviewCharts (barras)` — `overview-charts.tsx`.
2. `feat(charts): etiquetas y contraste en TPHTimeline` — `tph-timeline.tsx`.
3. `chore:` ajustes de contraste/tooltip si quedan sueltos.

(O un solo commit atómico si el equipo prefiere una PR única para TPH-8.)

---

## 6. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Etiquetas de eje solapadas en móvil | Reducir `fontSize`, acortar copy del eje X (“Tiempo (días)”), o `margin` mayor. |
| `CardDescription` alarga demasiado la card | Mantener copy §7 sin saltos forzados; comprobar 2 líneas en desktop. |
| Cambiar `CardDescription` global | Evitar; override local en `overview-charts` primero. |

---

*Plan alineado a `docs/specs/2026-04-10-dashboard-biopila-charts-and-kpis.md` (2026-04-10).*
