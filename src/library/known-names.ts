// The closed, six-way taxonomy every entry's `category` must be one of.
//
// There is deliberately no static per-name whitelist here: at catalog
// scale, hand-maintaining a list of every valid `name` in lockstep with
// styles/animate/*.css would be exactly the kind of duplication that
// drifts. `scripts/check-library.ts` is the authoritative check instead —
// it parses the built CSS directly and cross-checks it against the built
// library, both directions, after every build.
export const CATEGORIES = ['entrance', 'exit', 'attention', 'feedback', 'loading', 'state'] as const;
export type Category = (typeof CATEGORIES)[number];
