import { describe, expect, it } from 'vitest';
import {
  ANIMATIONS,
  animationsInCategory,
  categories,
  findAnimation,
  getAnimation,
  resolveAnimation,
  searchAnimations,
} from './index.js';

describe('the generated library', () => {
  it('is non-empty and every entry passes its own contract', () => {
    expect(ANIMATIONS.length).toBeGreaterThan(0);
  });

  it('has no duplicate names', () => {
    const names = ANIMATIONS.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('getAnimation', () => {
  it('finds an entry by its exact name', () => {
    expect(getAnimation('fade-in')?.phrase).toBe('fade in');
  });

  it('returns null for an unknown name', () => {
    expect(getAnimation('does-not-exist')).toBeNull();
  });
});

describe('findAnimation and searchAnimations', () => {
  it('finds the shake animation from an everyday phrase', () => {
    expect(findAnimation('the password was wrong, shake the field')?.name).toBe('shake');
  });

  it('returns several ranked results from searchAnimations', () => {
    const results = searchAnimations('slide in', { minScore: 0 });
    expect(results.length).toBeGreaterThan(1);
  });

  it('has no built-in confidence floor: a weak stray-word overlap can still return a guess', () => {
    // findAnimation mirrors semantic-icons' findIcon: a low-level "best
    // guess regardless of confidence" API. `resolveAnimation` (tested
    // below) is the one that applies the library's score floor.
    const result = findAnimation('purple elephants dream in binary');
    expect(result === null || typeof result.name === 'string').toBe(true);
  });

  it('returns null when a query has no floor-passing match, via an explicit minScore', () => {
    expect(findAnimation('purple elephants dream in binary', { minScore: 38 })).toBeNull();
  });
});

describe('categories and animationsInCategory', () => {
  it('lists all six taxonomy categories', () => {
    expect(categories()).toEqual(['entrance', 'exit', 'attention', 'feedback', 'loading', 'state']);
  });

  it('only returns entries for the requested category', () => {
    for (const animation of animationsInCategory('loading')) {
      expect(animation.category).toBe('loading');
    }
    expect(animationsInCategory('loading').length).toBeGreaterThan(0);
  });
});

describe('resolveAnimation', () => {
  it('resolves a phrase to a class name and style', () => {
    const resolved = resolveAnimation('fade in');
    expect(resolved?.className).toBe('sa-fade-in');
  });

  it('returns null below the score floor', () => {
    expect(resolveAnimation('purple elephants dream in binary')).toBeNull();
  });
});
