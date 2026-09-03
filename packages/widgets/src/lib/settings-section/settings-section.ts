import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { cordlyId } from '@cordly/ui';

/**
 * One section of a configuration page.
 *
 * Heading, description, an optional aside for the section's own control, a
 * notice slot for a prerequisite that needs attention, the essential settings,
 * and a named disclosure for the advanced ones.
 *
 * That order is the page anatomy from the UX plan, and the shape is what keeps
 * every module page in every Cordly application reading the same way. There is
 * no tab variant, deliberately: a module split across tabs hides half its state
 * from the person deciding about the other half.
 *
 * ```html
 * <cordly-settings-section
 *   heading="Level-up announcements"
 *   description="Where members are told they levelled up."
 *   advancedLabel="Advanced options"
 * >
 *   <cordly-switch cordly-section-aside label="Enabled" [(ngModel)]="enabled" />
 *   <cordly-status cordly-section-notice tone="warning">…</cordly-status>
 *   <cordly-select-field label="Channel" …/>
 *   <cordly-text-field cordly-section-advanced label="Message template" …/>
 * </cordly-settings-section>
 * ```
 */
@Component({
  selector: 'cordly-settings-section',
  templateUrl: './settings-section.html',
  styleUrl: './settings-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-settings-section',
    '[attr.aria-labelledby]': 'headingId',
    role: 'group',
  },
})
export class CordlySettingsSection {
  readonly heading = input.required<string>();
  readonly description = input<string | null>(null);

  /**
   * The disclosure's label. Absent means the section has no advanced options.
   *
   * Naming it is the requirement. "Advanced" alone tells a reader nothing about
   * whether what they are looking for is behind it, so the caller names what the
   * section actually holds where it can.
   */
  readonly advancedLabel = input<string | null>(null);

  /**
   * Two-way, so a page can open the disclosure to reveal the setting a
   * validation error refers to. An error pointing at a control nobody can see is
   * an error nobody can fix.
   */
  readonly advancedOpen = model(false);

  protected readonly headingId = cordlyId('section-heading');

  protected toggleAdvanced(event: Event): void {
    // `<details>` toggles itself; this keeps the model in step without fighting
    // the element for control of its own open state.
    event.preventDefault();
    this.advancedOpen.update((open) => !open);
  }
}
