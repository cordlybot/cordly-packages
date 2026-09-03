# Compatibility

## The supported matrix

| Package           | Angular             | TypeScript   | Node (build) | Proved by                                                |
| ----------------- | ------------------- | ------------ | ------------ | -------------------------------------------------------- |
| `@cordly/tokens`  | none — no framework | none         | 24           | `packages/tokens/test`, and both fixtures import its CSS |
| `@cordly/ui`      | `^22.0.0`           | `>=6.0 <6.1` | 24           | `compat/angular-22`, `fixtures/browser`, `fixtures/ssr`  |
| `@cordly/widgets` | `^22.0.0`           | `>=6.0 <6.1` | 24           | the same three                                           |

The peer range is `^22.0.0` and nothing wider. A range is a promise, and this
repository only makes promises it has a harness for.

## Why one line and not two

The two consumers were a major version apart when this repository was created:
`cordly-panel` on Angular 22 with TypeScript 6, `cordly-www` on Angular 21 with
TypeScript 5.9. That is the situation the implementation brief called out as
requiring an explicit decision rather than a guess, and it had two honest
answers:

1. align both applications on one Angular major, and publish one artefact; or
2. publish separate compatibility lines with a documented support window and
   identical public API tests.

**The product owner chose to align both applications on Angular 22 and one
TypeScript version.** So this repository publishes one line.

That is materially simpler than the alternative, and the simplification is worth
naming. Two lines would have meant two build outputs, two sets of peer ranges,
two harnesses, a support window somebody has to remember, and an API-equivalence
test to stop the lines drifting — permanent cost, carried to serve one consumer
that was one version behind.

`cordly-www` has been moved to Angular 22.1.4 and TypeScript 6.0.3 as part of the
same decision — the same pins `cordly-panel` carries, so the two front ends share
a toolchain rather than sharing a major by coincidence. Both consumers can now
resolve these peer ranges.

What still blocks either of them installing the packages is the registry
decision, not a version: see `docs/release.md`.

## How the range is proved

Three harnesses, each answering something the others cannot.

**`compat/angular-22`** installs the packed tarballs at exactly `22.0.0` — the
_floor_ of the declared range, not the version the consumers happen to run — and
compiles ahead of time a component that references **every** public export,
including every type-only export. A type alias that disappears is a breaking
change consumers feel and no runtime test sees.

**`fixtures/browser`** installs the same tarballs at the version the panel pins
and runs the accessibility, keyboard, focus, contrast, zoom, and reduced-motion
gates in a real browser.

**`fixtures/ssr`** installs the same tarballs and renders on a server with
hydration and event replay enabled, which is the mode the public site runs in.

All three install from `artifacts/*.tgz`. None of them is an npm workspace
member, and `packages/*` are not workspace members either — see
`docs/architecture.md` for why that matters.

## Partial compilation

The Angular packages are published in partial compilation mode, which is
ng-packagr's default for a library and is kept deliberately. A partially
compiled library is finished by the consumer's own Angular linker at build time,
so one artefact serves every patch and minor release inside the major without
being rebuilt against each.

## What is not done

- **`--force`, `--legacy-peer-deps`, and `*` ranges are not used anywhere.** A
  peer conflict is information. The one this repository hit — `@angular/ssr`
  pulling a `@angular/router` that pins an exact `@angular/common` — was fixed by
  pinning the router in the SSR fixture, which is the real answer; suppressing it
  would have produced a tree npm knows is wrong and nothing else would check.
- **Nothing compiles from a sibling path.** Every consumer here installs a
  tarball.

## Raising the range

Adding an Angular major means adding a harness, not editing a manifest:

1. Add `compat/angular-<n>` pinned at the new floor, importing every export.
2. Run it against the packed tarballs in `make compat` and in CI.
3. Widen the peer range and the expected range in `tools/check-packages.mjs`.
4. Record the support window in this file.

Dropping one is a major version of every package that declared it.
