import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlySection } from './section';

@Component({
  imports: [CordlySection],
  template: `
    <cordly-section heading="Recent changes" [description]="description()">
      <a cordly-section-actions href="#audit">See all</a>
      <p class="body">Three changes applied today.</p>
    </cordly-section>
    <cordly-section heading="Another section" />
  `,
})
class Host {
  readonly description = signal<string | null>('The last ten applied.');
}

describe('CordlySection', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const sections = [...root.querySelectorAll<HTMLElement>('cordly-section')];
    return { fixture, host: fixture.componentInstance, root, sections };
  }

  it('is a landmark named by its own heading', () => {
    // One attribute and an id, and the first thing dropped when a page is
    // written by hand. That is what makes it worth having in a package.
    const { sections, root } = render();
    const first = sections[0] as HTMLElement;
    const heading = root.querySelector('h2') as HTMLElement;

    expect(first.getAttribute('role')).toBe('region');
    expect(first.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent?.trim()).toBe('Recent changes');
  });

  it('gives every section a distinct heading id', () => {
    // Two sections sharing one would make both regions announce the first name.
    const { sections } = render();
    const ids = sections.map((section) => section.getAttribute('aria-labelledby'));

    expect(new Set(ids).size).toBe(2);
  });

  it('renders h2, one level under the page heading', () => {
    const { root } = render();

    expect(root.querySelectorAll('h1')).toHaveLength(0);
    expect(root.querySelectorAll('h2')).toHaveLength(2);
  });

  it('projects actions and content', () => {
    const { root } = render();

    expect(root.querySelector('.cordly-section__actions')?.textContent).toContain('See all');
    expect(root.querySelector('.body')).not.toBeNull();
  });

  it('omits the description when there is none', () => {
    const { fixture, host, root } = render();

    host.description.set(null);
    fixture.detectChanges();

    expect(root.querySelector('.cordly-section__description')).toBeNull();
  });
});
