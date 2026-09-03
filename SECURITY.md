# Security policy

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Report it privately through GitHub's advisory form:

<https://github.com/cordlybot/cordly-packages/security/advisories/new>

That creates a private thread where a fix can be prepared and released before the
problem is described publicly.

You should get an acknowledgement within three working days. If you have not,
assume the report was missed rather than ignored, and open a public issue saying
only that you are waiting on a security response — no details.

## Supported versions

Pre-1.0. Only the latest published version of each package receives fixes:

| Package           | Supported    |
| ----------------- | ------------ |
| `@cordly/tokens`  | latest `0.x` |
| `@cordly/ui`      | latest `0.x` |
| `@cordly/widgets` | latest `0.x` |

## What is in scope

These are front-end presentation packages. They hold no credentials, make no
network requests, and read no storage — so the realistic surface is narrow, and
worth stating so a reporter knows what is worth their time:

- **Markup injection.** Anything that lets caller-supplied text reach the DOM as
  markup rather than as text. Angular's sanitiser covers the normal paths; a
  place where a package bypasses it would be a real finding.
- **URL handling.** `CordlyLink` sets `rel="noopener noreferrer"` on external
  destinations. A path that drops it, or that lets a `javascript:` URL reach an
  `href` the package controls, is in scope.
- **A supply-chain problem in what is published** — an unexpected file in a
  tarball, a dependency that should not be there, a build that does not match its
  source.

## What is out of scope

- A consumer application passing unsanitised HTML into a slot. These components
  project what they are given; deciding what is safe to render is the
  application's job and its own security boundary.
- Vulnerabilities in Angular itself. Report those to the Angular project; if one
  affects a package here, tell us so the peer range can move.
- Findings that require an attacker to already control the page.

## Verifying a release

Every published version carries [npm
provenance](https://docs.npmjs.com/generating-provenance-statements), so npm can
prove which workflow run, from which commit, produced the tarball:

```bash
npm audit signatures
```

The release workflow builds and publishes from a tag in CI. Nothing is published
from a laptop.
