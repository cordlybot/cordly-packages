import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The tone vocabulary, closed.
 *
 * Four of these are status — information, success, warning, danger — and they
 * answer "how is this going?". `accent` is not: it is emphasis, and it answers
 * "is this the one to look at?". They are in one union because they occupy the
 * same slot on a component, and kept distinct in the documentation because a
 * badge that uses `accent` to mean "healthy" has said nothing.
 *
 * `neutral` carries no colour at all.
 */
export type CordlyTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

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
