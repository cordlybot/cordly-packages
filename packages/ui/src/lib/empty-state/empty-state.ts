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
 * Nothing here yet, and what to do about it.
 *
 * The action slot is not optional, and the component checks for it in
 * development. An empty state that only says "no data" hands the reader a dead
 * end at the exact moment they need a next step, and it is the single most
 * common way a well-built interface still feels unfinished.
 *
 * ```html
 * <cordly-empty-state heading="No servers yet">
 *   Add Cordly to a server you manage to configure it here.
 *   <a cordly-empty-state-action cordlyButton variant="primary" [href]="addUrl">Add to a server</a>
 * </cordly-empty-state>
 * ```
 */
@Component({
  selector: 'cordly-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-empty-state' },
})
export class CordlyEmptyState {
  readonly heading = input.required<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (!isDevMode()) return;

    afterNextRender(() => {
      const actions = this.host.nativeElement.querySelector('.cordly-empty-state__actions');
      if (!actions || actions.childElementCount === 0) {
        throw new Error(
          'cordly-empty-state: an empty state must offer a next action. Project one with the cordly-empty-state-action attribute.',
        );
      }
    });
  }
}
