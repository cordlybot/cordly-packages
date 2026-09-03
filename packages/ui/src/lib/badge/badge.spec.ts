import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyBadge, type CordlyTone } from './badge';

@Component({
  imports: [CordlyBadge],
  template: `<cordly-badge [tone]="tone()">Needs attention</cordly-badge>`,
})
class Host {
  readonly tone = signal<CordlyTone>('warning');
}

describe('CordlyBadge', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      badge: root.querySelector('cordly-badge') as HTMLElement,
    };
  }

  it('always carries text, because colour is never the only signal', () => {
    const { badge } = render();

    expect(badge.textContent?.trim()).toBe('Needs attention');
  });

  it('keeps the dot out of the accessibility tree', () => {
    // The dot repeats what the text already says; announcing it adds noise.
    const { badge } = render();

    expect(badge.querySelector('.cordly-badge__dot')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws no dot for the neutral tone', () => {
    const { fixture, host, badge } = render();

    host.tone.set('neutral');
    fixture.detectChanges();

    expect(badge.querySelector('.cordly-badge__dot')).toBeNull();
  });

  it('is not interactive', () => {
    // A badge that looks pressable and is not is a target people keep missing.
    const { badge } = render();

    expect(badge.tabIndex).toBe(-1);
    expect(badge.getAttribute('role')).toBeNull();
  });
});
