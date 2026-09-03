import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * How reachable the thing behind this tile is.
 *
 * Four states, and each one is a different sentence to the reader: it is set up
 * and working, it is set up and something needs attention, it is available but
 * not added yet, or it exists and you cannot open it. Collapsing any pair of
 * them produces a chooser where a person cannot tell why one tile behaves
 * differently from the next.
 */
export type CordlyEntityState = 'ready' | 'attention' | 'available' | 'inaccessible';

/**
 * A chooser tile.
 *
 * Domain-neutral on purpose: it renders a name, an optional short line, an
 * avatar or initial, a state, and one action. It has never heard of a server, a
 * guild, or a permission — the application resolves all of that and hands over
 * strings, which is what lets the same tile serve a server chooser, a template
 * gallery, and whatever the third chooser turns out to be.
 *
 * The whole tile is one target. With an `href` it renders an anchor, which keeps
 * middle-click and "open in a new tab" working; without one it renders a button
 * and emits. Either way there is exactly one control, because a tile containing
 * a title link and a separate button is two overlapping targets and an
 * announcement nobody can parse.
 */
@Component({
  selector: 'cordly-entity-tile',
  imports: [NgTemplateOutlet],
  templateUrl: './entity-tile.html',
  styleUrl: './entity-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-entity-tile',
    '[attr.data-state]': 'state()',
  },
})
export class CordlyEntityTile {
  readonly name = input.required<string>();

  /** One short line under the name — a member count, an owner, a category. */
  readonly detail = input<string | null>(null);

  readonly state = input<CordlyEntityState>('ready');

  /**
   * The state in words.
   *
   * Required, and it is what makes the state legible at all. The border tint is
   * an accompaniment; a reader with a colour-vision deficiency, in
   * forced-colours mode, or on a monochrome display has only this.
   */
  readonly stateLabel = input.required<string>();

  /** What activating the tile does — the accessible name's verb. */
  readonly actionLabel = input.required<string>();

  /** Image for the avatar slot. Absent falls back to the first letter of the name. */
  readonly avatarUrl = input<string | null>(null);

  readonly href = input<string | null>(null);

  readonly activate = output();

  /**
   * The first code point, upper-cased.
   *
   * `codePointAt` rather than `[0]` or a spread: an astral character — an emoji
   * in a server name, most obviously — is two UTF-16 units, and taking the first
   * one renders a replacement glyph.
   */
  protected get initial(): string {
    const point = this.name().trim().codePointAt(0);
    return point === undefined ? '?' : String.fromCodePoint(point).toUpperCase();
  }

  protected handleClick(event: Event): void {
    if (this.state() === 'inaccessible') {
      event.preventDefault();
      return;
    }
    if (this.href() !== null) return;
    event.preventDefault();
    this.activate.emit();
  }
}
