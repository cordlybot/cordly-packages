import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { CompatApp } from './app';

void bootstrapApplication(CompatApp, { providers: [provideZonelessChangeDetection()] });
