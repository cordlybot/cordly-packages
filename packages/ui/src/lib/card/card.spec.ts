import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyCard } from './card';

@Component({
  imports: [CordlyCard],
  template: `
    <cordly-card>
      <h3 cordly-card-header>Welcome messages</h3>
      <p>Greets a member the first time they post.</p>
      <span cordly-card-footer>Enabled</span>
    </cordly-card>

    <a cordlyCard interactive href="/servers/1">
      <h3 cordly-card-header>Night Library</h3>
    </a>
  `,
})
class Host {}

describe('CordlyCard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      card: root.querySelector('cordly-card') as HTMLElement,
      link: root.querySelector('a') as HTMLAnchorElement,
    };
  }

  it('projects the header, body, and footer slots', () => {
    const { card } = render();

    expect(card.querySelector('.cordly-card__body')?.textContent).toContain('Welcome messages');
    expect(card.textContent).toContain('Enabled');
  });

  it('adds no interactive semantics of its own', () => {
    // A card that is not a control must not look like one, or it becomes a
    // target people keep pressing with nothing behind it.
    const { card } = render();

    expect(card.hasAttribute('data-interactive')).toBe(false);
    expect(card.getAttribute('role')).toBeNull();
  });

  it('is the control itself when it is interactive, not a wrapper around one', () => {
    // The alternative is a title link, a background handler, and a button: three
    // overlapping targets that a screen reader reads as three unrelated controls
    // describing the same thing.
    const { link } = render();

    expect(link.tagName).toBe('A');
    expect(link.hasAttribute('data-interactive')).toBe(true);
    expect(link.querySelectorAll('a, button')).toHaveLength(0);
  });
});
