// The optional React binding. `react` is a peer dependency; nothing in the
// rest of the package needs it.
//
//   import { useSemanticAnimation } from 'semantic-animations/web';
//
//   const ref = useRef<HTMLButtonElement>(null);
//   useSemanticAnimation(ref, 'task completed', saveCount);
//   return <button ref={ref}>Save</button>;
import { useEffect, useRef, type RefObject } from 'react';
import { playAnimation, type PlayOptions } from './core.js';

export type UseSemanticAnimationOptions = PlayOptions;

/**
 * Play a curated animation, by name or by plain-prose phrase, on a ref'd
 * element whenever `trigger` changes (including on mount). A trigger that
 * only changes on the event you care about — a save counter, a toggled
 * boolean, a message id — is the usual choice.
 */
export function useSemanticAnimation<T extends Element>(
  ref: RefObject<T | null>,
  nameOrPhrase: string,
  trigger: unknown,
  options?: UseSemanticAnimationOptions,
): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    playAnimation(el, nameOrPhrase, optionsRef.current).catch(() => {
      // A typo'd name or phrase is a caller bug; surfacing it as an
      // unhandled rejection inside an effect would crash rendering for a
      // cosmetic feature, so it is logged instead.
      console.error(`semantic-animations: could not play "${nameOrPhrase}"`);
    });
    // `ref` is stable across renders and `optionsRef` is read through a ref,
    // so the effect only needs to re-run when the trigger or phrase changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, nameOrPhrase]);
}
