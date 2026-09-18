// Concatenate styles/animate/*.css into the public styles/animate.css.
// Run with `npm run css:build`. base.css always goes first (the shared
// custom-property block and the generic reduced-motion rule); everything
// else is sorted by filename, so a new batch file like `entrance-2.css`
// sits with its category and is picked up with no code change here.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'styles', 'animate');
const outFile = join(root, 'styles', 'animate.css');

function main() {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.css'));
  const base = files.filter((f) => f === 'base.css');
  const rest = files.filter((f) => f !== 'base.css').sort();
  const ordered = [...base, ...rest];

  const parts = ordered.map((f) => readFileSync(join(srcDir, f), 'utf8').trimEnd());
  writeFileSync(outFile, `${parts.join('\n\n')}\n`);
  console.log(`css:build: concatenated ${ordered.length} files (${files.length} total) into styles/animate.css`);
}

main();
