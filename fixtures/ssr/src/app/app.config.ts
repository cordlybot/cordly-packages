import { provideZonelessChangeDetection, type ApplicationConfig } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

/**
 * Hydration with event replay, which is the configuration that actually
 * exercises the packages.
 *
 * Plain hydration only checks that the DOM the browser builds matches the DOM
 * the server sent. Event replay additionally requires that a control the server
 * rendered can be pressed before Angular has finished booting — so a component
 * that only becomes interactive after its first client render fails here rather
 * than in production, where it looks like a click that did nothing.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
