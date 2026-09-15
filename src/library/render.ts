// Turn a library entry (plus caller overrides) into a CSS class name and the
// inline custom-property overrides `styles/animate.css` reads.
import type { AnimationDefaults, AnimationEntry } from './types.js';

export type RenderOptions = AnimationDefaults;

export type RenderedAnimation = {
  /** The `sa-` class to add to the element. */
  className: string;
  /** Inline `--sa-*` custom properties to set, caller options winning over the entry's own defaults. */
  style: Record<string, string>;
};

const PROPERTY_NAMES: Record<keyof AnimationDefaults, string> = {
  duration: '--sa-duration',
  delay: '--sa-delay',
  timing: '--sa-timing',
  repeat: '--sa-repeat',
  distance: '--sa-distance',
};

/**
 * Build the class name and custom-property overrides for an entry. Entry
 * defaults apply first; explicit `options` win over them.
 */
export function renderAnimation(entry: AnimationEntry, options: RenderOptions = {}): RenderedAnimation {
  const merged: AnimationDefaults = { ...entry.defaults, ...options };
  const style: Record<string, string> = {};
  for (const key of Object.keys(PROPERTY_NAMES) as (keyof AnimationDefaults)[]) {
    const value = merged[key];
    if (value === undefined) continue;
    style[PROPERTY_NAMES[key]] = String(value);
  }
  return { className: `sa-${entry.name}`, style };
}
