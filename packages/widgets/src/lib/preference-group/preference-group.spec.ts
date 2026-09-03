import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlyPreferenceGroup, type CordlyPreferenceOption } from './preference-group';

@Component({
  imports: [CordlyPreferenceGroup],
  template: `
    <cordly-preference-group label="Theme" [options]="options()" [(value)]="theme" />
    <cordly-preference-group label="Density" [options]="options()" [(value)]="density" />
  `,
})
class Host {
  readonly options = signal<readonly CordlyPreferenceOption[]>([
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ]);
  theme = signal<string | null>('dark');
  density = signal<string | null>('system');
}

describe('CordlyPreferenceGroup', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      radios: () => [...root.querySelectorAll<HTMLInputElement>('input[type="radio"]')],
      legends: () => [...root.querySelectorAll('legend')].map((n) => n.textContent?.trim()),
    };
  }

  it('is a native radio group in a named fieldset', () => {
    // Which is what supplies arrow-key navigation, one tab stop, and correct
    // announcement. Every hand-built segmented control re-earns one of those
    // the hard way.
    const { root, legends } = render();

    expect(root.querySelectorAll('fieldset')).toHaveLength(2);
    expect(legends()).toEqual(['Theme', 'Density']);
  });

  it('marks the current choice as checked', () => {
    const { radios } = render();

    expect(at(radios(), 2).checked).toBe(true);
    expect(at(radios(), 0).checked).toBe(false);
  });

  it('reports a change without storing it anywhere', () => {
    // Where a preference lives is a decision with a privacy and a deployment
    // dimension, and neither is a shared widget's to make.
    const { fixture, host, radios } = render();

    at(radios(), 1).click();
    fixture.detectChanges();

    expect(host.theme()).toBe('light');
  });

  it('gives each group its own radio name', () => {
    // Two groups sharing a name would behave as one control with the choices of
    // both, and arrow keys would walk between unrelated preferences.
    const { radios } = render();
    const names = new Set(radios().map((radio) => radio.name));

    expect(names.size).toBe(2);
  });

  it('keeps the radios in the accessibility tree rather than hiding them', () => {
    // `display: none` would take them out of the tab order and out of the
    // accessibility tree, which is the entire reason for using radios.
    const { radios } = render();

    expect(at(radios(), 0).hidden).toBe(false);
    expect(at(radios(), 0).getAttribute('aria-hidden')).toBeNull();
  });
});
