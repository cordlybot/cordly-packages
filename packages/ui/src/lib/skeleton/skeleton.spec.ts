import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { at } from '../../testing/dom';

import { CordlySkeleton, type CordlySkeletonShape } from './skeleton';

@Component({
  imports: [CordlySkeleton],
  template: `<cordly-skeleton [shape]="shape()" [count]="count()" />`,
})
class Host {
  readonly shape = signal<CordlySkeletonShape>('text');
  readonly count = signal(3);
}

describe('CordlySkeleton', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      skeleton: root.querySelector('cordly-skeleton') as HTMLElement,
      lines: () => [...root.querySelectorAll<HTMLElement>('.cordly-skeleton__line')],
    };
  }

  it('is hidden from assistive technology', () => {
    // A screen reader gains nothing from four grey rectangles being described.
    // What it needs is the surrounding region saying it is busy.
    const { skeleton } = render();

    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the requested number of rows', () => {
    const { fixture, host, lines } = render();

    host.count.set(5);
    fixture.detectChanges();

    expect(lines()).toHaveLength(5);
  });

  it('shortens the last row, because that is what a paragraph does', () => {
    const { lines } = render();

    expect(at(lines(), 0).style.inlineSize).toBe('100%');
    expect(at(lines(), 2).style.inlineSize).toBe('60%');
  });

  it('lets the caller size a block, so the placeholder matches what is coming', () => {
    // The whole advantage of a skeleton over a spinner is that it holds the
    // right space. A component that picks its own height throws that away.
    const { fixture, host, skeleton } = render();

    host.shape.set('block');
    fixture.detectChanges();

    expect(skeleton.getAttribute('data-shape')).toBe('block');
  });

  it('collapses to a single shape for a block or a circle', () => {
    const { fixture, host, lines, skeleton } = render();

    host.shape.set('circle');
    fixture.detectChanges();

    expect(lines()).toHaveLength(1);
    expect(skeleton.getAttribute('data-shape')).toBe('circle');
  });

  it('never renders zero rows, which would collapse the layout it is holding open', () => {
    const { fixture, host, lines } = render();

    host.count.set(0);
    fixture.detectChanges();

    expect(lines()).toHaveLength(1);
  });
});
