import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';

import { CordlyLink } from './link';

@Component({
  imports: [CordlyLink],
  template: `
    <a cordlyLink href="/servers">All servers</a>
    <a cordlyLink external href="https://example.invalid/status">Status page</a>
  `,
})
class Host {}

describe('CordlyLink', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
    return { internal: at(links, 0), external: at(links, 1) };
  }

  it('leaves an internal link exactly as the caller wrote it', () => {
    // Routing belongs to the application; this package never imports a router.
    const { internal } = render();

    expect(internal.getAttribute('href')).toBe('/servers');
    expect(internal.getAttribute('target')).toBeNull();
    expect(internal.getAttribute('rel')).toBeNull();
  });

  it('opens an external destination in a new context and severs the opener', () => {
    // Browsers imply `noopener` for `target=_blank`, but stating it keeps the
    // guarantee out of the browser's hands and makes the intent readable.
    const { external } = render();

    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('marks the external link visually without adding to its accessible name', () => {
    const { external } = render();

    expect(external.hasAttribute('data-external')).toBe(true);
    expect(external.textContent?.trim()).toBe('Status page');
  });
});
