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
  template: `
    <cordly-empty-state heading="Page not found" [headingLevel]="1">
      Check the address, or go back to your servers.
      <a cordly-empty-state-action href="/guilds">Go to your servers</a>
    </cordly-empty-state>
  `,
})
class AsPageHeading {}

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

describe('CordlyEmptyState heading level', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('is a level 3 heading by default, for a section that already has its own', () => {
    const fixture = TestBed.createComponent(WithAction);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h3.cordly-empty-state__heading')?.textContent).toBe(
      'No servers yet',
    );
  });

  it('can be the page heading, so a whole page made of one needs no second h1', () => {
    // The not-found route is nothing but an empty state. Fixed at level 3 it
    // forced the page to add a visually hidden h1 with the same words, which
    // gave screen reader users two identical headings.
    const fixture = TestBed.createComponent(AsPageHeading);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('h3')).toHaveLength(0);
    expect(root.querySelector('h1.cordly-empty-state__heading')?.textContent).toBe(
      'Page not found',
    );
  });
});

describe('CordlyEmptyState misplaced action', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('says the action is in the wrong slot rather than that there is none', async () => {
    // The common mistake, and the one where the generic message is least
    // helpful: somebody projected exactly the action the error asks for, and is
    // told to project one. It also renders in the wrong place, so this is a
    // layout bug reported as a contract one.
    @Component({
      imports: [CordlyEmptyState],
      template: `
        <cordly-empty-state heading="No servers yet">
          Add Cordly to a server you manage.
          <button type="button">Refresh</button>
        </cordly-empty-state>
      `,
    })
    class MisplacedAction {}

    const errors = withErrorCollector();
    const fixture = TestBed.createComponent(MisplacedAction);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(errors.messages).toContainEqual(
      expect.stringContaining('body slot rather than the action slot'),
    );
  });
});
