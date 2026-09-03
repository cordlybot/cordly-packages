import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type CordlyCardDensity = 'comfortable' | 'compact';
export type CordlyCardElevation = 'flat' | 'raised';

/**
 * A card groups exactly one decision.
 *
 * Three content slots, all optional: `cordly-card-media`, `cordly-card-header`,
 * and `cordly-card-footer`, with the default slot as the body.
 *
 * ```html
 * <cordly-card>
 *   <h3 cordly-card-header>Welcome messages</h3>
 *   <p>Greets a member the first time they post.</p>
 * </cordly-card>
 * ```
 *
 * When a card is the target of a navigation, apply the selector to the anchor
 * or button itself rather than wrapping one:
 *
 * ```html
 * <a cordlyCard interactive [routerLink]="link">…</a>
 * ```
 *
 * That is deliberate. A card containing a title link, a background click
 * handler, and a separate button is three overlapping targets, and it reads to a
 * screen reader as three unrelated controls describing the same thing.
 */
@Component({
  selector: 'cordly-card, a[cordlyCard], button[cordlyCard]',
  templateUrl: './card.html',
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-card',
    '[attr.data-density]': 'density()',
    '[attr.data-elevation]': 'elevation()',
    '[attr.data-interactive]': 'interactive() ? "" : null',
  },
})
export class CordlyCard {
  readonly density = input<CordlyCardDensity>('comfortable');
  readonly elevation = input<CordlyCardElevation>('flat');

  /**
   * The card is itself the control. Only meaningful on an anchor or a button;
   * on a `<cordly-card>` element it would produce a hover affordance with
   * nothing behind it, which is worse than no affordance at all.
   */
  readonly interactive = input(false, { transform: booleanAttribute });
}
