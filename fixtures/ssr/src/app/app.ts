import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The shell.
 *
 * A router is present because Angular's `server` output mode extracts routes at
 * build time to decide what each one renders as. This fixture has exactly one
 * route and renders it on the server, which is the mode `cordly-www` runs in.
 */
@Component({
  selector: 'fixture-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsrApp {}
