import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';

import { settle } from '../../testing/angular';
import { CordlySwitch } from './switch';

@Component({
  imports: [CordlySwitch, FormsModule],
  template: `
    <cordly-switch
      label="Welcome messages"
      description="Greets a member the first time they post."
      [checked]="checked()"
      (checkedChange)="lastChange.set($event)"
    />
    <cordly-switch label="Level roles" [(ngModel)]="levelRoles" />
  `,
})
class Host {
  readonly checked = signal(false);
  readonly lastChange = signal<boolean | null>(null);
  levelRoles = true;
}

describe('CordlySwitch', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const controls = [...root.querySelectorAll<HTMLButtonElement>('[role="switch"]')];
    return { fixture, host: fixture.componentInstance, root, controls };
  }

  it('is a switch rather than a checkbox', () => {
    // The two are announced differently: a checkbox is "selected for later",
    // a switch is "on now". A module toggle is the latter.
    const { controls } = render();

    expect(at(controls, 0).getAttribute('role')).toBe('switch');
    expect(at(controls, 0).getAttribute('aria-checked')).toBe('false');
  });

  it('takes its accessible name from the visible label', () => {
    const { root, controls } = render();
    const label = root.querySelector('.cordly-switch__label') as HTMLElement;

    expect(at(controls, 0).getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.textContent).toContain('Welcome messages');
  });

  it('points at its description when it has one', () => {
    const { root, controls } = render();
    const description = root.querySelector('.cordly-switch__description') as HTMLElement;

    expect(at(controls, 0).getAttribute('aria-describedby')).toBe(description.id);
    expect(at(controls, 1).getAttribute('aria-describedby')).toBeNull();
  });

  it('toggles and reports the new state', () => {
    const { fixture, host, controls } = render();

    at(controls, 0).click();
    fixture.detectChanges();

    expect(host.lastChange()).toBe(true);
    expect(at(controls, 0).getAttribute('aria-checked')).toBe('true');
  });

  it('reflects a form value and writes edits back', async () => {
    const { fixture, host, controls } = render();
    await settle(fixture);

    expect(at(controls, 1).getAttribute('aria-checked')).toBe('true');

    at(controls, 1).click();
    await settle(fixture);

    expect(host.levelRoles).toBe(false);
  });

  it('is reachable by keyboard as a native button', () => {
    const { controls } = render();

    expect(at(controls, 0).tagName).toBe('BUTTON');
    expect(at(controls, 0).type).toBe('button');
    expect(at(controls, 0).tabIndex).toBe(0);
  });
});
