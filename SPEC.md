# TPHZero Copilot — Spec

## 1. Visión del Producto

**TPHZero Copilot** es una plataforma web de monitoreo y optimización inteligente de biorremediación de suelos contaminados con hidrocarburos (TPH). Utiliza modelos matemáticos combinados con agentes de IA para analizar el estado de biopilas, predecir su evolución, recomendar acciones operativas y simular escenarios "what-if".

**Contexto del hackathon**: En la industria petrolera (Vaca Muerta), la perforación genera residuos contaminados. La biorremediación depende de múltiples variables (humedad, temperatura, oxígeno, nutrientes, tipo de hidrocarburo) y actualmente se maneja de forma empírica. Esta herramienta busca reemplazar ese manejo empírico con decisiones basadas en datos e IA.

---

## 2. Datasets Disponibles

### Dataset Nivel 1 (`dataset_biorremediacion_hackathon.csv`)
- **200 filas** — mediciones independientes (sin agrupar por biopila)
- **19 columnas**: `tiempo_dias`, `temperatura_suelo_C`, `humedad_suelo_pct`, `oxigeno_pct`, `pH`, `TPH_inicial_mgkg`, `TPH_actual_mgkg`, `tipo_hidrocarburo` (liviano/pesado), `agua_aplicada_L_m3`, `fertilizante_N/P/K`, `tensioactivo` (0/1), `enmienda` (biochar/diatomeas/ninguna), `frecuencia_volteo_dias`, `temperatura_ambiente_C`, `humedad_ambiente_pct`, `precipitaciones_mm`, `porcentaje_reduccion_TPH`
- **Target**: `porcentaje_reduccion_TPH` (0.0 = sin reducción, ~0.98 = casi total)

### Dataset Nivel 2 (`dataset_biorremediacion_hackathon_nivel2.csv`)
- **30 filas** — series temporales de 3 biopilas (B1, B2, B3), 10 mediciones c/u (0-360 días)
- **23 columnas**: todas las de nivel 1 + `biopila_id`, `conductividad_mScm`, `estado_sistema` (optimo/suboptimo/critico), `recomendacion_operativa` (mantener/aumentar_riego/airear/ajustar_nutrientes)
- Permite tracking temporal y análisis por biopila individual

---

## 3. Funcionalidades Core (MVP)

### F1 — Carga de Datos
- Upload de archivos CSV/Excel desde disco local
- Parsing y validación de columnas esperadas
- Preview de datos cargados en tabla interactiva
- **Estado vacío claro**: cuando no hay datos cargados, la UI muestra un estado vacío informativo con instrucciones de cómo cargar datos. Todo el flujo de la app requiere datos cargados primero.
- **Extensibilidad futura**: adaptador para S3/GCS/Azure Blob/Supabase Storage (interfaz `DataSource` abstracta)

### F2 — Dashboard de Estado
- **Vista general**: cards con métricas clave por biopila (TPH actual, % reducción, estado)
- **Semáforo de estados**:
  - Verde = óptimo (proceso en marcha, sin intervención)
  - Amarillo = subóptimo (requiere atención)
  - Rojo = crítico (intervención urgente)
- **Gráficos temporales**: evolución de TPH, temperatura, humedad, oxígeno por biopila
- **Tabla de detalle**: todas las mediciones con filtros y ordenamiento

### F3 — Agente Analista (AI + Modelos)
- Analiza el estado actual de una biopila o del dataset completo
- **Modelos matemáticos** calculan estadísticas, correlaciones y clasificación de estado
- **LLM** interpreta los resultados numéricos y genera diagnóstico en lenguaje natural
- Responde preguntas del usuario sobre los datos

### F4 — Agente Recomendador (AI + Modelos)
- **Modelo de clasificación** (decision tree) identifica qué variables están fuera de rango óptimo
- **LLM** genera plan de acción operativo con justificaciones comprensibles
- Recomendaciones: ajustar riego, modificar fertilización N-P-K, airear, cambiar frecuencia de volteo
- Genera advertencias cuando detecta condiciones críticas

### F5 — Agente Predictor (AI + Modelos)
- **Regresión multivariable** proyecta la curva de reducción de TPH en el tiempo
- **Modelo de decaimiento exponencial** ajustado a los datos de la biopila
- **LLM** contextualiza la predicción: explica si el ritmo es adecuado, riesgos, tiempo estimado
- Estima tiempo restante para alcanzar objetivo de remediación (ej. 90% reducción)

### F6 — Simulador What-If (Modelos + AI)
- El usuario modifica variables (humedad, temperatura, nutrientes, frecuencia de volteo)
- **Modelo de regresión** calcula el impacto numérico estimado
- **LLM** interpreta la simulación y advierte sobre valores irrealistas o riesgos
- Comparación visual: escenario actual vs. escenario simulado

---

## 4. Motor de Modelos Matemáticos

### Modelos implementados en el servidor (TypeScript)

| Modelo | Propósito | Algoritmo | Librería |
|--------|----------|-----------|----------|
| **Clasificador de Estado** | Determinar óptimo/subóptimo/crítico | Decision tree basado en umbrales del dominio | Reglas codificadas + `ml-cart` |
| **Predictor de TPH** | Proyectar reducción de TPH en el tiempo | Regresión exponencial decreciente | `ml-regression` |
| **Análisis de Correlación** | Identificar variables más influyentes | Correlación de Pearson/Spearman | `simple-statistics` |
| **Detector de Anomalías** | Identificar mediciones fuera de rango | Z-score + rangos del dominio | `simple-statistics` |
| **Estimador What-If** | Simular cambios de variables | Regresión multivariable | `ml-regression` |

### Flujo Modelos + LLM

```
Datos del usuario
       ↓
[Modelos Matemáticos] → resultados numéricos (JSON)
       ↓
[AI Tools] → el LLM recibe los resultados como contexto
       ↓
[LLM] → genera respuesta en lenguaje natural interpretando los números
       ↓
[UI] → muestra respuesta + gráficos
```

El LLM **nunca calcula** directamente. Los modelos calculan, el LLM interpreta y comunica.

---

## 5. Arquitectura

### Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Monorepo** | Turborepo | Orquestación de builds, caching |
| **Frontend** | Next.js 16 (App Router) | SSR, Server Components, API routes |
| **UI** | shadcn/ui + Tailwind CSS + Recharts | Componentes accesibles, gráficos interactivos |
| **AI Agents** | Vercel AI SDK v6 | Agnóstico al LLM, streaming, tool calling |
| **AI Rendering** | AI Elements | Renderizado de respuestas AI con markdown |
| **Modelos ML** | simple-statistics, ml-regression, ml-cart | Modelos ligeros en JS, sin dependencia de Python |
| **Data Processing** | Papa Parse (CSV), SheetJS (Excel) | Parsing de archivos en el servidor |
| **Base de datos** | Supabase (free tier) | Postgres + Storage + Auth-ready |
| **Deploy** | Vercel (free tier) | Zero-config, preview URLs |

### LLM Provider (MVP)

Google Gemini con API key propia del equipo:
```
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

Agnóstico via AI SDK — cambiar provider es solo cambiar el model string:
```typescript
// MVP: Google Gemini
model: 'google/gemini-2.5-flash-preview-05-20'

// Alternativas (solo cambiar string + API key):
model: 'anthropic/claude-sonnet-4-6'
model: 'openai/gpt-4o'
```

### Supabase (Free Tier)

| Recurso | Límite free | Uso estimado |
|---------|------------|-------------|
| Base de datos Postgres | 500 MB | Datasets pequeños (~1MB), sobra |
| Storage | 1 GB | Archivos CSV/Excel subidos |
| API requests | 500K/mes | Más que suficiente para MVP |
| Realtime | 200 conexiones | No usado en MVP |

**Tablas principales**:
- `sessions` — sesiones de análisis
- `datasets` — metadatos de archivos subidos
- `measurements` — filas parseadas del CSV (datos normalizados)
- `analyses` — resultados de análisis guardados
- `chat_history` — conversaciones con los agentes

### Estructura del Monorepo

```
tphzero-copilot/
├── apps/
│   └── web/                          # Next.js app
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx              # Landing con upload + empty state
│       │   ├── dashboard/
│       │   │   └── page.tsx          # Dashboard principal
│       │   ├── biopila/
│       │   │   └── [id]/
│       │   │       └── page.tsx      # Detalle de biopila
│       │   ├── simulator/
│       │   │   └── page.tsx          # Simulador what-if
│       │   ├── chat/
│       │   │   └── page.tsx          # Chat con agentes AI
│       │   └── api/
│       │       ├── chat/
│       │       │   └── route.ts      # AI chat endpoint
│       │       ├── upload/
│       │       │   └── route.ts      # File upload → Supabase
│       │       └── data/
│       │           └── route.ts      # Data queries
│       ├── components/
│       │   ├── ui/                   # shadcn/ui components
│       │   ├── dashboard/            # Dashboard-specific
│       │   ├── charts/               # Chart wrappers (Recharts)
│       │   ├── upload/               # File upload + empty state
│       │   └── simulator/            # Simulator UI
│       └── lib/
│           ├── ai/
│           │   ├── agents.ts         # Agent definitions + tools
│           │   └── prompts.ts        # System prompts (español)
│           ├── models/
│           │   ├── classifier.ts     # Clasificador de estado
│           │   ├── predictor.ts      # Predicción TPH (regresión)
│           │   ├── correlator.ts     # Análisis de correlación
│           │   ├── anomaly.ts        # Detección de anomalías
│           │   └── simulator.ts      # Estimador what-if
│           ├── data/
│           │   ├── parser.ts         # CSV/Excel parsing
│           │   ├── validator.ts      # Schema validation
│           │   └── supabase.ts       # Supabase client + queries
│           └── types/
│               └── biopila.ts        # Domain types
│
├── packages/
│   └── domain/                       # Shared domain logic
│       ├── src/
│       │   ├── types.ts              # Biopila, Measurement, etc.
│       │   ├── thresholds.ts         # Rangos óptimos/críticos
│       │   ├── calculations.ts       # Cálculos de reducción, estadísticas
│       │   └── data-source.ts        # Interfaz abstracta DataSource
│       └── package.json
│
├── turbo.json
├── package.json
└── vercel.json
```

### Patrón de Extensibilidad — Data Sources

```typescript
// packages/domain/src/data-source.ts
interface DataSource {
  list(): Promise<DataFile[]>;
  read(fileId: string): Promise<Buffer>;
  write(fileId: string, data: Buffer): Promise<void>;
  delete(fileId: string): Promise<void>;
}

// Implementaciones:
// - SupabaseDataSource   (MVP — Supabase Storage + Postgres)
// - S3DataSource          (futuro — AWS S3)
// - GCSDataSource         (futuro — Google Cloud Storage)
// - AzureBlobDataSource   (futuro — Azure Blob Storage)
// - VercelBlobDataSource  (futuro — Vercel Blob)
```

### Agentes AI — Diseño

Cada agente usa AI SDK `streamText` con tools que llaman a los modelos matemáticos:

| Agente | Tools (ejecutan modelos) | Input | Output |
|--------|--------------------------|-------|--------|
| **Analista** | `classify_state`, `get_correlations`, `detect_anomalies`, `get_statistics` | Pregunta + datos | Diagnóstico textual con datos |
| **Recomendador** | `classify_state`, `get_thresholds_status`, `get_historical_trends` | Estado actual | Plan de acción + advertencias |
| **Predictor** | `predict_tph_curve`, `estimate_remediation_time`, `get_reduction_rate` | Biopila + horizonte | Predicción con intervalos |
| **Simulador** | `simulate_scenario`, `compare_with_baseline`, `validate_parameters` | Variables modificadas | Comparación numérica + visual |

Todos los agentes se exponen a través de un único chat endpoint con routing por contexto.

---

## 6. Diseño Visual

### Tema
- **Dark mode** por defecto (dashboard de monitoreo)
- Paleta: zinc/neutral base, con acentos semánticos:
  - `emerald-500` → estado óptimo
  - `amber-500` → estado subóptimo
  - `red-500` → estado crítico
  - `blue-500` → accent principal (acciones, links)
- Font: Geist Sans (UI) + Geist Mono (datos, IDs, métricas)
- **Idioma**: Todo en español

### Páginas

1. **Home/Upload** — Empty state informativo → zona de drop para CSV/Excel → preview de datos → botón "Comenzar análisis"
2. **Dashboard** — Grid de cards por biopila + gráficos globales + indicadores KPI
3. **Detalle Biopila** — Gráficos temporales, tabla de mediciones, semáforo de estado
4. **Chat AI** — Chat con agentes, sidebar contextual con datos de la biopila seleccionada
5. **Simulador** — Sliders para variables + gráfico comparativo actual vs. simulado

### Empty State (Home sin datos)
- Ilustración/icono de biopila
- Texto: "Bienvenido a TPHZero Copilot"
- Subtexto: "Carga un archivo CSV o Excel con datos de tus biopilas para comenzar el análisis"
- Botón prominente: "Cargar datos"
- Link secundario: "¿Qué formato necesito?" → desplegable con las columnas esperadas

---

## 7. Deployment

### Vercel (free tier) + Supabase (free tier)
- Next.js en Vercel: zero-config deploy
- Supabase: instancia gratuita para Postgres + Storage
- Costo total: **$0/mes** para el MVP

### Variables de Entorno
```
# LLM (MVP: Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 8. Consideraciones de Extensibilidad

| Módulo futuro | Cómo se integra |
|--------------|----------------|
| **Backend Python (ML avanzado)** | Agregar como Vercel Service con FastAPI, modelos Scikit-learn/XGBoost |
| **Cloud Storage** | Implementar nueva clase que cumpla `DataSource` interface |
| **Modelos ML propios** | Entrenar offline, servir via API route o Supabase Edge Function |
| **Alertas automáticas** | Cron job de Vercel + Supabase realtime |
| **Multi-tenant** | Supabase Auth + Row Level Security |
| **Tiempo real** | Supabase Realtime para datos de sensores IoT |
| **Otro LLM** | Cambiar `GOOGLE_GENERATIVE_AI_API_KEY` por la key del nuevo provider + model string |

---

## 9. Fuera de Scope (MVP)

- Autenticación/autorización (acceso público para demo)
- Deep learning o modelos ML complejos en Python
- Múltiples idiomas (solo español)
- Mobile app nativa
- Integración con sensores IoT en tiempo real
- Datasets precargados (el usuario debe cargar sus datos)

---

## 10. Decisiones Resueltas

| # | Pregunta | Decisión |
|---|---------|---------|
| 1 | API Key del LLM | Google Gemini, API key propia del equipo |
| 2 | Persistencia | Supabase free tier (Postgres + Storage) |
| 3 | Idioma UI | Solo español |
| 4 | Datos de demo | No precargados. Empty state claro en la home |
| 5 | Modelos | Combinación: modelos matemáticos (JS) calculan + LLM interpreta |
| 6 | Nombre | TPHZero Copilot (confirmado) |
