// The curated animation library: a fixed set of CSS animations plus prose
// search over them.
//
//   import { searchAnimations, findAnimation, getAnimation, ANIMATIONS } from 'semantic-animations/library';
//
// The set is generated from `src/library/animations/*.json` by
// `scripts/build-library.ts`. Search runs in memory; nothing here needs a
// network call.
import { ANIMATIONS } from './animations.generated.js';
import { createAnimationIndex, searchIndex, bestMatch, LOCAL_MIN_SCORE, type SearchOptions } from './query.js';
import { renderAnimation, type RenderOptions, type RenderedAnimation } from './render.js';
import { CATEGORIES } from './known-names.js';
import type { AnimationEntry, AnimationMatch } from './types.js';

/** Every curated animation. Treat it as read-only: the search index is built once. */
export { ANIMATIONS };
export { renderAnimation };
export { createAnimationIndex, searchIndex, bestMatch, LOCAL_MIN_SCORE };
export { CATEGORIES };
export type { AnimationEntry, AnimationMatch, SearchOptions, RenderOptions, RenderedAnimation };

/** The index over the whole library. Built once, on first use. */
let cached: ReturnType<typeof createAnimationIndex> | null = null;
function index(): ReturnType<typeof createAnimationIndex> {
  cached ??= createAnimationIndex(ANIMATIONS);
  return cached;
}

/** Rank library animations against a word, a phrase, or a whole sentence. */
export function searchAnimations(query: string, options?: SearchOptions): AnimationMatch[] {
  return searchIndex(index(), query, options);
}

/** The best library animation for the prose, or null when nothing matches. */
export function findAnimation(query: string, options?: SearchOptions): AnimationEntry | null {
  return bestMatch(index(), query, options);
}

/** Name to animation. Built once, so `getAnimation` does not scan the whole set. */
let byName: Map<string, AnimationEntry> | null = null;

/** One animation by its stable name (the suffix of its `sa-` class). */
export function getAnimation(name: string): AnimationEntry | null {
  byName ??= new Map(ANIMATIONS.map((animation) => [animation.name, animation]));
  return byName.get(name) ?? null;
}

/** Every category in the library, in taxonomy order. */
export function categories(): string[] {
  return [...CATEGORIES];
}

/** Every animation in one category. */
export function animationsInCategory(category: string): AnimationEntry[] {
  return ANIMATIONS.filter((animation) => animation.category === category);
}

/**
 * Resolve a phrase to a rendered animation (class name plus custom-property
 * overrides), the same way `playAnimation` in `semantic-animations` (the
 * `.` entry point) does. Returns null when nothing matches closely enough.
 * Raise `minScore` to answer only on a strong match.
 */
export function resolveAnimation(
  phrase: string,
  options: Omit<SearchOptions, 'limit'> & RenderOptions = {},
): RenderedAnimation | null {
  const { minScore = LOCAL_MIN_SCORE, ...render } = options;
  const animation = bestMatch(index(), phrase, { minScore });
  return animation === null ? null : renderAnimation(animation, render);
}
