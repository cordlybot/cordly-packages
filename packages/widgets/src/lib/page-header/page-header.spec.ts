import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyPageHeader } from './page-header';

@Component({
  imports: [CordlyPageHeader],
  template: `
    <cordly-page-header heading="Night Library" [eyebrow]="eyebrow()" [description]="description()">
      <nav cordly-page-header-before aria-label="Breadcrumb">Servers</nav>
      <button cordly-page-header-actions type="button">Add a module</button>
      <p class="extra">Anything else</p>
    </cordly-page-header>
  `,
})
class Host {
  readonly eyebrow = signal<string | null>('Server');
  readonly description = signal<string | null>('Twelve modules enabled.');
}

describe('CordlyPageHeader', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, root };
  }

  it('renders the page heading as the one h1', () => {
    // Not configurable on purpose. A level input eventually gets an h3 from
    // somebody matching a visual size, and the document outline stops
    // describing the page.
    const { root } = render();

    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(root.querySelector('h1')?.textContent?.trim()).toBe('Night Library');
  });

  it('projects the before slot, the actions, and the rest', () => {
    const { root } = render();

    expect(root.querySelector('.cordly-page-header__before')?.textContent).toContain('Servers');
    expect(root.querySelector('.cordly-page-header__actions')?.textContent).toContain(
      'Add a module',
    );
    expect(root.querySelector('.extra')).not.toBeNull();
  });

  it('omits the eyebrow and the description when there are none', () => {
    const { fixture, host, root } = render();

    host.eyebrow.set(null);
    host.description.set(null);
    fixture.detectChanges();

    expect(root.querySelector('.cordly-page-header__eyebrow')).toBeNull();
    expect(root.querySelector('.cordly-page-header__description')).toBeNull();
  });

  it('leaves the breadcrumb to the application', () => {
    // A breadcrumb is a list of routes, and routes are not this package's
    // business — so it is a slot rather than an input.
    const { root } = render();

    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Breadcrumb');
  });
});
