// The vanilla-JS entry point: apply a curated animation to a DOM element by
// its name or by plain prose, with no build step and no framework.
//
//   import { playAnimation } from 'semantic-animations';
//   import 'semantic-animations/animate.css';
//
//   await playAnimation(toast, 'slide in from below');
//   await playAnimation(button, 'task completed');
//   playAnimation(spinner, 'loading'); // continuous: resolves immediately
import { findAnimation, getAnimation, renderAnimation, searchAnimations, LOCAL_MIN_SCORE } from './library/index.js';
import type { RenderOptions } from './library/render.js';

export { findAnimation, searchAnimations, getAnimation };
export type { AnimationEntry, AnimationMatch } from './library/types.js';
export type { SearchOptions } from './library/query.js';

export type PlayOptions = RenderOptions & {
  /** Drop a phrase match under this score. Defaults to the library's own floor. */
  minScore?: number;
};

const CUSTOM_PROPERTIES = ['--sa-duration', '--sa-delay', '--sa-timing', '--sa-repeat', '--sa-distance'];

/**
 * Apply a curated animation to an element, by its stable name (e.g.
 * `"slide-in-up"`) or by a plain-prose phrase (e.g. `"slide in from below"`).
 * An exact name always wins over prose search.
 *
 * The returned promise resolves once the animation finishes, for a one-shot
 * animation (an entrance, an exit, or a feedback cue). A continuous
 * animation (attention, loading, or an idle state) has no natural end, so
 * the promise resolves as soon as the class is applied; call
 * `stopAnimation(el)` when it should stop.
 *
 * Rejects if no animation in the library matches closely enough.
 */
export function playAnimation(el: Element, nameOrPhrase: string, options: PlayOptions = {}): Promise<void> {
  const { minScore = LOCAL_MIN_SCORE, ...renderOptions } = options;
  const entry = getAnimation(nameOrPhrase) ?? findAnimation(nameOrPhrase, { minScore });
  if (entry === null) {
    return Promise.reject(new Error(`semantic-animations: no animation matches "${nameOrPhrase}"`));
  }

  const { className, style } = renderAnimation(entry, renderOptions);
  el.classList.add(className);
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    for (const [property, value] of Object.entries(style)) el.style.setProperty(property, value);
  }

  const mergedRepeat = renderOptions.repeat ?? entry.defaults?.repeat;
  const oneShot = mergedRepeat === 1 || mergedRepeat === '1';
  if (!oneShot) return Promise.resolve();

  return new Promise<void>((resolveDone) => {
    const done = (): void => {
      el.removeEventListener('animationend', done);
      el.removeEventListener('animationcancel', done);
      resolveDone();
    };
    el.addEventListener('animationend', done, { once: true });
    el.addEventListener('animationcancel', done, { once: true });
  });
}

/** Remove every `sa-*` class and custom-property override from an element. */
export function stopAnimation(el: Element): void {
  for (const cls of [...el.classList]) {
    if (cls.startsWith('sa-')) el.classList.remove(cls);
  }
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    for (const property of CUSTOM_PROPERTIES) el.style.removeProperty(property);
  }
}
