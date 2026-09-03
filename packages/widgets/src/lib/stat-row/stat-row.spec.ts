import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlyStatRow, type CordlyStat } from './stat-row';

@Component({
  imports: [CordlyStatRow],
  template: `
    <cordly-stat-row [stats]="stats()" label="Server health" (activate)="chosen.set($event.id)" />
  `,
})
class Host {
  readonly chosen = signal<string | null>(null);
  readonly stats = signal<readonly CordlyStat[]>([
    {
      id: 'enabled',
      label: 'Modules enabled',
      value: '12',
      meaning: 'Everything you turned on is running.',
    },
    {
      id: 'attention',
      label: 'Needs attention',
      value: '2',
      meaning: 'Two modules are missing a permission.',
      tone: 'warning',
      action: { label: 'Review permissions' },
    },
  ]);
}

describe('CordlyStatRow', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      tiles: () => [...root.querySelectorAll<HTMLElement>('.cordly-stat-row__tile')],
    };
  }

  it('names the row, so it reads as one group rather than four loose figures', () => {
    const { root } = render();

    expect(root.querySelector('ul')?.getAttribute('aria-label')).toBe('Server health');
  });

  it('shows what every figure means, not only the figure', () => {
    // The UX plan says a metric appears only when it leads to an interpretation
    // or an action, and the required `meaning` field is how that is enforced.
    const { tiles } = render();

    expect(at(tiles(), 0).textContent).toContain('Everything you turned on is running.');
  });

  it('renders a plain tile as no control at all', () => {
    const { tiles } = render();

    expect(at(tiles(), 0).tagName).toBe('DIV');
  });

  it('renders an actionable tile as one button carrying the whole meaning', () => {
    const { tiles } = render();
    const actionable = at(tiles(), 1);

    expect(actionable.tagName).toBe('BUTTON');
    expect(actionable.getAttribute('aria-label')).toBe('Needs attention, 2. Review permissions');
  });

  it('does not repeat the action label to a screen reader', () => {
    const { root } = render();

    expect(root.querySelector('.cordly-stat-row__action')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('emits the stat that was activated', () => {
    const { fixture, host, tiles } = render();

    at(tiles(), 1).click();
    fixture.detectChanges();

    expect(host.chosen()).toBe('attention');
  });

  it('formats nothing itself, because grouping and units differ by language', () => {
    const { fixture, host, tiles } = render();

    host.stats.set([
      { id: 'members', label: 'Members', value: '1 204', meaning: 'Steady this week.' },
    ]);
    fixture.detectChanges();

    expect(at(tiles(), 0).querySelector('.cordly-stat-row__value')?.textContent?.trim()).toBe(
      '1 204',
    );
  });
});
