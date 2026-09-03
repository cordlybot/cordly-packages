import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The bubble a `[cordlyTooltip]` shows. Created by the directive, not by hand.
 *
 * `role="tooltip"` and an id, so the anchor can point `aria-describedby` at it.
 * It is exported because a consumer's own overlay may need to render one, not
 * because it is meant to be placed directly.
 */
@Component({
  selector: 'cordly-tooltip-panel',
  templateUrl: './tooltip-panel.html',
  styleUrl: './tooltip-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-tooltip-panel',
    role: 'tooltip',
  },
})
export class CordlyTooltipPanel {
  readonly text = input.required<string>();
}
