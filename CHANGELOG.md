# Changelog

Grouped by package. Every entry says what changed for a consumer.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the packages are versioned independently — see `VERSIONING.md`.

## Unreleased

### `@cordly/ui` 0.2.0

**Added**

- `CordlyStatusDot` — a coloured dot beside a word, where the word is required.
  A dot alone encodes its meaning entirely in hue: unreadable with a
  colour-vision deficiency, gone in forced-colours mode, and absent from a
  screen reader. `hideLabel` takes the label off the screen and leaves it in the
  accessibility tree; it does not remove it.
- `CordlyErrorState` — something failed where content should have been.
  Deliberately not the same component as `CordlyEmptyState`: nothing-yet is
  normal and says nothing, something-failed is not and announces itself with
  `role="alert"`. It refuses in development without a recovery action, and keeps
  the technical remainder in a separate `detail` input so a stack trace cannot
  land where the plain-language explanation belongs.

**Fixed**

- A dialog's title bar was a `<header>` and its actions a `<footer>`. A
  `<header>` whose nearest sectioning ancestor is the body maps to the `banner`
  landmark, and `<dialog>` is not sectioning content — so every page containing
  a dialog had two banners and two contentinfos. Both are plain elements now.
  Found by a consumer's landmark test, not by review.

**Changed**

- `CordlyTone` gains `accent`. Four of the tones are status and answer "how is
  this going?"; `accent` is emphasis and answers "is this the one to look at?".
  They share a slot on a component, so they share a union — and the
  documentation keeps them apart, because a badge using `accent` to mean
  "healthy" has said nothing.
- `CordlyEmptyState` gains a `body` input. The sibling `CordlyErrorState`
  already had one, and two components in the same union of states should not
  need to be called differently. The asymmetry was in this package.
- `CordlyTextField` gains `hideLabel`, for a control whose purpose its
  surroundings already give — a toolbar search box. It hides the label and never
  removes it, because `aria-label` on a bare input is how a field ends up with a
  name nobody can see.
- `CordlySkeleton` with `shape="block"` now fills the box the caller gave it.
  Holding the right space is the whole advantage of a skeleton over a spinner,
  and a component that picks its own height throws it away.
- `CordlyConfirm` and `CordlyConfirmDialog` — ask before something hard to undo.
  Imperative on purpose: a confirmation belongs to the action rather than the
  page, because the same sign-out runs from a header menu and an account page,
  and making each own a dialog and a boolean is how one of them forgets to ask.
  Every label is required; a generic "OK" does the most damage exactly here.
- `CordlyDialog` gains `alert`, setting `role="alertdialog"` so a question is
  announced immediately rather than waiting to be read to.
- `CordlyMenuItemContent` renders each item from a caller template while the
  menu keeps the roles, the roving tab stop, the arrow keys, Escape, and focus
  return. Added because the string API lost information that mattered: a
  language picker has to mark each name with its own `lang` or a screen reader
  pronounces "Français" as English, and that does not fit in a label.

### `@cordly/widgets` 0.2.0

**Added**

- `CordlyPageHeader` — eyebrow, the page's one `<h1>`, description, an actions
  slot, and a `before` slot for a breadcrumb the application owns. The heading
  level is not configurable: an input for it eventually gets `h3` from somebody
  matching a visual size, and the document outline stops describing the page.
- `CordlySection` — a titled block that is a real landmark named by its own
  heading. `CordlySettingsSection` remains its sibling for configuration
  sections; most sections have no aside, notice, or disclosure, and giving them
  a component with five unused slots reads worse than the markup it replaced.

## 0.1.0 — 2026-09-03

The first cut of Cordly's shared frontend foundations.

Not on npm: pre-1.0 releases ship as GitHub release artifacts that consumers
vendor. See `docs/release.md`.

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
