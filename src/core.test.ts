import { describe, expect, it } from 'vitest';
import { playAnimation, stopAnimation } from './core.js';

describe('playAnimation', () => {
  it('applies the class and style for an exact name match', () => {
    const el = document.createElement('div');
    void playAnimation(el, 'slide-in-up', { duration: '2s' });
    expect(el.classList.contains('sa-slide-in-up')).toBe(true);
    expect(el.style.getPropertyValue('--sa-duration')).toBe('2s');
  });

  it('resolves a phrase to the right entry', () => {
    const el = document.createElement('div');
    void playAnimation(el, 'fade in');
    expect(el.classList.contains('sa-fade-in')).toBe(true);
  });

  it('resolves once a one-shot animation reports animationend', async () => {
    const el = document.createElement('div');
    const done = playAnimation(el, 'fade-in');
    let settled = false;
    done.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    el.dispatchEvent(new Event('animationend'));
    await done;
    expect(settled).toBe(true);
  });

  it('resolves a continuous animation immediately, with no event required', async () => {
    const el = document.createElement('div');
    await expect(playAnimation(el, 'spin')).resolves.toBeUndefined();
  });

  it('rejects when nothing in the library matches', async () => {
    const el = document.createElement('div');
    await expect(playAnimation(el, 'purple elephants dream in binary')).rejects.toThrow();
  });

  it('lets an explicit repeat option override a continuous entry into one-shot', async () => {
    const el = document.createElement('div');
    const done = playAnimation(el, 'spin', { repeat: 1 });
    let settled = false;
    done.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    el.dispatchEvent(new Event('animationend'));
    await done;
    expect(settled).toBe(true);
  });
});

describe('stopAnimation', () => {
  it('removes every sa- class and custom property', () => {
    const el = document.createElement('div');
    el.classList.add('sa-pulse', 'sa-glow', 'unrelated');
    el.style.setProperty('--sa-duration', '2s');
    stopAnimation(el);
    expect(el.classList.contains('sa-pulse')).toBe(false);
    expect(el.classList.contains('sa-glow')).toBe(false);
    expect(el.classList.contains('unrelated')).toBe(true);
    expect(el.style.getPropertyValue('--sa-duration')).toBe('');
  });
});
