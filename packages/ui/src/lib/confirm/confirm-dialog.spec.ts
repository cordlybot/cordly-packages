import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { installDialogShim } from '../../../testing/src/public-api';
import { at } from '../../testing/dom';
import { CordlyConfirmDialog, type CordlyConfirmRequest } from './confirm-dialog';

@Component({
  imports: [CordlyConfirmDialog],
  template: `<cordly-confirm-dialog [request]="request()" (answered)="answers.push($event)" />`,
})
class Host {
  readonly request = signal<CordlyConfirmRequest>({
    heading: 'Sign out of Cordly?',
    body: 'Work in progress in other tabs will end.',
    confirmLabel: 'Sign out',
    cancelLabel: 'Stay signed in',
    tone: 'danger',
  });
  readonly answers: boolean[] = [];
}

/**
 * The shim this package ships for exactly this, rather than a fourth private
 * copy. What is under test is the component's contract; the real focus trap,
 * the backdrop, and `inert` belong to the browser and are proved in a browser.
 */

describe('CordlyConfirmDialog', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    installDialogShim();
  });

  function render() {
    const fixture = TestBed.createComponent(Host);
    const root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      surface: root.querySelector('dialog') as HTMLDialogElement,
      actions: () => [...root.querySelectorAll<HTMLButtonElement>('[cordly-dialog-actions]')],
    };
  }

  it('names both actions with the caller words rather than OK and Cancel', () => {
    // A confirmation is where a generic label does the most damage: the point is
    // that somebody can predict the effect before pressing.
    const { actions } = render();

    expect(at(actions(), 0).textContent?.trim()).toBe('Stay signed in');
    expect(at(actions(), 1).textContent?.trim()).toBe('Sign out');
  });

  it('announces itself as an alert that requires a response', () => {
    // `alertdialog` makes assistive technology read the question immediately
    // rather than waiting to be read to, which is the difference between a
    // confirmation and a panel that happens to be modal.
    const { surface } = render();

    expect(surface.getAttribute('role')).toBe('alertdialog');
  });

  it('colours the confirm action when the outcome is hard to undo', () => {
    const { actions } = render();

    expect(at(actions(), 1).getAttribute('data-variant')).toBe('danger');
  });

  it('answers true only when the confirm action is chosen', () => {
    const { fixture, host, actions } = render();

    at(actions(), 1).click();
    fixture.detectChanges();

    expect(host.answers).toEqual([true]);
  });

  it('answers false when the cancel action is chosen', () => {
    const { fixture, host, actions } = render();

    at(actions(), 0).click();
    fixture.detectChanges();

    expect(host.answers).toEqual([false]);
  });

  it('treats a dismissal as no', () => {
    // The safe answer has to be the one you get by doing nothing deliberate,
    // otherwise a confirmation is a trap.
    const { fixture, host, surface } = render();

    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.answers).toEqual([false]);
  });

  it('offers exactly one control named by the cancel label', () => {
    // The dialog used to take cancelLabel as its ✕ button's accessible name as
    // well, which put two identically named controls in one alertdialog: the
    // same words, the same effect, and no way to tell them apart by ear.
    const { root } = render();

    const named = [...root.querySelectorAll('button')].filter(
      (button) =>
        button.getAttribute('aria-label') === 'Stay signed in' ||
        button.textContent?.trim() === 'Stay signed in',
    );

    expect(named).toHaveLength(1);
    expect(root.querySelector('.cordly-dialog__dismiss')).toBeNull();
  });

  it('still answers no to Escape, with no ✕ left to press', () => {
    // Removing the button removed a control, not a way out. Escape fires
    // `cancel` and the browser then closes the dialog, which is what the
    // prototype stub's `close` stands in for here.
    const { fixture, host, surface } = render();

    surface.dispatchEvent(new Event('cancel', { cancelable: true }));
    surface.close();
    fixture.detectChanges();

    expect(host.answers).toEqual([false]);
  });

  it('answers exactly once, however many times it is closed', () => {
    const { fixture, host, actions, surface } = render();

    at(actions(), 1).click();
    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    at(actions(), 0).click();
    fixture.detectChanges();

    expect(host.answers).toEqual([true]);
  });
});
