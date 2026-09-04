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

  /**
   * Which heading level this is in the page it lands on.
   *
   * A shared component cannot guess. The default suits an empty state inside a
   * section that already has its own heading, which is most of them — but a
   * whole page can *be* an empty state, and Cordly has one: the not-found route
   * is nothing but this component. Fixing the level at 3 forced that page to add
   * a visually hidden `h1` saying the same words, which left two headings with
   * identical text and a document outline that started at level 3.
   *
   * The sibling `cordly-error-state` has no equivalent, and that asymmetry is
   * deliberate rather than an oversight: it is a `role="alert"` live region that
   * replaces content which failed to load, so it is announced when it appears
   * instead of taking a place in the document outline.
   */
  readonly headingLevel = input<1 | 2 | 3 | 4>(3);

  /**
   * The explanation, when it is one sentence.
   *
   * The default slot takes anything richer. Both exist because the sibling
   * `cordly-error-state` has the same pair, and two components that sit next to
   * each other in the same union of states should not need to be called
   * differently — the asymmetry was in this package, not in its callers.
   */
  readonly body = input<string | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    if (!isDevMode()) return;

    afterNextRender(() => {
      const host = this.host.nativeElement;
      const actions = host.querySelector('.cordly-empty-state__actions');
      if (actions && actions.childElementCount > 0) return;

      // Two different mistakes with the same symptom, and telling them apart is
      // most of the value. Projecting the action without the attribute is the
      // common one: it lands in the body slot, so it renders in the wrong place
      // *and* fails this check, and "project one" is unhelpful advice to
      // somebody looking straight at the one they projected.
      const misplaced = host.querySelector(
        '.cordly-empty-state__body button, .cordly-empty-state__body a',
      );

      throw new Error(
        misplaced
          ? 'cordly-empty-state: the action is in the body slot rather than the action slot, so it renders with the explanation instead of below it. Add the cordly-empty-state-action attribute to it.'
          : 'cordly-empty-state: an empty state must offer a next action. Project one with the cordly-empty-state-action attribute.',
      );
    });
  }
}
