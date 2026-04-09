# TPHZero Copilot

TPHZero Copilot es una plataforma web para monitoreo y soporte operativo de procesos de biorremediacion de suelos con hidrocarburos (TPH). Centraliza datos de campo, genera indicadores, habilita analisis asistido por IA y permite simulacion de escenarios what-if.

## 1. Que hace y para que sirve

La aplicacion ayuda a equipos tecnicos a:
- Cargar datasets operativos desde CSV/Excel.
- Visualizar estado de biopilas por dataset.
- Identificar condiciones optimas, suboptimas y criticas.
- Analizar tendencias historicas de TPH y variables ambientales.
- Consultar hallazgos mediante chat IA.
- Simular ajustes operativos para estimar impacto en la reduccion de TPH.

Contexto de uso principal: trabajo de campo y seguimiento tecnico-operativo.

## 2. Funcionalidades principales

### 2.1 Carga y gestion de datos
- Upload de archivos `.csv`, `.xlsx`, `.xls`.
- Parsing y validacion de columnas.
- Persistencia de datasets y mediciones en Supabase.
- Historial de datasets con seleccion de dataset activo.

### 2.2 Dashboard
- KPIs operativos (biopilas activas, reduccion promedio, estados).
- Cards por biopila con metricas resumidas.
- Graficos de evolucion de TPH y reduccion por biopila.
- Navegacion por dataset y detalle de biopilas.

### 2.3 Detalle de biopila
- Estado actual con indicador semantico.
- KPIs de la biopila.
- Series temporales (TPH + variables ambientales).
- Tabla de mediciones historicas.

### 2.4 Chat IA
- Endpoint `/api/chat` con AI SDK v6 + Google Gemini.
- Respuestas contextualizadas sobre dataset/biopilas.
- Soporte para analisis, interpretacion y recomendaciones.

### 2.5 Simulador what-if
- Ajuste de variables operativas con sliders.
- Comparacion linea base vs escenario simulado.
- Explicacion tecnica de cinetica y factores.
- Endpoint `/api/simulator/explain` para interpretacion IA del escenario.

## 3. Accesibilidad y UX de campo

La app incorpora funciones orientadas a legibilidad en entornos exigentes (luz variable, uso prolongado):

### 3.1 Tema claro/oscuro
- Switch de tema en sidebar.
- Persistencia con `next-themes`.
- Aplicacion global de tokens semanticos (no colores fijos por componente).

### 3.2 Preset de alto contraste (Campo)
- Toggle dedicado `Alto contraste` en sidebar.
- Persiste en `localStorage` con clave `tphzero-contrast-preset`.
- Valor activo: `field`.
- Aplica clase/atributo en `html` (`field-hc` y `data-contrast-preset='field'`).
- Refuerza contraste de:
  - texto principal/secundario,
  - bordes e inputs,
  - superficies (`background`, `card`, `muted`),
  - colores de estado (optimo/suboptimo/critico).

### 3.3 Mejoras de contraste implementadas
- Migracion de estilos hardcodeados (`zinc`, `white/black`) a tokens semanticos.
- Tooltips y ejes de graficos adaptados al tema.
- Breadcrumbs y elementos de navegacion con contraste reforzado.

## 4. Stack tecnico

- Monorepo: Turborepo
- Frontend: Next.js (App Router)
- UI: Tailwind CSS v4 + shadcn/ui + Base UI
- Charts: Recharts
- IA: AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- Data parsing: Papa Parse, SheetJS (`xlsx`)
- DB: Supabase
- Shared domain: `packages/domain`
- Tests: Vitest

## 5. Estructura relevante

```text
tphzero-copilot/
|-- apps/
|   `-- web/
|       |-- app/
|       |   |-- api/
|       |   |-- datasets/[datasetId]/
|       |   |-- chat/
|       |   |-- simulator/
|       |   `-- layout.tsx
|       |-- components/
|       |   |-- dashboard/
|       |   |-- simulator/
|       |   |-- charts/
|       |   |-- layout/
|       |   `-- ui/
|       `-- lib/
|-- packages/
|   `-- domain/
|-- docs/
`-- supabase/
```

## 6. Endpoints principales

- `POST /api/upload` -> carga y parseo de dataset
- `GET /api/data` -> listado de datasets
- `GET /api/data/[datasetId]` -> detalle del dataset y mediciones
- `DELETE /api/data/[datasetId]` -> elimina dataset
- `POST /api/chat` -> chat IA
- `POST /api/simulator/explain` -> explicacion IA del simulador

## 7. Variables de entorno

Template oficial: `apps/web/.env.local.example`

Archivo efectivo para la app web: `apps/web/.env.local`

Nota importante:
- `apps/web/.env.local` es el archivo que usa Next.js para `apps/web`.
- `/.env` en raiz queda reservado para tooling/monorepo y no reemplaza al de `apps/web`.

```env
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 8. Como correr el proyecto

### 8.1 Instalacion
```bash
npm install
```

### 8.2 Desarrollo (monorepo)
```bash
npm run dev
```

### 8.3 Desarrollo solo web
```bash
npm run -w web dev
```

### 8.4 Build
```bash
npm run build
```

### 8.5 Tests
```bash
npm run -w web test
```

## 9. Estado actual y analisis de la aplicacion

### 9.1 Fortalezas
- Flujo completo de datos: carga -> analisis -> simulacion.
- Modelo de UI consistente por tokens semanticos.
- Accesibilidad reforzada con claro/oscuro + preset de alto contraste.
- Arquitectura modular por dominio y componentes.
- Base solida para evolucion funcional y despliegue.

### 9.2 Riesgos o puntos a vigilar
- `next lint` en este repo aun depende de configuracion interactiva inicial.
- El rendimiento en datasets muy grandes requiere pruebas de escala.
- La interpretacion IA debe seguir validada por criterio tecnico de campo.

### 9.3 Siguientes pasos recomendados
1. Agregar modo "Alto contraste" como preferencia visible tambien en header/perfil.
2. Incorporar guia de QA visual automatizada (snapshots por tema/preset).
3. Definir politicas de calidad de datos y validaciones mas estrictas por tipo de dataset.
4. Extender observabilidad (errores API, tiempos de respuesta, metricas de uso).

## 10. Documentacion complementaria

- Setup: `docs/SETUP.md`
- Especificacion funcional: `SPEC.md`
- Planes de trabajo: `docs/plans/`

---

Si necesitas onboarding rapido para nuevos colaboradores, este README es la fuente principal y `docs/SETUP.md` cubre el paso a paso operativo.
