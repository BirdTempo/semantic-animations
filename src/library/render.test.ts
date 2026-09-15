import { describe, expect, it } from 'vitest';
import { renderAnimation } from './render.js';
import type { AnimationEntry } from './types.js';

const ENTRY: AnimationEntry = {
  name: 'slide-in-up',
  phrase: 'slide in from below',
  category: 'entrance',
  concept: 'Rises up into place from just below its resting position.',
  keywords: ['enter from bottom', 'rise up', 'toast entrance'],
  defaults: { repeat: 1 },
};

describe('renderAnimation', () => {
  it('derives the class name from the entry name', () => {
    expect(renderAnimation(ENTRY).className).toBe('sa-slide-in-up');
  });

  it('carries the entry defaults into style', () => {
    expect(renderAnimation(ENTRY).style).toEqual({ '--sa-repeat': '1' });
  });

  it('lets explicit options override entry defaults', () => {
    const { style } = renderAnimation(ENTRY, { repeat: 'infinite', duration: '2s' });
    expect(style).toEqual({ '--sa-repeat': 'infinite', '--sa-duration': '2s' });
  });

  it('emits no style properties when nothing is set', () => {
    const bare: AnimationEntry = { ...ENTRY, defaults: undefined };
    expect(renderAnimation(bare).style).toEqual({});
  });

  it('sets every supported custom property', () => {
    const { style } = renderAnimation(ENTRY, {
      duration: '1s',
      delay: '0.2s',
      timing: 'ease-out',
      repeat: 2,
      distance: '32px',
    });
    expect(style).toEqual({
      '--sa-duration': '1s',
      '--sa-delay': '0.2s',
      '--sa-timing': 'ease-out',
      '--sa-repeat': '2',
      '--sa-distance': '32px',
    });
  });
});
