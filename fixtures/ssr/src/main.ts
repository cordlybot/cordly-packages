import { bootstrapApplication } from '@angular/platform-browser';

import { SsrApp } from './app/app';
import { appConfig } from './app/app.config';

void bootstrapApplication(SsrApp, appConfig);
