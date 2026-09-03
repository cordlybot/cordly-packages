import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { CordlyTone } from '../badge/badge';

/**
 * An inline message about the surface it sits on.
 *
 * Not a toast. This stays beside the thing it describes, which is the only way
 * an error can say what to do about the field somebody is looking at, and the
 * only way a prerequisite notice can be read after the toast that announced it
 * has gone.
 *
 * ```html
 * <cordly-status tone="warning" heading="Missing permission">
 *   Cordly cannot post in the selected channel.
 *   <button cordly-status-actions cordlyButton size="sm">Recheck permissions</button>
 * </cordly-status>
 * ```
 */
@Component({
  selector: 'cordly-status',
  templateUrl: './status.html',
  styleUrl: './status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-status',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'role()',
    '[attr.aria-live]': 'ariaLive()',
  },
})
export class CordlyStatus {
  readonly tone = input<CordlyTone>('info');
  readonly heading = input<string | null>(null);

  /**
   * The message appeared in response to something the user just did, rather
   * than being present when the page rendered.
   *
   * This decides how the message is announced, and the two are genuinely
   * different. A notice that is part of the page needs no live region at all —
   * a screen reader reaches it while reading. One that appears after an action
   * has to interrupt, or nobody hears it. Announcing a static notice would make
   * every page load read its own warnings aloud before the heading.
   */
  readonly live = input(false);

  protected readonly role = computed(() => {
    if (!this.live()) return null;
    return this.tone() === 'danger' ? 'alert' : 'status';
  });

  // `role="alert"` implies `aria-live="assertive"`; restating it is redundant
  // and some combinations confuse older screen readers.
  protected readonly ariaLive = computed(() =>
    this.live() && this.tone() !== 'danger' ? 'polite' : null,
  );
}
