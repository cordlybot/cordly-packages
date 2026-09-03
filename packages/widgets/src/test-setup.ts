import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach } from 'vitest';

/**
 * Both Cordly front ends are zoneless, so the primitives they install are
 * tested zoneless. Running these with zones would let a component pass here and
 * never update in the application that consumes it.
 */
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
});
