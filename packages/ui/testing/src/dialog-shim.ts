/**
 * Teach jsdom enough about `<dialog>` to run a spec.
 *
 * jsdom implements `<dialog>` structurally and stops there: `showModal` and
 * `close` are missing entirely, because what they do — the top layer, the focus
 * trap, `inert` on everything behind, Escape — is rendering and input, which
 * jsdom has neither of.
 *
 * `@cordly/ui` builds its dialog, its confirmation, and any drawer on the real
 * element, and that is the point: those four behaviours come from the platform
 * rather than from a reimplementation that gets one of them subtly wrong. The
 * cost is that a specification rendering any of them in jsdom has to supply the
 * two methods, and every consumer hits it the first time a page under test
 * contains a dialog.
 *
 * So it ships. Three copies of this had already been written inside this
 * repository alone, and they had already drifted: one dispatched `close` when
 * the dialog was already closed, which turns a double close into a second
 * `closed` event and a test that passes for the wrong reason.
 *
 * ```ts
 * // test-setup.ts
 * import { installDialogShim } from '@cordly/ui/testing';
 *
 * installDialogShim();
 * ```
 *
 * What a spec proves with this in place is the component's contract: which
 * method it calls, what it labels, where it puts focus back. The trap, the
 * backdrop, and the inert page behind it are the browser's, and are proved in a
 * browser.
 */

/** Undoes one installation. Safe to call more than once. */
export interface DialogShim {
  restore(): void;
}

const noop: DialogShim = { restore: () => undefined };

/**
 * Installs the shim on `HTMLDialogElement.prototype`.
 *
 * On the prototype rather than per element, because a dialog that opens during
 * its own first render — a confirmation does — offers no moment in which the
 * element exists and is not yet open.
 *
 * Does nothing where a real implementation exists, so the same setup file can be
 * used by a jsdom runner and a browser runner without a flag. Detection is by
 * source rather than by presence: a previous installation is also "present".
 */
export function installDialogShim(): DialogShim {
  if (typeof HTMLDialogElement === 'undefined') {
    throw new Error(
      '@cordly/ui/testing: this environment has no HTMLDialogElement at all, so there is nothing to shim. Check that the test environment is jsdom or a browser.',
    );
  }

  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;

  // A native method stringifies as "[native code]". Anything else is either
  // already this shim or somebody else's, and replacing it would be a surprise
  // either way.
  const isNative = (value: unknown): boolean =>
    typeof value === 'function' &&
    Function.prototype.toString.call(value).includes('[native code]');

  if (isNative(prototype['showModal']) && isNative(prototype['close'])) return noop;

  const previous = {
    showModal: Object.getOwnPropertyDescriptor(prototype, 'showModal'),
    close: Object.getOwnPropertyDescriptor(prototype, 'close'),
  };

  Object.defineProperty(prototype, 'showModal', {
    configurable: true,
    writable: true,
    value: function showModal(this: HTMLDialogElement): void {
      this.setAttribute('open', '');
    },
  });

  Object.defineProperty(prototype, 'close', {
    configurable: true,
    writable: true,
    value: function close(this: HTMLDialogElement): void {
      // A dialog that is already closed fires nothing. Without this guard a
      // second `close()` emits a second `close` event, and a component that
      // reports why it closed reports it twice — which is a test passing for
      // the wrong reason rather than a test failing.
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    },
  });

  let restored = false;
  return {
    restore: () => {
      if (restored) return;
      restored = true;
      for (const [name, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(prototype, name, descriptor);
        else Reflect.deleteProperty(prototype, name);
      }
    },
  };
}
