import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  isDevMode,
} from '@angular/core';

/**
 * Something failed where content should have been.
 *
 * Deliberately not the same component as `cordly-empty-state`, and the
 * distinction is the point: an empty state is a place with nothing in it yet,
 * which is normal and expected. This is a place that should have had something
 * and did not, which is neither. So this one announces itself with
 * `role="alert"`, and it insists on a recovery action.
 *
 * ```html
 * <cordly-error-state
 *   heading="Could not load your servers"
 *   body="Cordly could not reach Discord. Your settings are unchanged."
 *   [detail]="correlationId()"
 * >
 *   <button cordlyButton (click)="retry()">Try again</button>
 * </cordly-error-state>
 * ```
 *
 * `detail` is for the technical remainder — a correlation id, a status code —
 * and is rendered quietly, because it is for the person reporting the problem
 * rather than the one reading it. It is a separate input from `body` so an
 * application cannot accidentally put a stack trace where the explanation goes.
 */
@Component({
  selector: 'cordly-error-state',
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-error-state',
    role: 'alert',
  },
})
export class CordlyErrorState {
  readonly heading = input.required<string>();

  /** What happened and what it means, in plain language. */
  readonly body = input<string | null>(null);

  /** The technical remainder. Quietly rendered, never the explanation. */
  readonly detail = input<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (!isDevMode()) return;

    afterNextRender(() => {
      const actions = this.host.nativeElement.querySelector('.cordly-error-state__actions');
      if (!actions || actions.childElementCount === 0) {
        throw new Error(
          'cordly-error-state: an error needs a way out. Project a retry, a reload, or a route away from here.',
        );
      }
    });
  }
}
