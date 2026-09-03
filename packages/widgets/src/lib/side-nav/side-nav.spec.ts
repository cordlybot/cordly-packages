import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlySideNav, type CordlyNavGroup, type CordlyNavItem } from './side-nav';

@Component({
  imports: [CordlySideNav],
  template: `<cordly-side-nav [groups]="groups()" (navigate)="routed.set($event)" />`,
})
class Host {
  readonly routed = signal<CordlyNavItem | null>(null);
  readonly groups = signal<readonly CordlyNavGroup[]>([
    {
      id: 'server',
      label: 'Server',
      items: [
        { id: 'overview', label: 'Overview', current: true },
        { id: 'modules', label: 'Modules', href: '/servers/1/modules', badge: '3' },
        { id: 'audit', label: 'Audit', disabled: true },
      ],
    },
  ]);
}

describe('CordlySideNav', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      items: () => [...root.querySelectorAll<HTMLAnchorElement>('.cordly-side-nav__item')],
    };
  }

  it('renders exactly the destinations it is given', () => {
    // This is what makes capability-derived navigation fall out for free: an
    // application that passes two items gets a two-item sidebar, with no second
    // component and no hidden branch for the reduced case.
    const { fixture, host, items } = render();

    expect(items()).toHaveLength(3);

    host.groups.set([{ id: 'server', label: 'Server', items: [{ id: 'audit', label: 'Audit' }] }]);
    fixture.detectChanges();

    expect(items()).toHaveLength(1);
  });

  it('marks the current destination in the accessibility tree, not only in colour', () => {
    const { items } = render();

    expect(at(items(), 0).getAttribute('aria-current')).toBe('page');
    expect(at(items(), 1).getAttribute('aria-current')).toBeNull();
  });

  it('renders a real anchor when the caller supplies a destination', () => {
    // Which is what makes middle-click and "open in a new tab" work. A div with
    // a click handler silently takes both away.
    const { items } = render();

    expect(at(items(), 1).getAttribute('href')).toBe('/servers/1/modules');
  });

  it('emits instead of navigating when there is no href, and imports no router', () => {
    const { fixture, host, items } = render();

    at(items(), 0).click();
    fixture.detectChanges();

    expect(host.routed()?.id).toBe('overview');
  });

  it('refuses a disabled destination without emitting', () => {
    const { fixture, host, items } = render();

    expect(at(items(), 2).getAttribute('aria-disabled')).toBe('true');

    at(items(), 2).click();
    fixture.detectChanges();

    expect(host.routed()).toBeNull();
  });

  it('renders a group label as a heading rather than a styled span', () => {
    const { root } = render();

    expect(root.querySelector('h2')?.textContent?.trim()).toBe('Server');
  });

  it('shows a badge beside the label it belongs to', () => {
    const { items } = render();

    expect(at(items(), 1).querySelector('.cordly-side-nav__item-badge')?.textContent?.trim()).toBe(
      '3',
    );
  });
});
