import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyChangeBar } from './change-bar';

@Component({
  imports: [CordlyChangeBar],
  template: `
    <cordly-change-bar
      [count]="count()"
      [label]="count() + ' changes staged'"
      regionLabel="Staged changes"
      discardLabel="Discard"
      reviewLabel="Review"
      (discard)="discarded.set(discarded() + 1)"
      (review)="reviewed.set(reviewed() + 1)"
    />
  `,
})
class Host {
  readonly count = signal(0);
  readonly discarded = signal(0);
  readonly reviewed = signal(0);
}

describe('CordlyChangeBar', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      region: () => root.querySelector('.cordly-change-bar__inner'),
      discard: () => root.querySelector('.cordly-change-bar__discard') as HTMLButtonElement,
      review: () => root.querySelector('.cordly-change-bar__review') as HTMLButtonElement,
    };
  }

  it('stays out of the way while the draft matches what is saved', () => {
    const { region } = render();

    expect(region()).toBeNull();
  });

  it('appears as a named region once something is staged', () => {
    // It comes and goes as a person works, so it has to be findable deliberately
    // rather than only by stumbling into it.
    const { fixture, host, region } = render();

    host.count.set(3);
    fixture.detectChanges();

    expect(region()?.getAttribute('aria-label')).toBe('Staged changes');
  });

  it('announces the count as it changes', () => {
    const { fixture, host, root } = render();

    host.count.set(3);
    fixture.detectChanges();

    const count = root.querySelector('.cordly-change-bar__count') as HTMLElement;
    expect(count.getAttribute('aria-live')).toBe('polite');
    expect(count.textContent?.trim()).toBe('3 changes staged');
  });

  it('offers review rather than apply as its primary action', () => {
    // Applying is a decision made after reading what will change, not a shortcut
    // past it. The bar can only get somebody to the reading.
    const { fixture, host, discard, review } = render();

    host.count.set(1);
    fixture.detectChanges();

    expect(review().textContent?.trim()).toBe('Review');
    expect(discard().textContent?.trim()).toBe('Discard');
  });

  it('emits both intents without acting on either', () => {
    const { fixture, host, discard, review } = render();

    host.count.set(2);
    fixture.detectChanges();

    review().click();
    discard().click();

    expect(host.reviewed()).toBe(1);
    expect(host.discarded()).toBe(1);
    // The bar holds no state: the count is still whatever the application says.
    expect(host.count()).toBe(2);
  });
});
