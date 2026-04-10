# Especificación detallada: gráficos del dashboard (TPH-8)

**Issue:** [TPH-8 — Dashboard - Mejorar los graficos mostrados](https://linear.app/tphzero-team/issue/TPH-8/dashboard-mejorar-los-graficos-mostrados)  
**Estado del documento:** especificación detallada para implementación y QA  
**Última actualización:** 2026-04-10  
**Relacionado:** [2026-04-04-dashboard-navigation-context.md](./2026-04-04-dashboard-navigation-context.md)

---

## 1. Propósito

Definir de forma **cerrada** qué debe implementarse para cumplir [TPH-8](https://linear.app/tphzero-team/issue/TPH-8/dashboard-mejorar-los-graficos-mostrados): **ejes con nombre y unidades**, **texto de ayuda por gráfico**, y **contraste** alineado a WCAG AA sin romper la línea visual actual.

Este documento **no** sustituye el issue en Linear; sirve como checklist de ingeniería y revisión.

---

## 2. Texto oficial del issue (fuente de verdad)

**Descripción en Linear:**

> Ninguno de los graficos mostrados en el dashboard tienen nombres en cada eje. Hay que agregarlos, con unidades de medidas apropiadas. Ademas, debe haber una pequeña descripcion en cada grafico que explique que es lo que esta mostrando y que se puede interpretar a grandes rasgos de el. Mejorar los contrastes de ser posible/necesario

---

## 3. Decisiones de producto (cerradas)

| Tema | Decisión |
|------|----------|
| Ruta | Solo **`/datasets/[datasetId]/dashboard`**. |
| Gráficos en alcance | Los **dos** bloques renderizados por **`OverviewCharts`**: (1) evolución de TPH, (2) reducción por biopila. |
| Fuera de alcance TPH-8 | Vista **`/datasets/.../biopila/...`**, tarjetas KPI, **`BiopilaCard`**, timeline “sin biopila” en `DashboardPageContent`. |
| Idioma | **Español**, copy **estático** en código (sin i18n en esta historia). |
| Longitud del texto de ayuda | En **desktop**, **~dos líneas** sin **scroll** dentro del bloque del gráfico; en móvil puede envolver más. Evitar alturas de `Card` excesivas. |
| Accesibilidad | **WCAG 2.1 AA** para **texto** (≥ **4.5:1** con el fondo). Series **distinguibles** sin depender solo del color si es viable (grosor, leyenda clara). Mantener **paleta zinc / semántica actual** (emerald, ámbar, rojo); ajustar tonos antes que cambiar de sistema. |

---

## 4. Inventario de UI afectada

| # | Ubicación en UI | Componente | Implementación actual |
|---|-----------------|------------|------------------------|
| 1 | Columna ancha (izquierda en `xl`) | Evolución de TPH | `OverviewCharts` → `TPHTimeline` (`apps/web/components/charts/tph-timeline.tsx`) |
| 2 | Columna estrecha (derecha en `xl`) | Reducción por biopila | `OverviewCharts` → `BarChart` inline en `overview-charts.tsx` |

Ambos están dentro de `Card` con `CardTitle`; hay que añadir **`CardDescription`** (o equivalente con las mismas clases tipográficas del design system) **debajo del título** y **encima** del área del gráfico.

---

## 5. Especificación por gráfico

### 5.1 Evolución de TPH (`TPHTimeline`)

**Datos:** `tphActualMgkg` vs `tiempoDias`; una **serie por** `biopilaId` cuando `biopilaIds` tiene elementos; si no, una sola serie agregada.

**Eje horizontal (X):**

- **Variable:** tiempo de operación desde el inicio del experimento en el modelo de datos.
- **Nombre visible:** **“Tiempo de operación”** (o **“Tiempo”** si el espacio es muy justo en móvil).
- **Unidad:** **días** — debe aparecer en la **etiqueta del eje** (no solo en el tooltip). Ejemplo de texto compuesto: **“Tiempo de operación (días)”** mediante `label` de `XAxis` en Recharts.
- **Ticks:** numéricos (`tiempoDias`). El `labelFormatter` del tooltip puede seguir siendo **“Día X”** / **“Día {n}”** (con tilde en “Día”).

**Eje vertical (Y):**

- **Variable:** concentración de hidrocarburos totales en suelo, **TPH actual**.
- **Unidad:** **mg/kg** obligatoria en la **etiqueta del eje** (p. ej. **“TPH actual (mg/kg)”**).
- **Ticks:** puede mantenerse notación abreviada en valores grandes (p. ej. miles como `k`) **siempre que** la etiqueta del eje deje claro que la magnitud es **mg/kg**. Si la abreviatura genera ambigüedad, preferir valores completos con formato localizado.

**Leyenda (solo modo multi-serie):**

- Debe ser **legible**: color del texto de leyenda con contraste AA sobre el fondo del gráfico (`#09090b` / área del chart).
- Los nombres de serie son los **IDs de biopila** (comportamiento actual).

**Tooltip:**

- Mantener unidades en el valor: **mg/kg** en el valor mostrado.
- Estilo de fondo/borde: mantener coherencia con el tema; si hace falta más contraste, subir tono del texto dentro del tooltip.

**Texto de ayuda (Card):** usar el copy de la **§7.1** (debajo).

**Modo sin `biopilaIds`:** el mismo requisito de ejes y descripción aplica al gráfico de una sola línea usado en otros contextos **solo cuando** ese gráfico se incluya en el alcance de una historia; **TPH-8** según §3 solo exige **`OverviewCharts`**, que con datos de biopila siempre pasa `biopilaIds`. Si en el futuro `TPHTimeline` se reutiliza sin cambios, conviene **parametrizar** títulos de ejes para no duplicar lógica.

---

### 5.2 Reducción por biopila (`BarChart` horizontal)

**Datos:** por cada biopila, **reducción porcentual** derivada de `tphReductionPct` (última medición vs TPH inicial en dominio), en **%**. Color de barra según `estado`: óptimo / subóptimo / crítico.

**Eje de categorías (Y en `layout="vertical"`):**

- **Contenido:** identificador de biopila (`biopilaId`).
- **Nombre visible:** **“Biopila”** o **“Identificador de biopila”**.
- No requiere unidad; si el margen es insuficiente para etiquetas largas, el ancho del eje puede aumentarse levemente sin romper el grid.

**Eje de valores (X en `layout="vertical"`):**

- **Variable:** reducción de TPH expresada en **porcentaje** respecto al inicio.
- **Nombre visible + unidad:** **“Reducción de TPH (%)”** en la etiqueta del eje numérico. El atributo `unit` de Recharts **no** sustituye una etiqueta legible; usar **`label`** del eje.
- **Rango:** de **0** al máximo necesario según datos (comportamiento actual aceptable).

**Tooltip:**

- Primera línea del valor: número con **una** decimal y símbolo **%**; nombre de la serie coherente (p. ej. **“Reducción”** con tilde: **“Reducción”**).

**Texto de ayuda (Card):** copy **§7.2**.

**Leyenda de colores:** el gráfico no incluye leyenda de estado hoy; **opcional** en TPH-8 añadir una **nota breve** bajo la descripción o junto al gráfico: *Verde = óptimo, ámbar = subóptimo, rojo = crítico* — solo si cabe en el tope de altura (~2 líneas de descripción + opcional una línea de leyenda de color). Si no cabe, el copy de §7.2 debe mencionar que el color indica estado operativo.

---

## 6. Contraste y tema (requisitos técnicos)

| Elemento | Requisito |
|----------|-----------|
| `CardTitle` | Ya en componente UI; verificar contraste sobre `bg-zinc-900`. |
| `CardDescription` | Usar token/clase que cumpla **≥ 4.5:1** frente al fondo (p. ej. `text-zinc-400` **solo** si el ratio lo cumple; si no, subir a `zinc-300`). |
| Ejes Recharts (`stroke`, `tick`, `label.fill`) | Sustituir **`#71717a`** si el contraste sobre el fondo del chart es insuficiente; preferir tono más claro de la escala zinc. |
| Grid (`#27272a`) | Opcional reforzar solo si mejora legibilidad sin romper el look. |
| Series (líneas / barras) | Mantener paleta semántica; si dos series adyacentes se confunden, diferenciar **grosor** o **dash** en una de ellas **solo** si no desvirtúa el diseño. |

**Herramienta de verificación:** inspector de contraste del navegador o [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) sobre color de texto y color de fondo real capturado.

---

## 7. Copy aprobado (español)

Máximo **~2 líneas en desktop** por bloque; sin scroll en el contenedor del texto.

### 7.1 Evolución de TPH

**Título de card:** **“Evolución de TPH”** (mantener o unificar mayúsculas con el resto de la app: preferir **“Evolución de TPH”** con “TPH” en mayúsculas).

**Descripción (`CardDescription`):**

> Cada línea corresponde a una biopila y muestra el TPH actual en suelo (mg/kg) según los días de operación. Compará las curvas para ver el ritmo de remediación o si alguna se estabiliza sin bajar.

*(Ajustar cortes de línea con CSS; no añadir saltos manuales obligatorios.)*

### 7.2 Reducción por biopila

**Título de card:** **“Reducción por biopila”**.

**Descripción (`CardDescription`):**

> Porcentaje de reducción de TPH respecto al valor inicial hasta la última medición de cada biopila. El color de la barra indica el estado operativo (óptimo, subóptimo o crítico) según variables medidas.

---

## 8. Comportamiento y datos (sin cambio funcional salvo aclaraciones)

- **Orden de biopilas en el eje Y:** se mantiene el orden actual del arreglo `biopilas` (sin reordenar en TPH-8 salvo decisión explícita).
- **Valores faltantes en el timeline:** comportamiento actual (puntos por día sin imputación); no es parte de TPH-8.
- **Una sola biopila:** los dos gráficos siguen mostrándose; el primero tendrá una sola línea.

---

## 9. Criterios de aceptación (QA)

- [ ] En **Evolución de TPH**, el eje X muestra **nombre + unidad (días)** y el eje Y **nombre + unidad (mg/kg)** de forma visible sin depender solo del tooltip.
- [ ] En **Reducción por biopila**, el eje de valores muestra **Reducción de TPH (%)** (o equivalente claro con **%** en la etiqueta del eje).
- [ ] Cada `Card` incluye **`CardDescription`** con el texto de **§7** (o equivalente aprobado por producto).
- [ ] En viewport **desktop** ancho típico (p. ej. ≥1280px), las descripciones **no** provocan scroll interno en la card por exceso de texto.
- [ ] Texto de títulos, descripciones, etiquetas de ejes y leyenda cumple **contraste ≥ 4.5:1** frente al fondo donde se renderiza.
- [ ] Tooltips siguen mostrando valores con **unidades** coherentes (mg/kg, %, días).
- [ ] No se modifican rutas ni contratos de API en esta historia salvo refactor interno de presentación.

---

## 10. Archivos previstos a tocar

| Archivo | Cambios esperados |
|---------|-------------------|
| `apps/web/components/dashboard/overview-charts.tsx` | `CardDescription`, etiquetas de ejes del `BarChart`, márgenes si hace falta, contraste tooltip/ejes. |
| `apps/web/components/charts/tph-timeline.tsx` | `label` en `XAxis`/`YAxis` (ambos modos: una serie y multi-serie), tilde en “Día” donde corresponda, contraste de ticks/leyenda. |
| `apps/web/components/ui/card.tsx` | Solo si hace falta variante de descripción; **preferir** usar `CardDescription` existente. |

---

## 11. Fuera de alcance (backlog / otros issues)

- Detalle de biopila, simulador, exportación PNG/PDF.
- KPIs: definición de “reducción promedio” por fila vs por biopila.
- Filtros, reordenación de barras, líneas de meta normativa.
- i18n.
- Nuevos tipos de gráfico (donut, tabla, heatmap).

---

## 12. Referencias de código

- `apps/web/components/dashboard/dashboard-page-content.tsx`
- `apps/web/components/dashboard/overview-charts.tsx`
- `apps/web/components/charts/tph-timeline.tsx`
- Dominio: `packages/domain` — `reductionPercent`, `BiopilaOverview`, `classifyBiopilaState`

---

*Fin de la especificación detallada TPH-8.*
