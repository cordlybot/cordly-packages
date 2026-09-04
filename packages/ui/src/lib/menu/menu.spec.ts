import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';

import { CordlyMenu, type CordlyMenuItem } from './menu';

@Component({
  imports: [CordlyMenu],
  template: `
    <cordly-menu [items]="items()" triggerLabel="Account menu" (selected)="chosen.set($event.id)">
      Ada
    </cordly-menu>
  `,
})
class Host {
  readonly items = signal<readonly CordlyMenuItem[]>([
    { id: 'settings', label: 'Settings' },
    { id: 'theme', label: 'Appearance', disabled: true },
    { id: 'sign-out', label: 'Sign out', tone: 'danger', separatorBefore: true },
  ]);
  readonly chosen = signal<string | null>(null);
}

@Component({
  imports: [CordlyMenu],
  // A distinct host attribute, because Angular derives a component id from the
  // selector and template shape: two anonymous test hosts around the same
  // component otherwise collide and warn (NG0912).
  host: { 'data-menu-host': 'links' },
  template: `
    <cordly-menu [items]="items()" triggerLabel="Account menu" (selected)="chosen.push($event)">
      Ada
    </cordly-menu>
  `,
})
class LinkHost {
  readonly items = signal<readonly CordlyMenuItem[]>([
    { id: 'account', label: 'Account', href: '/account' },
    // A destination and a disabled flag together: the destination loses,
    // because an anchor has no disabled state.
    { id: 'billing', label: 'Billing', href: '/billing', disabled: true },
    { id: 'sign-out', label: 'Sign out', tone: 'danger' },
  ]);
  readonly chosen: CordlyMenuItem[] = [];
}

const flush = () =>
  new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });

describe('CordlyMenu', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      trigger: root.querySelector('.cordly-menu__trigger') as HTMLButtonElement,
      panel: () => root.querySelector('.cordly-menu__panel'),
      items: () => [...root.querySelectorAll<HTMLButtonElement>('.cordly-menu__item')],
    };
  }

  function press(target: Element, key: string) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  it('describes itself as a menu button that is currently closed', () => {
    const { trigger, panel } = render();

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-label')).toBe('Account menu');
    expect(panel()).toBeNull();
  });

  it('opens on click and points the trigger at the panel it controls', () => {
    const { fixture, trigger, panel } = render();

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel()?.getAttribute('role')).toBe('menu');
    expect(trigger.getAttribute('aria-controls')).toBe(panel()?.id);
    expect(panel()?.getAttribute('aria-labelledby')).toBe(trigger.id);
  });

  it('opens on ArrowDown with the first item focused', async () => {
    const { fixture, trigger, items } = render();

    press(trigger, 'ArrowDown');
    fixture.detectChanges();
    await flush();

    expect(document.activeElement).toBe(at(items(), 0));
  });

  it('opens on ArrowUp with the last item focused', async () => {
    const { fixture, trigger, items } = render();

    press(trigger, 'ArrowUp');
    fixture.detectChanges();
    await flush();

    expect(document.activeElement).toBe(at(items(), 2));
  });

  it('skips a disabled item while arrowing', async () => {
    const { fixture, trigger, items } = render();

    press(trigger, 'ArrowDown');
    fixture.detectChanges();
    await flush();

    press(at(items(), 0), 'ArrowDown');
    fixture.detectChanges();
    await flush();

    expect(document.activeElement).toBe(at(items(), 2));
  });

  it('wraps from the last item to the first', async () => {
    const { fixture, trigger, items } = render();

    press(trigger, 'ArrowUp');
    fixture.detectChanges();
    await flush();

    press(at(items(), 2), 'ArrowDown');
    fixture.detectChanges();
    await flush();

    expect(document.activeElement).toBe(at(items(), 0));
  });

  it('keeps exactly one item in the tab order', () => {
    // Roving tabindex: Tab moves past the menu, arrows move inside it.
    const { fixture, trigger, items } = render();

    trigger.click();
    fixture.detectChanges();

    expect(items().filter((item) => item.tabIndex === 0)).toHaveLength(1);
  });

  it('closes on Escape and puts focus back on the trigger', () => {
    const { fixture, trigger, items, panel } = render();

    trigger.click();
    fixture.detectChanges();
    press(at(items(), 0), 'Escape');
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on Tab rather than trapping the keyboard inside it', () => {
    // A menu is not a dialog. Trapping focus in one strands a keyboard user.
    const { fixture, trigger, items, panel } = render();

    trigger.click();
    fixture.detectChanges();
    press(at(items(), 0), 'Tab');
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });

  it('emits the caller identifier and closes when an item is chosen', () => {
    const { fixture, host, trigger, items, panel } = render();

    trigger.click();
    fixture.detectChanges();
    at(items(), 0).click();
    fixture.detectChanges();

    expect(host.chosen()).toBe('settings');
    expect(panel()).toBeNull();
  });

  it('closes when a pointer goes down anywhere else', () => {
    const { fixture, trigger, panel } = render();

    trigger.click();
    fixture.detectChanges();

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(panel()).toBeNull();
  });
});

describe('CordlyMenu escape from the trigger', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('closes when Escape arrives before focus has reached the panel', () => {
    // Opening moves focus to the first entry only once the panel has rendered.
    // Somebody who opens a menu and immediately changes their mind presses
    // Escape inside that window, with focus still on the trigger — and the menu
    // used to stay open, because the only Escape handler was on the panel.
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const trigger = root.querySelector('.cordly-menu__trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).not.toBeNull();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement === trigger || document.activeElement === document.body).toBe(
      true,
    );
  });

  it('leaves Escape alone when the menu is already closed', () => {
    // A closed menu must not swallow a key the page may be listening for.
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector(
      '.cordly-menu__trigger',
    ) as HTMLButtonElement;

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    trigger.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});

describe('CordlyMenu destinations', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function renderWithLink() {
    const fixture = TestBed.createComponent(LinkHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('.cordly-menu__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, root };
  }

  it('renders an entry with a destination as a real link', () => {
    // The whole point: middle-click, "open in a new tab", and "copy link
    // address" belong to the anchor and cannot be recovered from a click
    // handler.
    const { root } = renderWithLink();
    const entry = root.querySelector('a.cordly-menu__item') as HTMLAnchorElement;

    expect(entry.getAttribute('href')).toBe('/account');
    expect(entry.getAttribute('role')).toBe('menuitem');
  });

  it('reports a plain click instead of letting the browser navigate', () => {
    const { fixture, host, root } = renderWithLink();
    const entry = root.querySelector('a.cordly-menu__item') as HTMLAnchorElement;

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    entry.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(host.chosen.map((item) => item.id)).toEqual(['account']);
  });

  it('leaves a modified click to the browser', () => {
    // Ctrl-click is "open in a new tab". Preventing it here would put the
    // destination in the current tab, which is the opposite of what was asked.
    const { fixture, host, root } = renderWithLink();
    const entry = root.querySelector('a.cordly-menu__item') as HTMLAnchorElement;

    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });
    // jsdom logs "Not implemented: navigation to another Document" here, and
    // that log is the point: the anchor was left to navigate on its own.
    entry.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(host.chosen).toEqual([]);
  });

  it('answers Space on a link entry, which a native anchor does not', () => {
    const { fixture, host, root } = renderWithLink();
    const entry = root.querySelector('a.cordly-menu__item') as HTMLAnchorElement;

    entry.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.chosen.map((item) => item.id)).toEqual(['account']);
  });

  it('keeps a disabled entry a button, because an anchor cannot be disabled', () => {
    const { root } = renderWithLink();

    const disabled = root.querySelector('[data-index="1"]') as HTMLElement;
    expect(disabled.tagName).toBe('BUTTON');
    expect((disabled as HTMLButtonElement).disabled).toBe(true);
  });
});
