// Assemble src/library/animations.generated.ts from src/library/animations/*.json.
// Run with `npm run anim:build`. Fails the build if any entry has a problem.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkLibrary } from '../src/library/validate.js';
import type { AnimationEntry } from '../src/library/types.js';

const here = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(here, '..', 'src', 'library', 'animations');
const outFile = join(here, '..', 'src', 'library', 'animations.generated.ts');

function loadEntries(): AnimationEntry[] {
  const files = readdirSync(sourceDir).filter((f) => f.endsWith('.json')).sort();
  const entries: AnimationEntry[] = [];
  for (const file of files) {
    const raw = readFileSync(join(sourceDir, file), 'utf8');
    const parsed = JSON.parse(raw) as AnimationEntry[];
    if (!Array.isArray(parsed)) throw new Error(`${file} must contain a JSON array of entries`);
    entries.push(...parsed);
  }
  return entries;
}

function main(): void {
  const entries = loadEntries();
  const problems = checkLibrary(entries);
  if (problems.size > 0) {
    console.error(`semantic-animations: ${problems.size} entr${problems.size === 1 ? 'y has' : 'ies have'} problems:\n`);
    for (const [entry, list] of problems) {
      console.error(`  ${entry}`);
      for (const problem of list) console.error(`    - ${problem}`);
    }
    process.exit(1);
  }

  entries.sort((a, b) => (a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)));

  const body = JSON.stringify(entries, null, 2);
  const output = `// GENERATED FILE. Do not edit by hand.
// Run \`npm run anim:build\` after changing anything in src/library/animations/*.json.
import type { AnimationEntry } from './types.js';

export const ANIMATIONS: AnimationEntry[] = ${body};
`;
  writeFileSync(outFile, output);
  console.log(`semantic-animations: wrote ${entries.length} entries to ${outFile}`);
}

main();
