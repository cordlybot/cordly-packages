import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { cordlyId } from '@cordly/ui';

/**
 * A titled block of content inside a page.
 *
 * The plain one. `cordly-settings-section` is its sibling and does more — an
 * aside for the section's own control, a notice slot, a named disclosure for
 * advanced options — because a configuration section has those parts. Most
 * sections do not, and giving them a component with five unused slots makes
 * every call site harder to read than the markup it replaced.
 *
 * It renders a real `<region>` named by its own heading, so the section appears
 * in a landmark list and can be jumped to. That is the part worth having in a
 * package: it is one attribute and an id, and it is the first thing dropped when
 * a page is written by hand.
 *
 * ```html
 * <cordly-section heading="Recent changes" description="The last ten applied.">
 *   <a cordly-section-actions cordlyLink [routerLink]="auditLink">See all</a>
 *   …rows…
 * </cordly-section>
 * ```
 */
@Component({
  selector: 'cordly-section',
  templateUrl: './section.html',
  styleUrl: './section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-section',
    role: 'region',
    '[attr.aria-labelledby]': 'headingId',
  },
})
export class CordlySection {
  readonly heading = input.required<string>();
  readonly description = input<string | null>(null);

  protected readonly headingId = cordlyId('section');
}
