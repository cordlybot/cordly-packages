import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { FixtureApp } from './app/app';

/**
 * The fixture is zoneless because both real consumers are. A primitive that
 * only updates under zones would pass a test here and fail in the panel.
 */
void bootstrapApplication(FixtureApp, {
  providers: [provideZonelessChangeDetection()],
});
