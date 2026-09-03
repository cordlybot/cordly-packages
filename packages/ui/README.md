# @cordly/ui

Accessible Angular primitives for Cordly web applications. This package owns the
raw HTML controls so no application has to.

Angular 22, standalone, `OnPush`, signal inputs, new control flow. Every visual
value comes from [`@cordly/tokens`](https://www.npmjs.com/package/@cordly/tokens);
nothing here hard-codes a colour, a radius, or a duration.

## Install

```bash
npm install @cordly/ui @cordly/tokens
```

Import the token stylesheet once in the application's style entry point — the
components resolve their colours from it and render unstyled without it.

## What is here

| Component         | Selector                                               |
| ----------------- | ------------------------------------------------------ |
| Button            | `button[cordlyButton]`, `a[cordlyButton]`              |
| Icon button       | `button[cordlyIconButton]`, `a[cordlyIconButton]`      |
| Link              | `a[cordlyLink]`                                        |
| Badge             | `<cordly-badge>`                                       |
| Card              | `<cordly-card>`, `a[cordlyCard]`, `button[cordlyCard]` |
| Text field        | `<cordly-text-field>`                                  |
| Select field      | `<cordly-select-field>`                                |
| Switch            | `<cordly-switch>`                                      |
| Status            | `<cordly-status>`                                      |
| Skeleton          | `<cordly-skeleton>`                                    |
| Empty state       | `<cordly-empty-state>`                                 |
| Dialog and drawer | `<cordly-dialog>`                                      |
| Menu              | `<cordly-menu>`                                        |
| Tooltip           | `[cordlyTooltip]`                                      |
| Toasts            | `<cordly-toast-region>` and `CordlyToasts`             |
| Visually hidden   | `[cordlyVisuallyHidden]`                               |

```html
<button cordlyButton variant="primary" (click)="apply()">Apply 3 changes</button>

<cordly-text-field
  label="Announcement channel"
  hint="Where level-up messages are posted."
  [(ngModel)]="channel"
/>
```

## The rules these primitives keep

They are the reason to install this rather than to write a button.

- **A control is the native element, not a wrapper around one.** `[cordlyButton]`
  applies to the `<button>` the caller wrote, so keyboard activation, form
  participation, and the disabled semantics come from the platform.
- **Nothing ships user-visible copy.** Every label, every accessible name, every
  message is an input. A shared package cannot know what language an application
  speaks, and a default English string is the one piece of copy nobody notices is
  untranslated.
- **An accessible name is required where it can be checked.** An icon-only
  button, a menu trigger, and a toast dismiss control all refuse in development
  when they have none.
- **Colour is never the only signal.** Every tone carries a word, a shape, or
  both, so the interface survives a colour-vision deficiency and forced-colours
  mode.
- **Focus is visible and nothing removes it.** One ring, drawn outside the box,
  so an indicator never shifts the layout around it.
- **Reduced motion keeps the affordance and loses the movement.** A lift keeps
  its elevation and drops its travel; a skeleton keeps its shape and drops its
  sheen. Collapsing durations alone turns a hover into an instant jump, which is
  the movement the preference exists to remove.
- **Nothing here knows about routes, endpoints, permissions, or stores.** The
  lint configuration makes that structural rather than aspirational.

## Server rendering

Every component renders on the server and hydrates without a warning. Where a
browser API is genuinely needed — `matchMedia`, `showModal`, `getComputedStyle`
— it is reached only after the platform check.

## Versioning

The public API is generated into `api/ui.api.md` in the repository and diffed on
every build, so removing or narrowing an export is a reviewed change rather than
a consumer's broken build. See `VERSIONING.md`.

MIT licensed. Part of
[cordly-packages](https://github.com/cordlybot/cordly-packages).
