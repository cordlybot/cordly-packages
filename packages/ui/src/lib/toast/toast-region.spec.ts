import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CordlyToastRegion } from './toast-region';
import { CordlyToasts } from './toasts';

@Component({
  imports: [CordlyToastRegion],
  template: `<cordly-toast-region dismissLabel="Dismiss notification" />`,
})
class Host {}

describe('CordlyToastRegion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
  });

  afterEach(() => vi.useRealTimers());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      toasts: TestBed.inject(CordlyToasts),
      root,
      live: root.querySelector('[aria-live]') as HTMLElement,
      messages: () =>
        [...root.querySelectorAll('.cordly-toast__message')].map((n) => n.textContent?.trim()),
    };
  }

  it('keeps one live region in the DOM whether or not it holds anything', () => {
    // A live region created at the moment a message arrives is usually not
    // announced: assistive technology has to be watching it before the content
    // changes, and a region plus its content is one mutation, not two.
    const { live, messages } = render();

    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.getAttribute('role')).toBe('status');
    expect(messages()).toEqual([]);
  });

  it('announces politely rather than interrupting, even for a failure', () => {
    // The durable copy of an error is the inline status beside the thing it
    // concerns. Interrupting somebody mid-sentence for a message that is about
    // to disappear costs more than it gives.
    const { fixture, toasts, live } = render();

    toasts.show({ message: 'Could not reach Discord.', tone: 'danger' });
    fixture.detectChanges();

    expect(live.getAttribute('aria-live')).toBe('polite');
  });

  it('renders the caller message verbatim', () => {
    const { fixture, toasts, messages } = render();

    toasts.show({ message: 'Welcome messages enabled in Night Library.' });
    fixture.detectChanges();

    expect(messages()).toEqual(['Welcome messages enabled in Night Library.']);
  });

  it('expires an informational toast on its own', () => {
    const { fixture, toasts, messages } = render();

    toasts.show({ message: 'Settings applied.' });
    fixture.detectChanges();
    expect(messages()).toHaveLength(1);

    vi.advanceTimersByTime(6000);
    fixture.detectChanges();

    expect(messages()).toHaveLength(0);
  });

  it('keeps a toast that carries an action until it is dealt with', () => {
    // An undo somebody has to catch within six seconds is not an undo.
    const { fixture, toasts, messages } = render();

    toasts.show({ message: 'Module disabled.', action: { label: 'Undo', run: vi.fn() } });
    fixture.detectChanges();

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();

    expect(messages()).toHaveLength(1);
  });

  it('runs the action and dismisses when it is chosen', () => {
    const { fixture, root, toasts, messages } = render();
    const run = vi.fn();

    toasts.show({ message: 'Module disabled.', action: { label: 'Undo', run } });
    fixture.detectChanges();

    (root.querySelector('.cordly-toast__action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(run).toHaveBeenCalledOnce();
    expect(messages()).toHaveLength(0);
  });

  it('gives the dismiss control the caller supplied name', () => {
    const { fixture, root, toasts } = render();

    toasts.show({ message: 'Settings applied.' });
    fixture.detectChanges();

    const dismiss = root.querySelector('.cordly-toast__dismiss') as HTMLButtonElement;
    expect(dismiss.getAttribute('aria-label')).toBe('Dismiss notification');

    dismiss.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('.cordly-toast')).toHaveLength(0);
  });
});
