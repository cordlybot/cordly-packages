import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyAvatar } from './avatar';

@Component({
  imports: [CordlyAvatar],
  template: `<cordly-avatar [name]="name()" [src]="src()" [size]="'lg'" />`,
})
class Host {
  readonly name = signal('Night Library');
  readonly src = signal<string | null>(null);
}

describe('CordlyAvatar', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      avatar: root.querySelector('cordly-avatar') as HTMLElement,
      image: () => root.querySelector('img'),
      initials: () => root.querySelector('.cordly-avatar__initials'),
    };
  }

  it('is hidden from assistive technology', () => {
    // An avatar sits beside the name it depicts. Exposing it makes a screen
    // reader read that name twice — once as a picture, once as text.
    const { avatar } = render();

    expect(avatar.getAttribute('aria-hidden')).toBe('true');
  });

  it('falls back to initials when there is no image', () => {
    const { initials, image } = render();

    expect(image()).toBeNull();
    expect(initials()?.textContent?.trim()).toBe('NL');
  });

  it('takes one initial from a single-word name', () => {
    const { fixture, host, initials } = render();

    host.name.set('Cordly');
    fixture.detectChanges();

    expect(initials()?.textContent?.trim()).toBe('C');
  });

  it('handles a name whose first character is astral', () => {
    // An emoji in a server name is two UTF-16 units; taking the first alone
    // renders a replacement glyph.
    const { fixture, host, initials } = render();

    host.name.set('🌙 Library');
    fixture.detectChanges();

    expect(initials()?.textContent?.trim()).toBe('🌙L');
  });

  it('never renders an empty badge for a blank name', () => {
    const { fixture, host, initials } = render();

    host.name.set('   ');
    fixture.detectChanges();

    expect(initials()?.textContent?.trim()).toBe('?');
  });

  it('renders the image when it has one, with an empty alt', () => {
    // The alt is empty rather than the name: the host is already aria-hidden,
    // and a described image inside a hidden element is a contradiction.
    const { fixture, host, image } = render();

    host.src.set('https://example.invalid/icon.png');
    fixture.detectChanges();

    expect(image()?.getAttribute('src')).toBe('https://example.invalid/icon.png');
    expect(image()?.getAttribute('alt')).toBe('');
    expect(image()?.getAttribute('loading')).toBe('lazy');
  });

  it('falls back to initials when the image fails to load', () => {
    // Avatar URLs point at a third party and expire. A page of broken-image
    // glyphs looks like the application is broken.
    const { fixture, host, image, initials } = render();

    host.src.set('https://example.invalid/gone.png');
    fixture.detectChanges();

    image()?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(image()).toBeNull();
    expect(initials()?.textContent?.trim()).toBe('NL');
  });

  it('tries again when the URL changes', () => {
    // Otherwise one expired avatar keeps a member on initials for the session.
    const { fixture, host, image } = render();

    host.src.set('https://example.invalid/gone.png');
    fixture.detectChanges();
    image()?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(image()).toBeNull();

    host.src.set('https://example.invalid/fresh.png');
    fixture.detectChanges();

    expect(image()?.getAttribute('src')).toBe('https://example.invalid/fresh.png');
  });

  it('treats an empty string as no image at all', () => {
    const { fixture, host, image, initials } = render();

    host.src.set('   ');
    fixture.detectChanges();

    expect(image()).toBeNull();
    expect(initials()).not.toBeNull();
  });

  it('exposes size and shape as attributes the stylesheet selects on', () => {
    const { avatar } = render();

    expect(avatar.getAttribute('data-size')).toBe('lg');
    expect(avatar.getAttribute('data-shape')).toBe('circle');
  });
});
