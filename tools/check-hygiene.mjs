#!/usr/bin/env node
/**
 * Four things that must not be in this repository.
 *
 * 1. **A credential.** Anything shaped like a token, a key, or a connection
 *    string. Nothing here needs one, so any match is either a mistake or an
 *    incident.
 * 2. **An absolute local path.** A drive-letter path under a user profile, or
 *    a POSIX home directory, committed in a file means something was written
 *    on one machine for one machine.
 * 3. **Personal data.** An email address or a real name in source, in a fixture,
 *    or in sample data. Fixtures use reserved example domains.
 * 4. **A third-party product name.** The design system is Cordly's own, and the
 *    repository has to be able to say so without a caveat. Names are compared as
 *    hashes rather than as strings — see tools/vendor-denylist.json for why.
 *
 * The vendor check tokenises text and hashes each token, so it is exact rather
 * than substring-based: it finds the name written on its own and misses an
 * unrelated word that happens to contain the same letters.
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const denylist = JSON.parse(readFileSync(join(root, 'tools/vendor-denylist.json'), 'utf8'));
const forbiddenDigests = new Map(denylist.tokens.map((entry) => [entry.digest, entry.describes]));

const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'artifacts',
  'out-tsc',
  'coverage',
  '.angular',
  'test-results',
  'playwright-report',
]);

const TEXT = /\.(ts|mjs|js|json|md|html|scss|css|yml|yaml|txt|sh)$/;

/** Skipped for the vendor check only: it names itself by hash, on purpose. */
const DENYLIST_FILE = 'tools/vendor-denylist.json';

const secretPatterns = [
  { name: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'bearer token literal', pattern: /\bBearer\s+[A-Za-z0-9._-]{24,}/ },
  {
    name: 'database connection string',
    pattern: /\b(postgres|postgresql|mysql|mongodb):\/\/[^\s"']*:[^\s"'@]+@/,
  },
  {
    name: 'assigned secret literal',
    pattern: /\b(client_secret|api[_-]?key|password|passwd|secret)\s*[:=]\s*['"][^'"\s]{12,}['"]/i,
  },
];

const pathPatterns = [
  { name: 'Windows absolute path', pattern: /[A-Za-z]:\\+(Users|Program Files|home)\\/i },
  { name: 'POSIX home path', pattern: /(^|[\s"'(])\/(home|Users)\/[A-Za-z0-9._-]+\// },
];

/**
 * Reserved example domains are the only ones allowed to appear.
 *
 * RFC 2606 sets `example.com` and `.invalid` aside precisely so documentation
 * and fixtures can name a host without naming somebody's actual host.
 */
const ALLOWED_EMAIL_DOMAINS = /@(example\.(com|org|net)|.*\.invalid)$/i;
const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (SKIP_DIRECTORIES.has(entry)) continue;
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (TEXT.test(entry)) files.push(full);
  }
  return files;
}

const problems = [];
let scanned = 0;

for (const file of walk(root)) {
  const where = relative(root, file).replace(/\\/g, '/');
  const content = readFileSync(file, 'utf8');
  scanned += 1;

  const lines = content.split('\n');

  for (const [index, line] of lines.entries()) {
    for (const rule of secretPatterns) {
      if (rule.pattern.test(line)) problems.push(`${where}:${index + 1}: ${rule.name}`);
    }
    for (const rule of pathPatterns) {
      if (rule.pattern.test(line)) problems.push(`${where}:${index + 1}: ${rule.name}`);
    }
    for (const address of line.match(emailPattern) ?? []) {
      if (!ALLOWED_EMAIL_DOMAINS.test(address)) {
        problems.push(
          `${where}:${index + 1}: an email address that is not a reserved example domain`,
        );
      }
    }
  }

  if (where === DENYLIST_FILE) continue;

  // Tokenise the way the denylist was built: lowercase, split on anything that
  // is not a letter or a digit. Adjacent pairs are joined as well, so a name
  // written with a space or a hyphen in the middle is still found.
  const words = content
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const candidates = new Set(words);
  for (let index = 0; index < words.length - 1; index += 1) {
    candidates.add(`${words[index]}${words[index + 1]}`);
  }

  for (const candidate of candidates) {
    const digest = createHash('sha256').update(candidate).digest('hex');
    const description = forbiddenDigests.get(digest);
    if (description) {
      problems.push(
        `${where}: a third-party product name appears here. ${description} Replace it with vendor-neutral language that keeps the technical meaning.`,
      );
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(`hygiene: ${problem}\n`);
  process.stderr.write(`hygiene: ${problems.length} problem(s) in ${scanned} files\n`);
  process.exit(1);
}

process.stdout.write(
  `hygiene: ${scanned} files carry no credential, local path, personal address, or third-party product name\n`,
);
