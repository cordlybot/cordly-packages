import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  isDevMode,
} from '@angular/core';

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
    '[attr.data-stretch]': 'stretch() ? "" : null',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
})
export class CordlyButton {
  readonly variant = input<CordlyButtonVariant>('neutral');
  readonly size = input<CordlyButtonSize>('md');

  /** Fills the inline axis. Used for a full-width action on a narrow screen. */
  readonly block = input(false, { transform: booleanAttribute });

  /**
   * The hit area is the card this control sits in, not the control's own box.
   *
   * A chooser tile wants the whole card clickable while the page still has
   * exactly one focusable control per card. The usual way to write that is an
   * absolutely positioned `::after` on the link, and doing it from outside this
   * package fails twice over, silently:
   *
   * - This package already owns `::after` on every control, to pad a small
   *   target up to the 44px the UX plan makes a release gate. A caller's own
   *   `::after` replaces that padding and nothing says so.
   * - Owning that pseudo also means the control is `position: relative`, so the
   *   caller's `inset: 0` resolves against the control rather than against the
   *   card, and the "stretched" overlay comes out exactly button-sized.
   *
   * Both failures look correct in a screenshot and in every jsdom test; the
   * panel shipped with them until its browser suite measured what was actually
   * under the pointer. So the package names the pattern instead of leaving
   * callers to fight it for a pseudo-element.
   *
   * The caller still owns the card: the overlay covers the nearest positioned
   * ancestor, which is checked in development because a missing one stretches
   * the hit area to the whole viewport.
   */
  readonly stretch = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (!isDevMode()) return;

    // Checked once, after the first render. A control that becomes stretched
    // later is not a case any Cordly surface has, and re-checking on every
    // change would mean reading layout on a hot path to catch it.
    afterNextRender(() => {
      if (!this.stretch()) return;

      for (
        let ancestor = this.host.nativeElement.parentElement;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        if (getComputedStyle(ancestor).position !== 'static') return;
      }

      throw new Error(
        'cordly-button: stretch needs a positioned ancestor to cover. Give the card position: relative; without one the hit area spans the whole viewport.',
      );
    });
  }

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
