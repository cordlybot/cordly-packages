# cordly-packages

The shared frontend foundations for Cordly's web surfaces: design tokens,
accessible Angular primitives, and domain-neutral composed widgets, published as
three independently versioned packages.

| Package                               | What it owns                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`@cordly/tokens`](packages/tokens)   | Semantic colour, spacing, radius, typography, elevation, breakpoint, focus, and motion values. Framework neutral.                                |
| [`@cordly/ui`](packages/ui)           | Accessible Angular primitives. Owns the raw HTML controls so no application has to.                                                              |
| [`@cordly/widgets`](packages/widgets) | Composed presentation — shells, catalogues, settings sections, staged-change and review surfaces — that names no route, endpoint, or permission. |

Consumers are `cordly-panel`, `cordly-www`, and whatever Cordly builds next.

## Publishing is the boundary

**A consumer installs a released version. Nothing resolves a sibling checkout.**

That is the whole architecture, and it is worth being blunt about why, because
the alternative is easier on the day and worse afterwards. A workspace link
resolves whatever happens to be on disk: it ignores `files`, it ignores
`exports`, it compiles the library's TypeScript inside the application's build,
and it will happily hand a consumer a symbol the published package does not
contain. The first time anybody finds out is when a deployment builds from a
clean checkout.

So the fixtures in this repository install packed tarballs, the compatibility
harness installs packed tarballs, and CI publishes the tarballs between jobs. A
workspace symlink is not release evidence.

There are no path aliases into neighbouring repositories, no git submodules, and
no copy scripts. See [`docs/architecture.md`](docs/architecture.md).

## Everything runs in Docker

Node is never run on the host, for the reason the other frontend repositories
give: a Windows `npm install` rewrites the bind-mounted `node_modules` with
junctions the Linux containers cannot follow.

```bash
make install    # dependencies into named volumes
make verify     # everything a change has to pass
make release    # verify, plus the tarballs installed into real consumers
```

Every target runs in one image pinned by digest, and CI runs the same commands.
`make help` lists them.

## What is proved, and where

| Gate                 | What it answers                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `make tokens`        | Generated artefacts match their source; every contrast pair meets WCAG 2.2 AA in **both** themes; no colour falls outside sRGB |
| `make files`         | Every component is `.ts` + `.html` + `.scss` + `.spec.ts`; no inline template survives                                         |
| `make lint`          | Nothing in a package imports a router, an HTTP client, or a store; templates pass the accessibility rules                      |
| `make test`          | 100+ unit tests, zoneless, on the same change-detection model both consumers use                                               |
| `make api`           | The public API matches a committed, human-readable report                                                                      |
| `make package-check` | Tarball contents, `exports`, peer ranges, `sideEffects`, and size ceilings                                                     |
| `make compat`        | Every public export compiles ahead of time at the **floor** of the declared peer range                                         |
| `make e2e`           | Real-browser accessibility, keyboard, focus, contrast, 200% zoom, touch targets, reduced motion, SSR rendering, and hydration  |
| `make hygiene`       | No credential, absolute local path, personal data, or third-party product name                                                 |

The split between the unit tests and the browser gates is deliberate. jsdom has
no layout, no painted focus ring, no `<dialog>` top layer and no forced-colours
mode, so an accessibility guarantee proved only there is a guarantee about a
simulation. Anything that needs a real browser is asserted in `e2e/`.

## Compatibility

One line: **Angular 22 on TypeScript 6**, which is what both consumers run.

`^22.0.0` is the peer range, and `compat/angular-22` proves it by installing the
tarballs at exactly `22.0.0` and compiling every public export ahead of time. The
range is deliberately no wider than what is proved. See
[`docs/compatibility.md`](docs/compatibility.md).

## Originality

Cordly's visual system is its own. The tokens were derived from the product's
stated goals and from measured contrast requirements, the component geometry from
the interaction model in the vault's UX plan, and the copy in every fixture was
written here. No third-party interface, wording, source, asset, dimension, or
visual identity was copied, and `make hygiene` fails the build if a third-party
product name appears anywhere in the repository.

## Where the decisions live

Development context, architecture direction, and decisions live in the
`cordly-vault` Obsidian vault at the workspace root — principally
`ADR-037 - Shared frontend foundations are a published package repository` and
`Design/Cordly Shared Frontend UX Plan 2026-09-03`. The `docs/` folder here
documents this repository only.

- [`docs/architecture.md`](docs/architecture.md) — what belongs in which package, and why
- [`docs/compatibility.md`](docs/compatibility.md) — the support matrix and how it is proved
- [`docs/release.md`](docs/release.md) — how a version is cut and published
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to add a component without widening the boundary
- [`VERSIONING.md`](VERSIONING.md) — what is breaking, and what deprecation means here

MIT licensed.
