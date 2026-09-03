import { isPlatformBrowser } from '@angular/common';
import {
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  Renderer2,
  ViewContainerRef,
  inject,
  input,
} from '@angular/core';

import { cordlyId } from '../a11y/unique-id';
import { CordlyTooltipPanel } from './tooltip-panel';

/**
 * Supplementary text for a control that already has a name.
 *
 * Three rules this enforces, because each is a defect somebody ships eventually:
 *
 * 1. **A tooltip is never the accessible name.** It is attached with
 *    `aria-describedby`, so a control still needs its own label. A tooltip used
 *    as a name disappears for anyone navigating by control.
 * 2. **It opens on focus as well as on hover.** Information only a mouse can
 *    reach is information a keyboard user does not have.
 * 3. **Escape closes it** while focus stays where it was, which is what lets
 *    somebody dismiss a bubble covering the thing they were reading.
 *
 * It is a directive rather than a wrapper so it can attach to a control the
 * caller already has — a button, a link, a badge — without changing its markup.
 * Directives cannot carry styles, so the bubble is a component this creates.
 */
@Directive({
  selector: '[cordlyTooltip]',
  host: {
    '[attr.aria-describedby]': 'visible ? panelId : null',
  },
})
export class CordlyTooltip {
  /** The supplementary sentence. Empty disables the tooltip entirely. */
  readonly cordlyTooltip = input.required<string>();

  protected readonly panelId = cordlyId('tooltip');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly container = inject(ViewContainerRef);
  private readonly renderer = inject(Renderer2);

  private panel: ComponentRef<CordlyTooltipPanel> | null = null;

  protected get visible(): boolean {
    return this.panel !== null;
  }

  constructor() {
    // A control can be removed while its tooltip is open — a row that finishes
    // loading, a menu that closes. Without this the bubble outlives its anchor.
    inject(DestroyRef).onDestroy(() => {
      this.hide();
    });

    // The anchor is the positioning context for the bubble. Setting it here
    // rather than asking every caller to remember is the difference between a
    // tooltip that lands on its control and one that lands at the page origin.
    //
    // Browser only: `getComputedStyle` does not exist in a server render, and
    // there is nothing to position there — a tooltip has no hover and no focus
    // until the page is interactive.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const element = this.host.nativeElement;
    if (element.ownerDocument.defaultView?.getComputedStyle(element).position === 'static') {
      this.renderer.setStyle(element, 'position', 'relative');
    }
  }

  @HostListener('mouseenter')
  @HostListener('focus')
  protected show(): void {
    if (this.panel !== null) return;

    const text = this.cordlyTooltip().trim();
    if (text.length === 0) return;

    this.panel = this.container.createComponent(CordlyTooltipPanel);
    this.panel.setInput('text', text);

    const element = this.panel.location.nativeElement as HTMLElement;
    this.renderer.setAttribute(element, 'id', this.panelId);
    this.renderer.appendChild(this.host.nativeElement, element);
    this.panel.changeDetectorRef.detectChanges();
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  protected hide(): void {
    this.panel?.destroy();
    this.panel = null;
  }

  @HostListener('keydown', ['$event'])
  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || this.panel === null) return;
    // Not `preventDefault`: Escape may also mean something to a dialog around
    // this control, and swallowing it there would trap the person inside.
    this.hide();
  }
}
