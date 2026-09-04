#!/usr/bin/env node
/**
 * Release preflight, version bumping, and publish-if-new.
 *
 *   node tools/release.mjs status            what each package is at, and what is published
 *   node tools/release.mjs bump <pkg> <ver>  set one package's version
 *   node tools/release.mjs check             refuse an incoherent release
 *   node tools/release.mjs publish           publish anything not already on the registry
 *
 * The packages are versioned independently, so a repository tag does not mean
 * "release all three" — it means "release whatever is not published yet". That
 * is why `publish` asks the registry rather than trusting the tag: a tag that
 * touches only `@cordly/ui` leaves the other two alone without anybody having to
 * remember to say so, and re-running a failed release republishes nothing.
 *
 * `check` is the part that earns its place. Every failure it reports is
 * something that is easy to do and expensive to discover after a tag exists,
 * because a published version cannot be taken back and a tag that produced a bad
 * one has to be superseded rather than fixed.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PACKAGES = [
  { key: 'tokens', dir: 'packages/tokens', dist: 'packages/tokens', tarball: 'cordly-tokens.tgz' },
  { key: 'ui', dir: 'packages/ui', dist: 'dist/ui', tarball: 'cordly-ui.tgz' },
  { key: 'widgets', dir: 'packages/widgets', dist: 'dist/widgets', tarball: 'cordly-widgets.tgz' },
];

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Pre-1.0 versions are not published to npm.
 *
 * The API is still moving — migrating one real consumer changed six of them in
 * an afternoon — and a version on a public registry is permanent in a way a
 * pre-1.0 API should not be. npm allows unpublishing for 72 hours, and doing so
 * breaks every lockfile that already resolved the version, so "we can take it
 * back" is not true in the way it sounds.
 *
 * Until 1.0 a release is a git tag plus a GitHub release with the packed
 * tarballs attached. Consumers vendor those artifacts and record their digests,
 * which gives the property that actually matters — a production build resolving
 * nothing outside its own repository — without claiming a stability the packages
 * have not earned.
 *
 * `CORDLY_PUBLISH_PRERELEASE=1` overrides it, for the deliberate case rather
 * than the accidental one.
 */
const isPrerelease = (version) => version.startsWith('0.');
const prereleasePublishAllowed = () => process.env['CORDLY_PUBLISH_PRERELEASE'] === '1';

const manifestPath = (pkg) => join(root, pkg.dir, 'package.json');
const readManifest = (pkg) => JSON.parse(readFileSync(manifestPath(pkg), 'utf8'));

function npm(args) {
  return execFileSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
}

/**
 * Is this exact version already on the registry?
 *
 * A missing version makes `npm view` exit non-zero, which is the answer rather
 * than an error. A network failure looks the same from here, so it is reported
 * as unknown and the caller refuses to publish — guessing "not published" and
 * being wrong means a failed release; guessing "published" and being wrong means
 * a silently skipped one.
 */
function publishedVersions(name) {
  try {
    return new Set(JSON.parse(npm(['view', name, 'versions', '--json'])));
  } catch (error) {
    const text = String(error.stderr ?? error.message ?? '');
    // A scope that has never been published is a 404, and it is a legitimate
    // starting state rather than a problem.
    if (text.includes('E404') || text.includes('404 Not Found')) return new Set();
    return null;
  }
}

/**
 * Does the changelog name this exact package and version?
 *
 * Backticks are stripped before matching. A changelog heading naturally writes
 * the package as a code span, and a check that refused `### \`@cordly/ui\` 0.2.0`
 * while accepting the same words unformatted would be enforcing punctuation
 * rather than the thing it cares about.
 */
function changelogHasEntry(name, version) {
  const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8').replaceAll('`', '');
  return changelog.includes(`${name} ${version}`);
}

/* --------------------------------------------------------------- commands */

function status() {
  for (const pkg of PACKAGES) {
    const manifest = readManifest(pkg);
    const published = publishedVersions(manifest.name);
    const state =
      published === null
        ? 'registry unreachable'
        : published.has(manifest.version)
          ? 'already published'
          : isPrerelease(manifest.version) && !prereleasePublishAllowed()
            ? 'pre-1.0 — a release artifact consumers vendor, deliberately not on npm'
            : published.size === 0
              ? 'never published'
              : `unpublished (registry has ${[...published].pop()})`;
    process.stdout.write(`release: ${manifest.name}@${manifest.version} — ${state}\n`);
  }
}

function bump(key, version) {
  const pkg = PACKAGES.find((candidate) => candidate.key === key);
  if (!pkg) fail(`unknown package "${key}". One of: ${PACKAGES.map((p) => p.key).join(', ')}`);
  if (!SEMVER.test(version)) fail(`"${version}" is not a semantic version`);

  const manifest = readManifest(pkg);
  const previous = manifest.version;
  manifest.version = version;
  writeFileSync(manifestPath(pkg), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  process.stdout.write(`release: ${manifest.name} ${previous} -> ${version}\n`);
  process.stdout.write(
    'release: now add a CHANGELOG.md entry, run `npm run api:extract` if the API moved, and re-run `make verify`.\n',
  );

  // A dependent package's peer range has to keep meaning what it says. This
  // reports rather than edits, because widening a peer range is a decision.
  for (const other of PACKAGES) {
    const dependent = readManifest(other);
    const range = dependent.peerDependencies?.[manifest.name];
    if (range && !range.includes(version.split('.').slice(0, 2).join('.'))) {
      process.stdout.write(
        `release: note — ${dependent.name} peers ${manifest.name}@${range}. Check that still covers ${version}.\n`,
      );
    }
  }
}

function check() {
  const problems = [];

  for (const pkg of PACKAGES) {
    const manifest = readManifest(pkg);
    const where = manifest.name;

    if (!SEMVER.test(manifest.version)) {
      problems.push(`${where}: "${manifest.version}" is not a semantic version`);
      continue;
    }

    if (!changelogHasEntry(manifest.name, manifest.version)) {
      problems.push(
        `${where}: CHANGELOG.md has no entry naming "${manifest.name} ${manifest.version}". A published version with no changelog entry is one nobody can evaluate.`,
      );
    }

    if (manifest.publishConfig?.access !== 'public') {
      problems.push(`${where}: publishConfig.access must be "public"`);
    }
    if (manifest.publishConfig?.provenance !== true) {
      problems.push(`${where}: publishConfig.provenance must be true`);
    }
    if (!manifest.license || !manifest.repository || !manifest.description) {
      problems.push(`${where}: license, repository, and description are all required to publish`);
    }

    const published = publishedVersions(manifest.name);
    if (published === null) {
      process.stdout.write(
        `release: ${where} — registry unreachable, skipping the published check\n`,
      );
    } else if (published.has(manifest.version)) {
      process.stdout.write(
        `release: ${where}@${manifest.version} is already published; a release run would skip it\n`,
      );
    } else if (isPrerelease(manifest.version) && !prereleasePublishAllowed()) {
      process.stdout.write(
        `release: ${where}@${manifest.version} is pre-1.0; it ships as a release artifact, not to npm\n`,
      );
    } else {
      process.stdout.write(`release: ${where}@${manifest.version} is ready to publish\n`);
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`release: ${problem}\n`);
    fail(`${problems.length} problem(s). Nothing was published.`);
  }

  process.stdout.write('release: the release is coherent\n');
}

function publish() {
  const dryRun = process.argv.includes('--dry-run');
  let publishedAny = false;

  for (const pkg of PACKAGES) {
    const manifest = readManifest(pkg);
    const already = publishedVersions(manifest.name);

    if (already === null) fail(`${manifest.name}: cannot reach the registry, refusing to publish`);

    if (already.has(manifest.version)) {
      process.stdout.write(
        `release: ${manifest.name}@${manifest.version} already published, skipping\n`,
      );
      continue;
    }

    if (isPrerelease(manifest.version) && !prereleasePublishAllowed()) {
      process.stdout.write(
        `release: ${manifest.name}@${manifest.version} is pre-1.0 — not publishing to npm. ` +
          'It ships as a GitHub release artifact and consumers vendor it. ' +
          'Set CORDLY_PUBLISH_PRERELEASE=1 to override.\n',
      );
      continue;
    }

    const target = join(root, pkg.dist);
    const args = ['publish', '--access', 'public', '--provenance'];
    if (dryRun) args.push('--dry-run');

    execFileSync('npm', args, {
      cwd: target,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    publishedAny = true;
    process.stdout.write(`release: published ${manifest.name}@${manifest.version}\n`);
  }

  if (!publishedAny) {
    // Deliberately says why rather than "nothing to do". The two reasons a
    // release publishes nothing — already there, or held back below 1.0 — mean
    // very different things, and a summary that blurs them is how a release that
    // should have shipped looks like one that did.
    process.stdout.write(
      'release: nothing published. Every version is either already on the registry or held back below 1.0; the lines above say which.\n',
    );
  }
}

function fail(message) {
  process.stderr.write(`release: ${message}\n`);
  process.exit(1);
}

const [command, ...rest] = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));

switch (command) {
  case 'status':
    status();
    break;
  case 'bump':
    bump(rest[0], rest[1]);
    break;
  case 'check':
    check();
    break;
  case 'publish':
    publish();
    break;
  default:
    process.stdout.write(
      'usage: release.mjs status | bump <tokens|ui|widgets> <version> | check | publish [--dry-run]\n',
    );
    process.exit(command === undefined ? 0 : 1);
}
