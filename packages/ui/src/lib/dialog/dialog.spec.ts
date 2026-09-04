import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CordlyDialog, type CordlyDialogCloseReason } from './dialog';

@Component({
  imports: [CordlyDialog],
  template: `
    <button type="button" id="opener" (click)="open.set(true)">Open</button>
    <cordly-dialog
      [open]="open()"
      heading="Remove the welcome module?"
      [description]="description()"
      [dismissible]="dismissible()"
      dismissLabel="Close"
      (closed)="lastReason.set($event)"
    >
      <button type="button" id="confirm">Remove module</button>
    </cordly-dialog>
  `,
})
class Host {
  readonly dialog = viewChild.required(CordlyDialog);
  readonly open = signal(false);
  readonly dismissible = signal(true);
  readonly description = signal<string | null>('Members stop receiving a greeting.');
  readonly lastReason = signal<CordlyDialogCloseReason | null>(null);
}

/**
 * jsdom implements `<dialog>` structurally but not the top layer, so
 * `showModal` is stubbed to record the call and set `open`. What is under test
 * here is the component's contract — which method it calls, what it labels, and
 * where focus goes — while the real focus trap, the backdrop, and `inert` are
 * the browser's and are proved in the browser fixture instead.
 */
function stubDialogElement(element: HTMLDialogElement) {
  const showModal = vi.fn(() => {
    element.setAttribute('open', '');
  });
  const close = vi.fn(() => {
    element.removeAttribute('open');
    element.dispatchEvent(new Event('close'));
  });
  Object.defineProperty(element, 'showModal', { value: showModal, configurable: true });
  Object.defineProperty(element, 'close', { value: close, configurable: true });
  return { showModal, close };
}

describe('CordlyDialog', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const surface = root.querySelector('dialog') as HTMLDialogElement;
    const stubs = stubDialogElement(surface);
    return { fixture, host: fixture.componentInstance, root, surface, ...stubs };
  }

  it('opens as a modal rather than as an ordinary open dialog', () => {
    // `show()` leaves the page behind it interactive and traps nothing.
    // `showModal()` is what supplies the focus trap, the top layer, and `inert`.
    const { fixture, host, showModal } = render();

    host.open.set(true);
    fixture.detectChanges();

    expect(showModal).toHaveBeenCalledOnce();
  });

  it('is named by its heading and described by its description', () => {
    const { fixture, host, root, surface } = render();

    host.open.set(true);
    fixture.detectChanges();

    const heading = root.querySelector('.cordly-dialog__heading') as HTMLElement;
    const description = root.querySelector('.cordly-dialog__description') as HTMLElement;

    expect(surface.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(surface.getAttribute('aria-describedby')).toBe(description.id);
    expect(heading.textContent).toContain('Remove the welcome module?');
  });

  it('does not reference a description that is not rendered', () => {
    const { fixture, host, surface } = render();

    host.description.set(null);
    host.open.set(true);
    fixture.detectChanges();

    expect(surface.getAttribute('aria-describedby')).toBeNull();
  });

  it('returns focus to whatever opened it', () => {
    // The browser does not do this. Without it a keyboard user is dropped at the
    // top of the document every time a dialog closes.
    const { fixture, host, root } = render();
    const opener = root.querySelector('#opener') as HTMLButtonElement;
    document.body.appendChild(root);
    opener.focus();

    host.open.set(true);
    fixture.detectChanges();

    host.open.set(false);
    fixture.detectChanges();

    expect(document.activeElement).toBe(opener);
  });

  it('reports why it closed', () => {
    const { fixture, host } = render();

    host.open.set(true);
    fixture.detectChanges();
    host.dialog().close('action');
    fixture.detectChanges();

    expect(host.lastReason()).toBe('action');
  });

  it('treats a click on the backdrop as a dismissal', () => {
    // The backdrop has no node of its own, so a click on it targets the dialog
    // element itself. Anything inside the panel targets something else.
    const { fixture, host, surface, close } = render();

    host.open.set(true);
    fixture.detectChanges();

    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(close).toHaveBeenCalled();
    expect(host.lastReason()).toBe('dismiss');
  });

  it('ignores a click inside the panel', () => {
    const { fixture, host, root, close } = render();

    host.open.set(true);
    fixture.detectChanges();

    (root.querySelector('#confirm') as HTMLButtonElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(close).not.toHaveBeenCalled();
  });

  it('gives its title bar no landmark role', () => {
    // A <header> whose nearest sectioning ancestor is the body maps to `banner`,
    // and <dialog> is not sectioning content — so the obvious markup gives a
    // page two banners. A dialog's title bar is not the page's header.
    const { fixture, host, root } = render();

    host.open.set(true);
    fixture.detectChanges();

    expect(root.querySelectorAll('header')).toHaveLength(0);
    expect(root.querySelectorAll('footer')).toHaveLength(0);
    expect(root.querySelector('.cordly-dialog__header')).not.toBeNull();
  });

  it('is a plain dialog unless it is told it interrupts', () => {
    const { fixture, host, surface } = render();

    host.open.set(true);
    fixture.detectChanges();

    expect(surface.getAttribute('role')).toBeNull();
  });

  it('refuses Escape and the backdrop when it holds a draft', () => {
    // Losing typed input to a stray click outside is exactly the edit the UX
    // plan says must never be lost.
    const { fixture, host, surface, close } = render();

    host.dismissible.set(false);
    host.open.set(true);
    fixture.detectChanges();

    const cancel = new Event('cancel', { cancelable: true });
    surface.dispatchEvent(cancel);
    surface.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(cancel.defaultPrevented).toBe(true);
    expect(close).not.toHaveBeenCalled();
  });
});
