import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlyCatalogue, type CordlyCatalogueFilter } from './catalogue';

@Component({
  imports: [CordlyCatalogue],
  template: `
    <cordly-catalogue
      [total]="total()"
      [resultCount]="resultCount()"
      [filters]="filters()"
      searchLabel="Search modules"
      [countLabel]="resultCount() + ' modules'"
      filtersLabel="Categories"
      [(query)]="query"
      [(activeFilterId)]="activeFilterId"
    >
      <p class="result">Welcome messages</p>
      <p cordly-catalogue-empty class="empty">Nothing matches that search.</p>
    </cordly-catalogue>
  `,
})
class Host {
  readonly total = signal(20);
  readonly resultCount = signal(4);
  readonly filters = signal<readonly CordlyCatalogueFilter[]>([
    { id: 'moderation', label: 'Moderation', count: 6 },
    { id: 'engagement', label: 'Engagement', count: 9 },
  ]);
  query = signal('');
  activeFilterId = signal<string | null>(null);
}

describe('CordlyCatalogue', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      search: () => root.querySelector('input[type="search"]') as HTMLInputElement | null,
      chips: () => [...root.querySelectorAll<HTMLButtonElement>('.cordly-catalogue__filter')],
      count: () => root.querySelector('.cordly-catalogue__count') as HTMLElement,
    };
  }

  it('offers search once the collection is larger than the threshold', () => {
    const { search } = render();

    expect(search()).not.toBeNull();
  });

  it('hides search for a collection somebody can simply read', () => {
    // Below the threshold a search field is chrome standing between a reader and
    // a list they can already see all of.
    const { fixture, host, search } = render();

    host.total.set(6);
    fixture.detectChanges();

    expect(search()).toBeNull();
  });

  it('can be pinned on for a collection that will grow', () => {
    const { fixture, host, root } = render();

    host.total.set(3);
    fixture.detectChanges();
    expect(root.querySelector('input[type="search"]')).toBeNull();
  });

  it('names the search field with a real label, not a placeholder', () => {
    // A placeholder is not a label: it vanishes exactly when somebody has typed
    // enough to have forgotten what the field was for.
    const { root, search } = render();
    const label = root.querySelector('.cordly-catalogue__search-label') as HTMLLabelElement;

    expect(label.htmlFor).toBe(search()?.id);
    expect(label.textContent?.trim()).toBe('Search modules');
  });

  it('announces the result count, because filtering moves no focus', () => {
    // Without a live region a screen-reader user gets no signal at all that the
    // list under their cursor has changed.
    const { count, search } = render();

    expect(count().getAttribute('aria-live')).toBe('polite');
    expect(count().textContent?.trim()).toBe('4 modules');
    expect(search()?.getAttribute('aria-describedby')).toBe(count().id);
  });

  it('reports typing without filtering anything itself', () => {
    // Matching stays with the application: only it knows a module should also be
    // found by a synonym nobody put in its name.
    const { fixture, host, search } = render();
    const field = search() as HTMLInputElement;

    field.value = 'welcome';
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.query()).toBe('welcome');
  });

  it('exposes filters as toggles that say whether they are pressed', () => {
    const { fixture, chips, host } = render();

    expect(at(chips(), 0).getAttribute('aria-pressed')).toBe('false');

    at(chips(), 0).click();
    fixture.detectChanges();

    expect(host.activeFilterId()).toBe('moderation');
    expect(at(chips(), 0).getAttribute('aria-pressed')).toBe('true');
  });

  it('clears the filter when the active chip is pressed again', () => {
    // A filter set with no way back to "everything" is a trap people escape by
    // reloading the page.
    const { fixture, chips, host } = render();

    at(chips(), 0).click();
    fixture.detectChanges();
    at(chips(), 0).click();
    fixture.detectChanges();

    expect(host.activeFilterId()).toBeNull();
  });

  it('shows results, and swaps them for the empty slot when there are none', () => {
    const { fixture, host, root } = render();

    expect(root.querySelector('.result')).not.toBeNull();

    host.resultCount.set(0);
    fixture.detectChanges();

    expect(root.querySelector('.result')).toBeNull();
    expect(root.querySelector('.empty')).not.toBeNull();
  });
});
