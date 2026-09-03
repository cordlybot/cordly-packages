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
 * One choice.
 *
 * A plain view model: a string value and a human label the caller has already
 * translated. Nothing here knows what the value identifies, which is what keeps
 * the control usable for a channel, a role, a locale, or a retention period
 * without learning about any of them.
 */
export interface CordlySelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * A labelled single choice, rendered as a native `<select>`.
 *
 * Native is the decision worth defending. A custom listbox has to reimplement
 * type-ahead, the mobile picker, screen-reader semantics, and scroll-into-view,
 * and the reimplementation is worse in at least one of them on every platform.
 * When a collection outgrows a select — the UX plan puts that at roughly eight
 * useful choices — the answer is a searchable widget with its own affordances,
 * not a hand-built dropdown wearing this control's clothes.
 */
@Component({
  selector: 'cordly-select-field',
  templateUrl: './select-field.html',
  styleUrl: './select-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CordlySelectField),
      multi: true,
    },
  ],
  host: {
    class: 'cordly-select-field',
    '[attr.data-invalid]': 'error() ? "" : null',
  },
})
export class CordlySelectField implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input.required<readonly CordlySelectOption[]>();

  readonly name = input<string | null>(null);

  /** Rendered as a leading empty option. Absent means the first option is the default. */
  readonly placeholder = input<string | null>(null);

  readonly description = input<string | null>(null);
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly required = input(false, { transform: booleanAttribute });

  readonly valueChange = output<string>();
  readonly blurred = output();

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  protected readonly controlId = cordlyId('select');
  protected readonly descriptionId = `${this.controlId}-description`;
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;

  protected readonly describedBy = computed(() => {
    const ids = [
      this.description() ? this.descriptionId : null,
      this.error() ? this.errorId : this.hint() ? this.hintId : null,
    ].filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  /*
   * Angular replaces both of these through `registerOnChange` and
   * `registerOnTouched` when a form directive binds to this control. They start
   * as no-ops so the component also works with no form at all, which is what
   * `(ngModel)` alone does.
   */
  private onChange: (value: string) => void = () => {
    // Replaced by registerOnChange.
  };
  private onTouched: () => void = () => {
    // Replaced by registerOnTouched.
  };

  protected handleChange(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    this.value.set(next);
    this.onChange(next);
    this.valueChange.emit(next);
  }

  protected handleBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
