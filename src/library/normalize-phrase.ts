// The cache/uniqueness key rule: collapse whitespace and case so two phrases
// that differ only in spacing or capitalization count as the same phrase.
export function normalizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, ' ');
}
