#!/usr/bin/env node
/**
 * Detiene la stack Supabase local (`supabase stop`).
 * La app Next.js se detiene con Ctrl+C en la terminal donde corre `npm run dev`.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

console.log('\n[stop:local] supabase stop …\n');

const r = spawnSync('npx', ['supabase', 'stop'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (r.status !== 0) {
  process.exit(r.status ?? 1);
}

console.log(
  '\n[stop:local] Listo. Si tenías `npm run dev` / `dev:local` abierto, ciérralo con Ctrl+C.\n'
);
