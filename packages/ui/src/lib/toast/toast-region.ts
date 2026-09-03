import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { CordlyToasts, type CordlyToast } from './toasts';

/**
 * Where toasts are rendered. One per application, near the end of the document.
 *
 * The live region is a single container that stays in the DOM whether or not it
 * holds anything. A region created at the moment a message arrives is usually not
 * announced at all: assistive technology has to be observing it before the
 * content changes, and a region and its content appearing together is one
 * mutation, not two.
 */
@Component({
  selector: 'cordly-toast-region',
  templateUrl: './toast-region.html',
  styleUrl: './toast-region.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-toast-region' },
})
export class CordlyToastRegion {
  private readonly service = inject(CordlyToasts);

  /**
   * The accessible name of every dismiss control.
   *
   * Required rather than defaulted, because a default would be an English string
   * shipped from a package that has no way to know what language the application
   * speaks — and it would be the one piece of copy nobody notices is untranslated.
   */
  readonly dismissLabel = input.required<string>();

  protected readonly toasts = this.service.toasts;

  protected dismiss(id: string): void {
    this.service.dismiss(id);
  }

  protected runAction(toast: CordlyToast): void {
    toast.action?.run();
    this.service.dismiss(toast.id);
  }
}
