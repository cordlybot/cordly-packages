import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyVisuallyHidden } from './visually-hidden';

@Component({
  imports: [CordlyVisuallyHidden],
  template: `<h2 cordlyVisuallyHidden>Staged changes</h2>`,
})
class Host {}

describe('CordlyVisuallyHidden', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('keeps the element in the accessibility tree', () => {
    // `display: none` and `visibility: hidden` remove the text from assistive
    // technology as well, which defeats the purpose entirely.
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h2') as HTMLElement;

    expect(heading.getAttribute('aria-hidden')).toBeNull();
    expect(heading.hidden).toBe(false);
    expect(heading.textContent).toBe('Staged changes');
    expect(heading.classList.contains('cordly-visually-hidden')).toBe(true);
  });
});
