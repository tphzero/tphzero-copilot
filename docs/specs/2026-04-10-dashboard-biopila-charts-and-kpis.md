# Especificación detallada: gráficos del dashboard (TPH-8) y tarjetas por biopila (KPI)

**Issue:** [TPH-8 — Dashboard - Mejorar los graficos mostrados](https://linear.app/tphzero-team/issue/TPH-8/dashboard-mejorar-los-graficos-mostrados)  
**Estado del documento:** especificación detallada para implementación y QA (**§1–12**, alcance original TPH-8); **registro de lo implementado** para **BiopilaCard y dominio asociado** (**§13**).  
**Última actualización:** 2026-04-10  
**Relacionado:** [2026-04-04-dashboard-navigation-context.md](./2026-04-04-dashboard-navigation-context.md)

---

## 1. Propósito

Definir de forma **cerrada** qué debe implementarse para cumplir [TPH-8](https://linear.app/tphzero-team/issue/TPH-8/dashboard-mejorar-los-graficos-mostrados): **ejes con nombre y unidades**, **texto de ayuda por gráfico**, y **contraste** alineado a WCAG AA sin romper la línea visual actual.

La **§13** documenta, como registro de producto e ingeniería, las **tarjetas por biopila (`BiopilaCard`)**, funciones de dominio y copy de detalle que se implementaron en la misma línea de trabajo del dashboard (complemento a los gráficos; no sustituye el texto del issue TPH-8 en §2–3).

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
| Fuera de alcance del issue TPH-8 (original) | Vista **`/datasets/.../biopila/...`** (detalle), timeline “sin biopila” en `DashboardPageContent`. Las **tarjetas `BiopilaCard`** estaban fuera del alcance **del issue**; su especificación e implementación quedan registradas en **§13**. |
| Ampliación implementada (registro §13) | **`BiopilaCard`**, dominio `primaryEnvironmentalDeviation` / `tphRemediationDynamics`, `TphSparkline`, copy unificado en detalle de biopila. |
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

- Simulador, exportación PNG/PDF.
- KPIs agregados del dashboard: definición formal de “reducción promedio” por fila vs por biopila (distinto del copy ya mostrado en tarjetas).
- Filtros, reordenación de barras, líneas de meta normativa.
- i18n.
- Nuevos tipos de gráfico (donut, tabla, heatmap).

*(La vista **detalle de biopila** y las **tarjetas `BiopilaCard`** no son backlog de TPH-8; su comportamiento documentado está en **§13**.)*

---

## 12. Referencias de código

- `apps/web/components/dashboard/dashboard-page-content.tsx`
- `apps/web/components/dashboard/overview-charts.tsx`
- `apps/web/components/charts/tph-timeline.tsx`
- Dominio: `packages/domain` — `reductionPercent`, `BiopilaOverview`, `classifyBiopilaState`
- Ampliación BiopilaCard: ver **§13**.

---

## 13. Tarjetas por biopila (`BiopilaCard`) — especificación implementada (registro)

Esta sección describe el comportamiento **implementado** en código para enriquecer las tiles del dashboard: conexión del **estado** (`StatusIndicator` / `classifyBiopilaState`) con la **variable** que más lo explica, **contexto TPH** inicial vs actual, **ritmo de remediación** reciente frente al período anterior, **mini tendencia** TPH, y tratamiento del **tipo de hidrocarburo**. Sirve como fuente de verdad para QA y evoluciones futuras.

### 13.1 Ruta y datos

| Tema | Decisión implementada |
|------|------------------------|
| Ruta | Listado de tarjetas en **`/datasets/[datasetId]/dashboard`** dentro de `DashboardPageContent`; cada tarjeta enlaza a **`/datasets/[datasetId]/biopila/[biopilaId]`**. |
| Fuente de datos | `BiopilaOverview`: `latestMeasurement`, `measurements[]`, `state`, `tphReductionPct`, `tiempoDias` (construcción actual en `dashboard-page-content.tsx`). |

### 13.2 Dominio (`packages/domain`)

**`primaryEnvironmentalDeviation(m: Measurement)`** (`state-explanation.ts`)

- Considera las mismas cuatro magnitudes que `classifyBiopilaState`: temperatura suelo, humedad suelo, oxígeno, pH (claves de umbral `temperatura_suelo_c`, `humedad_suelo_pct`, `oxigeno_pct`, `ph`).
- Para cada una obtiene `classifyValue` y **descarta** variables en estado óptimo.
- Entre las no óptimas, elige **mayor severidad** (`critico` > `suboptimo`). En empate de severidad, **mayor distancia** al intervalo **óptimo** (`THRESHOLDS[*].optimal`).
- Devuelve `null` si todas son óptimas.
- Tipo exportado: `EnvironmentalDeviation` (`variableKey`, `label`, `shortLabel`, `value`, `unit`, `status`).

**`tphRemediationDynamics(measurements, { recentDays? })`** (`calculations.ts`)

- Ventana por defecto **60 días** (`DEFAULT_REMEDIATION_WINDOW_DAYS`).
- Última medición `tLast`; punto de inicio de ventana reciente: `measurementAtOrBefore(measurements, tLast - W)`.
- **mg/kg por semana (reciente):** \((\mathrm{tph}_{\mathrm{inicio}} - \mathrm{tph}_{\mathrm{último}}) / (\Delta \mathrm{días} / 7)\) con \(\Delta\) entre ambas mediciones.
- **Período anterior** de igual duración en días: entre `measurementAtOrBefore(..., tLast - 2W)` y el punto de inicio de la ventana reciente; misma fórmula de pendiente → `mgKgPerWeekPrevious`.
- **`recentVsPreviousRatio`:** cociente reciente / anterior cuando el denominador ≠ 0 y ambos son finitos; si no hay datos suficientes, campos `null` (la UI no inventa valores).

### 13.3 UI: `BiopilaCard` (`apps/web/components/dashboard/biopila-card.tsx`)

**Cabecera**

- `biopilaId` (monoespaciado) + `StatusIndicator` (`biopila.state`).
- Si **todas** las mediciones de la biopila tienen el mismo `tipoHidrocarburo` (`tipoUniformeEnBiopila` calculado en el padre), el tipo se muestra como **subtítulo** pequeño bajo el ID; si no, el tipo aparece en **una línea al pie** de la tarjeta (“Tipo: …”).

**Contexto TPH**

- Una línea compacta: **TPH** *inicial redondeado* **→** *actual redondeado* **mg/kg** (`tphInicialMgkg`, `tphActualMgkg` de la última medición).

**Grid 2×2 (métricas + cuarto bloque)**

- **TPH actual** (valor numérico mg/kg).
- **Reducción** (tilde), porcentaje desde `tphReductionPct`.
- **Tiempo de operación** + valor en **días** (`tiempoDias` + sufijo `d`).
- **Cuarto bloque:**  
  - Si `state !== 'optimo'` y hay `primaryEnvironmentalDeviation`: bloque **Variable crítica** (etiqueta corta, valor con unidad, texto de severidad *crítico* / *subóptimo*) y debajo **Tendencia TPH** + sparkline.  
  - Si estado óptimo: solo **Tendencia TPH** + sparkline.

**Sparkline** (`apps/web/components/charts/tph-sparkline.tsx`)

- SVG fijo **40×16** px, `polyline` sobre `tiempoDias` y `tphActualMgkg`; sin Recharts por tarjeta. Si hay **menos de 2** mediciones, no se renderiza trazo útil (componente devuelve `null`).

**Ritmo reciente**

- Si `tphRemediationDynamics` devuelve `mgKgPerWeekRecent`: línea **“Ritmo reciente: ≈ … mg/kg·sem”** con formato abreviado para miles si aplica.
- Si además hay `recentVsPreviousRatio`: texto comparativo (*similar al período anterior*, *X% más rápido…*, *X% más lento…*).

### 13.4 Vista detalle de biopila (`biopila-detail-content.tsx`)

Copy alineado al dashboard:

- KPIs: **Reducción**; **Tiempo de operación (días)** como etiqueta del tiempo acumulado.
- Card **Evolución de TPH** (tilde en Evolución).
- Tabla de mediciones: cabeceras **Día**, **Reducción** (con tilde).

### 13.5 Archivos tocados (referencia)

| Archivo | Rol |
|---------|-----|
| `packages/domain/src/state-explanation.ts` | `primaryEnvironmentalDeviation`, tipos. |
| `packages/domain/src/calculations.ts` | `tphRemediationDynamics`, `TphRemediationDynamics`. |
| `packages/domain/src/index.ts` | Reexport. |
| `packages/domain/src/__tests__/calculations.test.ts` | Tests Vitest asociados. |
| `apps/web/components/charts/tph-sparkline.tsx` | Sparkline SVG. |
| `apps/web/components/dashboard/biopila-card.tsx` | Tarjeta. |
| `apps/web/components/dashboard/dashboard-page-content.tsx` | `tipoUniformeEnBiopila` por biopila. |
| `apps/web/components/dashboard/biopila-detail-content.tsx` | Copy detalle. |

### 13.6 Criterios de aceptación (QA) — BiopilaCard

- [ ] Con estado **no óptimo**, la tarjeta muestra **variable crítica** coherente con umbrales (misma familia que `classifyBiopilaState`).
- [ ] Línea **TPH inicial → actual** evita interpretar el TPH actual sin referencia.
- [ ] Con **≥ 2** mediciones aparece sparkline; con **1** medición no se muestra línea rota o vacía confusa.
- [ ] **Ritmo reciente** solo aparece cuando el dominio devuelve pendiente válida; si no hay datos, no se muestran cifras inventadas.
- [ ] **Tipo de hidrocarburo**: subtítulo si uniforme en el historial de la biopila; línea en cuerpo si hay mezcla.
- [ ] Detalle de biopila usa las mismas convenciones de **tildes** y **tiempo de operación** que la tarjeta/listado.

---

*Fin de la especificación (TPH-8 §1–12; registro BiopilaCard §13).*
