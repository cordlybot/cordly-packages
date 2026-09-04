import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
 * jsdom implements `<dialog>` structurally but not the top layer, so `showModal`
 * is absent. Patched on the prototype rather than per element, because this
 * dialog opens during its first render — there is no moment when the element
 * exists and is not yet open.
 *
 * What is under test is the component's contract. The real focus trap, the
 * backdrop, and `inert` belong to the browser and are proved in the browser
 * fixture.
 */
function stubDialogPrototype(): void {
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  prototype['showModal'] = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  prototype['close'] = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
}

describe('CordlyConfirmDialog', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    stubDialogPrototype();
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

  it('answers exactly once, however many times it is closed', () => {
    const { fixture, host, actions, surface } = render();

    at(actions(), 1).click();
    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    at(actions(), 0).click();
    fixture.detectChanges();

    expect(host.answers).toEqual([true]);
  });
});
