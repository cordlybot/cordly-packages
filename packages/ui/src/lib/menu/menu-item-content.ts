import { Directive, TemplateRef, inject } from '@angular/core';

import type { CordlyMenuItem } from './menu';

/** What a projected item template receives. */
export interface CordlyMenuItemContext {
  readonly $implicit: CordlyMenuItem;
  readonly index: number;
  readonly active: boolean;
}

/**
 * Render each menu item yourself, without giving up the keyboard model.
 *
 * ```html
 * <cordly-menu [items]="locales()" triggerLabel="Language" (selected)="choose($event)">
 *   <span>EN</span>
 *   <ng-template cordlyMenuItemContent let-item>
 *     <img [src]="flagFor(item.id)" alt="" />
 *     <span [lang]="item.id">{{ item.label }}</span>
 *   </ng-template>
 * </cordly-menu>
 * ```
 *
 * This exists because the string API lost information that mattered. A language
 * picker has to mark each name with its own `lang`, or a screen reader
 * pronounces "Français" as English; and a flag beside it is recognition a label
 * cannot carry. Neither fits in `label` and `detail`.
 *
 * What the menu keeps is everything worth having: the roles, the roving tab
 * stop, arrow keys, Home and End, Escape, focus return, and dismissal. The
 * caller supplies appearance, and cannot accidentally take over behaviour.
 */
@Directive({
  selector: 'ng-template[cordlyMenuItemContent]',
})
export class CordlyMenuItemContent {
  readonly template = inject<TemplateRef<CordlyMenuItemContext>>(TemplateRef);

  /** Lets Angular infer the context type inside the template. */
  static ngTemplateContextGuard(
    _directive: CordlyMenuItemContent,
    _context: unknown,
  ): _context is CordlyMenuItemContext {
    return true;
  }
}
