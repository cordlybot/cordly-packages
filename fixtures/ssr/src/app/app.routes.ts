import type { Routes } from '@angular/router';

import { FixturePage } from './fixture-page';

export const routes: Routes = [{ path: '**', component: FixturePage }];
