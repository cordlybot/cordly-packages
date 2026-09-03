import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CordlyTooltipPanel } from './tooltip-panel';

@Component({
  imports: [CordlyTooltipPanel],
  template: `<cordly-tooltip-panel text="Last checked 4 minutes ago" />`,
})
class Host {}

describe('CordlyTooltipPanel', () => {
  beforeEach(() => TestBed.resetTestingModule());

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector(
      'cordly-tooltip-panel',
    ) as HTMLElement;
  }

  it('carries the tooltip role, so an anchor can describe itself with it', () => {
    const panel = render();

    expect(panel.getAttribute('role')).toBe('tooltip');
  });

  it('renders the text it was given and nothing else', () => {
    const panel = render();

    expect(panel.textContent?.trim()).toBe('Last checked 4 minutes ago');
  });
});
