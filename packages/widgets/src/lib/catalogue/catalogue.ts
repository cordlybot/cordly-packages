import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  numberAttribute,
  output,
} from '@angular/core';
import { cordlyId } from '@cordly/ui';

/** One filter chip. `count` is shown when the caller knows it. */
export interface CordlyCatalogueFilter {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
}

/**
 * The frame around a searchable, filterable collection.
 *
 * It owns the search field, the filter chips, the result count, and the empty
 * slot. It does not own the results, and it does not do the filtering: matching
 * is the application's, because only the application knows that a module should
 * also be found by a synonym nobody put in its name.
 *
 * Two rules from the UX plan are enforced here rather than left to each caller:
 *
 * - **Search appears above eight choices.** Below that it is chrome in the way
 *   of a list a person can already read. `searchThreshold` moves the line;
 *   `alwaysSearchable` pins it on.
 * - **The count is announced.** Filtering changes what is on screen without
 *   moving focus, so a screen-reader user gets no signal at all unless the
 *   result count is in a live region.
 *
 * ```html
 * <cordly-catalogue
 *   [total]="modules().length"
 *   [resultCount]="visible().length"
 *   [filters]="categories()"
 *   [(query)]="query"
 *   [(activeFilterId)]="category"
 *   searchLabel="Search modules"
 *   [countLabel]="t('catalogue.count', { count: visible().length })"
 *   filtersLabel="Categories"
 * >
 *   …result cards…
 *   <cordly-empty-state cordly-catalogue-empty …/>
 * </cordly-catalogue>
 * ```
 */
@Component({
  selector: 'cordly-catalogue',
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-catalogue' },
})
export class CordlyCatalogue {
  /** How many items exist before filtering. Decides whether search is offered. */
  readonly total = input.required({ transform: numberAttribute });

  /** How many are showing now. Zero renders the empty slot. */
  readonly resultCount = input.required({ transform: numberAttribute });

  readonly filters = input<readonly CordlyCatalogueFilter[]>([]);

  readonly searchLabel = input.required<string>();

  /** The already-pluralised result sentence, in the application's language. */
  readonly countLabel = input.required<string>();

  /** Accessible name for the filter group. */
  readonly filtersLabel = input.required<string>();

  readonly searchPlaceholder = input<string | null>(null);

  /** Above this many items, search is offered. The UX plan puts the line at eight. */
  readonly searchThreshold = input(8, { transform: numberAttribute });

  /** Offer search regardless of size — for a collection that grows. */
  readonly alwaysSearchable = input(false);

  readonly query = model('');
  readonly activeFilterId = model<string | null>(null);

  readonly queryChanged = output<string>();

  protected readonly searchId = cordlyId('catalogue-search');
  protected readonly countId = `${this.searchId}-count`;

  protected readonly searchable = computed(
    () => this.alwaysSearchable() || this.total() > this.searchThreshold(),
  );

  protected readonly empty = computed(() => this.resultCount() === 0);

  protected handleQuery(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.query.set(next);
    this.queryChanged.emit(next);
  }

  protected chooseFilter(filter: CordlyCatalogueFilter): void {
    // Pressing the active chip clears it. A filter set with no way back to
    // "everything" is a trap people solve by reloading the page.
    this.activeFilterId.update((current) => (current === filter.id ? null : filter.id));
  }
}
