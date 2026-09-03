import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlyReviewList, type CordlyChangeGroup, type CordlyChangeRow } from './review-list';

@Component({
  imports: [CordlyReviewList],
  template: `
    <cordly-review-list
      [groups]="groups()"
      [statusLabels]="{
        staged: 'Staged',
        applying: 'Applying',
        applied: 'Applied',
        blocked: 'Blocked',
        failed: 'Failed',
      }"
      [originLabels]="{ person: 'You', assistant: 'Assistant', template: 'Template' }"
      [riskLabels]="{
        reversible: 'Reversible',
        disruptive: 'Disruptive',
        irreversible: 'Cannot be undone',
      }"
      beforeLabel="Was"
      afterLabel="Becomes"
      [discardLabel]="discardLabel()"
      (discardRow)="discarded.set($event)"
    />
  `,
})
class Host {
  readonly discardLabel = signal<string | null>('Discard');
  readonly discarded = signal<CordlyChangeRow | null>(null);
  readonly groups = signal<readonly CordlyChangeGroup[]>([
    {
      id: 'night-library',
      label: 'Night Library',
      rows: [
        {
          id: 'welcome-channel',
          summary: 'Welcome message channel',
          before: '#general',
          after: '#introductions',
          origin: 'person',
          status: 'staged',
          risk: 'reversible',
        },
        {
          id: 'purge',
          summary: 'Delete inactive member roles',
          before: '412 roles',
          after: '0 roles',
          origin: 'assistant',
          status: 'blocked',
          risk: 'irreversible',
          detail: 'Cordly cannot manage roles above its own.',
        },
        {
          id: 'applied-one',
          summary: 'Level-up announcements',
          before: 'Off',
          after: 'On',
          origin: 'template',
          status: 'applied',
        },
      ],
    },
  ]);
}

describe('CordlyReviewList', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      rows: () => [...root.querySelectorAll<HTMLElement>('.cordly-review-list__row')],
      discards: () => [...root.querySelectorAll<HTMLButtonElement>('.cordly-review-list__discard')],
    };
  }

  it('groups rows under a heading the caller supplied', () => {
    const { root } = render();

    expect(root.querySelector('.cordly-review-list__group-label')?.textContent?.trim()).toBe(
      'Night Library',
    );
  });

  it('shows before and after as a description list, so the pairing is announced', () => {
    // Two anonymous values side by side leave a screen-reader user guessing
    // which is which.
    const { rows } = render();
    const values = at(rows(), 0).querySelector('.cordly-review-list__values') as HTMLElement;
    const terms = [...values.querySelectorAll('dt')].map((n) => n.textContent?.trim());
    const definitions = [...values.querySelectorAll('dd')].map((n) => n.textContent?.trim());

    expect(terms).toEqual(['Was', 'Becomes']);
    expect(definitions).toEqual(['#general', '#introductions']);
  });

  it('states the origin of every row', () => {
    // A change the assistant proposed is read differently from one a person
    // typed, and hiding the difference is how an approval stops meaning anything.
    const { rows } = render();

    expect(at(rows(), 0).textContent).toContain('You');
    expect(at(rows(), 1).textContent).toContain('Assistant');
  });

  it('keeps blocked and failed as separate states', () => {
    // Collapsing them makes a validation error look like an outage.
    const { rows } = render();

    expect(at(rows(), 1).getAttribute('data-status')).toBe('blocked');
    expect(at(rows(), 1).textContent).toContain('Blocked');
  });

  it('surfaces the risk when a change is not simply reversible', () => {
    const { rows } = render();

    expect(at(rows(), 0).textContent).not.toContain('Reversible');
    expect(at(rows(), 1).textContent).toContain('Cannot be undone');
  });

  it('explains a blocked row instead of leaving the reader to guess', () => {
    const { rows } = render();

    expect(at(rows(), 1).querySelector('.cordly-review-list__detail')?.textContent?.trim()).toBe(
      'Cordly cannot manage roles above its own.',
    );
  });

  it('names each discard control by what it discards', () => {
    // Twenty buttons all called "Discard" are twenty identical entries in a
    // screen reader's list of controls.
    const { discards } = render();

    expect(at(discards(), 0).getAttribute('aria-label')).toBe('Discard: Welcome message channel');
  });

  it('cannot discard a change that has already been applied', () => {
    const { discards } = render();

    expect(at(discards(), 2).disabled).toBe(true);
  });

  it('emits the row rather than removing it, because the application owns the draft', () => {
    const { fixture, host, discards, rows } = render();

    at(discards(), 0).click();
    fixture.detectChanges();

    expect(host.discarded()?.id).toBe('welcome-channel');
    expect(rows()).toHaveLength(3);
  });

  it('renders read-only when no discard label is given', () => {
    const { fixture, host, discards } = render();

    host.discardLabel.set(null);
    fixture.detectChanges();

    expect(discards()).toHaveLength(0);
  });
});
