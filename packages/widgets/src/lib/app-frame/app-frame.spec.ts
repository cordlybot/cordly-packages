import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyAppFrame } from './app-frame';

@Component({
  imports: [CordlyAppFrame],
  template: `
    <cordly-app-frame
      skipLabel="Skip to main content"
      navigationLabel="Server sections"
      [bare]="bare()"
      [(navigationOpen)]="drawerOpen"
    >
      <div cordly-frame-header>Cordly</div>
      <div cordly-frame-navigation>Modules</div>
      <h1>Night Library</h1>
    </cordly-app-frame>
  `,
})
class Host {
  readonly bare = signal(false);
  drawerOpen = signal(false);
}

describe('CordlyAppFrame', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      frame: root.querySelector('cordly-app-frame') as HTMLElement,
      skip: () => root.querySelector('.cordly-app-frame__skip') as HTMLAnchorElement,
      main: () => root.querySelector('main') as HTMLElement,
      nav: () => root.querySelector('nav'),
    };
  }

  it('puts a skip link first and points it at the main landmark', () => {
    // Without one, a keyboard user walks the whole navigation on every view.
    const { skip, main } = render();

    expect(skip().getAttribute('href')).toBe(`#${main().id}`);
    expect(skip().textContent?.trim()).toBe('Skip to main content');
  });

  it('makes the main landmark focusable, so the skip link actually moves focus', () => {
    // Without `tabindex="-1"` the browser scrolls to the target and leaves focus
    // where it was, and the next Tab returns to the navigation.
    const { main } = render();

    expect(main().tabIndex).toBe(-1);
  });

  it('renders the landmarks a page is navigated by', () => {
    const { root, nav } = render();

    expect(root.querySelector('header')).not.toBeNull();
    expect(nav()).not.toBeNull();
    expect(root.querySelector('main')).not.toBeNull();
  });

  it('names the navigation region', () => {
    // Two unnamed `nav` landmarks are indistinguishable in a landmark list.
    const { nav } = render();

    expect(nav()?.getAttribute('aria-label')).toBe('Server sections');
  });

  it('omits the navigation region entirely when a page has none', () => {
    // An empty `nav` is a landmark that promises destinations and has none.
    const { fixture, host, nav } = render();

    host.bare.set(true);
    fixture.detectChanges();

    expect(nav()).toBeNull();
  });

  it('reflects the drawer state so a trigger outside the frame can drive it', () => {
    const { fixture, host, frame } = render();

    expect(frame.hasAttribute('data-navigation-open')).toBe(false);

    host.drawerOpen.set(true);
    fixture.detectChanges();

    expect(frame.hasAttribute('data-navigation-open')).toBe(true);
  });

  it('closes the drawer when the scrim is used', () => {
    const { fixture, host, root } = render();

    host.drawerOpen.set(true);
    fixture.detectChanges();

    (root.querySelector('.cordly-app-frame__scrim') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.drawerOpen()).toBe(false);
  });

  it('projects the application content without wrapping it in anything opinionated', () => {
    const { main } = render();

    expect(main().querySelector('h1')?.textContent).toBe('Night Library');
  });
});
