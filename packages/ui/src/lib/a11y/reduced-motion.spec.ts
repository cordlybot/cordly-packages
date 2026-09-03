import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CordlyReducedMotion } from './reduced-motion';

describe('CordlyReducedMotion', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => vi.unstubAllGlobals());

  function stubMatchMedia(matches: boolean) {
    const listeners: ((event: MediaQueryListEvent) => void)[] = [];
    const query = {
      matches,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.push(listener);
      },
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => query),
    );
    // Arrow properties, because the specs destructure `emit` off this object and
    // a shorthand method separated from its owner is exactly the footgun the
    // unbound-method rule exists to catch.
    return {
      emit: (next: boolean) => {
        for (const listener of listeners) listener({ matches: next } as MediaQueryListEvent);
      },
    };
  }

  it('reports the current preference in the browser', () => {
    stubMatchMedia(true);

    expect(TestBed.inject(CordlyReducedMotion).preferred()).toBe(true);
  });

  it('follows a change made while the page is open', () => {
    const { emit } = stubMatchMedia(false);
    const service = TestBed.inject(CordlyReducedMotion);

    expect(service.preferred()).toBe(false);
    emit(true);

    expect(service.preferred()).toBe(true);
  });

  it('reports no preference on the server, where a request carries none', () => {
    // A deliberate default rather than an oversight: the CSS already suppresses
    // movement in the first painted frame, so this value only decides what
    // JavaScript that has not run yet would have done.
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    expect(TestBed.inject(CordlyReducedMotion).preferred()).toBe(false);
  });
});
