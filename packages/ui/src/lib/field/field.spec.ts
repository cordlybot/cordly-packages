import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';

import { settle } from '../../testing/angular';
import { CordlyTextField } from './field';

@Component({
  imports: [CordlyTextField, FormsModule],
  template: `
    <cordly-text-field
      label="Announcement channel"
      [description]="description()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [multiline]="multiline()"
      [hideLabel]="hideLabel()"
      [(ngModel)]="channel"
    />
  `,
})
class Host {
  readonly description = signal<string | null>(null);
  readonly hint = signal<string | null>('Where level-up messages are posted.');
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
  readonly multiline = signal(false);
  readonly hideLabel = signal(false);
  channel = 'general';
}

describe('CordlyTextField', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host: fixture.componentInstance,
      root,
      input: () => root.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement,
      label: () => root.querySelector('label') as HTMLLabelElement,
    };
  }

  it('associates the label with the control it labels', () => {
    // The single most common form defect: a label rendered beside a control it
    // is not connected to. Clicking it does nothing and a screen reader reads
    // the control as unnamed.
    const { input, label } = render();

    expect(label().htmlFor).toBe(input().id);
    expect(input().id).not.toBe('');
    expect(label().textContent).toContain('Announcement channel');
  });

  it('renders the hint and points the control at it', () => {
    const { input, root } = render();
    const hint = root.querySelector('.cordly-field__hint') as HTMLElement;

    expect(input().getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('replaces the hint with the error, so nothing points at a removed element', () => {
    // An `aria-describedby` naming an id that is not in the document announces
    // nothing at all, and gives no clue why.
    const { fixture, host, input, root } = render();

    host.error.set('Pick a channel Cordly can post in.');
    fixture.detectChanges();

    const error = root.querySelector('.cordly-field__error') as HTMLElement;
    expect(root.querySelector('.cordly-field__hint')).toBeNull();
    expect(input().getAttribute('aria-describedby')).toBe(error.id);
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('describes with both the description and the active message, in reading order', () => {
    const { fixture, host, input, root } = render();

    host.description.set('Only channels Cordly can see are listed.');
    fixture.detectChanges();

    const description = root.querySelector('.cordly-field__description') as HTMLElement;
    const hint = root.querySelector('.cordly-field__hint') as HTMLElement;

    expect(input().getAttribute('aria-describedby')).toBe(`${description.id} ${hint.id}`);
  });

  it('marks required-ness once in the accessibility tree', () => {
    // The asterisk is decoration. Exposing it as well would make a screen reader
    // read "star" after every label in a form.
    const { fixture, host, input, root } = render();

    host.required.set(true);
    fixture.detectChanges();

    expect(input().getAttribute('aria-required')).toBe('true');
    expect(root.querySelector('.cordly-field__required')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('writes a form value into the control and reports edits back', async () => {
    const { fixture, host, input } = render();
    await settle(fixture);

    expect(input().value).toBe('general');

    input().value = 'announcements';
    input().dispatchEvent(new Event('input'));
    await settle(fixture);

    expect(host.channel).toBe('announcements');
  });

  it('renders a textarea when asked for one, keeping every association', () => {
    const { fixture, host, input, label } = render();

    host.multiline.set(true);
    fixture.detectChanges();

    expect(input().tagName).toBe('TEXTAREA');
    expect(label().htmlFor).toBe(input().id);
  });

  it('keeps the label associated when it is drawn off-screen', () => {
    // A search box in a toolbar needs no visible label; it still needs a name,
    // and `aria-label` on a bare input is how a field ends up with one nobody
    // can see.
    const { fixture, host, input, label, root } = render();

    host.hideLabel.set(true);
    fixture.detectChanges();

    expect(root.querySelector('cordly-text-field')?.hasAttribute('data-hide-label')).toBe(true);
    expect(label().htmlFor).toBe(input().id);
    expect(label().textContent).toContain('Announcement channel');
  });

  it('gives every instance a distinct control id', () => {
    // Two fields sharing an id makes both labels address the first control.
    const first = render();
    const second = render();

    expect(first.input().id).not.toBe(second.input().id);
  });
});
