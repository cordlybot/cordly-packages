#!/usr/bin/env node
/**
 * Produce the tarballs a consumer would install, into `artifacts/`.
 *
 * `npm pack` rather than a copied directory, and the distinction is the point of
 * the whole exercise: a workspace symlink resolves whatever is on disk, ignores
 * `files`, ignores `exports`, and will happily hand a consumer a source file the
 * published package does not contain. The fixtures install these tarballs, so a
 * mistake in packaging fails here rather than in somebody's application.
 *
 * The tokens package is packed from its own directory because it has no build
 * step; the Angular packages are packed from `dist/`, which is what ng-packagr
 * produced and what npm would publish.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'artifacts');

const targets = [
  { name: '@cordly/tokens', from: 'packages/tokens', file: 'cordly-tokens.tgz' },
  { name: '@cordly/ui', from: 'dist/ui', file: 'cordly-ui.tgz' },
  { name: '@cordly/widgets', from: 'dist/widgets', file: 'cordly-widgets.tgz' },
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

for (const target of targets) {
  const from = join(root, target.from);

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(join(from, 'package.json'), 'utf8'));
  } catch {
    process.stderr.write(`pack: ${target.from} has no package.json. Run: npm run build\n`);
    process.exit(1);
  }

  execFileSync('npm', ['pack', '--pack-destination', outDir], {
    cwd: from,
    stdio: ['ignore', 'ignore', 'inherit'],
    shell: process.platform === 'win32',
  });

  // npm names the file after the package and version. A stable name is what
  // lets a fixture's install command stay the same across a version bump.
  const produced = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
  renameSync(join(outDir, produced), join(outDir, target.file));

  const bytes = readFileSync(join(outDir, target.file));
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
  const size = (bytes.length / 1024).toFixed(1);
  process.stdout.write(
    `pack: ${target.name}@${manifest.version} -> artifacts/${target.file} (${size} kB, sha256 ${digest})\n`,
  );
}
