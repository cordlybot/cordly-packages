# @cordly/tokens

The single visual foundation for every Cordly web surface: semantic colour,
spacing, radius, typography, elevation, breakpoint, focus, and motion values as
CSS custom properties.

Framework neutral. It has no dependencies, no peer dependencies, and no
JavaScript a page has to run — the themes are a stylesheet, so they apply on the
first painted frame of a server-rendered page, before hydration.

## Install

```bash
npm install @cordly/tokens
```

## Use

Import the stylesheet once, at the application's style entry point:

```css
@import '@cordly/tokens/css';
```

Then reference roles rather than values:

```css
.summary {
  padding: var(--cordly-space-md);
  border-radius: var(--cordly-radius-card);
  background-color: var(--cordly-color-surface);
  color: var(--cordly-color-text);
}
```

### Themes

Dark is the default and carries `:root`. Light is complete, not a subset — every
colour is defined in both, so no theme is half-finished.

| Situation                               | What applies                        |
| --------------------------------------- | ----------------------------------- |
| No explicit choice                      | The viewer's `prefers-color-scheme` |
| `data-cordly-theme="light"` on `<html>` | Light, whatever the system says     |
| `data-cordly-theme="dark"` on `<html>`  | Dark, whatever the system says      |

An explicit choice always wins, in both directions. Set the attribute on the
server from whatever the application uses to remember a preference and the first
response is already correct; there is no flash of the wrong theme to correct on
hydration.

### Tailwind

Optional, and a separate entry point so a consumer that does not use Tailwind is
never asked to parse an `@theme` block:

```css
@import '@cordly/tokens/css/tailwind';
```

That binds the tokens to Tailwind v4's namespaces, so `bg-surface`,
`text-text-muted`, `rounded-card`, and `p-md` resolve to `var(--cordly-…)`. A
theme swap stays a variable change rather than a class change.

### Reading the tokens from code

```ts
import { tokenNames, cssVar, themeAttribute } from '@cordly/tokens';
```

`@cordly/tokens/tokens.json` carries the same set with each colour resolved to
sRGB, plus the measured contrast ratio of every pair the system promises.

## What is guaranteed

- **Both themes define the same tokens.** A colour cannot exist in one only.
- **No colour has its only definition inside a media query.**
- **Every promised contrast pair meets WCAG 2.2 AA in both themes** — 4.5:1 for
  body text, 3:1 for control edges and focus rings. The pairs are listed in
  `tokens.json` with their measured ratios, and a value that would fall below
  its minimum fails the build rather than shipping.
- **Every colour is inside the sRGB gamut.** A colour that only reaches its
  stated chroma outside sRGB is not the colour it claims to be, so the generator
  refuses it rather than letting the browser clamp it silently.
- **The motion vocabulary is closed**: four durations named by intent and three
  curves.

## Contributing

Everything under `generated/` is produced from `src/tokens.source.mjs`. Edit the
source, run `npm run tokens:build` from the repository root, and commit both.
`npm run tokens:check` fails when they disagree.

MIT licensed. Part of
[cordly-packages](https://github.com/cordlybot/cordly-packages).
