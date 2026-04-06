# Especificación: módulo Simulador (what-if TPH)

**Estado:** refinado con producto (brainstorming 2026-04-06)  
**Linear:** [TPH-12 — Simulador: hacer funcionar correctamente todo el módulo](https://linear.app/tphzero-team/issue/TPH-12/simulador-hacer-funcionar-correctamente-todo-el-modulo)  
**Relación con SPEC general:** corresponde a **F6 — Simulador What-If** del `SPEC.md` del repositorio (modelos + interpretación por IA, sin cálculo “a mano” en el LLM).

---

## 1. Resumen del problema

El simulador debe permitir explorar **escenarios hipotéticos** sobre una biopila concreta (ajuste de variables operativas) y ver el **efecto estimado** sobre la proyección de TPH frente a una **línea base** derivada del histórico. Hoy el módulo no cumple de forma fiable las expectativas de Linear: gráficos poco claros, poca transparencia sobre el modelo, sin diferenciación UX suficiente, sin filtros, y sin explicación asistida coherente con los datos.

**Valor para el usuario:** tomar decisiones o comunicar alternativas con una **estimación explícita** (baseline vs simulado), sabiendo **qué modelo** se usa y **por qué** la curva cambia según los parámetros tocados — sin confundir estimación con medición real.

**Utilidad para el conocimiento del problema:** el simulador **no sustituye** ensayos ni garantías; **estructura el razonamiento** (variables → modelo → resultado → narrativa) y acota expectativas al mostrar supuestos y límites del modelo seleccionado.

---

## 2. Objetivos

1. **Gráfico legible y profesional:** ejes con **descripción y unidades** adecuadas; **línea base** y **línea simulada** claramente diferenciadas (estilo, leyenda, tooltip).
2. **Control de lo que se ve:** **filtro de rango temporal** en el eje X y **visibilidad de series** (mostrar/ocultar baseline, simulado; opcionalmente puntos de mediciones reales si el dataset las aporta).
3. **Transparencia matemática:** el usuario entiende **qué modelo** está activo, **qué ecuación o forma funcional** usa (en lenguaje claro), **características y limitaciones**.
4. **Elección de modelo:** selector **explícito** entre modelos disponibles, más un modelo **recomendado** para el **dataset + biopila** actuales, con **motivo breve** de la recomendación.
5. **IA explicativa:** recuadro que explica **por qué** varió el resultado respecto al baseline en función de los **cambios en los parámetros** y del **modelo en uso**; el LLM **interpreta** resultados ya calculados (alineado con la arquitectura del proyecto: modelos calculan, IA comunica).

---

## 3. Alcance contextual (obligatorio)

| Regla | Descripción |
|-------|-------------|
| Dataset | El simulador opera **solo** sobre el **dataset activo** seleccionado en la aplicación. |
| Biopila | El usuario elige **una biopila** dentro de ese dataset; todas las mediciones y la simulación se anclan a esa biopila. |
| Sin modo “vacío” | No hay simulación genérica sin datos cargados; si falta contexto, el flujo debe redirigir o bloquear con mensaje claro (coherente con el resto de la app). |

---

## 4. Decisiones de producto (cerradas)

| Tema | Decisión |
|------|----------|
| Filtros del gráfico | **Combinación:** (A) **rango temporal** en el eje X con presets (p. ej. últimos 30 / 90 / 180 días, desde inicio, todo el horizonte proyectado) y coherencia con el **horizonte** del modelo; (B) **visibilidad de series** (baseline on/off, simulado on/off). Opcional: **leyenda interactiva** (clic para mostrar/ocultar) como duplicado ergonómico de B. |
| Sin datos en el rango | Mostrar estado vacío con mensaje (“No hay puntos en este rango”) en lugar de un gráfico engañoso. |
| Modelos: selector + recomendado | **Sí a ambos:** lista de modelos con **ficha** (nombre, forma/ecuación, supuestos, entradas/salidas, cuándo conviene / cuándo no). Uno marcado como **Recomendado** para el dataset+biopila actual, con **una línea de justificación** (criterios documentados en implementación; visibles al usuario de forma resumida). |
| Cambio de dataset o biopila | El modelo seleccionado **siempre se restablece al recomendado** para el nuevo contexto (no persistir la elección manual entre biopilas/datasets). |
| Panel de IA | **Solo bajo demanda:** botón **“Generar explicación”** si no hay texto; **“Actualizar explicación”** cuando ya hubo una generación previa. **No** regeneración automática al mover sliders. |
| Explicación desactualizada | Si cambian parámetros, modelo u otra entrada que invalide la última explicación, **ocultar el párrafo anterior** hasta que el usuario pulse de nuevo el botón (no mostrar texto contradictorio con el gráfico). |
| Exportación del gráfico | **Fuera de alcance** del MVP (sin PNG ni flujo “Exportar” en esta historia). |
| Trazabilidad IA | La explicación debe **mencionar el modelo matemático en uso** y basarse en **resultados estructurados** del motor (no inventar números). |

---

## 5. Requisitos funcionales

### 5.1 Carga de datos y simulación

- Al elegir biopila, inicializar sliders (u otros controles) con valores razonables a partir del **último estado conocido** de esa biopila en el dataset (p. ej. última medición por `tiempoDias`), sin perder la posibilidad de editar.
- Al cambiar cualquier parámetro relevante, recalcular **baseline** y **simulado** en cliente o vía API según la arquitectura vigente; el resultado debe ser **consistente** con el modelo seleccionado.
- Mostrar métricas resumidas ya existentes o acordadas (p. ej. delta de reducción, diferencias al final del horizonte) siempre que el modelo las exponga, con **etiquetas claras**.

### 5.2 Gráfico de comparación

- **Eje X:** tiempo en **días** (desde inicio de la serie o convención documentada en UI); **etiqueta** explícita (no solo “Días” genérico si el producto requiere más precisión, p. ej. “Tiempo (días desde inicio)”).
- **Eje Y:** TPH en **mg/kg** (o unidad del dominio); **formato** de ticks y tooltip legible; evitar ambigüedad entre miles y valores absolutos.
- **Línea base:** nombre visible en leyenda (p. ej. “Línea base” / “Proyección baseline”) y estilo **distinto** de la simulada (p. ej. trazo discontinuo vs continuo, contraste de color accesible).
- **Línea simulada:** idem, claramente distinguible.
- **Tooltip:** al pasar el cursor, mostrar día y valores de cada serie visible, con unidades.
- **Filtro temporal:** limitar el dominio mostrado según presets o rango min/max; el horizonte máximo debe alinearse con el **horizonte de proyección** configurado para el modelo (si el usuario acorta el rango, solo afecta la **vista**, no los datos subyacentes hasta que se recalcule).
- **Visibilidad de series:** toggles o leyenda interactiva para ocultar baseline o simulado.

### 5.3 Modelos matemáticos

- **Bloque “Modelo activo”** visible en la página: nombre, **descripción corta**, **forma matemática** (ecuación o expresión equivalente en texto), **hipótesis**, **limitaciones**.
- **Selector de modelo:** lista todas las variantes soportadas por el backend; al cambiar, **recalcular** la simulación y **invalidar** la explicación de IA (ver §4).
- **Recomendado:** calculado para el par dataset+biopila; criterios posibles (ejemplos, a ajustar en implementación): número mínimo de mediciones, cobertura temporal, varianza de variables, validez de rangos; lo importante para el spec es que exista **texto de “por qué recomendado”** y que al cambiar contexto se **resetee** al recomendado.

### 5.4 Panel de IA

- **Entrada:** resultado numérico estructurado del simulador (baseline vs simulado, deltas, parámetros modificados, **id/nombre del modelo**), más contexto mínimo de biopila/dataset si aplica a prompts existentes.
- **Disparo:** solo por botón; estados de UI: inactivo → cargando → éxito / error.
- **Error:** mensaje claro y opción de **reintentar**; no dejar bloqueada la página sin el gráfico (el gráfico debe seguir siendo la fuente de verdad visual).
- **Idioma:** coherente con el resto del producto (p. ej. español para usuarios de la app en español).

---

## 6. Fuera de alcance (esta historia)

- Exportación del gráfico (PNG, SVG, “Descargar”).
- Persistencia server-side de escenarios favoritos o historial de simulaciones (posible fase posterior).
- Entrenamiento de modelos ML ad hoc por usuario o subida de pesos custom.

---

## 7. Criterios de aceptación (verificables)

1. Con dataset y biopila seleccionados, el gráfico muestra **dos series** claramente diferenciadas cuando ambas están visibles; leyenda y tooltips incluyen **unidades** en ejes y valores.
2. El usuario puede **reducir el rango temporal** mostrado y **ocultar** una de las dos líneas sin romper el layout; si el rango no contiene puntos, aparece **mensaje de vacío**.
3. El **modelo activo** y su **descripción** (incl. ecuación/forma en texto) son visibles antes de pedir la explicación por IA.
4. Existe un modelo **Recomendado** con **justificación breve**; al cambiar de biopila o dataset, la selección vuelve al **recomendado**.
5. El panel de IA **no se actualiza solo** al mover sliders; requiere **“Generar explicación”** / **“Actualizar explicación”**.
6. Tras cambiar parámetros o modelo tras una explicación generada, el texto **desaparece** hasta una nueva generación.
7. La explicación menciona el **modelo usado** y se alinea cualitativamente con la **dirección** del cambio mostrado en el gráfico (para el mismo conjunto de entradas).
8. **No** hay flujo de exportación de gráfico en la UI.

---

## 8. Notas de implementación (no funcionales, orientativas)

- El código actual del estimador what-if (`simulateScenario`) construye `modified` pero la proyección “simulada” debe **usar coherentemente** las mediciones modificadas y el factor de ajuste; cualquier discrepancia entre comentario del código y el cálculo real debe corregirse para cumplir los criterios de aceptación.
- Los **modelos** adicionales “seleccionables” pueden ser, en una primera iteración, variantes del predictor (p. ej. distintos horizontes, pesos o formulaciones) siempre que cada uno tenga **definición** y **metadatos** para la UI; la especificación no impone nombres concretos de algoritmos hasta que el equipo los catalogue en código.
- La recomendación automática debe ser **determinística** para el mismo dataset+biopila (mismas entradas → mismo modelo recomendado), para evitar confusión.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| El usuario interpreta la simulación como **predicción garantizada** | Copy en ficha del modelo y, si aplica, disclaimer breve cerca del gráfico. |
| Coste/latencia de IA | Solo generación bajo demanda; sin llamadas en cada movimiento de slider. |
| Modelo recomendado “incorrecto” para el caso | Explicación visible del criterio + posibilidad de **override manual** explícito. |

---

## 10. Referencias

- Issue Linear: [TPH-12](https://linear.app/tphzero-team/issue/TPH-12/simulador-hacer-funcionar-correctamente-todo-el-modulo)
- `SPEC.md` del repositorio — sección F6 y motor de modelos.
