// Prose to animation. The index keeps a term posting list plus an exact
// alias map, and scores candidates by term weight, term rarity, and query
// coverage. Adapted from semantic-icons' `query.ts`; the scoring algorithm
// is domain-agnostic and unchanged.
import type { AnimationEntry, AnimationMatch } from './types.js';
import { aliasKey, rawKey, terms } from './normalize.js';

/**
 * Courtesy words that end a request. The library holds no animation named
 * after them, but they must not win a longer request on their own.
 */
const COURTESY = new Set(['please', 'thank', 'thanks', 'sorry', 'hello', 'hi', 'ok', 'okay']);

/** Where a term was found decides how much it counts. */
const WEIGHT_PHRASE = 6;
const WEIGHT_KEYWORD = 4;
const WEIGHT_CATEGORY = 1;
/** How many keywords of one animation may pay for the same term. */
const MAX_KEYWORD_HITS = 2;

/** An exact hit on the animation's own phrase or name outranks everything. */
const EXACT_PHRASE_BONUS = 140;
/** An exact hit on a keyword is strong, but the owner of the phrase wins. */
const EXACT_KEYWORD_BONUS = 100;
/**
 * The same hit, when the query also names another animation's whole phrase.
 * A prose tag such as "ring the bell" must not take that query away from the
 * `ring` animation: the query says what the caller wants.
 */
const SHADED_KEYWORD_BONUS = 30;
/** The unstemmed phrase of the animation itself: separates `spin` from `spinning`. */
const RAW_PHRASE_BONUS = 70;
/** The same hit on an unstemmed keyword. Smaller, as a keyword is weaker. */
const RAW_EXACT_BONUS = 12;
/**
 * How much of its score a mark keeps when it answers only one term of a long
 * query. A steeper curve than this starts to lose correct answers that share
 * one word with the query.
 */
const COVERAGE_FLOOR = 0.5;
const COVERAGE_POWER = 1.6;

/** A multi-word alias found inside longer prose is strong evidence. */
const CONTAINED_ALIAS_BONUS = 14;
/** The animation's own phrase found inside longer prose. Added on top of the
 * alias bonus, and paid for a one-word phrase too. */
const CONTAINED_PHRASE_BONUS = 40;

export type AnimationIndex = {
  entries: AnimationEntry[];
  /** term -> animation position -> weight sum for that term. */
  postings: Map<string, Map<number, number>>;
  /** exact alias key -> animation positions, for keywords. */
  aliases: Map<string, number[]>;
  /** exact alias key -> animation positions, for the phrase and the name only. */
  phraseAliases: Map<string, number[]>;
  /** phrase or name alias key -> word count, for every word count. */
  phraseAliasWords: Map<string, number>;
  /** unstemmed alias key -> animation positions. */
  rawAliases: Map<string, number[]>;
  /** unstemmed phrase or name -> animation positions. */
  rawPhraseAliases: Map<string, number[]>;
};

function addWeight(postings: AnimationIndex['postings'], term: string, position: number, weight: number): void {
  let byAnimation = postings.get(term);
  if (!byAnimation) {
    byAnimation = new Map();
    postings.set(term, byAnimation);
  }
  byAnimation.set(position, (byAnimation.get(position) ?? 0) + weight);
}

/** Build a searchable index over a set of animations. */
export function createAnimationIndex(entries: AnimationEntry[]): AnimationIndex {
  const postings: AnimationIndex['postings'] = new Map();
  const aliases: AnimationIndex['aliases'] = new Map();
  const phraseAliases: AnimationIndex['phraseAliases'] = new Map();
  const phraseAliasWords: AnimationIndex['phraseAliasWords'] = new Map();
  const rawAliases: AnimationIndex['rawAliases'] = new Map();
  const rawPhraseAliases: AnimationIndex['rawPhraseAliases'] = new Map();

  entries.forEach((entry, position) => {
    // The name is almost always a close relative of the phrase (`slide-in-up`
    // vs. "slide in up"), so count each term once, or a one-word hit pays
    // twice and a single common word can outrank a mark that answers the
    // whole query.
    for (const term of new Set(terms(`${entry.phrase} ${entry.name}`))) {
      addWeight(postings, term, position, WEIGHT_PHRASE);
    }
    // A term repeated across many keywords must not outweigh the animation
    // that owns the phrase. Count it at most `MAX_KEYWORD_HITS` times, so a
    // long tag list adds reach without letting one word dominate.
    const keywordHits = new Map<string, number>();
    for (const keyword of entry.keywords) {
      for (const term of new Set(terms(keyword))) {
        const seen = keywordHits.get(term) ?? 0;
        if (seen >= MAX_KEYWORD_HITS) continue;
        keywordHits.set(term, seen + 1);
        addWeight(postings, term, position, WEIGHT_KEYWORD);
      }
    }
    for (const term of terms(entry.category)) {
      addWeight(postings, term, position, WEIGHT_CATEGORY);
    }
    for (const alias of [entry.phrase, entry.name]) {
      const key = aliasKey(alias);
      if (key === '') continue;
      const owners = phraseAliases.get(key) ?? [];
      if (!owners.includes(position)) owners.push(position);
      phraseAliases.set(key, owners);
      phraseAliasWords.set(key, key.split(' ').length);
      const raw = rawKey(alias);
      if (raw !== '') {
        const rawOwners = rawPhraseAliases.get(raw) ?? [];
        if (!rawOwners.includes(position)) rawOwners.push(position);
        rawPhraseAliases.set(raw, rawOwners);
      }
    }
    for (const alias of [entry.phrase, entry.name, ...entry.keywords]) {
      const key = aliasKey(alias);
      if (key === '') continue;
      const positions = aliases.get(key) ?? [];
      if (!positions.includes(position)) positions.push(position);
      aliases.set(key, positions);
      const raw = rawKey(alias);
      if (raw !== '') {
        const rawPositions = rawAliases.get(raw) ?? [];
        if (!rawPositions.includes(position)) rawPositions.push(position);
        rawAliases.set(raw, rawPositions);
      }
    }
  });

  return {
    entries,
    postings,
    aliases,
    phraseAliases,
    phraseAliasWords,
    rawAliases,
    rawPhraseAliases,
  };
}

/**
 * The score a match needs before a caller treats it as an answer rather than
 * a miss. Tune with `scripts/prose-probe.ts` over labelled prose cases: too
 * low and cases that should return nothing start answering wrongly; too high
 * and real answers are refused.
 */
export const LOCAL_MIN_SCORE = 42;

export type SearchOptions = {
  /** How many results to return. Default 5. */
  limit?: number;
  /** Drop results under this score. Default 1. */
  minScore?: number;
};

/** A rare term says more about the query than a term half the set shares. */
function rarity(index: AnimationIndex, term: string): number {
  const documentCount = index.postings.get(term)?.size ?? 0;
  if (documentCount === 0) return 0;
  return Math.log(1 + index.entries.length / documentCount);
}

/** Rank animations against prose. Highest score first, then shortest phrase. */
export function searchIndex(index: AnimationIndex, query: string, options: SearchOptions = {}): AnimationMatch[] {
  const limit = options.limit ?? 5;
  const minScore = options.minScore ?? 1;
  const queryTerms = terms(query);
  if (queryTerms.length === 0) return [];

  const scores = new Map<number, number>();
  const matchedTerms = new Map<number, Set<string>>();
  const bump = (position: number, amount: number, term: string): void => {
    scores.set(position, (scores.get(position) ?? 0) + amount);
    const found = matchedTerms.get(position) ?? new Set<string>();
    found.add(term);
    matchedTerms.set(position, found);
  };

  const distinctTerms = [...new Set(queryTerms)];
  for (const term of distinctTerms) {
    const byAnimation = index.postings.get(term);
    if (!byAnimation) continue;
    const termRarity = rarity(index, term);
    for (const [position, weight] of byAnimation) bump(position, weight * termRarity, term);
  }

  // Coverage: an animation that answers every term beats one that answers a
  // word. The curve is steeper than linear, so a lone rare word carries less.
  for (const [position, score] of scores) {
    const coverage = (matchedTerms.get(position)?.size ?? 0) / distinctTerms.length;
    scores.set(position, score * (COVERAGE_FLOOR + (1 - COVERAGE_FLOOR) * coverage ** COVERAGE_POWER));
  }

  const wholeKey = queryTerms.join(' ');

  // Which animations have their whole phrase named inside the query.
  // Computed before the bonuses, because it decides how much an exact
  // keyword pays.
  const namedOwners = new Set<number>();
  if (queryTerms.length > 1) {
    for (let start = 0; start < queryTerms.length; start += 1) {
      for (let end = start + 1; end <= queryTerms.length; end += 1) {
        const alias = queryTerms.slice(start, end).join(' ');
        if (end - start === 1 && COURTESY.has(alias)) continue;
        if (!index.phraseAliasWords.has(alias)) continue;
        for (const position of index.phraseAliases.get(alias) ?? []) namedOwners.add(position);
      }
    }
  }

  const owners = new Set(index.phraseAliases.get(wholeKey) ?? []);
  for (const position of owners) bump(position, EXACT_PHRASE_BONUS, wholeKey);
  for (const position of index.aliases.get(wholeKey) ?? []) {
    if (owners.has(position)) continue;
    const shaded = namedOwners.size > 0 && !namedOwners.has(position);
    bump(position, shaded ? SHADED_KEYWORD_BONUS : EXACT_KEYWORD_BONUS, wholeKey);
  }
  // The unstemmed form breaks the tie between two animations that share a
  // stem, for example `spin` against `spinning`.
  const raw = rawKey(query);
  const rawOwners = new Set(index.rawPhraseAliases.get(raw) ?? []);
  for (const position of rawOwners) bump(position, RAW_PHRASE_BONUS, raw);
  for (const position of index.rawAliases.get(raw) ?? []) {
    if (!rawOwners.has(position)) bump(position, RAW_EXACT_BONUS, raw);
  }
  // An alias sitting inside longer prose, for example "slide in" inside "make
  // the toast slide in from the top". Walk the runs of query words and look
  // each one up, rather than test every alias in the library: the cost then
  // follows the query, not the size of the set.
  if (queryTerms.length > 1) {
    const tried = new Set<string>();
    for (let start = 0; start < queryTerms.length; start += 1) {
      for (let end = start + 1; end <= queryTerms.length; end += 1) {
        const alias = queryTerms.slice(start, end).join(' ');
        if (tried.has(alias)) continue;
        tried.add(alias);
        const wordCount = end - start;
        if (wordCount > 1) {
          for (const position of index.aliases.get(alias) ?? []) {
            bump(position, CONTAINED_ALIAS_BONUS * wordCount, alias);
          }
        }
        // The same test against the animation's own phrase, one-word phrases too.
        if (wordCount === 1 && COURTESY.has(alias)) continue;
        if (!index.phraseAliasWords.has(alias)) continue;
        for (const position of index.phraseAliases.get(alias) ?? []) {
          bump(position, CONTAINED_PHRASE_BONUS * wordCount, alias);
        }
      }
    }
  }

  return [...scores.entries()]
    .filter(([, score]) => score >= minScore)
    .map(([position, score]) => ({
      animation: index.entries[position]!,
      score: Math.round(score * 100) / 100,
      matched: [...(matchedTerms.get(position) ?? [])].sort(),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.animation.phrase.length !== b.animation.phrase.length) return a.animation.phrase.length - b.animation.phrase.length;
      return a.animation.name.localeCompare(b.animation.name);
    })
    .slice(0, limit);
}

/** The single best animation for the prose, or null when nothing matches. */
export function bestMatch(index: AnimationIndex, query: string, options: SearchOptions = {}): AnimationEntry | null {
  return searchIndex(index, query, { ...options, limit: 1 })[0]?.animation ?? null;
}
