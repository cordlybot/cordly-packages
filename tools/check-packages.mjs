#!/usr/bin/env node
/**
 * What is actually inside each tarball, and what its manifest promises.
 *
 * Run after `npm run pack:all`. Every assertion here corresponds to a way a
 * package can be wrong that no test in the repository would notice, because the
 * source is fine and only the packaging is not:
 *
 * - a source file, a spec, or a map shipped to consumers;
 * - `sideEffects: false` on a package whose CSS a bundler will then drop;
 * - an `exports` entry pointing at a path the tarball does not contain;
 * - a peer range wider than what was actually built and proved;
 * - a dependency on a sibling checkout (`file:` or `workspace:`), which works on
 *   the machine that published and nowhere else;
 * - a package that quietly grew by an order of magnitude.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = join(root, 'artifacts');

/** The Angular line this release is built for and proved against. */
const ANGULAR_PEER = '^22.0.0';

const expectations = [
  {
    file: 'cordly-tokens.tgz',
    name: '@cordly/tokens',
    sideEffects: ['*.css'],
    maxKilobytes: 120,
    mustContain: [
      'package/generated/cordly-tokens.css',
      'package/generated/cordly-tokens.tailwind.css',
      'package/generated/tokens.json',
      'package/generated/index.js',
      'package/generated/index.d.ts',
      'package/README.md',
      'package/LICENSE',
    ],
    peers: {},
  },
  {
    file: 'cordly-ui.tgz',
    name: '@cordly/ui',
    sideEffects: false,
    maxKilobytes: 250,
    mustContain: [
      'package/types/cordly-ui.d.ts',
      'package/fesm2022/cordly-ui.mjs',
      'package/README.md',
      'package/LICENSE',
    ],
    peers: {
      '@angular/common': ANGULAR_PEER,
      '@angular/core': ANGULAR_PEER,
      '@angular/forms': ANGULAR_PEER,
      '@cordly/tokens': '^0.1.0',
    },
  },
  {
    file: 'cordly-widgets.tgz',
    name: '@cordly/widgets',
    sideEffects: false,
    maxKilobytes: 250,
    mustContain: [
      'package/types/cordly-widgets.d.ts',
      'package/fesm2022/cordly-widgets.mjs',
      'package/README.md',
      'package/LICENSE',
    ],
    peers: {
      '@angular/common': ANGULAR_PEER,
      '@angular/core': ANGULAR_PEER,
      '@angular/forms': ANGULAR_PEER,
      '@cordly/tokens': '^0.1.0',
      '@cordly/ui': '^0.1.0',
    },
  },
];

/** Anything matching these has no business in a published package. */
const forbidden = [
  { pattern: /\.spec\.(ts|js)$/, why: 'a test file' },
  { pattern: /\/src\/.*\.ts$/, why: 'a TypeScript source file' },
  { pattern: /\.scss$/, why: 'an uncompiled stylesheet' },
  { pattern: /tsconfig.*\.json$/, why: 'a build configuration' },
  { pattern: /ng-package\.json$/, why: 'a build configuration' },
  { pattern: /\/testing\//, why: 'a test helper' },
  { pattern: /\.env/, why: 'an environment file' },
];

const problems = [];

function listTarball(file) {
  const output = execFileSync('tar', ['-tzf', join(artifacts, file)], { encoding: 'utf8' });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function manifestFrom(file) {
  const output = execFileSync('tar', ['-xzOf', join(artifacts, file), 'package/package.json'], {
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

for (const expectation of expectations) {
  const where = `artifacts/${expectation.file}`;
  let entries;
  let manifest;

  try {
    entries = listTarball(expectation.file);
    manifest = manifestFrom(expectation.file);
  } catch (error) {
    problems.push(`${where}: cannot be read (${String(error)}). Run: npm run pack:all`);
    continue;
  }

  if (manifest.name !== expectation.name) {
    problems.push(`${where}: contains ${manifest.name}, expected ${expectation.name}`);
  }

  for (const required of expectation.mustContain) {
    if (!entries.includes(required)) problems.push(`${where}: missing ${required}`);
  }

  for (const entry of entries) {
    for (const rule of forbidden) {
      if (rule.pattern.test(entry)) {
        problems.push(`${where}: ships ${entry}, which is ${rule.why}`);
      }
    }
  }

  const sideEffects = JSON.stringify(manifest.sideEffects);
  const expectedSideEffects = JSON.stringify(expectation.sideEffects);
  if (sideEffects !== expectedSideEffects) {
    problems.push(
      `${where}: sideEffects is ${sideEffects}, expected ${expectedSideEffects}. Wrong in either direction is a real defect: false lets a bundler drop a stylesheet, true keeps dead JavaScript in every consumer.`,
    );
  }

  const peers = manifest.peerDependencies ?? {};
  for (const [name, range] of Object.entries(expectation.peers)) {
    if (peers[name] !== range) {
      problems.push(
        `${where}: peer ${name} is ${peers[name] ?? 'absent'}, expected ${range}. A peer range wider than what was built and proved is a promise nothing checks.`,
      );
    }
  }
  for (const name of Object.keys(peers)) {
    if (!(name in expectation.peers)) {
      problems.push(
        `${where}: undeclared peer ${name}. Add it here with the range it was proved at.`,
      );
    }
  }

  for (const [name, range] of Object.entries({
    ...(manifest.dependencies ?? {}),
    ...peers,
  })) {
    if (/^(file:|link:|workspace:|portal:)/.test(String(range))) {
      problems.push(
        `${where}: ${name} resolves to ${range}. A published package must never point at a sibling checkout.`,
      );
    }
  }

  // Every declared entry point has to exist inside the tarball. This is the
  // failure that only ever shows up in a consumer's build, because the file is
  // right there on the machine that published.
  const exported = [];
  const collect = (value) => {
    if (typeof value === 'string') exported.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  collect(manifest.exports ?? {});
  for (const relativePath of new Set(exported)) {
    if (relativePath.includes('*')) continue;
    const entry = `package/${relativePath.replace(/^\.\//, '')}`;
    if (!entries.includes(entry)) {
      problems.push(`${where}: exports ${relativePath}, which the tarball does not contain`);
    }
  }

  if (!manifest.license) problems.push(`${where}: no license field`);
  if (!manifest.repository) problems.push(`${where}: no repository field`);
  if (!manifest.description) problems.push(`${where}: no description field`);
  if (manifest.private === true) problems.push(`${where}: marked private but packed for release`);

  // These publish to a public registry under a scope. npm defaults a scoped
  // package to restricted, so omitting this does not publish a private package
  // — it fails the publish with a 402 after the release has already been
  // tagged. Provenance is asserted here too, because it is the difference
  // between "someone published this" and "this workflow, from this commit,
  // published this".
  if (manifest.publishConfig?.access !== 'public') {
    problems.push(`${where}: publishConfig.access must be "public" for a scoped public package`);
  }
  if (manifest.publishConfig?.provenance !== true) {
    problems.push(`${where}: publishConfig.provenance must be true`);
  }

  const bytes = readFileSync(join(artifacts, expectation.file)).length;
  const kilobytes = bytes / 1024;
  if (kilobytes > expectation.maxKilobytes) {
    problems.push(
      `${where}: ${kilobytes.toFixed(1)} kB exceeds the ${expectation.maxKilobytes} kB ceiling. Either something was added that should not ship, or raise the ceiling deliberately.`,
    );
  }

  if (problems.length === 0 || !problems.some((p) => p.startsWith(where))) {
    process.stdout.write(
      `package: ${expectation.name}@${manifest.version} — ${entries.length} files, ${kilobytes.toFixed(1)} kB, peers and exports verified\n`,
    );
  }
}

if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(`package: ${problem}\n`);
  process.exit(1);
}
