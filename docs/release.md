# Releasing

## What a release is

A release is three tarballs installed into a real consumer and proved there.
`make release` produces exactly that evidence:

```bash
make release
```

It runs `make verify`, packs each package with `npm pack`, installs the packed
artefacts into both fixture consumers and the compatibility harness, and runs the
browser, mobile, and server-rendering gates against the result.

A workspace symlink is not release evidence. It resolves whatever is on disk,
ignores `files` and `exports`, and will hand a consumer a symbol the published
package does not contain.

## Cutting a version

1. Decide the version per package from `VERSIONING.md`. The packages are
   versioned independently, so only the ones that changed move.
2. Update each `package.json` that changed.
3. Update `CHANGELOG.md`, grouped by package, saying what changed for a consumer.
4. `make api-write` if the public API changed intentionally, and read the diff.
5. `make release`.
6. Commit. One commit, inside this repository only.

## Publishing

**The registry is not yet decided**, and neither is release automation. That is
an open product decision recorded in the vault's UX plan and in
`AI_WORKSTREAMS.md`, and it is the reason no consumer can install these packages
yet.

Until it is settled, the packages carry `"publishConfig": { "access":
"restricted" }` and nothing publishes. `make release` produces the artefacts that
a publication would upload, so the decision is the only thing missing.

Two things have to be answered together:

- **Which registry.** A private registry keeps the packages internal, which
  matches how the rest of the platform is deployed. A public one makes the design
  system readable by anyone evaluating Cordly, which has its own value. The scope
  `@cordly` has to be claimed either way.
- **What publishes.** A tag-triggered CI job that runs `make release` and then
  publishes is the shape that keeps the evidence and the publication in one
  place. Publishing from a laptop means the artefact nobody verified is the one
  that shipped.

## After publishing

Consumers pin an exact version, as both frontends already pin Angular. A caret
range would let a patch reach production without anybody choosing it, and the
whole point of the publication boundary is that reaching a consumer is a decision.

Record the published versions and their digests in `CHANGELOG.md`, and update
`docs/compatibility.md` if the supported matrix moved.
