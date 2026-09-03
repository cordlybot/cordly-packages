import { DOCUMENT, inject, Injectable, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Whether this viewer has asked for reduced motion.
 *
 * Almost everything in `@cordly/ui` answers that question in CSS, which is the
 * right place: it needs no JavaScript, it applies before hydration, and it
 * cannot get out of step with the media query. This exists for the remainder —
 * a component that would otherwise start a `requestAnimationFrame` loop or an
 * imperative scroll — and for consumers composing their own motion.
 *
 * On the server it reports `false`, because a request carries no such
 * preference. That is a deliberate default rather than an oversight: the CSS
 * already suppresses movement in the first painted frame, so the server value
 * only decides whether JavaScript that has not run yet would have animated.
 */
@Injectable({ providedIn: 'root' })
export class CordlyReducedMotion {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal(false);

  readonly preferred: Signal<boolean> = this.state.asReadonly();

  constructor() {
    if (!this.isBrowser) return;

    const view = this.document.defaultView;
    if (!view?.matchMedia) return;

    const query = view.matchMedia('(prefers-reduced-motion: reduce)');
    this.state.set(query.matches);
    query.addEventListener('change', (event) => {
      this.state.set(event.matches);
    });
  }
}

/** Convenience for components and consumers: the signal on its own. */
export function injectReducedMotion(): Signal<boolean> {
  return inject(CordlyReducedMotion).preferred;
}
