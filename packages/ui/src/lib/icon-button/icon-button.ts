import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  isDevMode,
} from '@angular/core';

export type CordlyIconButtonSize = 'sm' | 'md' | 'lg';

/** `quiet` is transparent until hovered; `solid` reads as a control at rest. */
export type CordlyIconButtonVariant = 'quiet' | 'solid';

/**
 * A control whose only visible content is a glyph.
 *
 * The accessible name is mandatory and is checked at runtime in development,
 * because this is the single easiest accessibility defect to ship: the icon
 * conveys the action to a sighted user and the control is anonymous to everyone
 * else, and nothing about the page looks wrong.
 *
 * ```html
 * <button cordlyIconButton aria-label="Dismiss notice" (click)="dismiss()">
 *   <svg …></svg>
 * </button>
 * ```
 *
 * The SVG is the caller's. This package ships no icon set and takes no
 * dependency on one, so an application can change icon provider without a
 * release here.
 */
@Component({
  selector: 'button[cordlyIconButton], a[cordlyIconButton]',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-icon-button',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
})
export class CordlyIconButton {
  readonly size = input<CordlyIconButtonSize>('md');
  readonly variant = input<CordlyIconButtonVariant>('quiet');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (!isDevMode()) return;

    // After the first render rather than in the constructor: `aria-labelledby`
    // may point at an element that does not exist yet, and a check that runs too
    // early reports a defect the application does not have.
    afterNextRender(() => {
      const element = this.host.nativeElement;
      const named =
        element.hasAttribute('aria-label') ||
        element.hasAttribute('aria-labelledby') ||
        element.hasAttribute('title') ||
        element.textContent.trim().length > 0;

      if (!named) {
        throw new Error(
          'cordlyIconButton: an icon-only control needs an accessible name. Add aria-label, or aria-labelledby pointing at visible text.',
        );
      }
    });
  }
}
