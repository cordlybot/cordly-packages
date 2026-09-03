#!/usr/bin/env node
/**
 * Every component is four files; every directive is two.
 *
 * `.ts`, `.html`, `.scss`, `.spec.ts` for a component. A directive gets `.ts`
 * and `.spec.ts` and no stylesheet, because an Angular directive cannot carry
 * one — an empty `.scss` beside a directive is a file that lies about what it
 * does, and this repository would rather not have it than have it for symmetry.
 * That is a deliberate narrowing of the workspace convention, recorded in
 * AGENTS.md.
 *
 * The rule is here rather than in review because inline templates are the kind
 * of thing that arrives one at a time. Each one is defensible and the twentieth
 * has made the design system unsearchable.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roots = ['packages/ui/src', 'packages/widgets/src'];

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const problems = [];

for (const sourceRoot of roots) {
  const directory = join(root, sourceRoot);
  for (const file of walk(directory)) {
    if (!file.endsWith('.ts') || file.endsWith('.spec.ts') || file.endsWith('.d.ts')) continue;

    const source = readFileSync(file, 'utf8');
    const isComponent = /^@Component\(/m.test(source);
    const isDirective = /^@Directive\(/m.test(source);
    if (!isComponent && !isDirective) continue;

    const where = relative(root, file).replace(/\\/g, '/');
    const stem = file.slice(0, -'.ts'.length);
    const name = basename(stem);

    if (/template\s*:/.test(source)) {
      problems.push(`${where}: inline template. Use templateUrl and a ${name}.html file.`);
    }
    if (/styles\s*:/.test(source)) {
      problems.push(`${where}: inline styles. Use styleUrl and a ${name}.scss file.`);
    }

    const required = isComponent ? ['.html', '.scss', '.spec.ts'] : ['.spec.ts'];

    for (const extension of required) {
      try {
        statSync(`${stem}${extension}`);
      } catch {
        problems.push(`${where}: missing ${name}${extension}`);
      }
    }

    if (isDirective) {
      try {
        statSync(`${stem}.scss`);
        problems.push(
          `${where}: a directive has no stylesheet of its own; ${name}.scss cannot apply and should be removed.`,
        );
      } catch {
        // Correct: no stylesheet beside a directive.
      }
    }

    if (isComponent && !/changeDetection:\s*ChangeDetectionStrategy\.OnPush/.test(source)) {
      problems.push(`${where}: components are OnPush without exception.`);
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(`files: ${problem}\n`);
  process.stderr.write(`files: ${problems.length} problem(s)\n`);
  process.exit(1);
}

process.stdout.write('files: every component has its four files and every directive its two\n');
