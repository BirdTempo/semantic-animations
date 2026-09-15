// Cross-check styles/animate.css and the curated library: every `sa-*` class
// the stylesheet defines must have exactly one library entry, and vice versa.
// Run with `npm run anim:check`.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANIMATIONS } from '../src/library/animations.generated.js';

const here = dirname(fileURLToPath(import.meta.url));
const cssFile = join(here, '..', 'styles', 'animate.css');

function classNamesInCss(css: string): Set<string> {
  const names = new Set<string>();
  for (const match of css.matchAll(/\.sa-([a-z0-9-]+)/g)) names.add(match[1]!);
  return names;
}

function main(): void {
  const css = readFileSync(cssFile, 'utf8');
  const cssNames = classNamesInCss(css);
  const libraryNames = new Set(ANIMATIONS.map((a) => a.name));

  const problems: string[] = [];
  for (const name of cssNames) {
    if (!libraryNames.has(name)) problems.push(`styles/animate.css defines .sa-${name}, but no library entry names it`);
  }
  for (const name of libraryNames) {
    if (!cssNames.has(name)) problems.push(`library entry "${name}" has no matching .sa-${name} class in styles/animate.css`);
  }

  if (problems.length > 0) {
    console.error(`semantic-animations: ${problems.length} mismatch(es) between the CSS and the library:\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  console.log(`semantic-animations: ${libraryNames.size} classes in styles/animate.css all match the library.`);
}

main();
