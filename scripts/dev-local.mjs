#!/usr/bin/env node
/**
 * Arranca Supabase local (Docker), opcionalmente aplica migraciones (db reset),
 * inyecta NEXT_PUBLIC_SUPABASE_* y SUPABASE_SERVICE_ROLE_KEY en el entorno del
 * proceso hijo y ejecuta `npm run dev` (turbo → Next).
 *
 * Uso:
 *   node scripts/dev-local.mjs              # start + env + dev (sin reset)
 *   node scripts/dev-local.mjs --fresh       # start + db reset + env + dev
 *
 * Variables:
 *   DEV_LOCAL_SKIP_START=1  → no ejecuta `supabase start` (ya está corriendo)
 *
 * No escribe apps/web/.env. Antes de ejecutar, comenta NEXT_PUBLIC_SUPABASE_* y
 * SUPABASE_SERVICE_ROLE_KEY de cloud en apps/web/.env y/o .env.local (ver docs/LOCAL-DATABASE.md).
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const args = process.argv.slice(2);
const fresh = args.includes('--fresh') || args.includes('-f');
const skipStart = process.env.DEV_LOCAL_SKIP_START === '1';

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function parseStatusJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No se pudo parsear JSON de `supabase status`');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function supabaseStatus() {
  const { status, stdout, stderr } = runCapture('npx', ['supabase', 'status', '-o', 'json']);
  const combined = stdout + stderr;
  if (status !== 0) {
    throw new Error(
      `supabase status falló (${status}). ¿Está Docker corriendo y \`supabase start\` ok?\n${stderr}`
    );
  }
  return parseStatusJson(combined);
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

if (!skipStart) {
  console.log('\n[dev:local] supabase start …\n');
  run('npx', ['supabase', 'start']);
}

if (fresh) {
  console.log('\n[dev:local] supabase db reset --yes (aplica migraciones; borra datos locales) …\n');
  run('npx', ['supabase', 'db', 'reset', '--yes', '--local']);
}

let json;
try {
  json = supabaseStatus();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}

const apiUrl = json.API_URL;
const anonKey = json.ANON_KEY;
const serviceRole = json.SERVICE_ROLE_KEY;

if (!apiUrl || !anonKey || !serviceRole) {
  console.error(
    'Faltan API_URL / ANON_KEY / SERVICE_ROLE_KEY en `supabase status -o json`. Salida:',
    JSON.stringify(json, null, 2)
  );
  process.exit(1);
}

const merged = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceRole,
};

console.log('\n[dev:local] Variables Supabase (local) aplicadas al proceso de Next.js:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL=${apiUrl}`);
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>');
console.log('  SUPABASE_SERVICE_ROLE_KEY=<service_role>\n');
console.log('[dev:local] npm run dev …\n');

const r = spawnSync(npmCmd, ['run', 'dev'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: merged,
  shell: process.platform === 'win32',
});

process.exit(r.status ?? 0);
