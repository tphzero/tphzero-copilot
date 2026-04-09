# Base de datos local para desarrollo

La app usa **`@supabase/supabase-js`**, que habla con la **API HTTP de Supabase** (PostgREST + Auth + JWT), no con Postgres por el protocolo nativo `pg`. Por eso, para desarrollo en `localhost` con el mismo código que en producción, la opción alineada con el repo es **levantar Supabase (Postgres + API) en local**, no solo un contenedor de Postgres suelto.

---

## Tres formas de trabajar (elige una)

| Comando | Supabase | Cuándo usarlo |
|---------|----------|----------------|
| **`npm run dev`** | **Cloud** (o lo que tengas en `apps/web/.env` / `.env.local`) | Desarrollo habitual contra el proyecto en [supabase.com](https://supabase.com); no requiere Docker. |
| **`npm run dev:local`** | **Local** (Docker) | Stack local ya levantada; el script ejecuta `supabase start`, **inyecta** URL y claves de `supabase status` en el proceso de Next y arranca `npm run dev`. **No** ejecuta `db reset` (no borra datos). |
| **`npm run dev:local:fresh`** | **Local** + migraciones | Primera vez en la máquina, o cuando cambió el esquema en `supabase/migrations/`. Igual que `dev:local` pero además **`supabase db reset --yes`** (recrea la DB y aplica migraciones + `seed.sql`; **borra todos los datos locales**). |

**Detener solo la stack local (Docker):** `npm run stop:local` (`supabase stop`). La app Next.js se cierra con **Ctrl+C** en la terminal donde corre el dev server.

**Scripts de bajo nivel** (si necesitas pasos sueltos): `npm run db:start`, `db:stop`, `db:reset`, `db:status`.

---

## Flujo recomendado con Supabase local

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) o Docker Engine + Compose (Linux), daemon en ejecución.
- Node.js 22+ y `npm install` en la raíz del repo.

### Antes de `dev:local` o `dev:local:fresh` (obligatorio leer)

Los scripts **no escriben** `apps/web/.env` ni `.env.local`: solo inyectan Supabase local en el **proceso** de `npm run dev`.

Si en **`apps/web/.env`** y/o **`apps/web/.env.local`** tienes definidas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` apuntando a **Supabase cloud**, Next.js puede seguir usando esas y **no** las del script. **Antes** de ejecutar `dev:local` o `dev:local:fresh`:

1. **Comenta o elimina** (temporalmente) esas tres variables de Supabase **cloud** en `apps/web/.env` y/o `.env.local`.
2. Deja el resto (Ollama, Gemini, etc.) como prefieras.
3. Cuando vuelvas a trabajar solo contra **cloud** con `npm run dev`, descomenta o restaura las variables del proyecto en el dashboard.

### Primera vez (esquema + datos de prueba desde cero)

```bash
npm run dev:local:fresh
```

Esto hace en cadena: `supabase start` → `supabase db reset --yes` → lee `supabase status -o json` → exporta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` al proceso → `npm run dev` (Turborepo → Next.js).

### Días siguientes (conservar datos locales)

```bash
npm run dev:local
```

Solo arranca Supabase si hace falta, **no** resetea la base.

### Al terminar

- **Ctrl+C** en la terminal del dev server.
- Opcional: `npm run stop:local` para apagar contenedores Supabase y liberar RAM/puertos.

### Variables de entorno y conflictos (resumen)

Mismo criterio que en la sección **Antes de `dev:local`**: archivos `.env` / `.env.local` con Supabase **cloud** pueden **ganar** a las variables inyectadas. Si usas solo `npm run dev` contra cloud, no hace falta tocar nada; si alternas entre cloud y local, conviene separar perfiles o comentar/descomentar las tres claves de Supabase según el modo.

---

## Opción solo cloud (sin Docker)

1. Crea el proyecto en Supabase y ejecuta la migración SQL del repo en el SQL Editor (`supabase/migrations/*.sql`).
2. Copia URL y claves desde **Project Settings → API**.
3. Ponlas en `apps/web/.env` o `.env.local`.
4. Ejecuta **`npm run dev`**.

No uses `dev:local` ni `stop:local` para este modo.

---

## Comandos `db:*` manuales (referencia)

| Script | Descripción |
|--------|-------------|
| `npm run db:start` | `supabase start` |
| `npm run db:stop` | `supabase stop` |
| `npm run db:reset` | Recrea la DB local y aplica migraciones + seed |
| `npm run db:status` | URL y claves (equivalente a lo que usa `dev:local` internamente) |

### Variables de entorno del script `dev:local`

| Variable | Efecto |
|--------|--------|
| `DEV_LOCAL_SKIP_START=1` | No ejecuta `supabase start` (útil si la stack ya está arriba). |

---

## Studio y SQL (local)

Con la stack local en marcha: **http://127.0.0.1:54323** (Table Editor, SQL Editor). Puerto por defecto en `supabase/config.toml` (`[studio].port`).

---

## Migraciones

- Archivos en `supabase/migrations/` con prefijo de timestamp (p. ej. `20260408000000_initial_schema.sql`).
- Tras cambiar el SQL: **`npm run dev:local:fresh`** o `npm run db:reset` para aplicar en local.

---

## Otras opciones (referencia)

### Podman (Linux)

Misma idea que Docker; luego los mismos comandos `npm run dev:local*`.

### Solo Postgres en Docker (sin Supabase)

No expone la API que usa `@supabase/supabase-js` sin montar PostgREST y JWT; no está soportado por este repo sin trabajo adicional.

### Servicios gestionados (no local)

Supabase / Neon / Railway: flujo de `docs/SETUP.md` con URL y claves del panel.

---

## Resolución de problemas

- **Puertos ocupados**: ajusta `[api].port` y `[db].port` en `supabase/config.toml`.
- **`docker pull` / `supabase start` falla con `failed to copy` / `httpReadSeeker` / `EOF`** al bajar capas desde el registro (URLs como `https://production.cloudflare.docker.com/...` o CloudFront hacia ECR): suele ser **red inestable**, proxy corporativo, firewall o rutas CDN cortadas a mitad de descarga. En equipos donde eso ocurre a menudo, **instalar [Cloudflare WARP](https://developers.cloudflare.com/warp-client/) y dejarlo conectado** suele estabilizar la ruta hasta esos CDNs (VPN ligera de Cloudflare). Contexto de errores análogos con Docker y registro detrás de Cloudflare: [docker/for-mac#7306](https://github.com/docker/for-mac/issues/7306). También ayuda: otra red (datos móviles), desactivar VPNs que rompan el tráfico, o revisar proxy en Docker Desktop.
- **Tablas vacías tras reset**: normal; usa `supabase/seed.sql` si quieres datos de prueba automáticos.
