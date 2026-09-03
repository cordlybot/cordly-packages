import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Text for assistive technology that is not painted on screen.
 *
 * Used where a visual cue carries meaning a screen reader cannot see: the word
 * behind a status dot, the object of an icon-only action, the heading a region
 * is named by. It is not a place to put instructions sighted users would also
 * benefit from — if it is worth saying, it is usually worth showing.
 *
 * ```html
 * <h2 cordlyVisuallyHidden>Staged changes</h2>
 * ```
 */
@Component({
  selector:
    'span[cordlyVisuallyHidden], h1[cordlyVisuallyHidden], h2[cordlyVisuallyHidden], h3[cordlyVisuallyHidden], legend[cordlyVisuallyHidden]',
  templateUrl: './visually-hidden.html',
  styleUrl: './visually-hidden.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-visually-hidden' },
})
export class CordlyVisuallyHidden {}
