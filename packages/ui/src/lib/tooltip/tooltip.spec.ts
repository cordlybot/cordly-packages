import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyTooltip } from './tooltip';

@Component({
  imports: [CordlyTooltip],
  template: `
    <button type="button" aria-label="Refresh" cordlyTooltip="Last checked 4 minutes ago">R</button>
  `,
})
class Host {}

describe('CordlyTooltip', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      button: root.querySelector('button') as HTMLButtonElement,
      panel: () => root.querySelector('cordly-tooltip-panel'),
    };
  }

  it('shows nothing until the control is hovered or focused', () => {
    const { button, panel } = render();

    expect(panel()).toBeNull();
    expect(button.getAttribute('aria-describedby')).toBeNull();
  });

  it('opens on focus, not only on hover', () => {
    // Information only a mouse can reach is information a keyboard user has not
    // been given.
    const { fixture, button, panel } = render();

    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(panel()?.getAttribute('role')).toBe('tooltip');
    expect(panel()?.textContent?.trim()).toBe('Last checked 4 minutes ago');
  });

  it('describes the control rather than naming it', () => {
    // A tooltip used as the accessible name disappears for anyone navigating by
    // control, so the control keeps its own label and this only describes it.
    const { fixture, button, panel } = render();

    button.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Refresh');
    expect(button.getAttribute('aria-describedby')).toBe(panel()?.id);
  });

  it('closes on Escape without swallowing the key', () => {
    // Escape may also mean something to a dialog around this control, and
    // consuming it here would trap the person inside.
    const { fixture, button, panel } = render();

    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    button.dispatchEvent(escape);
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(escape.defaultPrevented).toBe(false);
  });

  it('closes on blur and drops the description with it', () => {
    const { fixture, button, panel } = render();

    button.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    button.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(button.getAttribute('aria-describedby')).toBeNull();
  });
});
