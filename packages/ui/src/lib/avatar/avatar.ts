import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';

export type CordlyAvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type CordlyAvatarShape = 'circle' | 'square';

/**
 * A small picture of a person or a place, with initials when there is none.
 *
 * The whole element is hidden from assistive technology, and that is the
 * decision worth explaining rather than the styling. An avatar always sits
 * beside the name it depicts — in a menu trigger, a row, a header — so exposing
 * it means a screen reader reads the name twice, once as a picture and once as
 * text. Where an avatar is genuinely the only content, the control around it
 * carries the accessible name; that is the icon-button's job, not this one's.
 *
 * A broken image falls back to initials rather than to the browser's broken-image
 * glyph. Avatar URLs point at a third party and expire, and a page full of
 * broken-image icons looks like the application is broken.
 */
@Component({
  selector: 'cordly-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-avatar',
    'aria-hidden': 'true',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
  },
})
export class CordlyAvatar {
  /**
   * The name this depicts. Used for the initials, and never rendered as text.
   *
   * Required, because an avatar with no name has nothing to fall back to and
   * renders an empty grey circle the first time a URL expires.
   */
  readonly name = input.required<string>();

  readonly src = input<string | null>(null);
  readonly size = input<CordlyAvatarSize>('md');
  readonly shape = input<CordlyAvatarShape>('circle');

  private readonly failed = signal(false);

  constructor() {
    // A new URL deserves a fresh attempt; without this, one expired avatar
    // would keep a member on initials for the rest of the session.
    effect(() => {
      this.src();
      this.failed.set(false);
    });
  }

  protected readonly imageUrl = computed(() => {
    const url = this.src();
    if (url === null || url.trim().length === 0 || this.failed()) return null;
    return url;
  });

  /**
   * Up to two initials, by code point.
   *
   * `codePointAt` rather than `[0]`: an astral character — an emoji in a server
   * name is the common case — is two UTF-16 units, and taking the first alone
   * renders a replacement glyph.
   */
  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    const letters = words.slice(0, 2).map((word) => {
      const point = word.codePointAt(0);
      return point === undefined ? '' : String.fromCodePoint(point);
    });
    const joined = letters.join('').toUpperCase();
    return joined.length > 0 ? joined : '?';
  });

  protected handleImageError(): void {
    this.failed.set(true);
  }
}
