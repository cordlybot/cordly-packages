#!/usr/bin/env node
/**
 * A static file server for the browser fixture, with no dependencies.
 *
 * The fixture is a single-page application, so anything that is not a file on
 * disk falls back to `index.html`. That is the one behaviour a real deployment
 * has that a naive file server does not, and getting it wrong makes a deep link
 * 404 in the test suite for a reason that has nothing to do with the packages.
 *
 *   node tools/serve-static.mjs <directory> <port>
 */

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [directoryArgument, portArgument] = process.argv.slice(2);
if (!directoryArgument) {
  process.stderr.write('serve-static: a directory is required\n');
  process.exit(1);
}

const rootDirectory = resolve(directoryArgument);
const port = Number(portArgument ?? 4400);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  // `normalize` after stripping the leading slash, then a containment check:
  // a path that escapes the root is a traversal attempt, not a missing file.
  const candidate = resolve(join(rootDirectory, normalize(decodeURIComponent(urlPath))));
  if (!candidate.startsWith(rootDirectory)) return null;

  try {
    if (statSync(candidate).isFile()) return candidate;
  } catch {
    // Falls through to the single-page fallback below.
  }
  return join(rootDirectory, 'index.html');
}

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const file = resolveFile(url.pathname === '/' ? '/index.html' : url.pathname);

  if (file === null) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  response.writeHead(200, {
    'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, () => {
  process.stdout.write(`serve-static: ${rootDirectory} on http://localhost:${port}\n`);
});
