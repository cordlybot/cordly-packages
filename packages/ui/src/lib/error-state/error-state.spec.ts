import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { withErrorCollector } from '../../testing/angular';
import { CordlyErrorState } from './error-state';

@Component({
  imports: [CordlyErrorState],
  template: `
    <cordly-error-state
      heading="Could not load your servers"
      body="Cordly could not reach Discord. Your settings are unchanged."
      detail="correlation 4f2a-91c3"
    >
      <button type="button">Try again</button>
    </cordly-error-state>
  `,
})
class WithRecovery {}

@Component({
  imports: [CordlyErrorState],
  template: `<cordly-error-state heading="Could not load your servers" />`,
})
class DeadEnd {}

describe('CordlyErrorState', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(WithRecovery);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, root, state: root.querySelector('cordly-error-state') as HTMLElement };
  }

  it('announces itself, because it appeared where content should have been', () => {
    // The distinction from an empty state: nothing-yet is normal and says
    // nothing; something-failed is not, and interrupts.
    const { state } = render();

    expect(state.getAttribute('role')).toBe('alert');
  });

  it('separates the explanation from the technical remainder', () => {
    // Two inputs rather than one, so a stack trace cannot end up where the
    // plain-language explanation belongs.
    const { root } = render();

    expect(root.querySelector('.cordly-error-state__body')?.textContent).toContain(
      'Your settings are unchanged.',
    );
    expect(root.querySelector('.cordly-error-state__detail')?.textContent).toContain(
      'correlation 4f2a-91c3',
    );
  });

  it('keeps the warning mark out of the accessibility tree', () => {
    const { root } = render();

    expect(root.querySelector('.cordly-error-state__mark')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('projects the recovery action', () => {
    const { root } = render();

    expect(root.querySelector('.cordly-error-state__actions')?.textContent).toContain('Try again');
  });

  it('refuses in development when there is no way out', async () => {
    const errors = withErrorCollector();
    const fixture = TestBed.createComponent(DeadEnd);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(errors.messages.some((message) => message.includes('needs a way out'))).toBe(true);
  });
});
