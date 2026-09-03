import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
  output,
} from '@angular/core';

/**
 * The sticky bar that says a draft differs from what is saved.
 *
 * One bar, in one place, for every kind of edit — a toggle, a field, a proposal
 * the assistant wrote. The alternative, which is what most configuration
 * interfaces end up with, is a Save button on some pages and a bare "unsaved
 * changes" pill on others, and a person who cannot tell from the page whether
 * their work is safe.
 *
 * It carries a count and two verbs and nothing else. `Discard` and `Review` are
 * both the caller's words, because this package ships no copy — and the count is
 * the caller's too, formatted in their locale, because "3 changes" pluralises
 * differently in most of them.
 *
 * ```html
 * <cordly-change-bar
 *   [count]="staged().length"
 *   [label]="t('changes.staged', { count: staged().length })"
 *   [regionLabel]="t('changes.region')"
 *   [discardLabel]="t('changes.discard')"
 *   [reviewLabel]="t('changes.review')"
 *   (discard)="drop()"
 *   (review)="openReview()"
 * />
 * ```
 */
@Component({
  selector: 'cordly-change-bar',
  templateUrl: './change-bar.html',
  styleUrl: './change-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-change-bar',
    '[attr.data-visible]': 'visible() ? "" : null',
  },
})
export class CordlyChangeBar {
  /** How many settings differ from the saved state. Zero hides the bar. */
  readonly count = input.required({ transform: numberAttribute });

  /** The already-pluralised sentence, in the application's language. */
  readonly label = input.required<string>();

  /**
   * Accessible name for the region.
   *
   * The bar appears and disappears as a person works, so it is a landmark they
   * need to be able to find deliberately rather than stumble into.
   */
  readonly regionLabel = input.required<string>();

  readonly discardLabel = input.required<string>();
  readonly reviewLabel = input.required<string>();

  readonly discard = output();
  readonly review = output();

  protected readonly visible = computed(() => this.count() > 0);
}
