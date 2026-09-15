// The shape of one animation in the curated library.
//
// `name` doubles as the CSS class suffix: the entry named `slide-in-up`
// renders as class `sa-slide-in-up`, defined once in `styles/animate.css`.
// A library entry never carries its own keyframes — it points at one.
export type AnimationEntry = {
  /** Unique kebab-case id. Also the suffix of its `sa-` CSS class. */
  name: string;
  /** Canonical human phrase for the animation, for example "task completed". */
  phrase: string;
  /** One of the six taxonomy families: entrance, exit, attention, feedback, loading, state. */
  category: string;
  /** One or two sentences: what the motion says and when to reach for it. */
  concept: string;
  /** Synonyms, related words, and prose terms that must resolve here. */
  keywords: string[];
  /** Default custom-property overrides for this animation, e.g. a longer duration. */
  defaults?: AnimationDefaults;
};

/** Overrides for the `--sa-*` custom properties `styles/animate.css` reads. */
export type AnimationDefaults = {
  duration?: string;
  delay?: string;
  timing?: string;
  repeat?: string | number;
  distance?: string;
};

/** One search result. `score` is higher for a better match. */
export type AnimationMatch = {
  animation: AnimationEntry;
  score: number;
  /**
   * What matched this animation: single stemmed query terms, and whole
   * aliases such as `slide in` when the phrase sits inside the prose.
   */
  matched: string[];
};
