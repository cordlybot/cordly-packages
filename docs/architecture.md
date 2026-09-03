# Architecture

## Three packages, one boundary

```
@cordly/tokens      no dependencies, no framework
      ↑
@cordly/ui          peers: Angular, @cordly/tokens
      ↑
@cordly/widgets     peers: Angular, @cordly/tokens, @cordly/ui
```

The arrows are peer dependencies, not bundled ones. A consumer installs all three
and resolves one copy of each; nothing here vendors a version of anything.

`@cordly/tokens` is deliberately at the bottom and deliberately framework
neutral. It is a stylesheet plus a small machine-readable description, with no
JavaScript a page has to run — which is what lets a server-rendered application
send the correct theme in its first response instead of correcting a white page
once hydration finishes.

## What decides where something goes

| Belongs here                                         | Stays in the application               |
| ---------------------------------------------------- | -------------------------------------- |
| semantic tokens and themes                           | routes and navigation destinations     |
| accessible control primitives                        | authentication and authorization       |
| layout shells with data-free slots                   | API clients and contract DTOs          |
| feedback, empty, loading, and error presentation     | stores and business rules              |
| generic catalogue, stat, settings, and review shells | translated product copy and analytics  |
| interaction and accessibility tests                  | page composition and feature workflows |

The operative test is a sentence: **a widget is shareable only when its public
API can be explained without naming an application route, a backend endpoint, a
Discord object, or a Cordly permission.** If it cannot be, the application owns
it and composes primitives locally.

Three of those are enforced rather than reviewed. `no-restricted-imports` in
`eslint.config.mjs` refuses `@angular/router`, `@angular/common/http`, and
anything store-shaped inside `packages/`, because a widget that _can_ reach a
router is a widget that eventually names a route — and nothing about that will
look wrong in a diff.

## Why the packages ship no copy and no formatting

Every label, accessible name, message, and count arrives as a string the caller
already resolved.

This looks like extra work at the call site — the application passes
`'3 changes staged'` rather than `3` — and it is the right trade. Pluralisation,
number grouping, and word order differ by language, and a shared widget that
formats them has taken a decision it has no information to make. A default
English string is worse still: it is the one piece of copy nobody notices is
untranslated, because it renders perfectly.

The exception proves the rule. `CordlyStat.meaning` is required, and it is a
string the application writes. The type is how the UX plan's rule — a metric
appears only when it leads to an interpretation or an action — becomes something
the compiler checks rather than something a reviewer remembers.

## Why there is no headless-component dependency

`@cordly/ui` builds its overlays on the platform.

`<dialog>` in modal mode supplies the focus trap, the top layer, `inert` on the
rest of the document, Escape handling, and `aria-modal`. Those are the five
things a hand-built overlay reimplements and the five it gets subtly wrong.
Wrapping a headless library would have added a second peer range to keep truthful
across Angular versions, for behaviour the browser already ships.

What the component adds is what the element does not have: focus restoration to
the trigger, a labelled heading, backdrop-click dismissal that can tell the
backdrop from the panel, and a close reason.

The same reasoning applies to `<select>`, `<details>`, and the radio group inside
`CordlyPreferenceGroup`. Each gets the platform's keyboard model, the platform's
mobile behaviour, and the platform's screen-reader semantics for free.

## Known limitations, stated rather than hidden

- **The menu does not flip away from a viewport edge.** Collision handling needs
  measurement on every scroll and resize, and no Cordly surface currently places
  a menu where it would matter. Adding it later is additive.
- **`@cordly/ui` ships no icons.** The SVG is the caller's, so an application can
  change icon provider without a release here. The few marks components draw
  themselves — a chevron, a close cross, a status shape — are CSS geometry.
- **The tokens carry no chart palette.** No Cordly surface renders a chart yet,
  and inventing five colours nothing uses is how a token set starts drifting.

## Why the build is shaped the way it is

`packages/*` are **not** npm workspace members. If they were, npm would symlink
`node_modules/@cordly/ui` to the source directory, and every test and fixture
would silently resolve source rather than the built artefact — which is the exact
failure this repository exists to prevent, reintroduced one level down.

Instead the root holds the toolchain, `angular.json` points at
`packages/{ui,widgets}`, and `@cordly/widgets` compiles against `dist/ui` through
a single `paths` entry in `tsconfig.json`. That mapping points at the **built**
package, so the type surface the widgets see is the one a consumer installs, and
a widget cannot reach a symbol that is not publicly exported.

Shared SCSS mixins live in `styles/` at the repository root and reach both
packages through `styleIncludePaths`. They are compiled into each component's
stylesheet at build time, so they create no runtime dependency between packages
and nothing has to be published to share them.
