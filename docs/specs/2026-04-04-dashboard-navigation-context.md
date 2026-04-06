# Especificación: contexto y navegación del Dashboard (dataset + biopila)

**Estado:** aprobado por refinamiento (preguntas/respuestas 2026-04-04)  
**Alcance:** navegación explícita en URL, árbol lateral, breadcrumbs, control “atrás”; **sin** listado global de datasets ni controles prev/sig entre biopilas en esta historia.

---

## 1. Resumen del problema

Hoy el usuario puede pasar del dashboard a una biopila sin un rastro claro de:

- en qué **dataset** está trabajando;
- en qué **biopila** dentro de ese dataset está;
- cómo **volver** al contexto previo de forma obvia.

La URL y el shell de navegación no reflejan el dataset; el detalle de biopila no deja trazabilidad alineada con el módulo del dashboard.

---

## 2. Objetivos

1. Que el **dataset activo** forme parte de las **rutas canónicas** de la aplicación.
2. Que en todo momento el usuario pueda inferir **dataset** y **biopila** desde **URL**, **header**, **breadcrumbs** y **sidebar**.
3. Que las **rutas antiguas** dejen de usarse en la app y, si se visitan, muestren un **error descriptivo** (sin redirección silenciosa a las nuevas rutas).
4. Tratar **datasets inexistentes** en URL con un flujo de error coherente.

---

## 3. Decisiones de producto (cerradas)

| Tema | Decisión |
|------|----------|
| Dataset en URL | Sí. Rutas bajo prefijo `/datasets/[datasetId]/…`. |
| Estructura de rutas | **Opción A:** `/datasets/[datasetId]/dashboard` y `/datasets/[datasetId]/biopila/[biopilaId]`. |
| Rutas viejas (`/dashboard`, `/biopila/[id]`, etc.) | La aplicación **no** debe generar enlaces a ellas. Si el usuario las abre, **mensaje de error descriptivo** + CTA **solo a inicio** (`/`). Sin redirección automática a URLs nuevas. |
| Patrones de navegación en esta historia | **Las tres:** árbol en sidebar + breadcrumbs + botón “atrás” en detalle de biopila (vuelve al dashboard **de ese dataset**). |
| Saltos rápidos entre biopilas (prev/sig, combo) | **Fuera de alcance** de esta historia. |
| `datasetId` inválido (no existe en backend) | Página de error con mensaje claro + CTA **solo a inicio** (misma línea que rutas viejas). |
| Etiquetado del dataset en UI | **Truncar** IDs largos en breadcrumbs (y donde el espacio sea limitado); **id completo** accesible vía `title`/tooltip; en contexto de **detalle de biopila** mostrar identificación completa donde tenga sentido. La edición del `datasetId` en la subida de archivo será **otra historia**. |

---

## 4. Rutas canónicas

| Ruta | Propósito |
|------|-----------|
| `/datasets/[datasetId]/dashboard` | Vista general del dataset (KPIs, grid de biopilas, gráficos agregados según el diseño actual). |
| `/datasets/[datasetId]/biopila/[biopilaId]` | Detalle de una biopila dentro de ese dataset. |

**Reglas:**

- Toda navegación interna (tarjetas, sidebar, breadcrumbs) debe usar **solo** estas formas de URL (más el resto de módulos no afectados: inicio, chat, simulador, etc.).
- El `datasetId` y el `biopilaId` deben coincidir con los identificadores que expone el backend/API actual.

---

## 5. Rutas obsoletas (solo error)

Rutas consideradas **obsoletas** para esta aplicación (lista mínima a cubrir en implementación; ampliar si existen otras variantes en el código):

- `/dashboard`
- `/biopila/[id]` (cualquier id)

**Comportamiento:**

- **No** redirigir a `/datasets/...`.
- Mostrar una vista de error (puede ser página dedicada o ruta catch-all) con:
  - Texto que explique que **la URL ya no es válida** y que el contexto del dataset forma parte de la ruta.
  - Un botón: **Volver al inicio** → `/`.

---

## 6. Shell de navegación

### 6.1 Sidebar (árbol)

- Debe reflejar al menos:
  - Nodo **Dataset** (identificador truncado según §7) expandible/colapsable o siempre expandido según diseño.
  - Hijo: **Dashboard** → `/datasets/[datasetId]/dashboard`.
  - Hijos: una entrada por **biopila** del dataset actual → `/datasets/[datasetId]/biopila/[biopilaId]`.
- La lista de biopilas debe derivarse de los **mismos datos** que alimentan el dashboard de ese dataset (coherencia con el grid).
- Resaltar la ruta activa (dashboard vs biopila concreta).

**Nota:** sin pantalla global de datasets en esta historia: el usuario llega al dataset vía flujos existentes (p. ej. carga en inicio) que deben **navegar a la URL canónica** del dataset correspondiente.

### 6.2 Breadcrumbs

- Ubicación sugerida: zona superior, alineada con el header o inmediatamente debajo, según el layout existente.
- Ejemplos de cadena:
  - `Inicio` → `[Dataset truncado]` → `Dashboard`
  - `Inicio` → `[Dataset truncado]` → `Biopila [biopilaId o etiqueta acordada]`
- El segmento **Inicio** enlaza a `/`.
- Los segmentos intermedios deben ser clicables donde tenga sentido (dataset → dashboard de ese dataset; biopila → opcional si ya estás en esa biopila).

### 6.3 Header en detalle de biopila

- Además del título/subtítulo que describan la biopila y el dataset:
  - **Botón “Atrás”** (o equivalente accesible) que navegue a `/datasets/[datasetId]/dashboard`.
- El título debe dejar claro **qué biopila** se está viendo; el dataset puede aparecer en subtítulo o en breadcrumb (evitar duplicación redundante según diseño).

---

## 7. Truncado de IDs y accesibilidad

- Definir una longitud máxima visible para el `datasetId` en breadcrumbs y en el sidebar (p. ej. N caracteres + `…`), con **tooltip** o atributo `title` con el **id completo**.
- En la página de detalle de biopila, priorizar **legibilidad del id de biopila** (completo en título o sección principal).
- Cuando en una historia futura se permita **renombrar el `datasetId` en la subida**, esta especificación asume que las mismas reglas de truncado/tooltip seguirán aplicando a ids más cortos o legibles.

---

## 8. Estados de error

| Situación | Comportamiento |
|-----------|----------------|
| Ruta obsoleta | Error descriptivo + CTA a `/`. |
| `datasetId` inexistente | Error descriptivo + CTA a `/`. |
| `datasetId` válido pero `biopilaId` sin mediciones / desconocido | Definir en implementación: mensaje en página de detalle vs error; debe ser **coherente** y no silencioso. |

*(La fila “biopila desconocida” puede afinarse en revisión de código si hoy ya hay comportamiento definido.)*

---

## 9. Fuera de alcance (esta historia)

- Pantalla de **listado / selección de datasets**.
- **Controles** anterior/siguiente o desplegable entre biopilas del mismo dataset.
- **Renombrar** `datasetId` al subir archivo (historia aparte).
- Cambios profundos de **API** salvo los mínimos necesarios para validar existencia del dataset y listar biopilas bajo un dataset.

---

## 10. Criterios de aceptación (verificables)

1. No hay enlaces en la UI a `/dashboard` ni a `/biopila/...` sin prefijo de dataset.
2. Desde el grid del dashboard, al abrir una biopila, la URL es `/datasets/{id}/biopila/{biopilaId}`.
3. En dashboard y detalle de biopila del mismo dataset, breadcrumbs y sidebar muestran el **mismo** dataset (truncado + tooltip).
4. En detalle de biopila, “Atrás” lleva al dashboard de **ese** `datasetId`.
5. Abrir manualmente una URL obsoleta muestra mensaje claro y solo permite volver a inicio.
6. Abrir `/datasets/{idInexistente}/...` muestra error claro y CTA a inicio.

---

## 11. Plan de implementación (borrador técnico)

Orden sugerido para minimizar rutas rotas y facilitar revisión:

1. **Introducir rutas nuevas** bajo `app/datasets/[datasetId]/dashboard/page.tsx` y `app/datasets/[datasetId]/biopila/[biopilaId]/page.tsx`, moviendo o reutilizando la lógica de las páginas actuales de dashboard y biopila.
2. **Centralizar** lectura de `datasetId` desde `params` en fetch a `/api/data/[datasetId]` (alineado con el contrato actual del API).
3. **Actualizar todos los `Link`/`router.push`** (tarjetas de biopila, CTAs desde inicio tras carga, etc.) para usar solo URLs canónicas.
4. **Sidebar:** nuevo bloque o componente que, cuando `datasetId` esté en la ruta, muestre árbol dataset → dashboard + biopilas; en rutas sin dataset, comportamiento actual o colapsado.
5. **Breadcrumbs:** componente reutilizable alimentado por `pathname` + labels truncados.
6. **Header:** meta dinámica por ruta; botón atrás solo en ruta de biopila.
7. **Rutas obsoletas:** reemplazar `app/dashboard/page.tsx` y `app/biopila/[id]/page.tsx` por páginas de error o redirigir solo a componente de error **sin** 307 a nuevas URLs — cumplir “mensaje descriptivo”.
8. **Pruebas manuales** según §10; opcionalmente tests de rutas si el proyecto los usa.

**Riesgos:** flujo de “último dataset” en `page.tsx` de inicio debe apuntar explícitamente a `/datasets/{id}/dashboard` tras conocer el id.

---

## 12. Dependencias y notas

- **Historias futuras:** listado de datasets; renombrar `datasetId` en upload; navegación rápida entre biopilas.
- Mantener consistencia con el **design system** actual (Tailwind, componentes UI existentes).
