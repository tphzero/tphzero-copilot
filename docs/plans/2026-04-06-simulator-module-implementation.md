# Plan de implementación: módulo Simulador (what-if TPH)

**Estado:** borrador para ejecución  
**Especificación:** [../specs/2026-04-06-simulator-module.md](../specs/2026-04-06-simulator-module.md)  
**Linear:** [TPH-12](https://linear.app/tphzero-team/issue/TPH-12/simulador-hacer-funcionar-correctamente-todo-el-modulo)  
**Alcance:** mismo que la spec (gráfico, filtros, modelos + recomendación, panel IA bajo demanda; sin exportación de gráfico).

> **Para agentes:** los pasos pueden seguirse con desarrollo iterativo (tests primero donde aplique). Marcar casillas `- [ ]` al completar.

---

## 1. Decisiones de arquitectura

| Tema | Decisión |
|------|----------|
| Cálculo baseline/simulado | **Cliente:** seguir usando `simulateScenario` en `apps/web/lib/models/simulator.ts` (o equivalente tras refactor). Corregir la lógica para que la serie simulada use **coherentemente** mediciones modificadas y el factor de ajuste (ver §2). |
| Catálogo de modelos | **Registro en código** (p. ej. `lib/models/simulator-models.ts` o junto al predictor): cada variante expone `id`, metadatos de UI (nombre, ecuación en texto, hipótesis, limitaciones) y **parámetros** que afectan a `predictTPH` / horizonte (p. ej. distintos `horizonDays` o flags documentados). |
| Modelo recomendado | Función pura **determinística** `recommendSimulatorModel(measurements: Measurement[]): { modelId; reason: string }` basada en reglas acordadas (p. ej. número mínimo de puntos, cobertura temporal). Mismas entradas → mismo resultado. |
| Reset al cambiar contexto | Al cambiar **dataset activo** o **biopila**, `selectedModelId` vuelve al **recomendado** para el nuevo contexto (sin persistir override entre contextos). |
| Recalcular al cambiar parámetros | **Sí:** `baseline` y `simulado` se recalculan en cliente cuando cambian parámetros, modelo u horizonte (p. ej. `useMemo` + dependencias). El panel de IA **no** se dispara solo (solo botón). |
| Invalidación del texto IA | Estado `explanationStale: boolean` (o equivalente): se pone a *stale* cuando cambian params, modelo u horizonte; se **oculta** el párrafo anterior hasta nuevo clic en Generar/Actualizar. |
| Explicación IA | **Nueva ruta API** dedicada, p. ej. `POST /api/simulator/explain`, que recibe **solo** JSON estructurado (resultado del simulador + id/nombre modelo + deltas + parámetros tocados + ids biopila/dataset). Usar `generateText` (o streaming opcional) con prompt de sistema que **prohíba inventar números** y exija mencionar el modelo. Reutilizar patrón de modelo de chat de `lib/ai/` si existe centralización. |
| Tests | **Vitest** en `apps/web` para: `recommendSimulatorModel`, reglas de filtrado temporal, y pruebas unitarias del **motor** `simulateScenario` tras el fix. Componentes del gráfico: pruebas ligeras o manuales según tiempo; no bloquear el merge por E2E si no hay harness aún. |

---

## 2. Contexto del código actual (punto de partida)

- **Página:** `apps/web/app/simulator/page.tsx` — carga mediciones vía `GET /api/data/[datasetId]`, selección de biopila, sliders, botón **Simular** que llama a `simulateScenario`; sin panel IA ni selector de modelo.
- **Motor:** `apps/web/lib/models/simulator.ts` — `simulateScenario` construye `modified` pero **`predictTPH` se invoca dos veces con `measurements` originales**; la serie “simulada” aplica solo un factor sobre la proyección del segundo `predictTPH` idéntico al baseline. Debe alinearse con la spec (§8 notas de implementación).
- **Dominio:** `packages/domain/src/types.ts` — `SimulationResult`; puede ampliarse con `modelId` o campos opcionales si el resultado debe llevar trazabilidad al modelo usado.
- **Gráfico:** `apps/web/components/simulator/comparison-chart.tsx` — Recharts; ejes genéricos (“Dias”), sin filtro temporal ni toggles de series.
- **Chat global:** `apps/web/app/api/chat/route.ts` — no sustituye el panel del simulador; el explain del simulador debe ser endpoint acotado y con entrada estructurada.

---

## 3. Mapa de archivos (previsto)

| Archivo / área | Responsabilidad |
|----------------|-----------------|
| `packages/domain/src/types.ts` | Ampliar tipos si hace falta (`SimulationResult`, payload de explain). |
| `apps/web/lib/models/simulator.ts` | Corregir cálculo; aceptar `modelId` o `horizonDays` según variante. |
| `apps/web/lib/models/predictor.ts` | Revisar si las variantes de modelo requieren parámetros adicionales exportados. |
| `apps/web/lib/models/simulator-models.ts` (nuevo) | Registro de modelos + `recommendSimulatorModel`. |
| `apps/web/components/simulator/comparison-chart.tsx` | Ejes con unidades, leyenda/tooltip, presets de rango, visibilidad de series, estado vacío. |
| `apps/web/components/simulator/active-model-panel.tsx` (nuevo, opcional) | Bloque “Modelo activo” + selector. |
| `apps/web/components/simulator/simulator-explanation.tsx` (nuevo, opcional) | Botón + estados + texto + reintentar. |
| `apps/web/app/simulator/page.tsx` | Orquestar dataset/biopila, estado de modelo recomendado, recalc derivado, stale de IA. |
| `apps/web/app/api/simulator/explain/route.ts` (nuevo) | Handler POST para explicación IA. |

---

## 4. Fases de implementación

### Fase A — Motor de simulación y tipos

- [ ] **A.1** Añadir tests unitarios que fallen para el comportamiento deseado: con `modified` distinto del histórico, la proyección simulada debe reflejar el uso de esas mediciones en la ruta de predicción (según diseño acordado con `predictTPH`).
- [ ] **A.2** Implementar en `simulateScenario` la corrección: **segunda llamada** a `predictTPH(modified, horizonDays)` (o API equivalente del predictor) y ajustar el post-procesado si el factor `calculateOptimalityBoost` sigue siendo necesario; documentar en comentario breve la semántica.
- [ ] **A.3** Exponer en el resultado (o en la firma) el **horizonte** y **modelId** usados para que la UI y el endpoint de explain sean coherentes.
- [ ] **A.4** Ejecutar tests del paquete `domain` / `web` según corresponda y corregir regresiones.

### Fase B — Catálogo de modelos y recomendación

- [ ] **B.1** Definir al menos **dos** variantes en el registro (p. ej. distintos `horizonDays` o etiquetas claras) con **ficha completa** (nombre, forma/ecuación textual, hipótesis, limitaciones, entradas/salidas).
- [ ] **B.2** Implementar `recommendSimulatorModel` determinístico con reglas mínimas (p. ej. &lt; N mediciones → modelo conservador; documentar criterios en código).
- [ ] **B.3** Tests unitarios: mismas mediciones → mismo `modelId` y `reason` estable.

### Fase C — UI: gráfico y controles de vista

- [ ] **C.1** **Eje X:** etiqueta explícita (p. ej. “Tiempo (días desde inicio)” o convención alineada con `daysProjected`).
- [ ] **C.2** **Eje Y:** TPH en mg/kg con formato de ticks y tooltips sin ambigüedad; leyenda con nombres tipo “Línea base” / “Proyección simulada” (o copy acordado).
- [ ] **C.3** **Estilos:** línea base vs simulada claramente diferenciadas (discontinuo vs continuo, colores con contraste accesible).
- [ ] **C.4** **Filtro temporal:** presets (30/90/180 días, desde inicio, todo el horizonte) aplicados como **ventana de visualización** sobre los arrays ya calculados; si tras filtrar no hay puntos, mostrar mensaje “No hay puntos en este rango” (sin gráfico engañoso).
- [ ] **C.5** **Visibilidad:** toggles o leyenda interactiva para ocultar baseline y/o simulado; layout estable al ocultar.
- [ ] **C.6** (Opcional) Puntos de mediciones reales si el dataset las expone de forma directa en el componente sin complejizar el MVP.

### Fase D — Página del simulador: modelo y recalc

- [ ] **D.1** Al montar o al cambiar biopila/dataset, establecer `selectedModelId = recommendSimulatorModel(...).modelId`.
- [ ] **D.2** Selector de modelo con ficha desplegable o bloque “Modelo activo” visible **antes** de cualquier explicación IA.
- [ ] **D.3** Sustituir el flujo “solo al pulsar Simular” por **recalc automático** cuando cambien `values`, `selectedModelId` o mediciones seleccionadas (mantener botón “Restablecer” a última medición).
- [ ] **D.4** Al cambiar modelo, invalidar texto IA (ver Fase E) y recalcular curvas.

### Fase E — Panel de IA (bajo demanda)

- [ ] **E.1** Añadir estado: sin texto | cargando | texto | error; botones **“Generar explicación”** / **“Actualizar explicación”** según exista texto previo **válido** (no stale).
- [ ] **E.2** Al detectar cambio en params/modelo/medición que invalide la última explicación, **ocultar** el bloque de texto (stale).
- [ ] **E.3** Implementar `POST /api/simulator/explain` con validación Zod del payload; prompt que cite el **nombre/id del modelo** y use solo números del JSON; manejo de error + **Reintentar**.
- [ ] **E.4** Idioma alineado con el resto de la app (español si así está el producto).

### Fase F — Integración y herramientas AI existentes

- [ ] **F.1** Actualizar `simulate_scenario` en `apps/web/lib/ai/tools.ts` si el resultado del motor cambia de forma relevante (mantener contrato de herramienta).
- [ ] **F.2** Verificación manual o checklist: criterios de aceptación §7 de la spec (1–8).

---

## 5. Criterios de aceptación (checklist de verificación)

Tomado de la spec; marcar al validar:

- [ ] Gráfico: dos series diferenciadas, unidades en ejes y tooltips.
- [ ] Rango temporal + ocultar series; vacío si no hay puntos en el rango.
- [ ] Modelo activo + descripción/ecuación visibles antes de IA.
- [ ] Recomendado con justificación; reset al cambiar biopila/dataset.
- [ ] IA solo por botón; texto oculto si inputs cambian tras generar.
- [ ] Explicación menciona modelo y dirección cualitativa del cambio.
- [ ] No hay exportación de gráfico en la UI.

---

## 6. Riesgos y dependencias

- **Riesgo:** Cambiar `simulateScenario` altera números respecto a la UI actual — comunicar en PR y validar con datos reales.
- **Dependencia:** Horizonte máximo del modelo debe ser coherente entre presets de vista y arrays devueltos por `predictTPH`.
- **Fuera de alcance:** export PNG, persistencia de escenarios, ML custom (no implementar).

---

## 7. Referencias

- Especificación: [2026-04-06-simulator-module.md](../specs/2026-04-06-simulator-module.md)
- `SPEC.md` del repositorio — F6 Simulador What-If
