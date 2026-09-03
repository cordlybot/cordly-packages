import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { cordlyId } from '../a11y/unique-id';

/**
 * An on/off control with a visible label.
 *
 * `role="switch"` rather than a checkbox, and the distinction is not pedantry:
 * a checkbox is read as "selected", which is a choice being collected, and a
 * switch is read as "on", which is a state that exists now. Every Cordly module
 * has one clear enabled state, and that is a switch.
 *
 * The label is required and always rendered. A bare switch with its meaning in
 * an adjacent paragraph has no accessible name, and the failure is invisible
 * until somebody navigates the page by control.
 */
@Component({
  selector: 'cordly-switch',
  templateUrl: './switch.html',
  styleUrl: './switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CordlySwitch),
      multi: true,
    },
  ],
  host: { class: 'cordly-switch' },
})
export class CordlySwitch implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly description = input<string | null>(null);

  /** Uncontrolled use: read the state from here when no form is involved. */
  readonly checked = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();

  protected readonly internal = signal<boolean | null>(null);
  protected readonly disabled = signal(false);

  protected readonly controlId = cordlyId('switch');
  protected readonly labelId = `${this.controlId}-label`;
  protected readonly descriptionId = `${this.controlId}-description`;

  protected readonly describedBy = computed(() => (this.description() ? this.descriptionId : null));

  /**
   * A form value wins over the input once one arrives.
   *
   * Both entry points are legitimate — a settings section binds `ngModel`, a
   * one-off toggle passes `[checked]` — and silently preferring one would make
   * the other look broken.
   */
  protected readonly state = computed(() => this.internal() ?? this.checked());

  /*
   * Angular replaces both of these through `registerOnChange` and
   * `registerOnTouched` when a form directive binds to this control. They start
   * as no-ops so the component also works with no form at all, which is what
   * `checked` alone does.
   */
  private onChange: (value: boolean) => void = () => {
    // Replaced by registerOnChange.
  };
  private onTouched: () => void = () => {
    // Replaced by registerOnTouched.
  };

  protected toggle(): void {
    const next = !this.state();
    this.internal.set(next);
    this.onChange(next);
    this.onTouched();
    this.checkedChange.emit(next);
  }

  writeValue(value: boolean | null): void {
    this.internal.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
