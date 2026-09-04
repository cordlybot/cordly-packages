import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  createComponent,
  inject,
} from '@angular/core';

import { CordlyConfirmDialog, type CordlyConfirmRequest } from './confirm-dialog';

/**
 * Ask before doing something that is hard to undo.
 *
 * ```ts
 * const confirmed = await confirm.ask({
 *   heading: t('session.signOutTitle'),
 *   body: t('session.signOutBody'),
 *   confirmLabel: t('session.signOut'),
 *   cancelLabel: t('common.cancel'),
 *   tone: 'danger',
 * });
 * ```
 *
 * Imperative on purpose. A confirmation belongs to the *action*, not to the
 * page: the same sign-out runs from a header menu and from an account page, and
 * making each of them own a dialog, a boolean, and a pair of handlers is how the
 * two drift until one of them forgets to ask.
 *
 * The whole component is created and destroyed per question rather than kept
 * mounted and toggled. A confirmation is rare and short-lived, and a dialog that
 * lives permanently in the DOM is one more thing every page carries and every
 * accessibility scan walks.
 */
@Injectable({ providedIn: 'root' })
export class CordlyConfirm {
  private readonly applicationRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Resolves to what the person chose.
   *
   * On the server it resolves `false` without rendering anything. A render has
   * no user to ask, and the safe answer to an unanswerable question is no — the
   * alternative is a server render that silently approves a destructive action.
   */
  async ask(request: CordlyConfirmRequest): Promise<boolean> {
    if (!this.isBrowser) return false;

    const host = this.document.createElement('div');
    this.document.body.appendChild(host);

    const dialog = createComponent(CordlyConfirmDialog, {
      environmentInjector: this.injector,
      hostElement: host,
    });
    dialog.setInput('request', request);
    this.applicationRef.attachView(dialog.hostView);

    try {
      return await new Promise<boolean>((resolve) => {
        dialog.instance.answered.subscribe((answer: boolean) => {
          resolve(answer);
        });
      });
    } finally {
      // Runs on every path, including a rejected promise or a destroyed
      // application, because a leaked dialog host is invisible until a page has
      // accumulated a dozen of them.
      this.applicationRef.detachView(dialog.hostView);
      dialog.destroy();
      host.remove();
    }
  }
}
