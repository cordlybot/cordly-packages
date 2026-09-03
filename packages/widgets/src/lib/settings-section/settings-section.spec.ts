import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlySettingsSection } from './settings-section';

@Component({
  imports: [CordlySettingsSection],
  template: `
    <cordly-settings-section
      heading="Level-up announcements"
      description="Where members are told they levelled up."
      [advancedLabel]="advancedLabel()"
      [(advancedOpen)]="advancedOpen"
    >
      <button cordly-section-aside type="button" class="aside">Enable</button>
      <p cordly-section-notice class="notice">Cordly cannot post there.</p>
      <p class="essential">Channel</p>
      <p cordly-section-advanced class="advanced">Message template</p>
    </cordly-settings-section>
  `,
})
class Host {
  readonly advancedLabel = signal<string | null>('Advanced options');
  advancedOpen = signal(false);
}

describe('CordlySettingsSection', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      section: root.querySelector('cordly-settings-section') as HTMLElement,
      details: () => root.querySelector('details'),
      summary: () => root.querySelector('summary') as HTMLElement,
    };
  }

  it('is a group named by its own heading', () => {
    const { root, section } = render();
    const heading = root.querySelector('h2') as HTMLElement;

    expect(section.getAttribute('role')).toBe('group');
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent?.trim()).toBe('Level-up announcements');
  });

  it('keeps the section in one vertical rhythm rather than splitting it across tabs', () => {
    // A module split across tabs hides half its state from the person deciding
    // about the other half.
    const { root } = render();

    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(0);
    expect(root.querySelector('.essential')).not.toBeNull();
  });

  it('projects the aside, the notice, and the essential settings in reading order', () => {
    const { root } = render();
    const text = root.textContent ?? '';

    expect(text.indexOf('Enable')).toBeLessThan(text.indexOf('Cordly cannot post there.'));
    expect(text.indexOf('Cordly cannot post there.')).toBeLessThan(text.indexOf('Channel'));
  });

  it('discloses advanced settings behind a native details element', () => {
    // The platform gives the open state for free: it works with no JavaScript,
    // it is announced correctly, and in-page find reaches text inside a closed
    // section instead of pretending it is not there.
    const { details, summary } = render();

    expect(details()).not.toBeNull();
    expect(summary().textContent?.trim()).toBe('Advanced options');
  });

  it('opens and closes the disclosure through its model', () => {
    const { fixture, host, details, summary } = render();

    expect(details()?.hasAttribute('open')).toBe(false);

    summary().click();
    fixture.detectChanges();

    expect(host.advancedOpen()).toBe(true);
    expect(details()?.hasAttribute('open')).toBe(true);
  });

  it('can be opened from outside, so a validation error can reveal its own field', () => {
    // An error pointing at a control nobody can see is an error nobody can fix.
    const { fixture, host, details } = render();

    host.advancedOpen.set(true);
    fixture.detectChanges();

    expect(details()?.hasAttribute('open')).toBe(true);
  });

  it('renders no disclosure when a section has no advanced options', () => {
    const { fixture, host, details } = render();

    host.advancedLabel.set(null);
    fixture.detectChanges();

    expect(details()).toBeNull();
  });
});
