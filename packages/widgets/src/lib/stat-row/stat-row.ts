import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * One figure worth showing.
 *
 * `meaning` is required, and that is the point of the type. The UX plan says a
 * metric appears only when it leads to an interpretation or an action, so the
 * interpretation is not optional: a row of numbers a reader cannot act on is
 * decoration that costs them the time it takes to read it. Making the field
 * required means the rule is enforced by the compiler rather than by a reviewer
 * remembering it.
 */
export interface CordlyStat {
  readonly id: string;
  readonly label: string;
  /** Already formatted in the caller's locale. Grouping and units differ by language. */
  readonly value: string;
  /** What the figure tells the reader, in one short phrase. */
  readonly meaning: string;
  readonly tone?: 'neutral' | 'warning' | 'danger';
  /** Turns the tile into one button. The label is what a screen reader reads. */
  readonly action?: { readonly label: string };
}

/**
 * A row of figures across the top of an overview.
 *
 * A tile with an action is rendered as one button, not as a panel with a link
 * inside it — the same rule the card follows, and for the same reason.
 */
@Component({
  selector: 'cordly-stat-row',
  templateUrl: './stat-row.html',
  styleUrl: './stat-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-stat-row' },
})
export class CordlyStatRow {
  readonly stats = input.required<readonly CordlyStat[]>();

  /** Accessible name for the group, so the row is one landmark rather than four. */
  readonly label = input.required<string>();

  readonly activate = output<CordlyStat>();
}
