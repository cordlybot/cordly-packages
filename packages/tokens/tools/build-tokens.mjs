#!/usr/bin/env node
/**
 * Generate every consumable form of the Cordly tokens from one source.
 *
 *   node tools/build-tokens.mjs            write generated/
 *   node tools/build-tokens.mjs --check    regenerate into memory and compare
 *
 * `--check` is the gate. It fails when a generated file differs from what the
 * source produces, which catches both a hand-edited artefact and a generator
 * change nobody re-ran. The comparison is byte for byte on LF-normalised text,
 * so it means the same thing on Windows and in CI.
 *
 * Four outputs, because four kinds of consumer exist:
 *
 *   cordly-tokens.css      the themes, for any framework or none
 *   cordly-tokens.tailwind.css  the same tokens bound to Tailwind v4 namespaces
 *   tokens.json            machine-readable, with resolved sRGB and contrast
 *   index.js / index.d.ts  typed names for code that needs to reference one
 */

import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { source, contrastContract } from '../src/tokens.source.mjs';
import { contrastRatio, oklchToRgb, over, toHex } from './color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '..', 'generated');
const packageJson = JSON.parse(readFileSync(resolve(here, '..', 'package.json'), 'utf8'));

const check = process.argv.includes('--check');
const { prefix, defaultTheme, themes, constant } = source;
const themeNames = Object.keys(themes);
const otherTheme = themeNames.find((name) => name !== defaultTheme);

const varName = (name) => `--${prefix}-${name}`;

/* ------------------------------------------------------------------ values */

function isColorToken(value) {
  return typeof value === 'object' && value !== null && value.kind === 'oklch';
}

function cssValue(value) {
  if (!isColorToken(value)) return value;
  const { l, c, h, alpha } = value;
  const base = `${round(l, 4)} ${round(c, 4)} ${round(h, 2)}`;
  return alpha === undefined ? `oklch(${base})` : `oklch(${base} / ${round(alpha, 3)})`;
}

function round(value, places) {
  const factor = 10 ** places;
  return String(Math.round(value * factor) / factor);
}

/**
 * Resolve every colour to sRGB once, failing on anything outside the gamut.
 *
 * A clamped colour is not the colour the source asked for. Shipping one means
 * the JSON, the contrast numbers, and the browser disagree about what the token
 * is, so this refuses rather than rounding the problem away.
 */
function resolveTheme(themeName) {
  const resolved = {};
  const outOfGamut = [];
  for (const [name, value] of Object.entries(themes[themeName])) {
    if (!isColorToken(value)) continue;
    const { rgb, inGamut } = oklchToRgb(value);
    if (!inGamut) outOfGamut.push(`${themeName}/${name}`);
    resolved[name] = { rgb, alpha: value.alpha ?? 1 };
  }
  if (outOfGamut.length > 0) {
    fail(`These colours fall outside sRGB and would be clamped: ${outOfGamut.join(', ')}`);
  }
  return resolved;
}

/** A translucent token measured against the surface it actually sits on. */
function opaque(resolved, name, backdropName) {
  const token = resolved[name];
  if (token.alpha === 1) return token.rgb;
  return over(token.rgb, resolved[backdropName].rgb, token.alpha);
}

function evaluateContrast(themeName, resolved) {
  return contrastContract.map(([foreground, background, minimum]) => {
    const fg = opaque(resolved, foreground, background);
    const bg = opaque(resolved, background, 'color-canvas');
    const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100;
    return { theme: themeName, foreground, background, minimum, ratio, passes: ratio >= minimum };
  });
}

/* ------------------------------------------------------------------ output */

const BANNER = [
  '/*',
  ` * Cordly design tokens ${packageJson.version} - GENERATED, DO NOT EDIT.`,
  ' *',
  ' * Source: packages/tokens/src/tokens.source.mjs',
  ' * Regenerate: npm run tokens:build   Verify: npm run tokens:check',
  ' */',
].join('\n');

function themeBlock(themeName, selector, indent = '') {
  const lines = [`${indent}${selector} {`];
  lines.push(`${indent}  color-scheme: ${themeName};`);
  for (const [name, value] of Object.entries(themes[themeName])) {
    lines.push(`${indent}  ${varName(name)}: ${cssValue(value)};`);
  }
  lines.push(`${indent}}`);
  return lines.join('\n');
}

function constantBlock() {
  const lines = [':root {'];
  for (const [name, value] of Object.entries(constant)) {
    lines.push(`  ${varName(name)}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * The theme stylesheet.
 *
 * Three selectors per theme, and the order matters:
 *
 *   `:root`                      the default theme, always defined
 *   `[data-cordly-theme="x"]`    an explicit choice, which wins
 *   `prefers-color-scheme`       the system preference, only when no choice
 *
 * The media query is guarded by `:not([data-cordly-theme])` so an explicit
 * choice is never overridden by the operating system, and the default theme is
 * restated inside the guard so a viewer whose system asks for dark still gets
 * dark after the light branch has matched on an ancestor.
 */
function themesCss() {
  return [
    BANNER,
    '',
    '/* The default theme. Every colour is defined here, so no value has its',
    '   only definition inside a media query or a single theme block. */',
    themeBlock(defaultTheme, ':root'),
    '',
    '/* Values that do not change with the theme. */',
    constantBlock(),
    '',
    '/* An explicit choice. Set `data-cordly-theme` on <html> and nothing else',
    '   has to change; a theme swap is a variable swap, never a class swap on',
    '   every component. */',
    themeBlock(otherTheme, `[data-${prefix}-theme='${otherTheme}']`),
    '',
    themeBlock(defaultTheme, `[data-${prefix}-theme='${defaultTheme}']`),
    '',
    '/* No explicit choice: follow the system. Server-rendered pages reach this',
    '   branch on the first paint, before any script has run, which is what',
    '   stops a dark-mode visitor being shown a white page that corrects',
    '   itself on hydration. */',
    `@media (prefers-color-scheme: ${otherTheme}) {`,
    themeBlock(otherTheme, `:root:not([data-${prefix}-theme])`, '  '),
    '}',
    '',
    `@media (prefers-color-scheme: ${defaultTheme}) {`,
    themeBlock(defaultTheme, `:root:not([data-${prefix}-theme])`, '  '),
    '}',
    '',
  ].join('\n');
}

/**
 * The Tailwind v4 bridge.
 *
 * Optional, and deliberately a separate file: `@cordly/tokens` is framework
 * neutral and a consumer that does not use Tailwind should never be asked to
 * parse an `@theme` block. `inline` keeps the custom property as the single
 * source, so a utility resolves to `var(--cordly-...)` and a theme swap stays a
 * variable change.
 */
function tailwindCss() {
  const lines = [BANNER, '', "@import './cordly-tokens.css';", '', '@theme inline {'];
  const namespace = {
    color: 'color',
    space: 'spacing',
    radius: 'radius',
    'font-size': 'text',
    'font-weight': 'font-weight',
    'line-height': 'leading',
    'letter-spacing': 'tracking',
    breakpoint: 'breakpoint',
    ease: 'ease',
  };

  for (const [name] of Object.entries(themes[defaultTheme])) {
    if (name.startsWith('color-')) {
      lines.push(`  --color-${name.slice('color-'.length)}: var(${varName(name)});`);
    } else if (name.startsWith('elevation-')) {
      lines.push(`  --shadow-${name.slice('elevation-'.length)}: var(${varName(name)});`);
    }
  }
  for (const [name] of Object.entries(constant)) {
    const group = Object.keys(namespace).find((key) => name.startsWith(`${key}-`));
    if (!group) continue;
    lines.push(`  --${namespace[group]}-${name.slice(group.length + 1)}: var(${varName(name)});`);
  }
  lines.push('  --font-sans: var(--cordly-font-sans);');
  lines.push('  --font-mono: var(--cordly-font-mono);');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function tokensJson(resolvedByTheme, contrast) {
  const document = {
    $schema: './tokens.schema.json',
    name: packageJson.name,
    version: packageJson.version,
    prefix,
    defaultTheme,
    themes: Object.fromEntries(
      themeNames.map((themeName) => [
        themeName,
        Object.fromEntries(
          Object.entries(themes[themeName]).map(([name, value]) => [
            name,
            isColorToken(value)
              ? {
                  variable: varName(name),
                  css: cssValue(value),
                  oklch: { l: value.l, c: value.c, h: value.h, alpha: value.alpha ?? 1 },
                  hex: toHex(resolvedByTheme[themeName][name].rgb),
                  rgb: resolvedByTheme[themeName][name].rgb,
                }
              : { variable: varName(name), css: value },
          ]),
        ),
      ]),
    ),
    constant: Object.fromEntries(
      Object.entries(constant).map(([name, value]) => [
        name,
        { variable: varName(name), css: value },
      ]),
    ),
    contrast,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

function indexJs(contrast) {
  const names = [...Object.keys(themes[defaultTheme]), ...Object.keys(constant)].sort();
  const worst = Math.min(...contrast.map((entry) => entry.ratio));
  return [
    BANNER.replace('/*', '/*').replace(' */', ' */'),
    '',
    '/** Every token name this package defines, sorted. */',
    `export const tokenNames = ${JSON.stringify(names, null, 2)};`,
    '',
    '/** The CSS custom-property name for a token. */',
    `export function cssVar(name) {`,
    `  return '--${prefix}-' + name;`,
    '}',
    '',
    '/** The themes this package ships. The first is the default. */',
    `export const themes = ${JSON.stringify([defaultTheme, otherTheme])};`,
    '',
    '/** The attribute a host element sets to choose a theme explicitly. */',
    `export const themeAttribute = 'data-${prefix}-theme';`,
    '',
    '/** The lowest contrast ratio in the contract, across both themes. */',
    `export const minimumContrastRatio = ${worst};`,
    '',
  ].join('\n');
}

function indexDts() {
  return [
    BANNER,
    '',
    'export type CordlyTokenName = string;',
    'export declare const tokenNames: readonly CordlyTokenName[];',
    'export declare function cssVar(name: CordlyTokenName): string;',
    "export declare const themes: readonly ['dark', 'light'];",
    'export declare const themeAttribute: string;',
    'export declare const minimumContrastRatio: number;',
    '',
  ].join('\n');
}

/* ------------------------------------------------------------------- drive */

function fail(message) {
  process.stderr.write(`tokens: ${message}\n`);
  process.exit(1);
}

const resolvedByTheme = Object.fromEntries(themeNames.map((name) => [name, resolveTheme(name)]));

const contrast = themeNames.flatMap((themeName) =>
  evaluateContrast(themeName, resolvedByTheme[themeName]),
);

const failures = contrast.filter((entry) => !entry.passes);
if (failures.length > 0) {
  for (const entry of failures) {
    process.stderr.write(
      `tokens: ${entry.theme} ${entry.foreground} on ${entry.background} is ${entry.ratio}:1, needs ${entry.minimum}:1\n`,
    );
  }
  fail(`${failures.length} contrast pair(s) below the contract in generated/tokens.json`);
}

const files = {
  'cordly-tokens.css': themesCss(),
  'cordly-tokens.tailwind.css': tailwindCss(),
  'tokens.json': tokensJson(resolvedByTheme, contrast),
  'index.js': indexJs(contrast),
  'index.d.ts': indexDts(),
};

if (check) {
  const present = new Set(
    readdirSync(outDir, { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name),
  );
  const problems = [];
  for (const [name, content] of Object.entries(files)) {
    present.delete(name);
    let actual;
    try {
      actual = readFileSync(join(outDir, name), 'utf8').replace(/\r\n/g, '\n');
    } catch {
      problems.push(`${name} is missing`);
      continue;
    }
    if (actual !== content) problems.push(`${name} differs from the source`);
  }
  for (const stale of present) problems.push(`${stale} is not produced by the generator`);
  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`tokens: ${problem}\n`);
    fail('generated/ is out of date. Run: npm run tokens:build');
  }
  const digest = createHash('sha256')
    .update(Object.values(files).join(''))
    .digest('hex')
    .slice(0, 16);
  process.stdout.write(
    `tokens: generated/ matches the source (${Object.keys(files).length} files, digest ${digest})\n`,
  );
  process.stdout.write(`tokens: ${contrast.length} contrast pairs meet the contract\n`);
} else {
  mkdirSync(outDir, { recursive: true });
  for (const stale of readdirSync(outDir, { withFileTypes: true })) {
    if (stale.isFile() && !(stale.name in files)) rmSync(join(outDir, stale.name));
  }
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(outDir, name), content, 'utf8');
  }
  process.stdout.write(`tokens: wrote ${Object.keys(files).length} files to generated/\n`);
}
