# Animation style guide

The contract every curated `semantic-animations` entry follows. It exists so a
new entry reads like it belongs next to the other 32, and so a reviewer (human
or model) has a checklist rather than a feeling.

## 1. One motion, one CSS class, one library entry

Every entry's `name` is the suffix of exactly one class in
`styles/animate.css` (`slide-in-up` renders `.sa-slide-in-up`). The class
holds the actual `@keyframes`; the library entry only holds the metadata that
makes it findable and the taxonomy it belongs to. Nothing in the JSON encodes
motion — a library entry can never drift from what the CSS actually plays.

`scripts/check-library.ts` enforces this both ways: every class in the
stylesheet needs an entry, and every entry needs a class.

## 2. The six-category taxonomy

| Category | Says | Loops? | Example |
|---|---|---|---|
| `entrance` | An element has arrived | No, once, holds the finished state | `slide-in-up` |
| `exit` | An element is leaving | No, once, holds the finished (hidden) state | `fade-out` |
| `attention` | Look here, without changing what's present | Usually (`shake` is the one exception) | `pulse` |
| `feedback` | An action produced this result | No, once | `success-pop` |
| `loading` | Work is ongoing, with no known end | Yes, always | `spin` |
| `state` | This is how the element rests, ambiently | Yes, always | `float` |

A new animation must fit one category cleanly. If it seems to straddle two,
that is usually a sign it is really two animations (see rule 5).

## 3. Transform and opacity only, with two named exceptions

Every animation composites on the GPU: `transform` and `opacity` only. It
never triggers layout, so it is cheap enough for a whole list to animate at
once.

Two exceptions, and only these two:

- `sa-ring` animates `box-shadow`, to draw an expanding ring. It is written
  for a single small element (a notification dot), never a list.
- `sa-progress-sweep` positions a moving `::after` bar with `transform`, but
  needs `position: relative; overflow: hidden` on its own container.

A new entry that needs a third exception should be reconsidered, not added on
top of these two.

## 4. Color: `currentColor` only, or none at all

`sa-ring` and `sa-glow` read `currentColor` — the element's own `color` — the
same one-property contract `semantic-icons` uses for stroke color. Nothing
in this package assumes or ships a brand color. An animation with an opinion
about color does not belong in the curated set; it belongs in the caller's
own CSS.

## 5. One entry, one distinct visual. Reuse through keywords, not duplicates

`shake` (general attention) and `nope` (a tighter, feedback-specific
double-shake) are allowed to coexist because they render visibly differently
— different amplitude, different timing, different intent. What is not
allowed is two entries with the *same* keyframes and different names, so
that "wrong password" and "form is invalid" can both find an answer: give
`shake` (or whichever entry is the real answer) more keywords instead. The
prose search engine is exactly the tool for many phrasings pointing at one
motion.

## 6. Reduced motion is not optional

Every animation that starts invisible (`sa-fade-in`, the `slide-in-*` family,
`sa-scale-in`, `sa-pop-in`) or ends invisible (the exit family) has a
`prefers-reduced-motion: reduce` rule in `styles/animate.css` that returns it
to its *settled* state — never leaves it stuck at `opacity: 0`. A new
entrance or exit animation must add itself to that block. This is checked by
eye, not by a validator; treat it as load-bearing anyway.

## 7. Metadata rules the validator enforces

`src/library/validate.ts` checks every entry mechanically:

| Field | Rule |
|---|---|
| `name` | kebab-case, and has a matching `.sa-` class |
| `category` | one of the six above, and the name belongs to it |
| `phrase` | non-empty |
| `concept` | at least 20 characters: enough to explain the motion and when to reach for it |
| `keywords` | at least 4, lowercase, trimmed, no duplicates |
| `defaults.duration` / `defaults.delay` | a CSS `<time>` (`0.4s`, `400ms`) |
| `defaults.distance` | a CSS `<length>` (`20px`, `1.5rem`) |
| `defaults.repeat` | a positive integer, or `"infinite"` |

Across the whole library: no duplicate `name`, no duplicate `phrase` (compared
after collapsing whitespace and case), and no CSS class left without an
entry.

## 8. `defaults.repeat: 1` marks a one-shot animation

`playAnimation()` (the `.` entry point) decides whether to wait for
`animationend` by checking the *merged* `repeat` value (the caller's option,
falling back to the entry's own `defaults.repeat`). Every `entrance`, `exit`,
and `feedback` entry, plus `shake`, sets `"defaults": { "repeat": 1 }` so this
is always known from the data — the JS layer never has to parse the CSS to
find out. A new one-shot animation must set this explicitly; forgetting it
means `playAnimation()` treats it as continuous and its promise resolves
immediately, before the animation plays.

## 9. Writing keywords: match the query engine, not your own vocabulary

The search index in `src/library/query.ts` runs every keyword and every
incoming query through the same stemmer (`src/library/normalize.ts`) before
comparing them. Two things follow:

- **Direction and state words matter.** `up`, `down`, `in`, `out`, `on`,
  `off` are kept, deliberately, because an animation library lives or dies
  on them — `slide in from the left` must not index as just `slide`.
- **Write the phrasing a caller would actually type**, not a synonym list.
  "the order went through, celebrate a little" is a better keyword source
  for `success-pop` than a dictionary of synonyms for "success," because
  that is closer to what someone actually searches.

When an entry is missing an everyday phrasing, `scripts/prose-probe.ts` is
the way to find out — not guessing. Run `npm run anim:probe` after adding
keywords and confirm the case now answers correctly, rather than assuming it
does.

## 10. Worked example

```json
{
  "name": "success-pop",
  "phrase": "task completed",
  "category": "feedback",
  "concept": "The element grows briefly past full size and settles, once, and holds. A short celebratory acknowledgment that an action fully succeeded.",
  "defaults": { "repeat": 1 },
  "keywords": [
    "success", "done", "completed", "purchase complete", "order placed",
    "task finished", "checkmark moment", "achievement unlocked",
    "submitted successfully", "added to cart", "well done", "that worked",
    "celebrate", "went through successfully", "we made it"
  ]
}
```

Its class, `.sa-success-pop`, lives in `styles/animate.css` with a matching
comment explaining the motion in CSS terms. Neither file states the whole
idea alone; together they are the contract.
