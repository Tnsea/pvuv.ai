/**
 * Builds sdk/src/f.ts → sdk/dist/f.js (deployed to js.pvuv.ai).
 *
 * dist/ is gitignored build output; run `npm run build:sdk` before deploying.
 * Target: small, fast, ES2019-compatible IIFE — no dependencies.
 */

import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(here, 'src/f.ts')],
  outfile: path.join(here, 'dist/f.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  legalComments: 'none',
});

// This self-hosted console serves the SDK too. Keep the existing endpoint and
// the cache-busting URL used by Genogram in sync on every subsequent build.
const consoleAssets = path.join(here, '../workers/console/public');
await mkdir(consoleAssets, { recursive: true });
await Promise.all(['f.js', 'f-behavior-20261030.js'].map(name =>
  copyFile(path.join(here, 'dist/f.js'), path.join(consoleAssets, name))));
console.log('built sdk/dist/f.js and console SDK endpoints');
