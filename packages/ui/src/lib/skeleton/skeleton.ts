import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

export type CordlySkeletonShape = 'text' | 'block' | 'circle';

/**
 * A placeholder shaped like the content that is coming.
 *
 * Skeletons rather than spinners wherever the layout is known ahead. A spinner
 * says "wait"; a skeleton says "wait, and here is roughly what you will get",
 * and — more usefully — it holds the space, so nothing jumps when the real
 * content arrives and nobody clicks the wrong row.
 *
 * `shape="block"` fills whatever box the caller gave it, so a placeholder is the
 * size of the thing it stands in for — which is the entire advantage of a
 * skeleton over a spinner, and it is lost if the component picks its own height.
 *
 * The whole element is `aria-hidden` with a `busy` region around it. A screen
 * reader gains nothing from hearing four grey rectangles described; what it
 * needs is one statement that the region is loading, which is what `aria-busy`
 * on the container provides.
 */
@Component({
  selector: 'cordly-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-skeleton',
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape()',
  },
})
export class CordlySkeleton {
  readonly shape = input<CordlySkeletonShape>('text');

  /** How many placeholder rows to draw. Ignored for `block` and `circle`. */
  readonly count = input(3, { transform: numberAttribute });

  /**
   * Line widths, so a paragraph placeholder does not read as a solid slab.
   *
   * The last line is shorter, because that is what a paragraph of text does and
   * a placeholder that ignores it looks like a table.
   */
  protected readonly lines = computed(() => {
    if (this.shape() !== 'text') return ['100%'];
    const total = Math.max(1, this.count());
    return Array.from({ length: total }, (_, index) => (index === total - 1 ? '60%' : '100%'));
  });
}
