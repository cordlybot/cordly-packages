import { ErrorHandler, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';

/**
 * Let a form binding land, then render.
 *
 * `ngModel` pushes its first value through a bare promise chain rather than
 * through Angular's scheduler, so a zoneless `whenStable()` can resolve before
 * `writeValue` has run. Waiting a macrotask is the reliable point at which the
 * control has the value the template gave it.
 */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await fixture.whenStable();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

/**
 * Collect what a component reports to Angular's error handler.
 *
 * A `afterNextRender` callback that throws is routed to the `ErrorHandler`, not
 * to the promise a spec is awaiting, so `expect(...).rejects` never sees it.
 * Several primitives here refuse in development to render an accessibility
 * defect, and this is how that refusal is asserted.
 */
export function collectErrors(): { readonly provider: Provider; readonly messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    provider: {
      provide: ErrorHandler,
      useValue: {
        handleError(error: unknown) {
          messages.push(error instanceof Error ? error.message : String(error));
        },
      } satisfies ErrorHandler,
    },
  };
}

/** Install the collector before the fixture is created. */
export function withErrorCollector() {
  const collector = collectErrors();
  TestBed.configureTestingModule({ providers: [collector.provider] });
  return collector;
}
