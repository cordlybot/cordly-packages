import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Server-rendered, never prerendered.
 *
 * A prerendered page is built before any visitor exists, so it cannot read a
 * request — which is exactly the property `cordly-www` needs and gave up
 * prerendering for. Matching that here means the fixture proves the mode the
 * real consumer runs in rather than an easier one.
 */
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Server }];
