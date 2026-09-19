# semantic-animations

<!-- TODO: replace TODO below with the real Buy Me a Coffee username -->
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/TODO)

A curated set of 1033 CSS/JS UI animations you can find with plain prose.
Search runs in your page, with no request and no key.

```js
import { playAnimation } from 'semantic-animations';
import 'semantic-animations/animate.css';

await playAnimation(toast, 'slide in from below');
await playAnimation(saveButton, 'task completed');
playAnimation(spinner, 'loading'); // continuous — resolves immediately
```

`semantic-animations` is [semantic-icons](https://semanticicons.com)'
sibling project, built the same way: a fixed, hand-curated set, a lexical
prose search engine that runs entirely in the browser, and no network call,
API key, or backend of any kind. If you know how one works, you know how the
other works.

## Why prose instead of class names

CSS animation libraries usually make you remember a name:
`animate__bounceInDown`, `fadeInUp`, `tada`. `semantic-animations` lets you
say what you mean instead, and finds the closest curated animation:

```js
findAnimation('the order went through, celebrate a little'); // success-pop
findAnimation('tell them that action is not allowed');        // nope
findAnimation('show that someone is typing');                 // dots-bounce
```

The exact class name still works — `playAnimation(el, 'success-pop')` is the
same call — prose search is there for when you'd rather describe the moment
than memorize the catalog.

## Install

```sh
npm install semantic-animations
```

Zero required dependencies. React is an optional peer dependency, only
needed if you import `semantic-animations/web`.

## Three ways to use it

### 1. CSS only, no JS

Every animation is a plain CSS class. Skip the JS package entirely if you
just want the stylesheet:

```html
<link rel="stylesheet" href="node_modules/semantic-animations/styles/animate.css" />
<div class="sa-fade-in">Welcome</div>
<button class="sa-pulse">Notice me</button>
```

Tune any animation with CSS custom properties, on the element or on a parent:

```html
<div class="sa-slide-in-up" style="--sa-duration: 600ms; --sa-distance: 32px">
  A toast that travels further and takes longer
</div>
```

| Property | Controls | Default |
|---|---|---|
| `--sa-duration` | how long one run takes | varies by animation |
| `--sa-delay` | wait before the first run | `0s` |
| `--sa-timing` | the easing curve | varies by animation |
| `--sa-repeat` | how many runs, or `infinite` | varies by animation |
| `--sa-distance` | travel distance for `slide-*` | `20px` |

### 2. Vanilla JS: find it, play it, know when it's done

```js
import { playAnimation, stopAnimation } from 'semantic-animations';
import 'semantic-animations/animate.css';

// One-shot animations (entrance, exit, feedback) return a promise that
// resolves when the animation finishes.
await playAnimation(toast, 'slide in from below');
toast.remove();

// Continuous animations (attention, loading, state) have no natural end —
// the promise resolves as soon as the class is applied.
playAnimation(spinner, 'loading');
// ...later, once the request finishes:
stopAnimation(spinner);
```

`playAnimation` accepts either the animation's stable name (`'shake'`) or a
plain-prose phrase (`'the password was wrong'`) — an exact name always wins
over prose search. It rejects if nothing in the library matches closely
enough, so a typo fails loudly rather than silently doing nothing.

### 3. React

```jsx
import { useRef } from 'react';
import { useSemanticAnimation } from 'semantic-animations/web';
import 'semantic-animations/animate.css';

function SaveButton({ onSave }) {
  const ref = useRef(null);
  const [saveCount, setSaveCount] = useState(0);
  useSemanticAnimation(ref, 'task completed', saveCount);

  return (
    <button
      ref={ref}
      onClick={() => {
        onSave();
        setSaveCount((n) => n + 1);
      }}
    >
      Save
    </button>
  );
}
```

`useSemanticAnimation(ref, nameOrPhrase, trigger, options?)` replays the
animation whenever `trigger` changes — a save counter, a toggled boolean, a
message id. `react` is a peer dependency, not a hard one; nothing else in
the package imports it.

## The catalog

Search it live at the [gallery site](./site/index.html), or browse the six
categories below. Every phrase here is one you can pass straight to
`playAnimation` or `findAnimation` — this is a sample of each entry's
keywords, not the full list.

### entrance — an element has arrived (once, holds)

| Name | Try asking for |
|---|---|
| `fade-in` | "fade in", "appear", "show up" |
| `slide-in-up` | "slide in from below", "toast entrance" |
| `slide-in-down` | "slide in from above", "dropdown open" |
| `slide-in-left` | "slide in from the left", "left drawer open" |
| `slide-in-right` | "slide in from the right", "right sidebar open" |
| `scale-in` | "scale in", "dialog open", "modal appear" |
| `pop-in` | "pop in with a bounce", "badge appears" |

### exit — an element is leaving (once, holds)

| Name | Try asking for |
|---|---|
| `fade-out` | "fade out", "dismiss", "vanish" |
| `slide-out-up` | "slide out upward", "archive off the top" |
| `slide-out-down` | "slide out downward", "banner retracts" |
| `slide-out-left` | "slide out to the left", "swipe left to dismiss" |
| `slide-out-right` | "slide out to the right", "swipe right to dismiss" |
| `scale-out` | "scale out", "dialog close", "modal dismiss" |

### attention — look here (loops, except `shake`)

| Name | Try asking for |
|---|---|
| `pulse` | "pulse", "gentle pulse", "live indicator" |
| `beat` | "beat like a heart", "like button" |
| `flash` | "flash", "blink", "recording indicator" |
| `wobble` | "ring like a notification", "notification bell shake" |
| `shake` | "shake", "wrong password", "invalid input" |
| `jiggle` | "jiggle", "wiggle", "edit mode icons" |
| `ring` | "ring like a notification", "sonar", "online indicator" |

### feedback — the result of an action (once)

| Name | Try asking for |
|---|---|
| `success-pop` | "task completed", "purchase complete" |
| `nope` | "that's not allowed", "access denied" |
| `saved-flash` | "saved", "autosave", "copied to clipboard" |

### loading — ongoing, indeterminate work (always loops)

| Name | Try asking for |
|---|---|
| `spin` | "spin", "loading", "processing" |
| `spin-reverse` | "spin the other way", "counter-rotate" |
| `shimmer` | "loading skeleton", "placeholder loading" |
| `dots-bounce` | "typing indicator", "someone is typing" |
| `progress-sweep` | "progress unknown", "indeterminate progress bar" |

### state — an ambient idle state (always loops)

| Name | Try asking for |
|---|---|
| `float` | "float gently", "empty state illustration" |
| `breathe` | "breathe", "idle state", "waiting quietly" |
| `sway` | "sway gently", "hanging sign" |
| `glow` | "glow", "highlighted", "lit up" |
| `nudge` | "look here", "onboarding hint", "new feature" |

## API reference

```ts
// semantic-animations
function playAnimation(el: Element, nameOrPhrase: string, options?: PlayOptions): Promise<void>;
function stopAnimation(el: Element): void;
function findAnimation(query: string, options?: SearchOptions): AnimationEntry | null;
function searchAnimations(query: string, options?: SearchOptions): AnimationMatch[];

// semantic-animations/web
function useSemanticAnimation<T extends Element>(
  ref: RefObject<T | null>,
  nameOrPhrase: string,
  trigger: unknown,
  options?: PlayOptions,
): void;

// semantic-animations/library
const ANIMATIONS: AnimationEntry[];
function findAnimation(query: string, options?: SearchOptions): AnimationEntry | null;
function searchAnimations(query: string, options?: SearchOptions): AnimationMatch[];
function getAnimation(name: string): AnimationEntry | null;
function resolveAnimation(phrase: string, options?): { className: string; style: Record<string, string> } | null;
function categories(): string[];
function animationsInCategory(category: string): AnimationEntry[];
```

`PlayOptions` accepts `duration`, `delay`, `timing`, `repeat`, and
`distance` — the same names as the CSS custom properties, without the
`--sa-` prefix — plus `minScore` to require a stronger prose match.

`findAnimation` (both entry points) has no built-in confidence floor: it
returns its single best guess, even a weak one. `playAnimation` and
`resolveAnimation` apply the library's own score floor by default, so a
phrase with no good answer fails rather than guessing.

## Accessibility

Every animation in `styles/animate.css` is disabled under
`prefers-reduced-motion: reduce` — and every entrance or exit animation that
starts or ends invisible is explicitly returned to its settled, visible
state in that same rule. Turning motion off never leaves an element stuck
invisible.

## How the library is built

`src/library/animations/*.json` is the source of truth — one file per
category, one hand-written entry per animation. Nothing here is generated by
a model; each entry's `concept` and `keywords` are authored to match what
its CSS class actually does.

```sh
npm run anim:build   # assemble animations.generated.ts from the JSON, validating every entry
npm run anim:check   # cross-check styles/animate.css against the library, both directions
npm run anim:probe   # run the labelled prose-retrieval probe (docs/animation-style-guide.md § 9)
npm run build         # bundle src/core.ts, src/web.ts, src/library/index.ts with tsup
npm run test           # vitest
npm run typecheck       # tsc --noEmit
```

See [`docs/animation-style-guide.md`](./docs/animation-style-guide.md) for
the full contract a new entry has to meet: the taxonomy, the
transform/opacity-only rule, the reduced-motion rule, and how to write
keywords the search engine can actually use.

## License

MIT © BirdTempo

<!-- TODO: replace TODO below with the real Buy Me a Coffee username -->
If this saved you time, [buy me a coffee](https://www.buymeacoffee.com/TODO).
