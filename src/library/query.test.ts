import { describe, expect, it } from 'vitest';
import { createAnimationIndex, searchIndex, bestMatch } from './query.js';
import type { AnimationEntry } from './types.js';

const ENTRIES: AnimationEntry[] = [
  {
    name: 'fade-in',
    phrase: 'fade in',
    category: 'entrance',
    concept: 'Opacity climbs to fully visible.',
    keywords: ['appear', 'show up', 'become visible'],
  },
  {
    name: 'shake',
    phrase: 'shake',
    category: 'attention',
    concept: 'A quick side-to-side rattle.',
    keywords: ['wrong password', 'invalid input', 'error', 'try again'],
  },
  {
    name: 'slide-in-left',
    phrase: 'slide in from the left',
    category: 'entrance',
    concept: 'Travels in from the left edge.',
    keywords: ['enter from the left', 'left drawer open', 'panel slides in'],
  },
];

describe('searchIndex', () => {
  it('ranks an exact phrase match first', () => {
    const index = createAnimationIndex(ENTRIES);
    const [top] = searchIndex(index, 'fade in');
    expect(top?.animation.name).toBe('fade-in');
  });

  it('ranks a single-word exact name match to that entry', () => {
    const index = createAnimationIndex(ENTRIES);
    const [top] = searchIndex(index, 'shake');
    expect(top?.animation.name).toBe('shake');
  });

  it('finds a keyword hit inside a longer sentence', () => {
    const index = createAnimationIndex(ENTRIES);
    const [top] = searchIndex(index, 'the form said the password was wrong, try again');
    expect(top?.animation.name).toBe('shake');
  });

  it('gives an animation that covers every query term a higher score than one that covers only one', () => {
    const index = createAnimationIndex(ENTRIES);
    const results = searchIndex(index, 'slide in from the left', { minScore: 0 });
    const left = results.find((r) => r.animation.name === 'slide-in-left');
    const fade = results.find((r) => r.animation.name === 'fade-in');
    expect(left).toBeDefined();
    expect(fade === undefined || left!.score > fade.score).toBe(true);
  });

  it('returns nothing for an empty query', () => {
    const index = createAnimationIndex(ENTRIES);
    expect(searchIndex(index, '   ')).toEqual([]);
  });

  it('drops results under minScore', () => {
    const index = createAnimationIndex(ENTRIES);
    const results = searchIndex(index, 'completely unrelated gibberish query text', { minScore: 1000 });
    expect(results).toEqual([]);
  });
});

describe('bestMatch', () => {
  it('returns the single top animation', () => {
    const index = createAnimationIndex(ENTRIES);
    expect(bestMatch(index, 'fade in')?.name).toBe('fade-in');
  });

  it('returns null when nothing matches', () => {
    const index = createAnimationIndex(ENTRIES);
    expect(bestMatch(index, 'completely unrelated gibberish', { minScore: 1000 })).toBeNull();
  });
});
