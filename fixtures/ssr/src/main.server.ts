import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';

import { SsrApp } from './app/app';
import { serverConfig } from './app/app.config.server';

/**
 * The `BootstrapContext` is not optional in Angular 22: without it the platform
 * cannot be created on the server, and the failure appears during route
 * extraction rather than at runtime.
 */
export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(SsrApp, serverConfig, context);
}
