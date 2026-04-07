# Plan de implementación: serie observada en el gráfico del simulador

**Estado:** listo para ejecución  
**Contexto:** [spec del simulador](../specs/2026-04-06-simulator-module.md) · plan base [2026-04-06-simulator-module-implementation.md](./2026-04-06-simulator-module-implementation.md)

**Objetivo:** superponer al gráfico de comparación (línea base \(k\) vs simulado \(kM\)) la **evolución observada** de TPH en el mismo eje \(t\) (días desde el inicio), como **línea tenue con interpolación lineal entre mediciones** y **marcadores** en los puntos reales, visualmente distinta de las dos proyecciones y alineada con la paleta actual (zinc + emerald).

> **Para agentes:** marcar casillas `- [ ]` al completar. Priorizar función pura + tests para la construcción de series; el componente puede validarse en manual si no hay harness E2E.

---

## 1. Decisiones de producto y UX

| Tema | Decisión |
|------|----------|
| Qué es “real” | Valores **`tphActualMgkg`** frente a **`tiempoDias`** de las mediciones de la biopila seleccionada, ordenados por tiempo. |
| Interpolación | **Lineal** entre mediciones consecutivas **solo en el tramo** \([t_{\min}, t_{\max}]\) de las observaciones. Fuera de ese tramo: **`null`** en la serie (sin extrapolar hacia el futuro ni antes del primer punto) para no sugerir datos donde no los hay. |
| Representación | `Line` de Recharts: trazo **fino** (`strokeWidth` ~1–1.5), opacidad moderada en el trazo; **`dot`** solo en días que coinciden con una medición (o subconjunto si hay solapamiento). |
| Paleta | No competir con baseline (**zinc** `#a1a1aa`, trazo discontinuo) ni simulado (**emerald** `#34d399`). Usar un acento **sky** (p. ej. `#38bdf8` / `text-sky-400`) o **amber** suave (`#fbbf24` con opacidad en línea) coherente con fondo oscuro; leyenda y checkbox con el mismo color. |
| Toggles | Nuevo checkbox **“Mediciones / observado”** junto a los existentes; **por defecto activado** (valor pedagógico alto) o desactivado si se prefiere gráfico mínimo — **recomendación: activado por defecto**. |
| Rango temporal | Al aplicar presets (`last30`, etc.), **filtrar también** los puntos observados e interpolados al mismo `[minKeep, maxD]` que `filterSeriesByTimePreset` (reutilizar el `minKeep` o extraer lógica común). |
| Tooltip | Incluir clave “Observado (interpolado)” o “TPH medido” donde aplique; en días sin medición mostrar valor interpolado con etiqueta clara para no confundir con medición cruda. |

---

## 2. Decisiones técnicas

| Tema | Decisión |
|------|----------|
| Dónde vive la lógica | **Función pura** en `apps/web/lib/models/` (p. ej. `simulator-chart-observed.ts`) que, dado `days: number[]` (eje ya filtrado por preset) y `Measurement[]`, devuelve `observedInterpolated: (number \| null)[]` y opcionalmente `observedMarker: (number \| null)[]` (solo en días de medición) para alimentar una sola tabla `data` del `LineChart`. |
| Forma de los datos para Recharts | **Una sola** matriz `data[]` con claves `dia`, `baseline`, `simulado`, `observado` (interpolado), `observadoMarcador` (solo en días de medición, resto `null`). Dos `<Line>`: uno con `connectNulls` para la línea tenue; otro con `dataKey="observadoMarcador"` y `dot` visible, `stroke="none"` o `dot` custom — *alternativa más simple:* un solo `Line` con `dot={(props) => ...}` que pinte punto solo si hay medición ese día. |
| Coincidencia día | Las mediciones usan `tiempoDias` enteros o decimales; normalizar comparación (p. ej. `Math.round` o tolerancia ε) para decidir “hay medición en este `d` del bucle”. |
| Puntos excluidos del ajuste | El predictor puede filtrar puntos para el \(k\). Para el gráfico “real”, **mostrar todas las mediciones con TPH > 0** en el rango temporal, o documentar si se alinean a la misma regla que el fit — **recomendación inicial:** todas las mediciones válidas para visualización; si un punto cae muy lejos de la exponencial, eso **refuerza** el mensaje de incertidumbre. (Ajuste opcional en iteración 2: misma regla que `fitExponentialDecayRate`.) |
| Dominio compartido | **No** extender `SimulationResult` en `@tphzero/domain` si la serie observada se deriva solo de mediciones en la página; pasar `measurements` como prop al chart. |

---

## 3. Mapa de archivos

| Archivo | Cambio |
|---------|--------|
| `apps/web/lib/models/simulator-chart-observed.ts` (nuevo) | `linearInterpolateObservedTph(days, measurements): { interpolated: (number \| null)[]; markerAtIndex: boolean[] }` o equivalente. |
| `apps/web/lib/models/simulator-chart-observed.test.ts` (nuevo) | Casos: dos puntos, tres puntos, rango vacío, un solo punto (solo marcador, sin segmento o segmento degenerado), días fuera de \([t_{\min}, t_{\max}]\) → null. |
| `apps/web/lib/models/simulator-chart-range.ts` | Opcional: exportar `getVisibleDayRange(days, preset)` para reutilizar en observed sin duplicar constantes de `last30/90/180`. |
| `apps/web/components/simulator/comparison-chart.tsx` | Nuevas props: `measurements: Measurement[]`. Estado `showObserved`. Construir `data` con columna interpolada + marcadores. Estilos línea/punto según paleta. |
| `apps/web/app/simulator/page.tsx` | Pasar `selectedMeasurements` (o el array filtrado por biopila) a `<ComparisonChart />`. |

---

## 4. Pasos de implementación (orden sugerido)

- [ ] **4.1** Implementar `linearInterpolateObservedTph` + tests (sin UI).
- [ ] **4.2** Integrar en `ComparisonChart`: merge de columnas, filtro por preset alineado con `filterSeriesByTimePreset`.
- [ ] **4.3** Añadir `Line` observada (trazo tenue, `type="linear"` entre puntos con valores no null) y marcadores distinguibles.
- [ ] **4.4** Checkbox + leyenda visual (mini muestra de color sky/amber como hoy con zinc/emerald).
- [ ] **4.5** Tooltip: nombres y formato coherentes con `formatTooltipValue`.
- [ ] **4.6** Actualizar nota al pie del gráfico (LatexMarkdown) en una línea: observado = mediciones + interpolación lineal, sin extrapolación fuera del tramo medido.
- [ ] **4.7** Verificación manual: biopila con pocas y muchas mediciones; preset “últimos 30 días”; toggles combinados.

---

## 5. Criterios de aceptación

- En el mismo gráfico se ven **tres** elementos diferenciables: baseline (discontinua zinc), simulada (emerald), observado (línea tenue + marcadores en paleta acordada).
- Fuera del intervalo temporal cubierto por mediciones, **no** se dibuja tramo interpolado inventado.
- Los presets de tiempo recortan **de forma coherente** baseline, simulado y observado.
- Sin regresiones en tests existentes del simulador; nuevos tests cubren la función de interpolación.

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Muchas mediciones → puntos densos | Reducir radio del `dot` o mostrar cada N si > umbral (opcional, fase 2). |
| Confusión interpolado vs medido | Tooltip explícito; texto breve bajo el gráfico. |
| Doble fuente de verdad con el fit | Documentar en UI que observado es histórico crudo; baseline es ajuste exponencial. |

---

## 7. Fuera de alcance (explícito)

- Exportación PNG/SVG del gráfico.
- Extrapolación del observado más allá de la última medición.
- Cambiar el motor `simulateScenario` o el cálculo de \(k\).
