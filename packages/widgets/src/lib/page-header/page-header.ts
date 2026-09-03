import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The top of a routed page.
 *
 * An eyebrow, the page's one `<h1>`, a description, an actions slot, and a
 * `before` slot for whatever belongs above the title — a breadcrumb, a back
 * link, a server switcher. Everything projected is the application's, including
 * the breadcrumb, because a breadcrumb is a list of routes and routes are not
 * this package's business.
 *
 * It renders an `<h1>`, deliberately and without an option to change it. A page
 * has exactly one, it is what a screen reader jumps to first, and a component
 * that let the level be passed in would eventually be given `h3` by somebody
 * matching a visual size — which is how a document outline quietly stops
 * describing the page.
 *
 * ```html
 * <cordly-page-header heading="Night Library" eyebrow="Server" description="…">
 *   <nav cordly-page-header-before>…breadcrumb…</nav>
 *   <button cordly-page-header-actions cordlyButton>Add a module</button>
 * </cordly-page-header>
 * ```
 */
@Component({
  selector: 'cordly-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'cordly-page-header' },
})
export class CordlyPageHeader {
  readonly heading = input.required<string>();

  /** A short kicker above the title — what kind of thing this page is about. */
  readonly eyebrow = input<string | null>(null);

  readonly description = input<string | null>(null);
}
