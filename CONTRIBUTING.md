# Contributing

## Before adding anything

Two questions, in order.

**Does a real consumer need it?** This repository is a shared foundation, not a
component catalogue. A primitive with no caller has no feedback: its API is a
guess, its accessibility is untested against real content, and removing it later
is a breaking change. Build it in the application first; move it here when a
second surface needs the same thing.

**Can its public API be explained without naming an application concept?** Say it
out loud without using a route, a backend endpoint, a Discord object, or a Cordly
permission. If you cannot, the application owns it and composes primitives
locally. That sentence is the boundary, and it is the one thing review should be
strict about.

## Adding a component

1. Decide the package. `@cordly/ui` owns raw controls and single-purpose
   primitives; `@cordly/widgets` composes them into domain-neutral structures.
2. Create four files: `name.ts`, `name.html`, `name.scss`, `name.spec.ts`. A
   directive gets two — Angular directives carry no styles, so an empty
   stylesheet beside one would be a file that lies.
3. Standalone, `OnPush`, signal inputs, `inject()`, new control flow.
4. Every visual value is a token. If one is missing, add it to
   `packages/tokens/src/tokens.source.mjs` and run `make tokens-build` — do not
   hard-code the value and do not edit `generated/`.
5. Export it by name from `public-api.ts`. Never `export *`.
6. Run `make api-write` and read the diff. That is the change consumers see.
7. Add it to the fixture that exercises it. `fixtures/browser` walks the
   workflow; `fixtures/ssr` renders every component that produces markup, which
   is how a browser-only API reference is caught.
8. `make verify`, then `make release`.

## What a spec has to cover

Unit tests, in jsdom, are for the wiring: which element is rendered, which
attributes are set, what is announced, what is emitted, and what the component
refuses to do.

Browser tests, in `e2e/`, are for everything jsdom cannot answer — a painted
focus ring, a real focus trap, computed contrast, a 44-pixel target, 200% zoom,
reduced motion, and hydration. If an assertion would pass in jsdom without the
behaviour actually working, it belongs in `e2e/`.

Both are release gates. Neither is optional for a component that ships.

## Writing the component itself

- **No user-visible copy.** Labels, accessible names, and messages are inputs.
- **No formatting.** Counts, plurals, and dates arrive as strings.
- **Colour is never the only signal.** Every tone carries a word, a shape, or
  both.
- **Focus is visible, and the indicator never changes an element's box.**
- **Reduced motion keeps the affordance and loses the movement.** A lift keeps
  its elevation and drops its travel. Collapsing durations alone turns a hover
  into an instant jump, which is the movement the preference exists to remove.
- **An accessible name that can be checked, is.** Several primitives here refuse
  in development when they have none; that is cheaper than finding it in a
  usability session.
- **Say what the component will not do.** A limitation in a doc comment is worth
  more than a subtly wrong implementation of the same thing.

## Changing a token

`packages/tokens/src/tokens.source.mjs` is the only file to edit. Then:

```bash
make tokens-build   # regenerate generated/
make tokens         # the generated files match, and every contrast pair holds
```

Commit the source and the generated output together. The generator refuses a
colour outside the sRGB gamut and refuses a contrast pair below its minimum, in
either theme, so a token that looks fine and reads badly does not reach a
release.

## Reviewing

Beyond the gates, three things worth asking:

- Does this name a role, or an appearance? `surface-raised` survives a palette
  change; `grey-800` has opted out of theming.
- Would a second consumer want this, or is it this page's shape?
- Is the doc comment saying _why_, or restating the code?
