// The closed set of animation names `styles/animate.css` defines a class
// for, grouped by category. This is the whitelist a library entry's `name`
// and `category` must agree with: `scripts/check-library.ts` also parses
// the CSS file directly and fails the build if the two ever drift apart.
export const CATEGORIES = ['entrance', 'exit', 'attention', 'feedback', 'loading', 'state'] as const;
export type Category = (typeof CATEGORIES)[number];

export const NAMES_BY_CATEGORY: Record<Category, string[]> = {
  entrance: ['fade-in', 'slide-in-up', 'slide-in-down', 'slide-in-left', 'slide-in-right', 'scale-in', 'pop-in'],
  exit: ['fade-out', 'slide-out-up', 'slide-out-down', 'slide-out-left', 'slide-out-right', 'scale-out'],
  attention: ['pulse', 'beat', 'flash', 'wobble', 'shake', 'jiggle', 'ring'],
  feedback: ['success-pop', 'nope', 'saved-flash'],
  loading: ['spin', 'spin-reverse', 'shimmer', 'dots-bounce', 'progress-sweep'],
  state: ['float', 'breathe', 'sway', 'glow', 'nudge'],
};

export const KNOWN_NAMES = new Set(Object.values(NAMES_BY_CATEGORY).flat());
