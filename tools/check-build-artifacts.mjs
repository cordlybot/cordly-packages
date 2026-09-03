#!/usr/bin/env node
/**
 * Refuse to run a type-aware tool before the artifact it needs exists.
 *
 * `@cordly/widgets` is type-checked against `dist/ui`, not against
 * `packages/ui/src` — that mapping is deliberate and documented in
 * docs/architecture.md, because it means the widgets see exactly the type
 * surface a consumer installs.
 *
 * The cost is an ordering dependency: lint and the compiler both need `ng build
 * ui` to have run. Without this guard the failure is eight lines of "unsafe
 * assignment of an error typed value" pointing at a `cordlyId` call, which says
 * nothing about the real cause and sent CI red once already.
 */

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = 'dist/ui/types/cordly-ui.d.ts';

if (!existsSync(join(root, required))) {
  process.stderr.write(
    `build: ${required} is missing.\n` +
      '@cordly/widgets is type-checked against the built @cordly/ui, so lint and the\n' +
      'compiler both need it. Run: npm run build:ui\n',
  );
  process.exit(1);
}
