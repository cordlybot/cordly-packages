import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

/**
 * The Cordly link treatment.
 *
 * Applied to an anchor the caller already wrote, so routing stays the
 * application's business: this package has no opinion about how a destination
 * is resolved and never imports a router.
 *
 * ```html
 * <a cordlyLink [routerLink]="['/servers']">All servers</a>
 * <a cordlyLink external href="https://example.invalid/status">Status page</a>
 * ```
 */
@Component({
  selector: 'a[cordlyLink]',
  templateUrl: './link.html',
  styleUrl: './link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-link',
    '[attr.data-external]': 'external() ? "" : null',
    '[attr.target]': 'target()',
    '[attr.rel]': 'rel()',
  },
})
export class CordlyLink {
  /**
   * The destination leaves this application.
   *
   * Adds a visual marker, opens in a new context, and sets `rel` so the opened
   * page cannot reach back through `window.opener`. Modern browsers imply
   * `noopener` for `target="_blank"`, but stating it keeps the guarantee out of
   * the browser's hands and makes the intent readable in the DOM.
   */
  readonly external = input(false, { transform: booleanAttribute });

  protected readonly target = computed(() => (this.external() ? '_blank' : null));
  protected readonly rel = computed(() => (this.external() ? 'noopener noreferrer' : null));
}
