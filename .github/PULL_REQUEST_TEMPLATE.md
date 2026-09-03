## What changes for a consumer

<!-- Not what you refactored — what someone installing this would notice. -->

## Why

<!-- The reasoning a future reader would need. If it replaces an approach, say
     what was wrong with the old one. -->

## Checklist

- [ ] `make verify` passes
- [ ] `make release` passes if a package changed — the tarballs installed into
      the fixtures and the compatibility harness, then exercised in a browser
      and on a server
- [ ] `make api-write` run and the diff reviewed if the public API changed
- [ ] A changelog entry under `## Unreleased`, grouped by package
- [ ] Version impact considered against `VERSIONING.md` — additive, a
      deprecation, or breaking

## For a new or changed component

- [ ] Four files: `.ts`, `.html`, `.scss`, `.spec.ts` (a directive gets two)
- [ ] No user-visible copy and no value formatting — both are inputs
- [ ] Every visual value is a token
- [ ] Colour is not the only signal
- [ ] Keyboard reachable, with a visible focus indicator that does not change the
      element's box
- [ ] Reduced motion keeps the affordance and loses the movement
- [ ] Renders on a server and hydrates cleanly
