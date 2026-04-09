# Deploy paso a paso en Vercel + Supabase + Google Gemini

Esta guia explica como dejar TPHZero Copilot funcionando en produccion con:

- frontend y API routes desplegados en Vercel,
- base de datos en Supabase,
- modelo de IA conectado a Google Gemini por API key.

## Resumen de lo que vas a configurar

1. Crear proyecto en Supabase
2. Ejecutar la migracion SQL
3. Obtener claves de Supabase
4. Crear API key de Google Gemini
5. Subir el repo a GitHub si todavia no esta
6. Importar el proyecto en Vercel
7. Configurar variables de entorno en Vercel
8. Hacer el primer deploy
9. Verificar upload, dashboard, chat y simulador

## Requisitos previos

- Cuenta en GitHub
- Cuenta en Vercel
- Cuenta en Supabase
- Cuenta de Google con acceso a Google AI Studio
- Repositorio accesible desde Vercel

## Paso 1: Crear el proyecto en Supabase

1. Entra a https://supabase.com
2. Haz clic en `New project`
3. Elige organizacion
4. Define:
   - nombre del proyecto
   - password de la base de datos
   - region
5. Espera a que Supabase termine el aprovisionamiento

## Paso 2: Ejecutar la migracion SQL

1. Abre tu proyecto en Supabase
2. Ve a `SQL Editor`
3. Crea una nueva query
4. Copia el contenido completo de:

- `supabase/migrations/*_initial_schema.sql` (migracion inicial del esquema)

5. Ejecuta la query
6. Verifica en `Table Editor` que existan:
   - `datasets`
   - `measurements`

## Paso 3: Copiar las credenciales de Supabase

En Supabase ve a:

`Project Settings > API`

Necesitas copiar estos valores:

- `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret key` -> `SUPABASE_SERVICE_ROLE_KEY`

Guarda estos valores porque los vas a usar en Vercel.

## Paso 4: Crear la API key de Google Gemini

1. Entra a https://aistudio.google.com
2. Inicia sesion con tu cuenta de Google
3. Ve a `Get API key`
4. Crea una nueva API key
5. Copia la clave generada

Esta clave se usara como:

- `GOOGLE_GENERATIVE_AI_API_KEY`

## Paso 5: Verificar el archivo de variables del proyecto

La plantilla local ya existe en:

- `.env.local.example`

Las variables requeridas son:

```env
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Paso 6: Importar el proyecto en Vercel

1. Entra a https://vercel.com/dashboard
2. Haz clic en `Add New...`
3. Selecciona `Project`
4. Importa el repositorio `tphzero-copilot`
5. Vercel deberia detectar automaticamente Next.js

El repo ya incluye:

- `vercel.json`

con:

```json
{
  "framework": "nextjs"
}
```

## Paso 7: Configurar variables de entorno en Vercel

En la pantalla del proyecto en Vercel:

1. Ve a `Settings`
2. Abre `Environment Variables`
3. Agrega estas variables una por una:

### Variable 1

- Name: `GOOGLE_GENERATIVE_AI_API_KEY`
- Value: tu API key de Google Gemini

### Variable 2

- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: la URL del proyecto Supabase

### Variable 3

- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: la anon key publica

### Variable 4

- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: la service role key

Aplicalas al menos a:

- `Production`
- `Preview`

Si tambien quieres usarlas en desarrollo con Vercel local, agregalas a:

- `Development`

## Paso 8: Confirmar Root Directory y build

Como el repo es un monorepo simple con `apps/web`, verifica:

- Root Directory: repositorio raiz
- Framework Preset: Next.js

No hace falta cambiar el comando principal si Vercel detecta el proyecto correctamente.

## Paso 9: Hacer el primer deploy

Una vez cargadas las variables:

1. Vuelve a `Deployments`
2. Ejecuta el deploy inicial o redeploy si ya importaste el proyecto
3. Espera a que termine la build

Si la build falla:

- revisa que todas las variables esten presentes,
- revisa que la migracion SQL haya corrido,
- revisa que no haya copiado mal la `SUPABASE_SERVICE_ROLE_KEY`.

## Paso 10: Verificar que Supabase este conectado

Abre la URL del deploy y prueba el flujo:

1. Entra a la pagina principal
2. Sube un CSV o Excel valido
3. Ve a Supabase `Table Editor`
4. Verifica que aparezcan filas en:
   - `datasets`
   - `measurements`

Si el upload falla:

- revisa `SUPABASE_SERVICE_ROLE_KEY`
- revisa que la migracion SQL este aplicada
- revisa el formato del archivo

## Paso 11: Verificar que Google Gemini este conectado

Abre la pantalla de chat:

- `/chat`

Haz una consulta simple, por ejemplo:

- `Dame un resumen del dataset`
- `Cual es el estado actual de las biopilas?`

Si el chat falla:

- revisa `GOOGLE_GENERATIVE_AI_API_KEY`
- confirma que la key este activa en Google AI Studio
- verifica que la variable este configurada en el entorno correcto en Vercel

## Paso 12: Verificar funcionalidades principales

### Upload

- debe aceptar CSV y Excel
- debe crear un dataset
- debe mostrar preview

### Dashboard

- debe abrir en `/dashboard`
- debe mostrar KPIs y graficos

### Detalle de biopila

- debe abrir desde una card del dashboard
- debe mostrar timeline, variables y tabla

### Chat

- debe responder usando las tools server-side

### Simulador

- debe abrir en `/simulator`
- debe permitir elegir biopila
- debe simular cambios sobre el ultimo dataset

## Checklist final

- Supabase creado
- Migracion SQL ejecutada
- Google Gemini API key creada
- Variables cargadas en Vercel
- Deploy exitoso
- Upload funcionando
- Dashboard funcionando
- Chat funcionando
- Simulador funcionando

## Problemas comunes

### 1. `supabaseUrl is required`

Causa:

- falta `NEXT_PUBLIC_SUPABASE_URL`

Solucion:

- agregala en Vercel y redeploya

### 2. `No hay datos disponibles`

Causa:

- todavia no cargaste ningun dataset

Solucion:

- sube un CSV o Excel desde la home

### 3. Chat sin respuesta o error del modelo

Causa:

- API key de Gemini ausente o invalida

Solucion:

- revisa `GOOGLE_GENERATIVE_AI_API_KEY`
- confirma la key en Google AI Studio

### 4. Upload falla al guardar dataset

Causa probable:

- migracion no aplicada
- service role key incorrecta

Solucion:

- vuelve a ejecutar la migracion
- revisa `SUPABASE_SERVICE_ROLE_KEY`

### 5. Desarrollo local con Supabase Docker (`dev:local`)

Esta guia es de **produccion** (Vercel + Supabase cloud). Para trabajar con Supabase **en tu PC** (`npm run dev:local` / `dev:local:fresh`), antes comenta las variables de Supabase **cloud** en `apps/web/.env` y/o `.env.local` para que no entren en conflicto con las que inyecta el script. Detalle: `docs/LOCAL-DATABASE.md`.

## Archivos clave para esta configuracion

- Setup general: `docs/SETUP.md`
- Variables de entorno: `.env.local.example`
- Migracion Supabase: ver `supabase/migrations/`
- Config Vercel: `vercel.json`
- Endpoint de chat: `apps/web/app/api/chat/route.ts`
