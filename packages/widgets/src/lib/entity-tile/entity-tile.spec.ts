import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyEntityTile, type CordlyEntityState } from './entity-tile';

@Component({
  imports: [CordlyEntityTile],
  template: `
    <cordly-entity-tile
      name="Night Library"
      detail="1,204 members"
      [state]="state()"
      [stateLabel]="stateLabel()"
      actionLabel="Open"
      [href]="href()"
      [avatarUrl]="avatarUrl()"
      (activate)="activated.set(activated() + 1)"
    />
  `,
})
class Host {
  readonly state = signal<CordlyEntityState>('ready');
  readonly stateLabel = signal('Set up');
  readonly href = signal<string | null>(null);
  readonly avatarUrl = signal<string | null>(null);
  readonly activated = signal(0);
}

describe('CordlyEntityTile', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      target: () => root.querySelector('.cordly-entity-tile__target') as HTMLElement,
    };
  }

  it('is exactly one control, not a panel containing several', () => {
    // A tile with a title link, a background handler, and a button is three
    // overlapping targets and an announcement nobody can parse.
    const { root, target } = render();

    expect(root.querySelectorAll('a, button')).toHaveLength(1);
    expect(target().tagName).toBe('BUTTON');
  });

  it('becomes a real anchor when the caller has a destination', () => {
    const { fixture, host, target } = render();

    host.href.set('/servers/1');
    fixture.detectChanges();

    expect(target().tagName).toBe('A');
    expect(target().getAttribute('href')).toBe('/servers/1');
  });

  it('puts the name, the state, and the action into one accessible name', () => {
    // Read aloud, the control has to answer what it is, how it stands, and what
    // pressing it will do.
    const { target } = render();

    expect(target().getAttribute('aria-label')).toBe('Night Library. Set up. Open');
  });

  it('states the state in words as well as in colour', () => {
    const { fixture, host, root } = render();

    host.state.set('attention');
    host.stateLabel.set('Needs attention');
    fixture.detectChanges();

    expect(root.querySelector('.cordly-entity-tile__state')?.textContent?.trim()).toBe(
      'Needs attention',
    );
    expect(root.querySelector('cordly-entity-tile')?.getAttribute('data-state')).toBe('attention');
  });

  it('does not repeat the state to a screen reader', () => {
    // It is already in the accessible name; hearing it twice is worse than not
    // styling it at all.
    const { root } = render();

    expect(root.querySelector('.cordly-entity-tile__state')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('falls back to an initial when there is no avatar, and hides it either way', () => {
    // The name is right there in text; an avatar that announces itself just
    // makes every tile read its own first letter aloud.
    const { fixture, host, root } = render();
    const avatar = () => root.querySelector('.cordly-entity-tile__avatar') as HTMLElement;

    expect(avatar().textContent?.trim()).toBe('N');
    expect(avatar().getAttribute('aria-hidden')).toBe('true');

    host.avatarUrl.set('https://example.invalid/icon.png');
    fixture.detectChanges();

    expect(avatar().querySelector('img')?.getAttribute('alt')).toBe('');
  });

  it('emits when it has no destination of its own', () => {
    const { fixture, host, target } = render();

    target().click();
    fixture.detectChanges();

    expect(host.activated()).toBe(1);
  });

  it('refuses activation when the thing behind it cannot be opened', () => {
    const { fixture, host, target } = render();

    host.state.set('inaccessible');
    host.stateLabel.set('No access');
    fixture.detectChanges();

    target().click();
    fixture.detectChanges();

    expect(host.activated()).toBe(0);
    expect((target() as HTMLButtonElement).disabled).toBe(true);
  });
});
