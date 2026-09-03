import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The five states this system distinguishes. `neutral` carries no colour. */
export type CordlyTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/**
 * A small, non-interactive state label.
 *
 * The text is required and the colour is an accompaniment, never the message.
 * A badge whose only content is a coloured dot communicates nothing to a reader
 * with a colour-vision deficiency, in forced-colours mode, or on a printout.
 *
 * ```html
 * <cordly-badge tone="warning">Needs attention</cordly-badge>
 * ```
 */
@Component({
  selector: 'cordly-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-badge',
    '[attr.data-tone]': 'tone()',
  },
})
export class CordlyBadge {
  readonly tone = input<CordlyTone>('neutral');
}
