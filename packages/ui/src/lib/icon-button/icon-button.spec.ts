import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { withErrorCollector } from '../../testing/angular';
import { CordlyIconButton } from './icon-button';

@Component({
  imports: [CordlyIconButton],
  template: `
    <button cordlyIconButton aria-label="Dismiss notice" size="sm">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 13 13" /></svg>
    </button>
  `,
})
class Named {}

@Component({
  imports: [CordlyIconButton],
  template: `
    <button cordlyIconButton>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3 13 13" /></svg>
    </button>
  `,
})
class Anonymous {}

describe('CordlyIconButton', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('renders a native button carrying the accessible name the caller supplied', () => {
    const fixture = TestBed.createComponent(Named);
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Dismiss notice');
    expect(button.getAttribute('data-size')).toBe('sm');
  });

  it('refuses in development when the control has no accessible name', async () => {
    // The easiest accessibility defect to ship: the icon tells a sighted user
    // what the control does, the control is anonymous to everyone else, and
    // nothing about the page looks wrong.
    const errors = withErrorCollector();
    const fixture = TestBed.createComponent(Anonymous);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(errors.messages.some((message) => message.includes('needs an accessible name'))).toBe(
      true,
    );
  });
});
