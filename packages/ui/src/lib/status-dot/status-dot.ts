import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

import type { CordlyTone } from '../badge/badge';

export type CordlyStatusDotSize = 'sm' | 'md' | 'lg';

/**
 * A coloured dot beside a word.
 *
 * The word is required, and that requirement is the component. A dot on its own
 * encodes its meaning entirely in hue — unreadable with a colour-vision
 * deficiency, gone in forced-colours mode, and absent from a screen reader
 * altogether. Making the label an input with no default is how that stops being
 * a thing a reviewer has to catch.
 *
 * `hideLabel` exists for the case where the surrounding row already says it in
 * words. It takes the label off the screen and leaves it in the accessibility
 * tree; it does not remove it.
 *
 * ```html
 * <cordly-status-dot tone="success" label="Connected" />
 * <cordly-status-dot tone="danger" label="Offline" hideLabel />
 * ```
 */
@Component({
  selector: 'cordly-status-dot',
  templateUrl: './status-dot.html',
  styleUrl: './status-dot.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-status-dot',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[attr.data-hide-label]': 'hideLabel() ? "" : null',
    '[attr.data-live]': 'live() ? "" : null',
  },
})
export class CordlyStatusDot {
  /** What the state is, in the application's language. Never optional. */
  readonly label = input.required<string>();

  readonly tone = input<CordlyTone>('neutral');
  readonly size = input<CordlyStatusDotSize>('md');

  /** Visually hidden, still announced. For a row that already says it in words. */
  readonly hideLabel = input(false, { transform: booleanAttribute });

  /**
   * The state is being observed right now, not remembered from a page load.
   *
   * Adds a pulse. Reserved for genuinely live state, because a page where
   * everything pulses says nothing about which part is live.
   */
  readonly live = input(false, { transform: booleanAttribute });
}
