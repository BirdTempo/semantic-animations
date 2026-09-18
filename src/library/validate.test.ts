import { describe, expect, it } from 'vitest';
import { checkEntry, checkLibrary } from './validate.js';
import type { AnimationEntry } from './types.js';

function goodEntry(overrides: Partial<AnimationEntry> = {}): AnimationEntry {
  return {
    name: 'fade-in',
    phrase: 'fade in',
    category: 'entrance',
    concept: 'Opacity climbs from nothing to fully visible, with no movement.',
    keywords: ['appear', 'show up', 'materialize', 'reveal'],
    ...overrides,
  };
}

describe('checkEntry', () => {
  it('accepts a well-formed entry', () => {
    expect(checkEntry(goodEntry())).toEqual([]);
  });

  it('rejects a name that is not kebab-case', () => {
    expect(checkEntry(goodEntry({ name: 'FadeIn' }))).toContain('name "FadeIn" is not kebab-case');
  });

  it('rejects a category that is not one of the six', () => {
    const problems = checkEntry(goodEntry({ category: 'vibes' }));
    expect(problems.some((p) => p.includes('is not one of'))).toBe(true);
  });

  it('rejects a concept that is too short', () => {
    expect(checkEntry(goodEntry({ concept: 'Too short.' }))).toContain(
      'concept is too short to explain the motion and when to use it',
    );
  });

  it('rejects too few keywords', () => {
    const problems = checkEntry(goodEntry({ keywords: ['appear'] }));
    expect(problems.some((p) => p.includes('at least 4 are required'))).toBe(true);
  });

  it('rejects duplicate keywords', () => {
    expect(checkEntry(goodEntry({ keywords: ['appear', 'show up', 'appear', 'reveal'] }))).toContain('keywords repeat');
  });

  it('rejects an invalid defaults.duration', () => {
    const problems = checkEntry(goodEntry({ defaults: { duration: 'fast' } }));
    expect(problems.some((p) => p.includes('is not a CSS time'))).toBe(true);
  });

  it('accepts a valid defaults block', () => {
    expect(checkEntry(goodEntry({ defaults: { duration: '0.4s', repeat: 1, distance: '20px' } }))).toEqual([]);
  });

  it('rejects an invalid defaults.repeat', () => {
    const problems = checkEntry(goodEntry({ defaults: { repeat: 0 } }));
    expect(problems.some((p) => p.includes('defaults.repeat'))).toBe(true);
  });
});

describe('checkLibrary', () => {
  it('flags a duplicate name', () => {
    const problems = checkLibrary([goodEntry(), goodEntry()]);
    const flat = [...problems.values()].flat();
    expect(flat.some((p) => p.includes('duplicate name'))).toBe(true);
  });

  it('flags a duplicate phrase even with different spacing', () => {
    const problems = checkLibrary([
      goodEntry({ name: 'fade-in' }),
      goodEntry({ name: 'pop-in', phrase: 'Fade   In' }),
    ]);
    const flat = [...problems.values()].flat();
    expect(flat.some((p) => p.includes('duplicate phrase'))).toBe(true);
  });
});
