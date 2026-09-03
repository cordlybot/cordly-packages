import { ChangeDetectionStrategy, Component, booleanAttribute, input, model } from '@angular/core';

/**
 * The page skeleton every Cordly application shares.
 *
 * A skip link, a banner, a navigation region, a main landmark, and a content
 * footer — the parts that decide whether a page can be navigated by structure
 * at all, and the parts every application otherwise rebuilds slightly
 * differently.
 *
 * It contains no routes, no destinations, and no copy. Everything visible is
 * projected:
 *
 * ```html
 * <cordly-app-frame
 *   skipLabel="Skip to main content"
 *   navigationLabel="Server sections"
 *   [(navigationOpen)]="drawerOpen"
 * >
 *   <cordly-app-header cordly-frame-header …/>
 *   <cordly-side-nav cordly-frame-navigation …/>
 *   <router-outlet />
 * </cordly-app-frame>
 * ```
 *
 * On a narrow viewport the navigation column becomes a drawer. The frame owns
 * whether it is showing; it does not own what opens it, because the trigger
 * belongs beside the application's own brand.
 */
@Component({
  selector: 'cordly-app-frame',
  templateUrl: './app-frame.html',
  styleUrl: './app-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-app-frame',
    '[attr.data-navigation-open]': 'navigationOpen() ? "" : null',
  },
})
export class CordlyAppFrame {
  /**
   * The skip link's text.
   *
   * Required, and it is the first thing in the tab order. A page without one
   * makes a keyboard user walk the entire navigation on every single view.
   */
  readonly skipLabel = input.required<string>();

  /** Accessible name for the navigation landmark. Two unnamed `nav` regions are indistinguishable. */
  readonly navigationLabel = input.required<string>();

  /** The application has no side navigation on this page. */
  readonly bare = input(false, { transform: booleanAttribute });

  /** Drawer state on narrow viewports. Two-way, so the trigger can live outside. */
  readonly navigationOpen = model(false);

  protected readonly mainId = 'cordly-main';

  protected closeNavigation(): void {
    this.navigationOpen.set(false);
  }
}
