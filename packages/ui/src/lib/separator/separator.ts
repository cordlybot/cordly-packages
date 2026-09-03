import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type CordlySeparatorOrientation = 'horizontal' | 'vertical';

/**
 * A rule between things.
 *
 * Decorative by default, and that default is the useful part. A separator
 * exposed to assistive technology puts the word "separator" between every pair
 * of rows in a list — noise a sighted reader skips past without noticing and a
 * screen-reader user has to listen to. `semantic` opts back in for the case
 * where the rule genuinely divides two regions and removing it would change how
 * the page reads.
 */
@Component({
  selector: 'cordly-separator',
  templateUrl: './separator.html',
  styleUrl: './separator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-separator',
    '[attr.data-orientation]': 'orientation()',
    '[attr.role]': 'role()',
    '[attr.aria-orientation]': 'ariaOrientation()',
  },
})
export class CordlySeparator {
  readonly orientation = input<CordlySeparatorOrientation>('horizontal');

  /** The rule divides two regions rather than decorating a list. */
  readonly semantic = input(false, { transform: booleanAttribute });

  protected readonly role = computed(() => (this.semantic() ? 'separator' : 'presentation'));

  // `aria-orientation` only means anything on a real separator, and horizontal
  // is already the implicit value — stating it adds a word for no information.
  protected readonly ariaOrientation = computed(() =>
    this.semantic() && this.orientation() === 'vertical' ? 'vertical' : null,
  );
}
