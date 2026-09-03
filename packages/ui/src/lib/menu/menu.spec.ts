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
