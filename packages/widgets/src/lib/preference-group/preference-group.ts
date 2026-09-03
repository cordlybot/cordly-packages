import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { cordlyId } from '@cordly/ui';

/** One choice. The label is the caller's, already translated. */
export interface CordlyPreferenceOption {
  readonly id: string;
  readonly label: string;
}

/**
 * A small closed set of choices, presented as one control.
 *
 * Built for display preferences — theme, density, motion — which is why it takes
 * a value and emits one and does nothing else. It does not read a cookie, write
 * a cookie, or know that a preference is shared across a domain. That belongs to
 * the application: where a preference is stored is a decision with a privacy
 * dimension and a deployment dimension, and neither is a shared widget's to make.
 *
 * ```html
 * <cordly-preference-group
 *   label="Theme"
 *   [options]="themeOptions()"
 *   [(value)]="theme"
 * />
 * ```
 */
@Component({
  selector: 'cordly-preference-group',
  templateUrl: './preference-group.html',
  styleUrl: './preference-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-preference-group' },
})
export class CordlyPreferenceGroup {
  readonly label = input.required<string>();
  readonly options = input.required<readonly CordlyPreferenceOption[]>();
  readonly description = input<string | null>(null);

  readonly value = model<string | null>(null);

  /**
   * Radios are grouped by `name`, and the grouping is what makes arrow keys move
   * between exactly these options. Two preference groups on one page sharing a
   * name would behave as a single control with the choices of both.
   */
  protected readonly groupName = cordlyId('preference');

  protected choose(id: string): void {
    this.value.set(id);
  }
}
