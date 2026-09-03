/**
 * What `@cordly/tokens` promises, as tests.
 *
 * These run on the *generated* files rather than on the source, because the
 * generated files are what a consumer installs. A guarantee proved against the
 * authoring format and not the artefact is a guarantee about the wrong thing.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, '..');
const generated = join(pkgDir, 'generated');

const css = readFileSync(join(generated, 'cordly-tokens.css'), 'utf8');
const tailwind = readFileSync(join(generated, 'cordly-tokens.tailwind.css'), 'utf8');
const tokens = JSON.parse(readFileSync(join(generated, 'tokens.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));

/** The declarations inside one top-level block, keyed by custom property. */
function blockOf(source, selector) {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `selector not found: ${selector}`);
  const end = source.indexOf('\n}', start);
  const body = source.slice(start, end);
  return Object.fromEntries(
    [...body.matchAll(/(--cordly-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
}

test('both themes define exactly the same set of tokens', () => {
  const dark = Object.keys(tokens.themes.dark).sort();
  const light = Object.keys(tokens.themes.light).sort();
  assert.deepEqual(
    dark,
    light,
    'a token defined in one theme only would look finished until toggled',
  );
  assert.ok(dark.length > 40, 'the theme should be a complete palette, not a stub');
});

test('no colour has its only definition inside a media query', () => {
  // Everything the root block defines is present before any media query runs,
  // so a viewer with an unusual `prefers-color-scheme` still gets a full theme.
  const root = blockOf(css, ':root');
  for (const name of Object.keys(tokens.themes[tokens.defaultTheme])) {
    assert.ok(root[`--cordly-${name}`], `${name} is missing from :root`);
  }
});

test('an explicit theme choice overrides the system preference', () => {
  // The media query is guarded, so `data-cordly-theme` wins in both directions.
  assert.match(css, /@media \(prefers-color-scheme: light\)/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /:root:not\(\[data-cordly-theme\]\)/);
  assert.match(css, /\[data-cordly-theme='light'\]/);
  assert.match(css, /\[data-cordly-theme='dark'\]/);
});

test('each theme block declares its own color-scheme', () => {
  // Without this the browser paints its native form controls and scrollbars for
  // the wrong theme, which is the one part of theming CSS cannot restyle.
  assert.equal(blockOf(css, ':root')['--cordly-color-canvas'] !== undefined, true);
  assert.match(css, /\[data-cordly-theme='light'\] \{\n {2}color-scheme: light;/);
  assert.match(css, /\[data-cordly-theme='dark'\] \{\n {2}color-scheme: dark;/);
});

test('every contrast pair in the contract meets its minimum in both themes', () => {
  assert.ok(tokens.contrast.length > 0, 'the contract must not be empty');
  const failures = tokens.contrast.filter((entry) => !entry.passes);
  assert.deepEqual(failures, [], 'a failing pair is a release blocker, not a warning');
  for (const theme of ['dark', 'light']) {
    assert.ok(
      tokens.contrast.some((entry) => entry.theme === theme),
      `${theme} is not covered by the contrast contract`,
    );
  }
});

test('token names describe a role, never a colour or a palette step', () => {
  // `--grey-800` survives no palette change, and a component that asked for grey
  // has opted out of theming without saying so.
  const forbidden =
    /(^|-)(red|green|blue|yellow|orange|purple|violet|grey|gray|black|white|blurple)(-|$)|-\d{2,3}$/;
  for (const name of Object.keys(tokens.themes.dark)) {
    assert.doesNotMatch(name, forbidden, `${name} names an appearance rather than a role`);
  }
});

test('the motion vocabulary is closed', () => {
  // Four durations and three curves. A component needing a fifth is usually
  // doing something the design does not ask for; adding one is a token change
  // and a review, not a number typed into a stylesheet.
  const durations = Object.keys(tokens.constant).filter((n) => n.startsWith('duration-'));
  const eases = Object.keys(tokens.constant).filter((n) => n.startsWith('ease-'));
  assert.deepEqual(durations.sort(), [
    'duration-ambient',
    'duration-fast',
    'duration-instant',
    'duration-slow',
  ]);
  assert.deepEqual(eases.sort(), ['ease-ambient', 'ease-exit', 'ease-standard']);
});

test('the token set covers every group the design system needs', () => {
  const groups = [
    'space-',
    'radius-',
    'font-size-',
    'line-height-',
    'font-weight-',
    'breakpoint-',
    'layer-',
    'focus-ring-',
    'control-height-',
  ];
  for (const group of groups) {
    assert.ok(
      Object.keys(tokens.constant).some((name) => name.startsWith(group)),
      `no ${group}* tokens are defined`,
    );
  }
  assert.ok(Object.keys(tokens.themes.dark).some((n) => n.startsWith('elevation-')));
});

test('the minimum pointer target is at least 44 CSS pixels', () => {
  // The UX plan makes this a release gate rather than a preference.
  assert.equal(tokens.constant['target-min'].css, '2.75rem');
});

test('the Tailwind bridge is optional and derives from the same variables', () => {
  // A consumer that does not use Tailwind must never be asked to parse an
  // `@theme` block, which is why this is a separate entry point.
  assert.match(tailwind, /@import '\.\/cordly-tokens\.css';/);
  assert.match(tailwind, /--color-accent: var\(--cordly-color-accent\);/);
  assert.doesNotMatch(
    tailwind,
    /oklch\(/,
    'the bridge must reference variables, never restate values',
  );
});

test('every declared export resolves to a shipped file', () => {
  const paths = [];
  const walk = (value) => {
    if (typeof value === 'string') paths.push(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(manifest.exports);
  for (const relative of paths) {
    assert.doesNotThrow(
      () => readFileSync(join(pkgDir, relative)),
      `${relative} is exported but not present`,
    );
  }
});

test('the package declares CSS as side-effectful and nothing else', () => {
  // Getting this wrong in either direction is a real bug: `false` lets a bundler
  // drop the stylesheet, and `true` keeps dead JavaScript in every consumer.
  assert.deepEqual(manifest.sideEffects, ['*.css']);
});

test('the package is framework neutral', () => {
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.peerDependencies, undefined);
  assert.doesNotMatch(css, /angular/i);
});
