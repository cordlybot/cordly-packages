import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The smallest server that can host the fixture.
 *
 * It exists to prove one thing: that the packages render without a browser and
 * that what they render hydrates cleanly. So it has no API, no session, no
 * cookies, and no configuration — nothing that could make a failure here mean
 * something other than a rendering problem.
 */
const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();

/**
 * Angular 22 refuses a request whose `Host` header it was not told about, which
 * is a server-side request forgery defence and a good default. A fixture is
 * reached at `localhost`, so that is what it allows; a real deployment names its
 * own hostnames instead of widening this to `*`.
 */
const angularApp = new AngularNodeAppEngine({
  allowedHosts: (process.env['NG_ALLOWED_HOSTS'] ?? 'localhost,127.0.0.1').split(','),
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((request, response, next) => {
  angularApp
    .handle(request)
    .then((result) => (result ? writeResponseToNodeResponse(result, response) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4401);
  app.listen(port, () => {
    process.stdout.write(`fixture-ssr listening on http://localhost:${port}\n`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
