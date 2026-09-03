import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';
import { CordlyMenu, type CordlyMenuItem } from './menu';
import { CordlyMenuItemContent } from './menu-item-content';

@Component({
  imports: [CordlyMenu, CordlyMenuItemContent],
  template: `
    <cordly-menu [items]="items()" triggerLabel="Language" (selected)="chosen.set($event.id)">
      <span>EN</span>
      <ng-template cordlyMenuItemContent let-item let-active="active">
        <span class="flag" [attr.data-locale]="item.id" aria-hidden="true"></span>
        <span class="name" [attr.lang]="item.id">{{ item.label }}</span>
        @if (active) {
          <span class="active-marker"></span>
        }
      </ng-template>
    </cordly-menu>
  `,
})
class Host {
  readonly items = signal<readonly CordlyMenuItem[]>([
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
  ]);
  readonly chosen = signal<string | null>(null);
}

describe('CordlyMenuItemContent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    const trigger = root.querySelector('.cordly-menu__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      trigger,
      items: () => [...root.querySelectorAll<HTMLButtonElement>('.cordly-menu__item')],
    };
  }

  it('renders the caller template for each item', () => {
    const { items } = render();

    expect(items()).toHaveLength(2);
    expect(at(items(), 1).querySelector('.name')?.textContent?.trim()).toBe('Français');
  });

  it('lets the caller carry information the string API cannot', () => {
    // The reason this directive exists: a language name needs its own `lang` or
    // a screen reader pronounces "Français" as English, and that does not fit in
    // a label.
    const { items } = render();

    expect(at(items(), 1).querySelector('.name')?.getAttribute('lang')).toBe('fr');
    expect(at(items(), 1).querySelector('.flag')?.getAttribute('data-locale')).toBe('fr');
  });

  it('keeps the menu semantics and the keyboard model', () => {
    // The caller supplies appearance and cannot take over behaviour.
    const { items, root } = render();

    expect(root.querySelector('[role="menu"]')).not.toBeNull();
    expect(at(items(), 0).getAttribute('role')).toBe('menuitem');
    expect(items().filter((item) => item.tabIndex === 0)).toHaveLength(1);
  });

  it('tells the template which item is active', () => {
    const { items } = render();

    expect(at(items(), 0).querySelector('.active-marker')).not.toBeNull();
    expect(at(items(), 1).querySelector('.active-marker')).toBeNull();
  });

  it('still emits the caller identifier on selection', () => {
    const { fixture, host, items } = render();

    at(items(), 1).click();
    fixture.detectChanges();

    expect(host.chosen()).toBe('fr');
  });
});
