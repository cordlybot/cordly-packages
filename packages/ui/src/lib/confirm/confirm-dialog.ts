import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

import { CordlyButton } from '../button/button';
import { CordlyDialog, type CordlyDialogCloseReason } from '../dialog/dialog';

/**
 * What a caller is asking, in their own words.
 *
 * Every label is required. A confirmation is the one place a generic "OK" does
 * the most damage: the UX plan asks for a verb and a specific object — "Remove
 * module", "Sign out" — so somebody can predict the effect of the button before
 * pressing it, which is exactly what a confirmation exists to make possible.
 */
export interface CordlyConfirmRequest {
  readonly heading: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;

  /** What will happen, naming what it affects. */
  readonly body?: string;

  /** `danger` colours the confirm action. Use it when the outcome is hard to undo. */
  readonly tone?: 'default' | 'danger';
}

/**
 * The dialog `CordlyConfirm` mounts. Not placed by hand.
 *
 * Exported because a consumer's own overlay might need to render one, and
 * because a component that appears in an application's DOM without appearing in
 * its API is harder to reason about than one that is simply documented as
 * internal-by-convention.
 */
@Component({
  selector: 'cordly-confirm-dialog',
  imports: [CordlyButton, CordlyDialog],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-confirm-dialog' },
})
export class CordlyConfirmDialog {
  readonly request = input.required<CordlyConfirmRequest>();

  /** Emitted exactly once, with what the person chose. */
  readonly answered = output<boolean>();

  protected readonly open = signal(true);

  private settled = false;

  protected settle(answer: boolean): void {
    if (this.settled) return;
    this.settled = true;
    this.open.set(false);
    this.answered.emit(answer);
  }

  /**
   * Escape, the backdrop, and the ✕ all mean no.
   *
   * Treating a dismissal as anything else is how a confirmation becomes a
   * trap — the safe answer has to be the one you get by doing nothing
   * deliberate.
   */
  protected handleClosed(reason: CordlyDialogCloseReason): void {
    if (reason === 'dismiss') this.settle(false);
  }
}
