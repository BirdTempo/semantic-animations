// Copy the built package into site/, so site/ is a fully self-contained
// static directory ready for `wrangler pages deploy site`. Run after
// `npm run build`; run via `npm run site:build`.
import { cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distSrc = join(root, 'dist');
const stylesSrc = join(root, 'styles');
const distDest = join(root, 'site', 'dist');
const stylesDest = join(root, 'site', 'styles');

if (!existsSync(distSrc)) {
  console.error('site:build: dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

rmSync(distDest, { recursive: true, force: true });
rmSync(stylesDest, { recursive: true, force: true });
cpSync(distSrc, distDest, { recursive: true });
cpSync(stylesSrc, stylesDest, { recursive: true });

console.log('site:build: copied dist/ and styles/ into site/');
