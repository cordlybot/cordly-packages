# Releasing

## Where these go

**Before 1.0: nowhere but a GitHub release.** Each tag attaches the packed
tarballs to its release, and consumers vendor them.

The reason is that a published version is permanent in a way a pre-1.0 API should
not be. npm allows unpublishing for 72 hours, and doing so breaks every lockfile
that already resolved the version — so "we can take it back" is not true in the
way it sounds. Migrating one real application changed six of these APIs in an
afternoon; that is exactly the phase where a permanent record of every
intermediate shape helps nobody.

Vendoring gives up nothing that matters. The property the publication boundary
exists for is that **a production build resolves nothing outside its own
repository** — no sibling checkout, no registry fetch, no network — and a
committed tarball with a recorded digest has that property just as fully as a
registry version does. What it does not give is discoverability, and pre-1.0
there is nothing to discover yet.

`node tools/release.mjs publish` refuses any `0.x` version and says why.
`CORDLY_PUBLISH_PRERELEASE=1` overrides it, for the deliberate case rather than
the accidental one.

**From 1.0: the public npm registry**, under the `@cordly` scope, published with
provenance from a tagged CI run. A design system anyone evaluating Cordly can
read is worth more than one kept internal, and these packages hold nothing that
needs hiding — no credentials, no API shapes, no product logic. What is internal
stays internal because it lives in the applications, which is the boundary the
packages exist to keep.

## Consuming a release today

The consumer copies the tarballs in and records their digests. `cordly-panel`
does this in `tools/packages-sync.mjs`, which is worth reading before writing a
second one:

```bash
# in the consumer, with cordly-packages checked out beside it
npm run packages:sync     # copy artifacts/*.tgz into vendor/, record digests
npm install               # resolve them
npm run packages:check    # part of the verify gate: the tarball matches the lock
```

`package.json` then depends on `file:vendor/cordly-ui.tgz` rather than a version
range. At 1.0 those three lines become pinned versions and `vendor/` is deleted.

One sharp edge worth knowing about, because it costs an hour the first time: npm
records an integrity hash for a `file:` tarball, and replacing the file leaves
the lock describing bytes that no longer exist. npm then either refuses with
EINTEGRITY or — worse — decides the lock still matches `node_modules` and
silently keeps the old package installed. `packages:sync` clears those entries
itself for exactly that reason.

## What a release is

Three tarballs installed into real consumers and proved there. `make release`
produces exactly that evidence locally:

```bash
make release
```

`make verify`, then `npm pack` for each package, then those packed artefacts
installed into both fixture consumers and the compatibility harness, then the
browser, mobile, and server-rendering gates.

A workspace symlink is not release evidence. It resolves whatever is on disk,
ignores `files` and `exports`, and will hand a consumer a symbol the published
package does not contain.

## Versions are per package

The three are versioned independently — see `VERSIONING.md` for why. A repository
tag does not mean "release all three"; it means "release whatever is not
published yet".

That is why the publish step asks the registry rather than trusting the tag. A
tag that only moved `@cordly/ui` leaves the other two alone without anybody
remembering to say so, and re-running a failed release republishes nothing.

```bash
make release-status     # what each package is at, and what the registry has
```

## Cutting a version

1. **Bump the packages that changed.**

   ```bash
   make bump PKG=ui VERSION=0.2.0
   ```

   This writes the version and tells you whether any dependent package's peer
   range still covers it. It reports rather than edits, because widening a peer
   range is a decision with a harness attached — see `docs/compatibility.md`.

2. **Write the changelog entry**, under a heading naming the package and version
   exactly (`### @cordly/ui 0.2.0`). The preflight fails without it: a published
   version with no changelog entry is one nobody can evaluate.

3. **Regenerate the API report** if the public surface moved, and read the diff.

   ```bash
   make api-write
   ```

4. **Prove it.**

   ```bash
   make release
   make release-check
   ```

5. **Commit, tag, push.**

   ```bash
   git commit -m "Release @cordly/ui 0.2.0"
   git tag v0.2.0
   git push origin main --follow-tags
   ```

The tag starts `.github/workflows/release.yml`, which re-runs the whole gate,
re-runs the consumer proofs, publishes anything the registry does not have, and
opens a GitHub release with the tarballs attached.

## What the repository needs, once

Two things a maintainer sets up and nobody touches again:

- **`NPM_TOKEN`** — a granular npm access token with publish rights on the
  `@cordly` scope, stored as a repository secret.

  Until it exists, a tag still produces a fully verified GitHub release with the
  tarballs attached; it just does not reach the registry, and the release notes
  say so rather than implying a version is installable when it is not. Add the
  secret and re-run the workflow to publish.

  To require a human approval before publishing, create a GitHub deployment
  environment named `npm` with a required reviewer and add `environment: npm` to
  the publish job. It is left out by default because naming an environment that
  does not exist fails the job before it starts.

- **The `@cordly` scope**, claimed on npmjs.com by the organisation that owns
  it.

## Dry runs

```bash
make release-check                       # locally, without publishing
```

or run the workflow manually from the Actions tab with `dry_run` left on, which
does everything a real release does and stops short of the registry.

## After publishing

Consumers pin an exact version, the way both front ends already pin Angular. A
caret range would let a patch reach production without anybody choosing it, and
the point of the publication boundary is that reaching a consumer is a decision.

```bash
npm install @cordly/tokens@0.1.0 @cordly/ui@0.1.0 @cordly/widgets@0.1.0
```

Then update `docs/compatibility.md` if the supported matrix moved.

## If a published version is wrong

Do not unpublish. npm allows it for 72 hours and it breaks every lockfile that
already resolved the version.

Publish a fix as a new patch, and if the bad version is actively harmful mark it
deprecated so installs warn:

```bash
npm deprecate @cordly/ui@0.2.0 "Drops the focus ring on the menu; use 0.2.1"
```
