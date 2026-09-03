import { DestroyRef, Injectable, computed, inject, signal, type Signal } from '@angular/core';

import type { CordlyTone } from '../badge/badge';

/** What a caller asks for when something finished in the background. */
export interface CordlyToastRequest {
  /**
   * The whole message, already translated by the caller.
   *
   * It says what happened and where — "Welcome messages enabled in Night
   * Library" rather than "Saved". A summary nobody can place is a summary
   * nobody can act on.
   */
  readonly message: string;

  readonly tone?: CordlyTone;

  /**
   * How long before it leaves, in milliseconds. `null` keeps it until dismissed.
   *
   * A toast carrying an action is kept by default: an undo a reader has to catch
   * within four seconds is not an undo.
   */
  readonly duration?: number | null;

  /** One recovery or follow-up action. Not a place for a second primary action. */
  readonly action?: { readonly label: string; readonly run: () => void };
}

export interface CordlyToast extends CordlyToastRequest {
  readonly id: string;
  readonly tone: CordlyTone;
}

/**
 * Background outcomes, announced once.
 *
 * The rule this service exists to keep: **a toast never carries the only copy of
 * an error.** It is transient, it can be missed entirely by somebody who was
 * looking elsewhere, and it is gone before a screen-reader user has finished the
 * sentence they were on. Anything a person has to act on also has an inline
 * `cordly-status` beside the thing it concerns; the toast is the summary, not
 * the record.
 *
 * The region announces through one polite live region. Danger tones are not
 * escalated to `assertive` here, deliberately: interrupting somebody mid-sentence
 * to read a message that is about to disappear is worse than letting them reach
 * it, and the durable message is the inline one.
 */
@Injectable({ providedIn: 'root' })
export class CordlyToasts {
  private readonly items = signal<readonly CordlyToast[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private sequence = 0;

  readonly toasts: Signal<readonly CordlyToast[]> = computed(() => this.items());

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.timers.values()) clearTimeout(timer);
      this.timers.clear();
    });
  }

  /** Returns the id, so a caller can dismiss its own toast early. */
  show(request: CordlyToastRequest): string {
    this.sequence += 1;
    const id = `cordly-toast-${this.sequence}`;
    const duration =
      request.duration === undefined ? (request.action ? null : 6000) : request.duration;

    const toast: CordlyToast = { ...request, id, tone: request.tone ?? 'neutral' };
    this.items.update((current) => [...current, toast]);

    if (duration !== null) {
      this.timers.set(
        id,
        setTimeout(() => {
          this.dismiss(id);
        }, duration),
      );
    }

    return id;
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((current) => current.filter((toast) => toast.id !== id));
  }

  dismissAll(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.items.set([]);
  }
}
