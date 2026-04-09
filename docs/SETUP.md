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
3. Ejecuta el contenido de la migracion inicial en `supabase/migrations/` (archivo `*_initial_schema.sql`), o usa el SQL Editor con el mismo DDL.
4. Copia estas credenciales desde `Project Settings > API`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 3. Configurar variables de entorno

Parte de la plantilla incluida en `.env.local.example`.

```bash
cp .env.local.example apps/web/.env.local
```

Luego edita `apps/web/.env.local` con tus valores reales:

```env
GOOGLE_GENERATIVE_AI_API_KEY=tu-api-key-de-gemini
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## 4. Ejecutar en desarrollo

Desde la raiz del monorepo:

```bash
npm run dev
```

Esto arranca el workspace `apps/web` a traves de Turborepo.

Abre:

```text
http://localhost:3000
```

### Base de datos en localhost (Docker)

- **Todo automático:** `npm run dev:local` (día a día) o `npm run dev:local:fresh` (primera vez o tras cambiar migraciones). **Antes** de usarlos, comenta las variables de Supabase cloud en `apps/web/.env` / `.env.local` (el script no escribe esos archivos). Detalle: `docs/LOCAL-DATABASE.md` → *Antes de dev:local*.
- **Pasos manuales** (`db:start`, `db:reset`, copiar claves): también en ese documento.

## 5. Validar build local

```bash
npm run build
```

Si faltan variables de entorno, Next.js puede fallar al recolectar datos para las rutas API.

## 6. Desplegar en Vercel

El proyecto ya incluye `vercel.json` con framework `nextjs`.

```bash
npm i -g vercel
vercel
```

Configura en Vercel las mismas variables:

- `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Notas

- El frontend, dashboard, chat y simulador viven en `apps/web`.
- La logica de dominio compartida vive en `packages/domain`.
- El endpoint de chat usa AI SDK v6 con Google Gemini y requiere la API key configurada.
