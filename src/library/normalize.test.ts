import { describe, expect, it } from 'vitest';
import { stem, terms, aliasKey, rawKey } from './normalize.js';

describe('stem', () => {
  it('strips regular plurals', () => {
    expect(stem('dots')).toBe('dot');
    expect(stem('classes')).toBe('class');
  });

  it('handles -oes and -ies plurals without leaving a trailing e', () => {
    expect(stem('heroes')).toBe('hero');
    expect(stem('parties')).toBe('party');
  });

  it('strips -ing and -ed, undoubling a doubled consonant', () => {
    expect(stem('spinning')).toBe('spin');
    expect(stem('jumped')).toBe('jump');
    expect(stem('running')).toBe('run');
  });

  it('keeps a doubled vowel intact', () => {
    expect(stem('seeing')).toBe('see');
  });

  it('leaves short words alone', () => {
    expect(stem('up')).toBe('up');
    expect(stem('in')).toBe('in');
  });

  it('uses the irregular table for words the rules would get wrong', () => {
    expect(stem('children')).toBe('child');
  });

  it('does not strip -s from words ending in -us or -is', () => {
    expect(stem('focus')).toBe('focus');
    expect(stem('basis')).toBe('basis');
  });
});

describe('terms', () => {
  it('drops stopwords but keeps direction words', () => {
    expect(terms('slide it in from the left')).toEqual(['slide', 'in', 'from', 'left']);
  });

  it('folds accents and strips punctuation', () => {
    expect(terms('café style!')).toEqual(['cafe', 'style']);
  });

  it('returns an empty list for a query of only stopwords', () => {
    expect(terms('the a an')).toEqual([]);
  });
});

describe('aliasKey and rawKey', () => {
  it('aliasKey stems, rawKey does not', () => {
    expect(aliasKey('sliding panels')).toBe('slid panel');
    expect(rawKey('sliding panels')).toBe('sliding panels');
  });

  it('collapses to the same key regardless of extra whitespace', () => {
    expect(aliasKey('  slide   in ')).toBe(aliasKey('slide in'));
  });
});
