# @cordly/widgets

Domain-neutral composed presentation for Cordly web applications: the shells,
catalogues, settings sections, and staged-change surfaces that every Cordly
front end needs and none of them should build twice.

Built on [`@cordly/ui`](https://www.npmjs.com/package/@cordly/ui) and
[`@cordly/tokens`](https://www.npmjs.com/package/@cordly/tokens).

## Install

```bash
npm install @cordly/widgets @cordly/ui @cordly/tokens
```

## What is here

| Widget                      | What it frames                                                  |
| --------------------------- | --------------------------------------------------------------- |
| `<cordly-app-frame>`        | Skip link, banner, navigation, main landmark, responsive drawer |
| `<cordly-side-nav>`         | Grouped destinations, with the current one marked               |
| `<cordly-stat-row>`         | Figures that lead to an interpretation                          |
| `<cordly-entity-tile>`      | A chooser tile that is exactly one control                      |
| `<cordly-catalogue>`        | Search, filters, an announced count, an empty slot              |
| `<cordly-settings-section>` | One decision, with advanced options disclosed                   |
| `<cordly-change-bar>`       | The sticky bar that says a draft differs from what is saved     |
| `<cordly-review-list>`      | Before, after, origin, status, and risk per change              |
| `<cordly-preference-group>` | A small closed set of display choices                           |

## The line a widget stays on

**A widget belongs here only when its public API can be explained without naming
an application route, a backend endpoint, a Discord object, or a Cordly
permission.**

Everything here takes strings the application has already resolved and
translated, and typed view models it has already assembled. Nothing imports a
router, an HTTP client, a store, or a translation service — the lint
configuration forbids it, so the boundary fails a build rather than a review.

The consequence is worth stating plainly, because it looks like extra work at the
call site: the application passes `'3 changes staged'`, not `3`. That is
deliberate. Pluralisation, number formatting, and word order differ by language,
and a shared widget that formats them has quietly taken a decision it has no
information to make.

## What these widgets encode

Each is a rule from Cordly's UX plan, kept in one place instead of re-argued per
page:

- **One review model for every change.** A manual edit and an assistant proposal
  enter the same list, with the same before/after, the same origin, and the same
  confirmation — so approving something a model wrote is not a different act from
  approving something a person typed.
- **One change bar, everywhere.** Not a Save button on some pages and an unsaved
  pill on others.
- **Search above eight choices.** Below that it is chrome between a reader and a
  list they can already see; the threshold is a token, not a habit.
- **A metric appears with its meaning.** `CordlyStat.meaning` is required, so a
  row of numbers nobody can act on does not compile.
- **A tile is one target.** With a destination it renders an anchor, so
  middle-click still works; without one it emits.
- **Advanced settings are disclosed, not hidden.** A native `<details>`, so
  in-page find still reaches text inside a closed section.

## Versioning

The public API is generated into `api/widgets.api.md` in the repository and
diffed on every build. See `VERSIONING.md`.

MIT licensed. Part of
[cordly-packages](https://github.com/cordlybot/cordly-packages).
