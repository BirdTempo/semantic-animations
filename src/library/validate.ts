// Metadata and contract checks for curated library entries.
import type { AnimationEntry } from './types.js';
import { normalizePhrase } from './normalize-phrase.js';
import { CATEGORIES, KNOWN_NAMES, NAMES_BY_CATEGORY } from './known-names.js';

export const MIN_KEYWORDS = 4;
export const MIN_CONCEPT_LENGTH = 20;

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A CSS `<time>`: a number followed by `s` or `ms`. */
const TIME_RE = /^-?\d*\.?\d+m?s$/;
/** A CSS `<length>` good enough for a `translate*()` distance. */
const LENGTH_RE = /^-?\d*\.?\d+(px|rem|em|%|vh|vw)$/;

export type Problem = string;

/** Check one library entry's metadata and its `defaults` overrides. Returns every problem found. */
export function checkEntry(entry: AnimationEntry): Problem[] {
  const problems: Problem[] = [];
  if (typeof entry !== 'object' || entry === null) return ['entry is not an object'];
  if (typeof entry.name !== 'string' || !NAME_RE.test(entry.name)) {
    problems.push(`name "${String(entry.name)}" is not kebab-case`);
    return problems;
  }
  for (const field of ['phrase', 'category', 'concept'] as const) {
    if (typeof entry[field] !== 'string') return [...problems, `${field} is missing or is not a string`];
  }
  if (!Array.isArray(entry.keywords) || entry.keywords.some((k) => typeof k !== 'string')) {
    return [...problems, 'keywords is missing or is not a list of strings'];
  }

  if (!KNOWN_NAMES.has(entry.name)) {
    problems.push(`name "${entry.name}" has no matching class in styles/animate.css`);
  }
  if (!(CATEGORIES as readonly string[]).includes(entry.category)) {
    problems.push(`category "${entry.category}" is not one of: ${CATEGORIES.join(', ')}`);
  } else if (!NAMES_BY_CATEGORY[entry.category as (typeof CATEGORIES)[number]].includes(entry.name)) {
    problems.push(`name "${entry.name}" does not belong to category "${entry.category}"`);
  }
  if (entry.phrase.trim() === '') problems.push('phrase is empty');
  if (entry.concept.trim().length < MIN_CONCEPT_LENGTH) {
    problems.push('concept is too short to explain the motion and when to use it');
  }
  if (entry.keywords.length < MIN_KEYWORDS) {
    problems.push(`only ${entry.keywords.length} keywords; at least ${MIN_KEYWORDS} are required`);
  }
  for (const keyword of entry.keywords) {
    if (keyword !== keyword.toLowerCase().trim()) problems.push(`keyword "${keyword}" is not lowercase and trimmed`);
  }
  if (new Set(entry.keywords).size !== entry.keywords.length) problems.push('keywords repeat');

  if (entry.defaults !== undefined) {
    const { duration, delay, timing, repeat, distance } = entry.defaults;
    if (duration !== undefined && !TIME_RE.test(duration)) problems.push(`defaults.duration "${duration}" is not a CSS time`);
    if (delay !== undefined && !TIME_RE.test(delay)) problems.push(`defaults.delay "${delay}" is not a CSS time`);
    if (distance !== undefined && !LENGTH_RE.test(distance)) problems.push(`defaults.distance "${distance}" is not a CSS length`);
    if (timing !== undefined && timing.trim() === '') problems.push('defaults.timing is empty');
    if (repeat !== undefined) {
      const ok = repeat === 'infinite' || (typeof repeat === 'number' && Number.isInteger(repeat) && repeat > 0) ||
        (typeof repeat === 'string' && /^\d+$/.test(repeat));
      if (!ok) problems.push(`defaults.repeat "${String(repeat)}" must be a positive integer or "infinite"`);
    }
  }

  return problems;
}

/** Check the whole set: per-entry problems, plus cross-entry uniqueness and class coverage. */
export function checkLibrary(entries: AnimationEntry[]): Map<string, Problem[]> {
  const byEntry = new Map<string, Problem[]>();
  const seenNames = new Set<string>();
  const seenPhrases = new Set<string>();
  entries.forEach((entry, position) => {
    const problems = checkEntry(entry);
    const name = typeof entry?.name === 'string' ? entry.name : `entry ${position}`;
    if (seenNames.has(name)) problems.push(`duplicate name "${name}"`);
    seenNames.add(name);
    const phraseKey = typeof entry?.phrase === 'string' ? normalizePhrase(entry.phrase) : `entry ${position}`;
    if (seenPhrases.has(phraseKey)) problems.push(`duplicate phrase "${entry.phrase}"`);
    seenPhrases.add(phraseKey);
    if (problems.length > 0) byEntry.set(`${position}: ${name}`, problems);
  });

  const missing = [...KNOWN_NAMES].filter((name) => !seenNames.has(name));
  if (missing.length > 0) {
    byEntry.set('library', [`no entry for CSS class(es): ${missing.map((n) => `sa-${n}`).join(', ')}`]);
  }

  return byEntry;
}
