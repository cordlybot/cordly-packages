import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Where a staged change came from. Shown, because it changes how it is read. */
export type CordlyChangeOrigin = 'person' | 'assistant' | 'template';

/**
 * How far along a single change is.
 *
 * `blocked` and `failed` are separate on purpose: one never ran because
 * something was wrong with it, the other ran and did not work. Collapsing them
 * makes a validation error look like an outage.
 */
export type CordlyChangeStatus = 'staged' | 'applying' | 'applied' | 'blocked' | 'failed';

/** How hard this change is to undo. Drives how much confirmation it deserves. */
export type CordlyChangeRisk = 'reversible' | 'disruptive' | 'irreversible';

/**
 * One staged change, as plain text.
 *
 * Every field is a string the caller already resolved and translated. The widget
 * never sees a DTO, an identifier it has to look up, or a value it has to
 * format — which is what lets the same list render a role change, a channel
 * change, and a retention-period change without knowing what any of them are.
 */
export interface CordlyChangeRow {
  readonly id: string;
  /** What is being changed, in the user's words. */
  readonly summary: string;
  readonly before: string;
  readonly after: string;
  readonly origin: CordlyChangeOrigin;
  readonly status: CordlyChangeStatus;
  readonly risk?: CordlyChangeRisk;
  /** Why it is blocked or what failed. Required reading when the status says so. */
  readonly detail?: string;
}

/** Changes belong to something — a server, a module. The caller says what. */
export interface CordlyChangeGroup {
  readonly id: string;
  readonly label: string;
  readonly rows: readonly CordlyChangeRow[];
}

/**
 * The surface where a person reads what they are about to change.
 *
 * Before, after, origin, status, and risk on every row, grouped by whatever the
 * caller groups by. This is the widget the whole staged-change model exists for:
 * one review surface for a manual edit and an assistant proposal alike, so
 * approving something the model wrote uses the same reading and the same
 * confirmation as approving something a person typed.
 *
 * It renders and it emits. It does not apply anything, it does not know what an
 * approval is, and it holds no state — the application owns the staged set,
 * because the staged set is the thing that has to survive a navigation.
 */
@Component({
  selector: 'cordly-review-list',
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-review-list' },
})
export class CordlyReviewList {
  readonly groups = input.required<readonly CordlyChangeGroup[]>();

  /** Words for each status and origin, in the application's language. */
  readonly statusLabels = input.required<Readonly<Record<CordlyChangeStatus, string>>>();
  readonly originLabels = input.required<Readonly<Record<CordlyChangeOrigin, string>>>();
  readonly riskLabels = input.required<Readonly<Record<CordlyChangeRisk, string>>>();

  /** "was" and "becomes", named so a screen reader hears which value is which. */
  readonly beforeLabel = input.required<string>();
  readonly afterLabel = input.required<string>();

  /** Per-row removal. Absent label means the list is read-only. */
  readonly discardLabel = input<string | null>(null);

  readonly discardRow = output<CordlyChangeRow>();
}
