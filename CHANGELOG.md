# Changelog

Grouped by package. Every entry says what changed for a consumer.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the packages are versioned independently — see `VERSIONING.md`.

## Unreleased

Nothing yet.

## 0.1.0 — 2026-09-03

The first cut of Cordly's shared frontend foundations, published to the public
npm registry under the `@cordly` scope with provenance.

### `@cordly/tokens` 0.1.0

**Added**

- Semantic colour, spacing, radius, typography, elevation, breakpoint, focus,
  sizing, layer, and motion tokens as CSS custom properties, prefixed
  `--cordly-`.
- Complete dark and light themes. Dark carries `:root`; an explicit
  `data-cordly-theme` wins over the system preference in both directions.
- `@cordly/tokens/css` for any framework or none, and an optional
  `@cordly/tokens/css/tailwind` bridge for Tailwind v4 namespaces.
- `@cordly/tokens/tokens.json` with every colour resolved to sRGB and the
  measured contrast ratio of every pair the system promises.
- A typed entry point exposing `tokenNames`, `cssVar`, `themes`,
  `themeAttribute`, and `minimumContrastRatio`.

**Guaranteed by the build**

- 132 contrast pairs meet WCAG 2.2 AA across both themes — 4.5:1 for body text,
  3:1 for control edges and focus rings. A value below its minimum fails the
  build.
- Every colour is inside the sRGB gamut, so none is silently clamped.
- Both themes define the same token set, and no colour has its only definition
  inside a media query.

### `@cordly/ui` 0.1.0

**Added**

- Button, icon button, and link treatments applied to native elements.
- Text field, select field, and switch, each owning the `id`/`for`/
  `aria-describedby` wiring between a label, a description, a hint, and an error.
- Badge, card, status, skeleton, and empty state.
- Avatar with an initials fallback, hidden from assistive technology because it
  sits beside the name it depicts; a broken image falls back to initials rather
  than to the browser's broken-image glyph, since avatar URLs point at a third
  party and expire.
- Separator, decorative by default and `semantic` when the rule genuinely
  divides two regions — a rule announced between every pair of rows in a list is
  noise a sighted reader never notices.
- Dialog and drawer built on the platform's `<dialog>` in modal mode, with focus
  restoration to the trigger and a reported close reason.
- Menu with the full keyboard model, and a tooltip that opens on focus as well as
  hover.
- A toast region and `CordlyToasts`, announcing through one persistent polite
  live region.
- `CordlyReducedMotion` / `injectReducedMotion`, and `cordlyId` for ids stable
  across a server render and its hydration.

### `@cordly/widgets` 0.1.0

**Added**

- `CordlyAppFrame` — skip link, banner, named navigation landmark, focusable
  main, responsive drawer.
- `CordlySideNav`, `CordlyStatRow`, `CordlyEntityTile`, `CordlyCatalogue`,
  `CordlySettingsSection`, `CordlyChangeBar`, `CordlyReviewList`, and
  `CordlyPreferenceGroup`.
- One review model for a manual edit and an assistant proposal alike: before,
  after, origin, status, and risk on every row.

### Repository

- Docker-only quality gate: formatting, lint including a package-boundary rule,
  component file structure, hygiene, token generation and contrast, both
  library builds, unit tests, a generated public API report, packing, and tarball
  content verification.
- Browser, mobile, and server-rendering gates against two fixture consumers that
  install the packed tarballs, plus a compatibility harness that compiles every
  public export at the floor of the declared peer range.
