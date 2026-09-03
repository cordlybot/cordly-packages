import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * One navigation destination.
 *
 * `href` is optional. An application using a router binds nothing here and
 * listens to `navigate` instead; one using plain links passes an `href` and gets
 * a real anchor, which is what makes middle-click and "open in new tab" work.
 * The widget never resolves a route itself and imports no router.
 */
export interface CordlyNavItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly current?: boolean;
  /** A count worth surfacing beside the label — items needing attention, say. */
  readonly badge?: string;
  readonly disabled?: boolean;
}

/** A titled run of destinations. The title is a real heading, not a styled span. */
export interface CordlyNavGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly CordlyNavItem[];
}

/**
 * Grouped destinations for the frame's navigation column.
 *
 * Renders only what it is given, which is what makes capability-derived
 * navigation fall out for free: an application that passes two items renders a
 * two-item sidebar, and there is no second component and no hidden branch for
 * the reduced case.
 *
 * The current destination is marked with `aria-current="page"` as well as
 * visually. A sidebar where "you are here" is only a background colour tells a
 * screen-reader user nothing at all.
 */
@Component({
  selector: 'cordly-side-nav',
  templateUrl: './side-nav.html',
  styleUrl: './side-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-side-nav' },
})
export class CordlySideNav {
  readonly groups = input.required<readonly CordlyNavGroup[]>();

  /** Emitted for an item with no `href`, so the application can route it. */
  readonly navigate = output<CordlyNavItem>();

  protected choose(item: CordlyNavItem, event: Event): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (item.href !== undefined) return;
    event.preventDefault();
    this.navigate.emit(item);
  }
}
