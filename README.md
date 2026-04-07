# TPHZero Copilot

TPHZero Copilot es una plataforma web para monitorear procesos de biorremediacion de suelos contaminados con hidrocarburos. Combina modelos matematicos, visualizacion de series temporales y herramientas de IA para ayudar a analizar biopilas, detectar anomalias, proyectar reduccion de TPH y simular escenarios operativos.

## Que resuelve

En procesos reales de biorremediacion, variables como humedad, temperatura, oxigeno, pH y nutrientes afectan directamente la velocidad de degradacion del contaminante. En muchos contextos esto se gestiona de forma empirica. TPHZero Copilot centraliza datos, calcula indicadores y usa IA para convertir resultados numericos en diagnosticos y recomendaciones accionables.

## Funcionalidades implementadas

- Carga de archivos CSV y Excel con validacion de columnas.
- Persistencia de datasets y mediciones en Supabase.
- Dashboard con KPIs, cards por biopila y graficos de evolucion.
- Vista de detalle por biopila con timeline, variables ambientales y tabla de mediciones.
- Chat con AI SDK v6 y Google Gemini para consultar estado, correlaciones, anomalias, predicciones y simulaciones.
- Simulador what-if para ajustar variables operativas y comparar linea base vs. escenario ajustado.

## Stack tecnico

- Monorepo: Turborepo
- Frontend: Next.js App Router
- UI: Tailwind CSS + shadcn/ui + Base UI
- Charts: Recharts
- AI: Vercel AI SDK v6 + `@ai-sdk/google`
- Modelos numericos: `simple-statistics`
- Parsing de archivos: Papa Parse + SheetJS
- Base de datos: Supabase
- Deploy: Vercel

## Estructura del repo

```text
tphzero-copilot/
|-- apps/
|   `-- web/
|       |-- app/
|       |   |-- api/
|       |   |-- biopila/[id]/
|       |   |-- chat/
|       |   |-- dashboard/
|       |   `-- simulator/
|       |-- components/
|       |   |-- charts/
|       |   |-- chat/
|       |   |-- dashboard/
|       |   |-- layout/
|       |   |-- simulator/
|       |   |-- ui/
|       |   `-- upload/
|       `-- lib/
|           |-- ai/
|           |-- data/
|           `-- models/
|-- docs/
|-- packages/
|   `-- domain/
|-- supabase/
|   `-- migrations/
`-- vercel.json
```

## Como funciona

### 1. Carga de datos

La pagina principal permite subir un CSV o Excel. El backend:

- valida columnas esperadas,
- detecta si el dataset es nivel 1 o nivel 2,
- crea un registro en `datasets`,
- inserta las mediciones normalizadas en `measurements`.

### 2. Dashboard

El dashboard toma el dataset mas reciente y:

- calcula reduccion promedio,
- agrupa mediciones por `biopila_id`,
- clasifica el estado de cada biopila,
- muestra la evolucion de TPH y reduccion por biopila.

### 3. Analisis por biopila

Cada biopila tiene una vista de detalle con:

- estado actual,
- metricas clave,
- serie temporal de TPH,
- serie temporal de variables ambientales,
- tabla de mediciones historicas.

### 4. Chat IA

El endpoint `/api/chat` usa AI SDK v6 con tools server-side para:

- clasificar estado,
- calcular correlaciones,
- detectar anomalias,
- proyectar TPH,
- simular escenarios,
- resumir el dataset mas reciente.

### 5. Simulador

El simulador toma una biopila del dataset mas reciente, inicializa sliders con la ultima medicion y proyecta TPH con cinética exponencial ajustada al historial; el escenario simulado escala la tasa con factores operativos (Q10, Monod, humedad, volteo) respecto a esa medicion. Ver `simulateScenario` y `simulator-kinetics.ts`.

## Variables de entorno

El proyecto usa estas variables:

```env
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

La plantilla esta en `.env.local.example`.

## Desarrollo local

Instala dependencias:

```bash
npm install
```

Levanta el proyecto:

```bash
npm run dev
```

Build del monorepo:

```bash
npm run build
```

## Scripts principales

En la raiz:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`

En `apps/web`:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Base de datos

La migracion principal vive en:

- `supabase/migrations/001_initial_schema.sql`

Tablas principales:

- `datasets`
- `measurements`

## Documentacion adicional

- Setup general: `docs/SETUP.md`
- Deploy paso a paso: `docs/DEPLOY-VERCEL-SUPABASE-GEMINI.md`
- Especificacion funcional: `SPEC.md`
- Plan de implementacion: `docs/plans/2026-03-21-tphzero-copilot.md`

## Estado actual

El MVP ya incluye:

- upload y parsing de datasets,
- dashboard,
- detalle por biopila,
- chat IA,
- simulador,
- configuracion base de Vercel.

Lo siguiente natural es endurecer persistencia de conversaciones, mejorar auth, y extender la capa de modelos para datasets mas grandes y mas casos de uso operativos.
