import { inject } from '@angular/core';
import { APP_ID } from '@angular/core';

/**
 * A DOM id that is stable across a server render and its hydration.
 *
 * Angular's own `inject(APP_ID)` participates in the same scope the server used,
 * so seeding the counter with it keeps two applications on one page from
 * colliding. A `Math.random()` id would differ between the server's HTML and the
 * browser's first render, which breaks `aria-describedby` for exactly as long as
 * it takes hydration to notice — and hydration does not notice, because the
 * attribute value is not part of what it reconciles.
 */
let sequence = 0;

export function cordlyId(prefix: string): string {
  const appId = inject(APP_ID);
  sequence += 1;
  return `${appId}-cordly-${prefix}-${sequence}`;
}

/**
 * Reset the counter. Test-only: two specs that both render a field would
 * otherwise assert against ids that depend on execution order.
 */
export function resetCordlyIdSequenceForTests(): void {
  sequence = 0;
}
