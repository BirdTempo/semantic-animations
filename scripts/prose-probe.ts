// A labelled retrieval probe: real prose in, expected top-1 answer out.
// Not part of the Vitest suite — run it directly with `npm run anim:probe`.
// Reports "N of M cases answered correctly at rank 1 (floor F)", banded.
import { ANIMATIONS } from '../src/library/animations.generated.js';
import { createAnimationIndex, searchIndex, LOCAL_MIN_SCORE } from '../src/library/query.js';

type Band = 'everyday' | 'word-trap' | 'honest-gap';

type Case = {
  query: string;
  band: Band;
  /** Rank-1 result must be one of these names. Omit (or empty) to require no match. */
  accept?: string[];
};

const CASES: Case[] = [
  // ------------------------------------------------------------- everyday
  // One phrasing per library entry, so every entry is confirmed reachable.
  { query: 'make it fade in', band: 'everyday', accept: ['fade-in'] },
  { query: 'slide the toast up from the bottom', band: 'everyday', accept: ['slide-in-up'] },
  { query: 'the banner should drop down from the top', band: 'everyday', accept: ['slide-in-down'] },
  { query: 'open the drawer sliding in from the left', band: 'everyday', accept: ['slide-in-left'] },
  { query: 'the panel should come in from the right side', band: 'everyday', accept: ['slide-in-right'] },
  { query: 'zoom the dialog in as it opens', band: 'everyday', accept: ['scale-in'] },
  { query: 'make the new badge bounce in', band: 'everyday', accept: ['pop-in'] },
  { query: 'fade the toast away', band: 'everyday', accept: ['fade-out'] },
  { query: 'dismiss the card by sliding it up and out', band: 'everyday', accept: ['slide-out-up'] },
  { query: 'the banner should retract downward', band: 'everyday', accept: ['slide-out-down'] },
  { query: 'swipe the card away to the left to dismiss it', band: 'everyday', accept: ['slide-out-left'] },
  { query: 'swipe right to dismiss the card', band: 'everyday', accept: ['slide-out-right'] },
  { query: 'shrink the modal away as it closes', band: 'everyday', accept: ['scale-out'] },
  { query: 'give it a gentle pulse to draw the eye', band: 'everyday', accept: ['pulse'] },
  { query: 'make the heart beat when it is liked', band: 'everyday', accept: ['beat'] },
  { query: 'the recording indicator should blink', band: 'everyday', accept: ['flash'] },
  { query: 'ring the notification bell icon', band: 'everyday', accept: ['wobble'] },
  { query: 'shake it, the password was wrong', band: 'everyday', accept: ['shake'] },
  { query: 'let the app icons wiggle so they can be rearranged', band: 'everyday', accept: ['jiggle'] },
  { query: 'show a ping radiating out from the online dot', band: 'everyday', accept: ['ring'] },
  { query: 'the order went through, celebrate a little', band: 'everyday', accept: ['success-pop'] },
  { query: 'tell them that action is not allowed', band: 'everyday', accept: ['nope'] },
  { query: 'flash briefly to confirm it auto saved', band: 'everyday', accept: ['saved-flash'] },
  { query: 'spin while the page loads', band: 'everyday', accept: ['spin'] },
  { query: 'spin the sync icon the other way', band: 'everyday', accept: ['spin-reverse'] },
  { query: 'show a loading skeleton while the content loads', band: 'everyday', accept: ['shimmer'] },
  { query: 'show that someone is typing in the chat', band: 'everyday', accept: ['dots-bounce'] },
  { query: 'an indeterminate loading bar with no percentage', band: 'everyday', accept: ['progress-sweep'] },
  { query: 'let it float gently in the empty state', band: 'everyday', accept: ['float'] },
  { query: 'make it breathe quietly while idle', band: 'everyday', accept: ['breathe'] },
  { query: 'the hanging sign should sway gently', band: 'everyday', accept: ['sway'] },
  { query: 'highlight it with a soft glow', band: 'everyday', accept: ['glow'] },
  { query: 'nudge it to point out the new feature', band: 'everyday', accept: ['nudge'] },

  // ------------------------------------------------------------ word-traps
  // A shared token must not hand the query to the wrong entry.
  { query: 'left the building in a hurry', band: 'word-trap', accept: [] },
  { query: 'right, lets get started with the meeting', band: 'word-trap', accept: [] },
  { query: 'the bell pepper is spicy', band: 'word-trap', accept: [] },
  { query: 'left click the mouse button twice', band: 'word-trap', accept: [] },
  { query: 'float a loan to a friend until payday', band: 'word-trap', accept: ['float'] },
  { query: 'top of the morning to you', band: 'word-trap', accept: [] },

  // ----------------------------------------------------------- honest gaps
  // Nothing in the library answers these; the probe expects no match.
  { query: 'play a sound when the dialog opens', band: 'honest-gap', accept: [] },
  { query: 'translate this text into spanish', band: 'honest-gap', accept: [] },
  { query: 'sort the table by the price column', band: 'honest-gap', accept: [] },
  { query: 'validate the email address format', band: 'honest-gap', accept: [] },
  { query: 'print the document', band: 'honest-gap', accept: [] },
  { query: 'compress the image file before upload', band: 'honest-gap', accept: [] },
  { query: 'rotate the 3d camera around the object', band: 'honest-gap', accept: [] },
  { query: 'convert the currency to euros', band: 'honest-gap', accept: [] },
];

function main(): void {
  const byName = new Set(ANIMATIONS.map((a) => a.name));
  for (const testCase of CASES) {
    for (const name of testCase.accept ?? []) {
      if (!byName.has(name)) {
        console.error(`prose-probe: case "${testCase.query}" accepts unknown entry "${name}"`);
        process.exit(1);
      }
    }
  }

  const index = createAnimationIndex(ANIMATIONS);
  const bands = new Map<Band, { pass: number; total: number; failures: string[] }>();
  for (const band of ['everyday', 'word-trap', 'honest-gap'] as Band[]) bands.set(band, { pass: 0, total: 0, failures: [] });

  for (const testCase of CASES) {
    const stats = bands.get(testCase.band)!;
    stats.total += 1;
    const [top] = searchIndex(index, testCase.query, { limit: 1, minScore: LOCAL_MIN_SCORE });
    const gotName = top?.animation.name ?? null;
    const wantsMatch = (testCase.accept?.length ?? 0) > 0;
    const ok = wantsMatch ? gotName !== null && testCase.accept!.includes(gotName) : gotName === null;
    if (ok) {
      stats.pass += 1;
    } else {
      stats.failures.push(
        `  "${testCase.query}" -> got ${gotName ?? 'nothing'}${top ? ` (score ${top.score})` : ''}, wanted ${
          wantsMatch ? testCase.accept!.join(' or ') : 'nothing'
        }`,
      );
    }
  }

  let allPass = 0;
  let allTotal = 0;
  for (const [band, stats] of bands) {
    allPass += stats.pass;
    allTotal += stats.total;
    console.log(`${band}: ${stats.pass} of ${stats.total} correct at rank 1 (floor ${LOCAL_MIN_SCORE})`);
    for (const failure of stats.failures) console.log(failure);
  }
  console.log(`\ntotal: ${allPass} of ${allTotal} correct at rank 1 (floor ${LOCAL_MIN_SCORE})`);

  if (allPass !== allTotal) process.exitCode = 1;
}

main();
