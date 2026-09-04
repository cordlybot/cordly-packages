# Versioning

Semantic versioning, per package, versioned independently.

Independently rather than together, because the packages change at genuinely
different rates: a token adjustment is frequent and almost always additive, a
primitive's API is slow and load-bearing. Locking them to one number would mean
every token tweak bumps the major of a package that did not change, and
consumers would stop reading the version.

## What is a breaking change

For `@cordly/ui` and `@cordly/widgets`, against `api/*.api.md`:

- removing or renaming an export;
- removing an input, an output, or a content-projection slot;
- making an optional input required;
- narrowing an input's accepted type, or widening an output's emitted type;
- removing a member of a union another package's code can switch on;
- changing a component's rendered element, its ARIA role, or the shape of its
  accessible name;
- changing which class names a consumer's stylesheet could reasonably target.

The last two are easy to miss and are the ones that break an application without
breaking its build. A component that stops being a `<button>`, or whose
accessible name changes shape, changes what a consumer's own tests assert and
what their users hear.

For `@cordly/tokens`:

- removing or renaming a token;
- changing a token's _role_ — what it is for — even if the value is identical;
- lowering a contrast pair below the minimum recorded in `tokens.json`.

Changing a token's **value** while keeping its role is a minor change. That is
the point of naming tokens by role: a palette can be adjusted without a consumer
having to do anything, because nothing depended on the specific colour.

## What the gates catch

`npm run api:check` regenerates the public API from the built `.d.ts` and diffs
it against the committed report. A change that is not reflected there fails the
build, so removing an export is a decision somebody makes on purpose rather than
something a consumer discovers.

`npm run package:check` verifies peer ranges, `exports`, `sideEffects`, and the
tarball contents. Widening a peer range past what `compat/` proves fails there.

Neither gate decides whether a change is breaking. They make the change visible;
a person decides.

## Deprecation

A deprecated export keeps working for **one minor release** at minimum, and
removal is a major.

1. Mark it `@deprecated` in the source, naming the replacement in the same
   sentence. The tag reaches the API report, so the deprecation is visible in the
   diff a consumer reviews.
2. Add the deprecation to `CHANGELOG.md` under the release that introduced it,
   with what to use instead.
3. Remove it in the next major, and say in the changelog which version deprecated
   it.

A deprecation without a named replacement is not a deprecation; it is a removal
with extra steps.

## Pre-1.0

Until `1.0.0`, a breaking change bumps the **minor** — the standard pre-1.0
convention.

Pre-1.0 versions are also **not published to npm**. A release is a git tag and a
GitHub release with the packed tarballs attached; consumers vendor them and
record their digests. A published version is permanent in a way a moving API
should not be, and `npm unpublish` breaks every lockfile that already resolved
the version, so it is not the escape hatch it sounds like. `docs/release.md` has
the mechanics.

`1.0.0` is cut when the abstractions have survived real use. `cordly-panel` has
now retired its own UI kit onto these packages, which is the first half of that
evidence and which moved six APIs in the process. The second half is
`cordly-www`, and then a period where migrating something does _not_ change the
packages. Stabilising before that would be committing to guesses.

## Changelog

Every published version has an entry in `CHANGELOG.md`, grouped by package,
under Added / Changed / Deprecated / Removed / Fixed. An entry says what changed
for a consumer, not what was refactored.
