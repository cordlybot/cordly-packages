import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  contentChild,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { cordlyId } from '../a11y/unique-id';
import { CordlyMenuItemContent } from './menu-item-content';

/**
 * One menu entry.
 *
 * `id` is the caller's own identifier and is what comes back on `select`. The
 * menu never learns what an id means, which is what keeps it usable for an
 * account menu, a row's overflow actions, and a locale picker alike.
 */
export interface CordlyMenuItem {
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
  readonly disabled?: boolean;
  readonly current?: boolean;
  readonly tone?: 'neutral' | 'danger';
  readonly separatorBefore?: boolean;
}

/**
 * A button that opens a short list of actions.
 *
 * Keyboard behaviour follows the established menu-button pattern, because a
 * control that looks like a menu and does not answer arrow keys is worse than a
 * plain list of buttons: Down/Up move, Home/End jump, Escape closes and returns
 * focus to the trigger, Tab closes and moves on.
 *
 * Positioning is deliberately simple — anchored below the trigger, aligned to
 * one edge — and it does not flip away from a viewport edge. Collision handling
 * needs measurement on every scroll and resize, and adding it now would be
 * building for a case no Cordly surface has. The limitation is recorded in
 * `docs/architecture.md` rather than hidden.
 */
@Component({
  selector: 'cordly-menu',
  imports: [NgTemplateOutlet],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'cordly-menu',
    '[attr.data-align]': 'align()',
  },
})
export class CordlyMenu {
  readonly items = input.required<readonly CordlyMenuItem[]>();

  /**
   * The trigger's accessible name.
   *
   * Required, because the trigger's visible content is usually an avatar or a
   * glyph, and the failure — an anonymous button that opens something — is
   * invisible to the person shipping it.
   */
  readonly triggerLabel = input.required<string>();

  readonly align = input<'start' | 'end'>('end');

  readonly selected = output<CordlyMenuItem>();

  /**
   * An optional per-item template. Without one, items render their label and
   * detail; with one, the caller owns appearance and the menu keeps behaviour.
   */
  protected readonly itemContent = contentChild(CordlyMenuItemContent);

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly triggerId = cordlyId('menu-trigger');
  protected readonly panelId = `${this.triggerId}-panel`;

  protected readonly expanded = signal(false);
  protected readonly activeIndex = signal(0);

  protected toggle(): void {
    this.expanded.update((open) => !open);
    if (!this.expanded()) return;
    this.activeIndex.set(this.firstEnabledIndex());
    this.focusActiveSoon();
  }

  protected choose(item: CordlyMenuItem): void {
    if (item.disabled) return;
    this.selected.emit(item);
    this.closeAndRestore();
  }

  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.expanded.set(true);
    this.activeIndex.set(
      event.key === 'ArrowDown' ? this.firstEnabledIndex() : this.lastEnabledIndex(),
    );
    this.focusActiveSoon();
  }

  protected handlePanelKeydown(event: KeyboardEvent): void {
    const indices = this.enabledIndices();
    if (indices.length === 0) return;

    const position = Math.max(0, indices.indexOf(this.activeIndex()));

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveTo(indices[(position + 1) % indices.length]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveTo(indices[(position - 1 + indices.length) % indices.length]);
        break;
      case 'Home':
        event.preventDefault();
        this.moveTo(indices[0]);
        break;
      case 'End':
        event.preventDefault();
        this.moveTo(indices[indices.length - 1]);
        break;
      case 'Escape':
        event.preventDefault();
        this.closeAndRestore();
        break;
      case 'Tab':
        // Tab leaves the menu rather than cycling inside it. A menu is not a
        // dialog: nothing about it should trap a keyboard user.
        this.expanded.set(false);
        break;
      default:
        break;
    }
  }

  /** A click anywhere else closes the menu without stealing the click. */
  @HostListener('document:pointerdown', ['$event'])
  protected handleOutsidePointer(event: Event): void {
    if (!this.expanded()) return;
    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) return;
    this.expanded.set(false);
  }

  private moveTo(index: number | undefined): void {
    if (index === undefined) return;
    this.activeIndex.set(index);
    this.focusActiveSoon();
  }

  /**
   * Move focus, not just the tab stop.
   *
   * Roving `tabindex` decides where Tab lands; it does not move focus. A menu
   * that marks one item active while the keyboard is still on another is a menu
   * whose arrow keys appear not to work at all.
   *
   * `afterNextRender` rather than a microtask, and the difference is not
   * academic: in a zoneless application setting a signal schedules a render, it
   * does not perform one, so a microtask queued here still runs before the panel
   * exists in the DOM. This was found by the browser gate — the unit test passed
   * because the fixture's `detectChanges` had already rendered the panel by the
   * time the microtask ran.
   */
  private focusActiveSoon(): void {
    afterNextRender(
      () => {
        const buttons = this.itemButtons();
        buttons[this.activeIndex()]?.focus();
      },
      { injector: this.injector },
    );
  }

  private closeAndRestore(): void {
    this.expanded.set(false);
    this.trigger().nativeElement.focus();
  }

  private itemButtons(): HTMLButtonElement[] {
    const panel = this.panel()?.nativeElement ?? this.document.createElement('div');
    return [...panel.querySelectorAll<HTMLButtonElement>('.cordly-menu__item')];
  }

  private enabledIndices(): number[] {
    return this.items()
      .map((item, index) => (item.disabled ? -1 : index))
      .filter((index) => index >= 0);
  }

  private firstEnabledIndex(): number {
    return this.enabledIndices()[0] ?? 0;
  }

  private lastEnabledIndex(): number {
    const indices = this.enabledIndices();
    return indices[indices.length - 1] ?? 0;
  }
}
