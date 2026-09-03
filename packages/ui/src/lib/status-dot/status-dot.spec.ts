import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyStatusDot } from './status-dot';
import type { CordlyTone } from '../badge/badge';

@Component({
  imports: [CordlyStatusDot],
  template: `
    <cordly-status-dot
      [tone]="tone()"
      [label]="label()"
      [hideLabel]="hideLabel()"
      [live]="live()"
    />
  `,
})
class Host {
  readonly tone = signal<CordlyTone>('success');
  readonly label = signal('Connected');
  readonly hideLabel = signal(false);
  readonly live = signal(false);
}

describe('CordlyStatusDot', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      dot: root.querySelector('cordly-status-dot') as HTMLElement,
      mark: () => root.querySelector('.cordly-status-dot__mark'),
      label: () => root.querySelector('.cordly-status-dot__label'),
    };
  }

  it('always carries the state in words, not only in hue', () => {
    // A dot alone is unreadable with a colour-vision deficiency, gone in
    // forced-colours mode, and absent from a screen reader entirely.
    const { label } = render();

    expect(label()?.textContent?.trim()).toBe('Connected');
  });

  it('keeps the mark out of the accessibility tree', () => {
    const { mark } = render();

    expect(mark()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the label in the accessibility tree even when it is not shown', () => {
    // `hideLabel` takes it off the screen. It does not remove it — that is the
    // difference between this and a bare coloured dot.
    const { fixture, host, dot, label } = render();

    host.hideLabel.set(true);
    fixture.detectChanges();

    expect(dot.hasAttribute('data-hide-label')).toBe(true);
    expect(label()?.textContent?.trim()).toBe('Connected');
    expect(label()?.getAttribute('aria-hidden')).toBeNull();
  });

  it('exposes tone, size, and liveness as attributes the stylesheet selects on', () => {
    const { fixture, host, dot } = render();

    expect(dot.getAttribute('data-tone')).toBe('success');
    expect(dot.getAttribute('data-size')).toBe('md');
    expect(dot.hasAttribute('data-live')).toBe(false);

    host.tone.set('danger');
    host.live.set(true);
    fixture.detectChanges();

    expect(dot.getAttribute('data-tone')).toBe('danger');
    expect(dot.hasAttribute('data-live')).toBe(true);
  });

  it('adds no interactive semantics', () => {
    const { dot } = render();

    expect(dot.getAttribute('role')).toBeNull();
    expect(dot.tabIndex).toBe(-1);
  });
});
