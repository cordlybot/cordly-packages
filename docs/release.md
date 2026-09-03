# Releasing

## Where these publish

The public npm registry, under the `@cordly` scope, from a public repository.

That is a deliberate pair. A design system that anyone evaluating Cordly can read
is worth more than one kept internal, and the packages hold nothing that needs
hiding: no credentials, no API shapes, no product logic — only visual values and
accessible controls. What is internal stays internal because it lives in the
applications, which is the boundary these packages exist to keep.

Every version is published **with provenance**, from a tagged CI run. Nothing is
published from a laptop, and `npm audit signatures` proves it.

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
  `@cordly` scope, stored as a repository secret. The release workflow reads it
  through an `npm` [deployment
  environment](https://docs.github.com/en/actions/deployment/targeting-different-environments),
  so publishing can require an approval if you want one.
- **The `@cordly` scope**, claimed on npmjs.com by the organisation that owns
  it.

Until the token exists the workflow reaches the publish step and fails there,
after everything else has passed — which is the right order: nothing is tagged
that was not proved.

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
