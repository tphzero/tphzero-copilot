# TPHZero Copilot - Setup Guide

## Prerrequisitos

- Node.js 22 recomendado
- npm 10+
- Cuenta de Supabase
- API key de Google Generative AI

## 1. Clonar e instalar

```bash
git clone <repo-url>
cd tphzero-copilot
npm install
```

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre el SQL Editor.
3. Ejecuta la migracion principal en `supabase/migrations/001_initial_schema.sql`.
3. Ejecuta la migracion inicial de `supabase/migrations/` (archivo con sufijo `_initial_schema.sql`).
4. Copia estas credenciales desde `Project Settings > API`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 3. Configurar variables de entorno

Para esta aplicacion, **el archivo que usa Next.js es**:
- `apps/web/.env.local`

La plantilla oficial esta en:
- `apps/web/.env.local.example`

### 3.1 Crear `apps/web/.env.local`

Desde la raiz del repo (`tphzero-copilot/`), en PowerShell:

```powershell
Copy-Item apps/web/.env.local.example apps/web/.env.local
```

Alternativa (si no queres comando): crear manualmente el archivo `apps/web/.env.local` y copiar el contenido de `apps/web/.env.local.example`.

### 3.2 Completar variables requeridas

Edita `apps/web/.env.local` y completa:

```env
GOOGLE_GENERATIVE_AI_API_KEY=tu-api-key-de-gemini
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3.3 Importante: diferencia entre `/.env` y `apps/web/.env.local`

- `apps/web/.env.local`: **siempre** es la fuente principal para ejecutar la app web (`next dev`, `next build`) del workspace `apps/web`.
- `/.env` (raiz del monorepo): puede existir para otros usos locales, pero **no reemplaza** a `apps/web/.env.local` para la app de Next.js.
- Si corres `npm run dev` desde la raiz (Turborepo), el proceso web sigue leyendo `apps/web/.env.local`.

En resumen: para evitar errores, manten las claves operativas en `apps/web/.env.local`.

## 4. Ejecutar en desarrollo

Desde la raiz del monorepo:

```bash
npm run dev
```

O solo el workspace web:

```bash
npm run -w web dev
```

Abre:

```text
http://localhost:3000
```

### Base de datos en localhost (Docker)

- `npm run dev:local` (día a día) o `npm run dev:local:fresh` (reset local completo).
- Detalle operativo: `docs/LOCAL-DATABASE.md`.

## 5. Verificaciones recomendadas

Typecheck:

```bash
npx tsc -p apps/web/tsconfig.json --noEmit
```

Tests:

```bash
npm run -w web test
```

Build:

```bash
npm run build
```

## 6. Smoke test funcional (manual)

1. Cargar un dataset desde Home.
2. Entrar a Dashboard y verificar KPIs + graficos.
3. Abrir detalle de biopila.
4. Probar Chat IA (`/chat`).
5. Probar Simulador (`/simulator`).
6. Verificar accesibilidad visual:
   - toggle Claro/Oscuro en sidebar,
   - toggle `Alto contraste` en sidebar (preset campo).

## 7. Despliegue en Vercel

El proyecto incluye `vercel.json` con framework `nextjs`.

```bash
npm i -g vercel
vercel
```

Variables a configurar en Vercel:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notas

- Frontend y API routes viven en `apps/web`.
- Logica de dominio compartida en `packages/domain`.
- Chat usa AI SDK v6 con Google Gemini.
- El preset de alto contraste persiste en `localStorage` con clave `tphzero-contrast-preset`.
