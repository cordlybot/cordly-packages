import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyConfirm } from './confirm';

describe('CordlyConfirm', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('answers no on the server without rendering anything', async () => {
    // A render has no user to ask, and the safe answer to an unanswerable
    // question is no. The alternative is a server render that silently approves
    // a destructive action.
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    const before = document.body.childElementCount;
    const answer = await TestBed.inject(CordlyConfirm).ask({
      heading: 'Remove the module?',
      confirmLabel: 'Remove',
      cancelLabel: 'Keep',
    });

    expect(answer).toBe(false);
    expect(document.body.childElementCount).toBe(before);
  });
});
