import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { withErrorCollector } from '../../testing/angular';
import { CordlyEmptyState } from './empty-state';

@Component({
  imports: [CordlyEmptyState],
  template: `
    <cordly-empty-state heading="No servers yet" body="Add Cordly to a server you manage.">
      Or read the setup guide.
      <a cordly-empty-state-action href="#add">Add to a server</a>
    </cordly-empty-state>
  `,
})
class WithAction {}

@Component({
  imports: [CordlyEmptyState],
  template: `<cordly-empty-state heading="No servers yet">Nothing to show.</cordly-empty-state>`,
})
class WithoutAction {}

describe('CordlyEmptyState', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('renders the heading as a heading, so the region is reachable by structure', () => {
    const fixture = TestBed.createComponent(WithAction);
    fixture.detectChanges();
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h3');

    expect(heading?.textContent).toContain('No servers yet');
  });

  it('takes a one-sentence body as an input and richer content as a slot', () => {
    // The sibling error state has the same pair. Two components in the same
    // union of states should not need to be called differently.
    const fixture = TestBed.createComponent(WithAction);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Add Cordly to a server you manage.');
    expect(root.textContent).toContain('Or read the setup guide.');
  });

  it('projects the next action', () => {
    const fixture = TestBed.createComponent(WithAction);
    fixture.detectChanges();
    const actions = (fixture.nativeElement as HTMLElement).querySelector(
      '.cordly-empty-state__actions',
    );

    expect(actions?.textContent).toContain('Add to a server');
  });

  it('refuses in development to render a dead end', async () => {
    // "No data" with nowhere to go is the most common way a well-built interface
    // still feels unfinished. Failing loudly in development is cheaper than
    // finding it in a usability session.
    const errors = withErrorCollector();
    const fixture = TestBed.createComponent(WithoutAction);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(errors.messages.some((message) => message.includes('must offer a next action'))).toBe(
      true,
    );
  });
});
