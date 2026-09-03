# cordly-packages agent guide

This repository holds Cordly's shared frontend foundations. It contains no
service, no API client, no application state, and no product decision. Read the
workspace `AGENTS.md` first; the rules below are additional, not a replacement.

## Ownership

Three published packages, versioned independently:

| Package           | Owns                                                             |
| ----------------- | ---------------------------------------------------------------- |
| `@cordly/tokens`  | Every visual value, as CSS custom properties. Framework neutral. |
| `@cordly/ui`      | Accessible Angular primitives and the raw HTML controls          |
| `@cordly/widgets` | Domain-neutral composed presentation                             |

What this repository does **not** own: routes, authentication, authorization,
API clients, contract DTOs, stores, translations, analytics, business rules, and
product copy. Those belong to the application, and the lint configuration
enforces the ones it can.

## Before writing

1. Confirm you own this repository in `AI_WORKSTREAMS.md`.
2. Read `cordly-vault/Design/Cordly Shared Frontend UX Plan 2026-09-03.md`. It is
   authoritative for the interaction model; this repository implements it.
3. Read `docs/architecture.md` for the boundary and `VERSIONING.md` for what
   counts as a breaking change.

## Rules

- **Never let a widget name an application concept.** The test is a sentence: a
  widget belongs here only when its public API can be explained without naming a
  route, an endpoint, a Discord object, or a Cordly permission. If it cannot,
  the application owns it and composes primitives locally.
- **Never ship user-visible copy.** Every label, accessible name, and message is
  an input. A default English string is the one piece of copy nobody notices is
  untranslated.
- **Never format a value.** Numbers, plurals, dates, and lists arrive as strings
  the caller already resolved. Formatting them here takes a decision this
  repository has no information to make.
- **Never use `export *`.** Every public entry point is a named export from
  `public-api.ts`, and the generated report in `api/` has to agree.
- **Never widen a peer range past what is proved.** `compat/angular-22` installs
  the tarballs at the floor of the range and compiles every export. Raising the
  range means adding a harness, not editing a manifest.
- **Never resolve a sibling checkout.** No path alias into another repository, no
  submodule, no copy script. A consumer installs a released version.
- **Never suppress a peer conflict** with `--force`, `--legacy-peer-deps`, or a
  `*` range. A conflict is information; pin the dependency that causes it.
- **Never edit `packages/tokens/generated/`.** It is produced from
  `src/tokens.source.mjs`; `npm run tokens:check` compares them byte for byte.
- **Never let colour be the only signal.** Every tone carries a word, a shape, or
  both, so meaning survives a colour-vision deficiency and forced-colours mode.
- **Never remove a focus indicator** without replacing it, and never make one
  that changes an element's box.
- **Never name a third-party product** in source, tests, fixtures, comments,
  commit messages, or documentation. `npm run hygiene:check` fails the build if
  one appears; the denylist stores hashes rather than names so the check does not
  itself become an occurrence.
- **Run everything in Docker.** Node is not run on the host in this workspace.

## Component conventions

- Standalone, `OnPush`, signal inputs, `inject()`, new control flow.
- **A component is four files**: `.ts`, `.html`, `.scss`, `.spec.ts`. No inline
  template and no inline styles, including one-line ones. `npm run files:check`
  is a build gate.
- **A directive is two files**: `.ts` and `.spec.ts`. This narrows the workspace
  convention deliberately: an Angular directive cannot carry styles, so an empty
  `.scss` beside one is a file that lies about what it does. The gate refuses it.
- A control is the native element, not a wrapper around one. `[cordlyButton]`
  applies to the `<button>` the caller wrote.
- Every visual value is a token. Nothing hard-codes a colour, radius, or
  duration.
- Shared SCSS mixins live in `styles/` at the repository root and reach both
  packages through `styleIncludePaths`. They are compiled into each component, so
  they create no runtime dependency between the packages.

## Quality gate

```bash
make verify     # what every change has to pass
make release    # verify, plus the tarballs installed into real consumers
```

`make release` is what a publication needs and local work does not: the packed
artefacts installed into two fixture consumers and a compatibility harness, then
exercised in a real browser and on a real server. A workspace symlink is not
release evidence.

## Handoff

Use the format in the workspace `AI_WORKSTREAMS.md`. Name every package whose
public API changed, and say for each whether the change is additive, a
deprecation, or a new major version.
