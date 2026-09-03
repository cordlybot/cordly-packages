import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyStatus } from './status';
import type { CordlyTone } from '../badge/badge';

@Component({
  imports: [CordlyStatus],
  template: `
    <cordly-status [tone]="tone()" [live]="live()" heading="Missing permission">
      Cordly cannot post in the selected channel.
      <button cordly-status-actions type="button">Recheck permissions</button>
    </cordly-status>
  `,
})
class Host {
  readonly tone = signal<CordlyTone>('warning');
  readonly live = signal(false);
}

describe('CordlyStatus', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      status: root.querySelector('cordly-status') as HTMLElement,
    };
  }

  it('renders as part of the page, announcing nothing, when it was always there', () => {
    // A live region here would make every page load read its own warnings aloud
    // before the heading.
    const { status } = render();

    expect(status.getAttribute('role')).toBeNull();
    expect(status.getAttribute('aria-live')).toBeNull();
  });

  it('announces politely when it appeared in response to an action', () => {
    const { fixture, host, status } = render();

    host.live.set(true);
    fixture.detectChanges();

    expect(status.getAttribute('role')).toBe('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('interrupts for a failure, because a failure blocks the task', () => {
    const { fixture, host, status } = render();

    host.live.set(true);
    host.tone.set('danger');
    fixture.detectChanges();

    expect(status.getAttribute('role')).toBe('alert');
    // `role="alert"` already implies assertive; restating it confuses some
    // screen readers and adds nothing.
    expect(status.getAttribute('aria-live')).toBeNull();
  });

  it('carries a shape as well as a colour', () => {
    // Four tones distinguished only by hue are one tone in forced-colours mode.
    const { root } = render();

    expect(root.querySelector('.cordly-status__mark')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.cordly-status__heading')?.textContent).toContain(
      'Missing permission',
    );
  });

  it('projects a recovery action beside the explanation', () => {
    const { root } = render();
    const actions = root.querySelector('.cordly-status__actions') as HTMLElement;

    expect(actions.textContent).toContain('Recheck permissions');
  });

  it('exposes the tone as an attribute the stylesheet selects on', () => {
    const { fixture, host, status } = render();

    host.tone.set('success');
    fixture.detectChanges();

    expect(status.getAttribute('data-tone')).toBe('success');
  });
});
