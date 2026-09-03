import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';

import { settle } from '../../testing/angular';
import { CordlySelectField, type CordlySelectOption } from './select-field';

@Component({
  imports: [CordlySelectField, FormsModule],
  template: `
    <cordly-select-field
      label="Language"
      [options]="options()"
      [placeholder]="placeholder()"
      [error]="error()"
      [(ngModel)]="locale"
    />
  `,
})
class Host {
  readonly options = signal<readonly CordlySelectOption[]>([
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch', disabled: true },
  ]);
  readonly placeholder = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  locale = 'fr';
}

describe('CordlySelectField', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      select: () => root.querySelector('select') as HTMLSelectElement,
      label: () => root.querySelector('label') as HTMLLabelElement,
    };
  }

  it('renders a native select, which is what supplies type-ahead and the mobile picker', () => {
    const { select } = render();

    expect(select().tagName).toBe('SELECT');
    expect(select().options).toHaveLength(3);
  });

  it('associates the label with the control', () => {
    const { select, label } = render();

    expect(label().htmlFor).toBe(select().id);
  });

  it('reflects the bound value as the selected option', async () => {
    const { fixture, select } = render();
    await settle(fixture);

    expect(select().value).toBe('fr');
  });

  it('writes a change back to the form', async () => {
    const { fixture, host, select } = render();
    await settle(fixture);

    select().value = 'en';
    select().dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(host.locale).toBe('en');
  });

  it('keeps a disabled option unselectable rather than hiding it', () => {
    // Removing it would leave a reader wondering where a choice went; disabling
    // it says the choice exists and is not available right now.
    const { select } = render();

    expect(at([...select().options], 2).disabled).toBe(true);
    expect(at([...select().options], 2).textContent?.trim()).toBe('Deutsch');
  });

  it('renders a leading placeholder option when one is given', () => {
    const { fixture, host, select } = render();

    host.placeholder.set('Choose a language');
    fixture.detectChanges();

    expect(select().options).toHaveLength(4);
    expect(at([...select().options], 0).textContent?.trim()).toBe('Choose a language');
    expect(at([...select().options], 0).value).toBe('');
  });

  it('marks the control invalid and describes it with the error', () => {
    const { fixture, host, select, root } = render();

    host.error.set('Cordly does not support that language yet.');
    fixture.detectChanges();

    const error = root.querySelector('.cordly-select-field__error') as HTMLElement;
    expect(select().getAttribute('aria-invalid')).toBe('true');
    expect(select().getAttribute('aria-describedby')).toBe(error.id);
  });
});
