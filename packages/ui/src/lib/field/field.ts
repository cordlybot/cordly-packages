import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { cordlyId } from '../a11y/unique-id';

export type CordlyFieldType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';

/**
 * A labelled text control.
 *
 * The package renders the `<input>` rather than styling one a caller projected,
 * and that is the whole reason this component exists in this shape: a label, a
 * description, a hint, and an error message only work if something owns the
 * `id`/`for`/`aria-describedby` wiring between them. Leaving that to each
 * application is how a form ends up with a label that points at nothing.
 *
 * ```html
 * <cordly-text-field
 *   label="Announcement channel"
 *   hint="Where level-up messages are posted."
 *   [(ngModel)]="channel"
 * />
 * ```
 *
 * Validation is the caller's: pass `error` and the field renders it, marks the
 * control invalid, and points `aria-describedby` at it. This package contains no
 * validation rules, because the rules belong to the schema the application
 * received and not to a shared control.
 */
@Component({
  selector: 'cordly-text-field',
  templateUrl: './field.html',
  styleUrl: './field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CordlyTextField),
      multi: true,
    },
  ],
  host: {
    class: 'cordly-field',
    '[attr.data-invalid]': 'error() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-multiline]': 'multiline() ? "" : null',
    '[attr.data-hide-label]': 'hideLabel() ? "" : null',
  },
})
export class CordlyTextField implements ControlValueAccessor {
  /** Required. A placeholder is not a label; it disappears when it is needed most. */
  readonly label = input.required<string>();

  /**
   * Draw the label off-screen, keeping it in the accessibility tree.
   *
   * For a control whose purpose is already obvious from its surroundings — a
   * search box in a toolbar is the case this exists for. It hides the label; it
   * never removes it, because `aria-label` on a bare input is how a field ends
   * up with a name nobody can see and a magnifying glass nobody can parse.
   */
  readonly hideLabel = input(false, { transform: booleanAttribute });

  readonly type = input<CordlyFieldType>('text');
  readonly name = input<string | null>(null);
  readonly placeholder = input<string | null>(null);
  readonly autocomplete = input<string | null>(null);
  readonly inputMode = input<string | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });

  /** Sits above the control: context needed before answering. */
  readonly description = input<string | null>(null);

  /** Sits below the control: help that clarifies an answer already being given. */
  readonly hint = input<string | null>(null);

  /** A validation message from the caller. Non-null puts the field in its invalid state. */
  readonly error = input<string | null>(null);

  readonly multiline = input(false, { transform: booleanAttribute });
  readonly rows = input(3, { transform: numberAttribute });

  readonly valueChange = output<string>();
  readonly blurred = output();

  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  protected readonly controlId = cordlyId('field');
  protected readonly descriptionId = `${this.controlId}-description`;
  protected readonly hintId = `${this.controlId}-hint`;
  protected readonly errorId = `${this.controlId}-error`;

  /**
   * Description, then hint or error.
   *
   * Order is the reading order, and only the message currently rendered is
   * referenced: pointing at the id of an element that is not in the DOM makes a
   * screen reader announce nothing and gives no clue why.
   */
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

  protected handleInput(event: Event): void {
    const next = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
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
