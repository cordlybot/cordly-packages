import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/** How much weight a button carries. Every view has at most one `primary`. */
export type CordlyButtonVariant = 'primary' | 'neutral' | 'quiet' | 'danger';

export type CordlyButtonSize = 'sm' | 'md' | 'lg';

/**
 * A Cordly button.
 *
 * It is a component whose selector is a native element, not a wrapper around
 * one. The `<button>` a caller wrote stays the rendered element, so keyboard
 * activation, form participation, the disabled semantics, and the accessibility
 * tree all come from the platform rather than from a reimplementation that gets
 * one of them subtly wrong. What this adds is appearance, geometry, and a
 * consistent way to say an action is running.
 *
 * ```html
 * <button cordlyButton variant="primary" (click)="apply()">Apply 3 changes</button>
 * <a cordlyButton variant="quiet" [href]="guideUrl">Read the guide</a>
 * ```
 *
 * The label is the caller's. Nothing here ships user-visible copy, because a
 * shared package cannot know which language the application speaks.
 */
@Component({
  selector: 'button[cordlyButton], a[cordlyButton]',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-block]': 'block() ? "" : null',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
})
export class CordlyButton {
  readonly variant = input<CordlyButtonVariant>('neutral');
  readonly size = input<CordlyButtonSize>('md');

  /** Fills the inline axis. Used for a full-width action on a narrow screen. */
  readonly block = input(false, { transform: booleanAttribute });

  /**
   * An action started from this button is running.
   *
   * This reports state and nothing else: `aria-busy`, a visible indicator, and
   * the label still legible beside it. It deliberately does **not** swallow the
   * next activation, and the reason is worth stating because the omission looks
   * like one.
   *
   * The two ways to block activation both cost more than they return. Native
   * `disabled` removes the control from the accessibility tree and drops focus
   * to the document, so a keyboard user loses their place every time they submit
   * something. Intercepting the event in a host listener does not work either:
   * Angular registers a component's host listeners after the listeners its
   * consumer wrote in the template, so `stopImmediatePropagation` here runs too
   * late to stop the handler it was meant to stop. A guarantee that holds only
   * for pointer users is worse than no guarantee, because it is the one nobody
   * tests.
   *
   * So the guard belongs to the action rather than to the control, which is
   * where Cordly already keeps it: every mutation carries an idempotency key, so
   * a second press repeats a request rather than repeating an effect. Callers
   * that want the control unusable can still pass `disabled`.
   */
  readonly busy = input(false, { transform: booleanAttribute });
}
