// Turn prose into the comparable terms the animation index is built from.

/**
 * Words that carry no animation meaning. Dropped from every query and alias.
 *
 * Direction and state words stay in: `up`, `down`, `in`, `out`, `on`, `off`,
 * `over`, `from`, `at`, `no`, `not`, `all`. An animation set is full of them,
 * and `slide in up` must not index as `slide`.
 */
export const STOPWORDS = new Set([
  'a', 'am', 'an', 'and', 'are', 'as', 'be', 'been', 'but', 'could', 'did', 'does', 'for',
  'had', 'has', 'have', 'he', 'her', 'him', 'his', 'how', 'i', 'if', 'is', 'it', 'its',
  'just', 'me', 'my', 'need', 'of', 'or', 'our', 'she',
  'should', 'so', 'than', 'that', 'the', 'their', 'them', 'then', 'these', 'they', 'this', 'those',
  'to', 'us', 'want', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who',
  'with', 'would', 'you', 'your',
]);

/** Plurals and verb forms that the simple rules below would get wrong. */
const IRREGULAR: Record<string, string> = {
  children: 'child', people: 'person', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth',
  mice: 'mouse', geese: 'goose', knives: 'knife', leaves: 'leaf', loaves: 'loaf', wolves: 'wolf',
  shelves: 'shelf', lives: 'life', halves: 'half', thieves: 'thief', scarves: 'scarf', dice: 'die',
  glasses: 'glass', dresses: 'dress', buses: 'bus', kisses: 'kiss', classes: 'class',
  lenses: 'lens', lens: 'lens', shoes: 'shoe', canoes: 'canoe', toes: 'toe',
  // A word that ends `-eed` is usually a base word (`seed`, `breed`,
  // `speed`), so no rule can strip the ending. Name the few past tenses.
  agreed: 'agree', freed: 'free', decreed: 'decree', guaranteed: 'guarantee',
  proceed: 'proceed', succeed: 'succeed', exceed: 'exceed', indeed: 'indeed',
};

/**
 * A doubled consonant before a dropped ending is spelling, not meaning:
 * `running` -> `runn` -> `run`. Keep `ll`, `ss`, `ff`, which are real endings.
 * Keep a doubled vowel too: `seeing` -> `see`, not `se`.
 */
function undouble(word: string): string {
  const last = word.slice(-1);
  const before = word.slice(-2, -1);
  if (last !== before) return word;
  if (last === 'l' || last === 's' || last === 'f') return word;
  if ('aeiou'.includes(last)) return word;
  return word.slice(0, -1);
}

/**
 * Reduce a word to a comparable stem. Plurals and simple verb endings only.
 * The same rule runs over the index and over the query, so a rough stem still
 * matches, as long as it is rough in the same way on both sides.
 */
export function stem(word: string): string {
  const irregular = IRREGULAR[word];
  if (irregular) return irregular;
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses') || word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('ss')) return word;
  // `tomatoes` -> `tomato`, `heroes` -> `hero`. A bare `-s` strip would leave
  // `tomatoe`, which never matches the singular.
  if (word.endsWith('oes') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('us') && !word.endsWith('is') && !word.endsWith('ns')) {
    return word.slice(0, -1);
  }
  if (word.endsWith('ns') && word.endsWith('ens')) return word.slice(0, -1);
  if (word.endsWith('ing') && word.length > 5) return undouble(word.slice(0, -3));
  if (word.endsWith('ed') && word.length > 5) return undouble(word.slice(0, -2));
  return word;
}

/**
 * Fold accents to plain letters, so `café` reads as `cafe`. Without this the
 * punctuation rule below cuts the word into pieces.
 */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Split text into lowercase terms: no punctuation, no stopwords, stemmed. */
export function terms(text: string): string[] {
  return fold(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word !== '' && !STOPWORDS.has(word))
    .map(stem);
}

/** A whole phrase reduced to one comparable key, for exact alias lookup. */
export function aliasKey(text: string): string {
  return terms(text).join(' ');
}

/**
 * The query reduced to its words, without stemming. Two phrases that share a
 * stem, such as `spin` and `spinning`, still differ here, so an exact word
 * match can outrank a stem match.
 */
export function rawKey(text: string): string {
  return fold(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((word) => word !== '' && !STOPWORDS.has(word))
    .join(' ');
}
