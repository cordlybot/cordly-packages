import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyButton } from './button';

@Component({
  imports: [CordlyButton],
  template: `
    <button
      cordlyButton
      [variant]="variant()"
      [size]="size()"
      [busy]="busy()"
      [disabled]="disabled()"
      (click)="clicks.set(clicks() + 1)"
    >
      Apply 3 changes
    </button>
    <a cordlyButton variant="quiet" href="#help">Read the guide</a>
  `,
})
class Host {
  readonly variant = signal<'primary' | 'neutral' | 'quiet' | 'danger'>('primary');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly busy = signal(false);
  readonly disabled = signal(false);
  readonly clicks = signal(0);
}

describe('CordlyButton', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      button: root.querySelector('button') as HTMLButtonElement,
      link: root.querySelector('a') as HTMLAnchorElement,
    };
  }

  it('renders a native button, so the platform keeps keyboard and form behaviour', () => {
    const { button } = render();

    expect(button.tagName).toBe('BUTTON');
    expect(button.type).toBe('submit');
    expect(button.classList.contains('cordly-button')).toBe(true);
  });

  it('exposes the variant and size as data attributes the stylesheet selects on', () => {
    const { fixture, host, button } = render();

    expect(button.getAttribute('data-variant')).toBe('primary');

    host.variant.set('danger');
    host.size.set('lg');
    fixture.detectChanges();

    expect(button.getAttribute('data-variant')).toBe('danger');
    expect(button.getAttribute('data-size')).toBe('lg');
  });

  it('keeps the caller label rather than shipping copy of its own', () => {
    const { button } = render();

    expect(button.textContent?.trim()).toBe('Apply 3 changes');
  });

  it('works on an anchor, for navigation that should look like an action', () => {
    const { link } = render();

    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#help');
    expect(link.classList.contains('cordly-button')).toBe(true);
  });

  it('does not interfere with the native disabled state', () => {
    const { fixture, host, button } = render();

    host.disabled.set(true);
    fixture.detectChanges();

    expect(button.disabled).toBe(true);
  });

  describe('while busy', () => {
    it('announces itself as busy without leaving the tab order', () => {
      // `disabled` would remove the control from the accessibility tree and send
      // focus to the document, which is how a keyboard user loses their place
      // every time they submit something.
      const { fixture, host, button } = render();

      host.busy.set(true);
      fixture.detectChanges();

      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.disabled).toBe(false);
      expect(button.tabIndex).toBe(0);
    });

    it('reports state without blocking activation, which is the documented contract', () => {
      // Angular registers a component's host listeners after the ones its
      // consumer wrote in the template, so a guard here would stop pointer users
      // and let keyboard users through. Rather than ship a half-guarantee, the
      // primitive reports and the action stays idempotent; a caller that wants
      // the control unusable passes `disabled`.
      const { fixture, host, button } = render();

      host.busy.set(true);
      fixture.detectChanges();
      button.click();

      expect(host.clicks()).toBe(1);

      host.disabled.set(true);
      fixture.detectChanges();
      button.click();

      expect(host.clicks()).toBe(1);
    });

    it('keeps the label visible beside the indicator', () => {
      const { fixture, host, button } = render();

      host.busy.set(true);
      fixture.detectChanges();

      expect(button.querySelector('.cordly-button__busy')?.getAttribute('aria-hidden')).toBe(
        'true',
      );
      expect(button.textContent).toContain('Apply 3 changes');
    });
  });
});

describe('CordlyButton stretch', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('hands the overlay back to the card by making the control unpositioned', () => {
    // The whole mechanism. Left positioned, the ::after this package already
    // owns for touch padding resolves `inset: 0` against the control itself,
    // which is how a "stretched" hit area comes out exactly button-sized.
    @Component({
      imports: [CordlyButton],
      template: `<div style="position: relative">
        <a cordlyButton stretch href="/guilds/1">Manage</a>
      </div>`,
    })
    class Card {}

    const fixture = TestBed.createComponent(Card);
    fixture.detectChanges();

    const anchor = (fixture.nativeElement as HTMLElement).querySelector('a') as HTMLElement;
    expect(anchor.hasAttribute('data-stretch')).toBe(true);
  });

  it('is off unless asked for, so an ordinary button keeps its touch padding', () => {
    @Component({
      imports: [CordlyButton],
      template: `<button cordlyButton size="sm">Refresh</button>`,
    })
    class Plain {}

    const fixture = TestBed.createComponent(Plain);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLElement;
    expect(button.hasAttribute('data-stretch')).toBe(false);
  });
});
