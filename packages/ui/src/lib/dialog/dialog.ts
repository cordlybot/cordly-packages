import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { cordlyId } from '../a11y/unique-id';

/** Centred modal, or a sheet anchored to the inline end. Same component. */
export type CordlyDialogPlacement = 'center' | 'end';

/** How the dialog was closed. `dismiss` covers Escape, the backdrop, and the ✕. */
export type CordlyDialogCloseReason = 'dismiss' | 'action';

/**
 * A modal dialog, or the same dialog as an edge drawer.
 *
 * Built on the platform's `<dialog>` element in modal mode rather than on an
 * overlay toolkit. That decision is worth recording because it removed a
 * dependency: `showModal()` supplies the focus trap, the top layer, `inert` on
 * the rest of the document, Escape handling, and `aria-modal` semantics — the
 * five things a hand-built overlay reimplements, and the five things it gets
 * subtly wrong. Wrapping a headless library here would also have meant a second
 * peer-dependency range to keep truthful across Angular versions, for behaviour
 * the browser already ships.
 *
 * What the component adds on top is the parts the element does not have: focus
 * restoration to the trigger, a labelled heading, backdrop-click dismissal that
 * distinguishes the backdrop from the panel, and a close reason.
 *
 * The title bar is a `<div>` rather than a `<header>`, deliberately. A `<header>`
 * whose nearest sectioning ancestor is the body maps to the `banner` landmark,
 * and `<dialog>` is not sectioning content — so a dialog built the obvious way
 * gives a page two banners and two contentinfos. A dialog's title bar is not the
 * page's header.
 *
 * ```html
 * <cordly-dialog
 *   [open]="confirming()"
 *   heading="Remove the welcome module?"
 *   description="Members will stop receiving a greeting in Night Library."
 *   dismissLabel="Close"
 *   (closed)="confirming.set(false)"
 * >
 *   <button cordly-dialog-actions cordlyButton variant="danger" (click)="remove()">Remove module</button>
 * </cordly-dialog>
 * ```
 */
@Component({
  selector: 'cordly-dialog',
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-dialog',
    '[attr.data-placement]': 'placement()',
  },
})
export class CordlyDialog {
  readonly open = input(false, { transform: booleanAttribute });
  readonly heading = input.required<string>();
  readonly description = input<string | null>(null);
  readonly placement = input<CordlyDialogPlacement>('center');

  /** Accessible name for the ✕ control. Required for the same reason as the toast's. */
  readonly dismissLabel = input.required<string>();

  /**
   * Escape and a backdrop click close the dialog.
   *
   * Turned off for a dialog whose content is a draft: losing typed input to a
   * stray click outside is exactly the kind of edit the UX plan says must never
   * be lost. A dialog that refuses to dismiss must offer a visible cancel.
   */
  readonly dismissible = input(true, { transform: booleanAttribute });

  /**
   * This dialog is an alert that requires a response.
   *
   * Sets `role="alertdialog"`, which tells assistive technology to announce the
   * dialog's description immediately rather than waiting to be read to. Reserved
   * for a genuine interruption — a confirmation before something hard to undo —
   * because a page where every dialog interrupts has no way to signal that one
   * of them matters more.
   */
  readonly alert = input(false, { transform: booleanAttribute });

  readonly closed = output<CordlyDialogCloseReason>();

  private readonly surface = viewChild.required<ElementRef<HTMLDialogElement>>('surface');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly headingId = cordlyId('dialog-heading');
  protected readonly descriptionId = `${this.headingId}-description`;

  /** Where focus came from, so it can be put back exactly there. */
  private trigger: HTMLElement | null = null;
  private reason: CordlyDialogCloseReason = 'dismiss';

  constructor() {
    effect(() => {
      const shouldOpen = this.open();

      // `showModal` does not exist on the server, and the element is rendered
      // closed there anyway: a modal in server HTML would be a block of content
      // a crawler reads as part of the page.
      if (!this.isBrowser) return;

      const element = this.surface().nativeElement;
      if (shouldOpen === element.open) return;

      if (shouldOpen) {
        this.trigger = element.ownerDocument.activeElement as HTMLElement | null;
        this.reason = 'dismiss';
        element.showModal();
      } else {
        element.close();
      }
    });
  }

  /** Close from inside the dialog — a confirm button, or the ✕. */
  close(reason: CordlyDialogCloseReason = 'action'): void {
    this.reason = reason;
    this.surface().nativeElement.close();
  }

  protected handleCancel(event: Event): void {
    // `cancel` is Escape. Preventing it is the only way to keep a draft dialog
    // from vanishing under a key people press for unrelated reasons.
    if (!this.dismissible()) {
      event.preventDefault();
      return;
    }
    this.reason = 'dismiss';
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (!this.dismissible()) return;

    // A click on the backdrop targets the `<dialog>` element itself, because the
    // backdrop is a pseudo-element with no node of its own. A click anywhere in
    // the panel targets something inside it. That difference is the whole test —
    // comparing coordinates against the panel's box gets the answer wrong for a
    // click that starts inside and ends outside.
    if (event.target !== this.surface().nativeElement) return;

    this.close('dismiss');
  }

  protected handleNativeClose(): void {
    // Focus goes back to whatever opened the dialog. The browser does not do
    // this, and without it a keyboard user is returned to the top of the
    // document every time they close something.
    this.trigger?.focus();
    this.trigger = null;
    this.closed.emit(this.reason);
  }
}
