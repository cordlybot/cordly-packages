import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CordlyBadge,
  CordlyButton,
  CordlyCard,
  CordlyDialog,
  CordlyEmptyState,
  CordlyLink,
  CordlyMenu,
  CordlySelectField,
  CordlySkeleton,
  CordlyStatus,
  CordlySwitch,
  CordlyTextField,
  CordlyToastRegion,
  CordlyTooltip,
  CordlyVisuallyHidden,
  type CordlyMenuItem,
  type CordlySelectOption,
} from '@cordly/ui';
import {
  CordlyAppFrame,
  CordlyCatalogue,
  CordlyChangeBar,
  CordlyEntityTile,
  CordlyPreferenceGroup,
  CordlyReviewList,
  CordlySettingsSection,
  CordlySideNav,
  CordlyStatRow,
  type CordlyChangeGroup,
  type CordlyNavGroup,
  type CordlyStat,
} from '@cordly/widgets';

/**
 * Every exported component that renders markup, on one server-rendered page.
 *
 * Deliberately broader than the browser fixture. The browser fixture asks
 * whether the workflow works; this one asks whether anything in the packages
 * touches a browser API during a render, and the only way to answer that for a
 * component is to render it. A component that reaches for `window`,
 * `matchMedia`, or `getComputedStyle` on the server fails the build here rather
 * than the first time a marketing page includes it.
 */
@Component({
  selector: 'fixture-page',
  imports: [
    FormsModule,
    CordlyAppFrame,
    CordlyBadge,
    CordlyButton,
    CordlyCard,
    CordlyCatalogue,
    CordlyChangeBar,
    CordlyDialog,
    CordlyEmptyState,
    CordlyEntityTile,
    CordlyLink,
    CordlyMenu,
    CordlyPreferenceGroup,
    CordlyReviewList,
    CordlySelectField,
    CordlySettingsSection,
    CordlySideNav,
    CordlySkeleton,
    CordlyStatRow,
    CordlyStatus,
    CordlySwitch,
    CordlyTextField,
    CordlyToastRegion,
    CordlyTooltip,
    CordlyVisuallyHidden,
  ],
  templateUrl: './fixture-page.html',
  styleUrl: './fixture-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixturePage {
  readonly drawerOpen = signal(false);
  readonly reviewOpen = signal(false);
  readonly advancedOpen = signal(false);
  readonly enabled = signal(true);
  readonly channel = signal('general');
  readonly template = signal('Welcome {member}!');
  readonly theme = signal<string | null>('dark');
  readonly query = signal('');
  readonly activeFilterId = signal<string | null>(null);

  /** Counts how many times the browser has handled a click, for the replay check. */
  readonly presses = signal(0);

  readonly navigation: readonly CordlyNavGroup[] = [
    {
      id: 'server',
      label: 'Server',
      items: [
        { id: 'overview', label: 'Overview', href: '#overview', current: true },
        { id: 'modules', label: 'Modules', href: '#modules', badge: '2' },
      ],
    },
  ];

  readonly stats: readonly CordlyStat[] = [
    {
      id: 'enabled',
      label: 'Modules enabled',
      value: '12',
      meaning: 'Everything you turned on is running.',
    },
  ];

  readonly menuItems: readonly CordlyMenuItem[] = [
    { id: 'settings', label: 'Settings' },
    { id: 'sign-out', label: 'Sign out', tone: 'danger' },
  ];

  readonly channels: readonly CordlySelectOption[] = [
    { value: 'general', label: '#general' },
    { value: 'introductions', label: '#introductions' },
  ];

  readonly filters = [{ id: 'engagement', label: 'Engagement', count: 4 }];

  readonly themeOptions = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  readonly changeGroups: readonly CordlyChangeGroup[] = [
    {
      id: 'night-library',
      label: 'Night Library',
      rows: [
        {
          id: 'channel',
          summary: 'Welcome message channel',
          before: '#general',
          after: '#introductions',
          origin: 'person',
          status: 'staged',
          risk: 'reversible',
        },
      ],
    },
  ];

  readonly statusLabels = {
    staged: 'Staged',
    applying: 'Applying',
    applied: 'Applied',
    blocked: 'Blocked',
    failed: 'Failed',
  };

  readonly originLabels = { person: 'You', assistant: 'Assistant', template: 'Template' };

  readonly riskLabels = {
    reversible: 'Reversible',
    disruptive: 'Disruptive',
    irreversible: 'Cannot be undone',
  };

  readonly pressLabel = computed(() => `Pressed ${this.presses()} times`);

  press(): void {
    this.presses.update((value) => value + 1);
  }
}
