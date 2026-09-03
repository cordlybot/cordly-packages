import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlySeparator } from './separator';

@Component({
  imports: [CordlySeparator],
  template: `
    <cordly-separator />
    <cordly-separator semantic [orientation]="orientation()" />
  `,
})
class Host {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
}

describe('CordlySeparator', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const all = [...(fixture.nativeElement as HTMLElement).querySelectorAll('cordly-separator')];
    return {
      fixture,
      host: fixture.componentInstance,
      decorative: at(all, 0),
      semantic: at(all, 1),
    };
  }

  it('is decorative by default', () => {
    // A separator exposed between every pair of rows puts the word "separator"
    // into a screen reader's ear as many times as there are rows — noise a
    // sighted reader skips past without noticing.
    const { decorative } = render();

    expect(decorative.getAttribute('role')).toBe('presentation');
  });

  it('can opt back in when the rule divides two regions', () => {
    const { semantic } = render();

    expect(semantic.getAttribute('role')).toBe('separator');
  });

  it('states its orientation only when that adds information', () => {
    // Horizontal is the implicit value on a separator, so declaring it is a
    // word for nothing; vertical is not, so it is declared.
    const { fixture, host, semantic } = render();

    expect(semantic.getAttribute('aria-orientation')).toBeNull();

    host.orientation.set('vertical');
    fixture.detectChanges();

    expect(semantic.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('never announces an orientation on a decorative rule', () => {
    const { fixture, host, decorative } = render();

    host.orientation.set('vertical');
    fixture.detectChanges();

    expect(decorative.getAttribute('aria-orientation')).toBeNull();
  });

  it('exposes the orientation as an attribute the stylesheet selects on', () => {
    const { fixture, host, semantic } = render();

    expect(semantic.getAttribute('data-orientation')).toBe('horizontal');

    host.orientation.set('vertical');
    fixture.detectChanges();

    expect(semantic.getAttribute('data-orientation')).toBe('vertical');
  });
});
