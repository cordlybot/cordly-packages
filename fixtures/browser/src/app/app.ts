import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CordlyBadge,
  CordlyButton,
  CordlyCard,
  CordlyDialog,
  CordlyEmptyState,
  CordlyIconButton,
  CordlyLink,
  CordlyMenu,
  CordlySelectField,
  CordlySkeleton,
  CordlyStatus,
  CordlySwitch,
  CordlyTextField,
  CordlyToastRegion,
  CordlyToasts,
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
 * A representative consumer, not a component gallery.
 *
 * It walks the first workflow slice end to end — choose a server, find a module,
 * change a setting, see the change staged, review it — because that is the
 * journey the packages exist to support, and a page of isolated demos would
 * prove that each component renders while proving nothing about whether they
 * compose.
 *
 * Everything here is the *application's* job and is written here on purpose: the
 * copy, the filtering, the staged set, the labels. None of it lives in a package.
 */
@Component({
  selector: 'fixture-root',
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
    CordlyIconButton,
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
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixtureApp {
  readonly toasts = inject(CordlyToasts);

  readonly drawerOpen = signal(false);
  /**
   * Starts at `system`, because that is what the page is actually doing: no
   * `data-cordly-theme` attribute is set, so the tokens follow
   * `prefers-color-scheme`. Defaulting the model to `dark` while the document
   * says nothing would put the control and the page in disagreement.
   */
  readonly theme = signal<string | null>('system');
  readonly loading = signal(false);
  readonly reviewOpen = signal(false);
  readonly advancedOpen = signal(false);

  readonly navigation: readonly CordlyNavGroup[] = [
    {
      id: 'server',
      label: 'Server',
      items: [
        { id: 'overview', label: 'Overview', href: '#overview' },
        { id: 'modules', label: 'Modules', href: '#modules', current: true, badge: '2' },
        { id: 'audit', label: 'Audit', href: '#audit' },
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
    {
      id: 'attention',
      label: 'Needs attention',
      value: '2',
      meaning: 'Two modules are missing a permission.',
      tone: 'warning',
      action: { label: 'Review permissions' },
    },
  ];

  readonly accountMenu: readonly CordlyMenuItem[] = [
    // A destination, so the browser gate can check that this entry is a real
    // link rather than a button that happens to navigate.
    { id: 'profile', label: 'Profile', href: '/profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'appearance', label: 'Appearance', detail: 'Theme and language' },
    { id: 'sign-out', label: 'Sign out', tone: 'danger', separatorBefore: true },
  ];

  readonly themeOptions = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  readonly channels: readonly CordlySelectOption[] = [
    { value: 'general', label: '#general' },
    { value: 'introductions', label: '#introductions' },
    { value: 'archive', label: '#archive', disabled: true },
  ];

  /**
   * Ten modules, which is what puts the catalogue over the eight-item threshold
   * where the search field appears. Below it the field would be chrome in the
   * way of a list somebody can already read.
   */
  private readonly modules = [
    { id: 'welcome', name: 'Welcome messages', category: 'engagement', enabled: true },
    { id: 'levels', name: 'Level system', category: 'engagement', enabled: true },
    { id: 'roles', name: 'Reaction roles', category: 'engagement', enabled: false },
    { id: 'polls', name: 'Polls', category: 'engagement', enabled: false },
    { id: 'automod', name: 'Auto moderation', category: 'safety', enabled: true },
    { id: 'raid', name: 'Raid protection', category: 'safety', enabled: true },
    { id: 'filters', name: 'Word filters', category: 'safety', enabled: false },
    { id: 'tickets', name: 'Support tickets', category: 'support', enabled: true },
    { id: 'faq', name: 'Answer suggestions', category: 'support', enabled: false },
    { id: 'logs', name: 'Audit logs', category: 'safety', enabled: true },
  ];

  readonly filters = [
    { id: 'engagement', label: 'Engagement', count: 4 },
    { id: 'safety', label: 'Safety', count: 4 },
    { id: 'support', label: 'Support', count: 2 },
  ];

  readonly query = signal('');
  readonly activeFilterId = signal<string | null>(null);

  /** Filtering is the application's, because only it knows what a synonym is. */
  readonly visibleModules = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const category = this.activeFilterId();
    return this.modules.filter((module) => {
      if (category !== null && module.category !== category) return false;
      if (needle.length === 0) return true;
      return module.name.toLowerCase().includes(needle);
    });
  });

  readonly totalModules = this.modules.length;

  /* The staged draft. The application owns it, because it is the thing that has
     to survive a navigation. */
  readonly welcomeEnabled = signal(true);
  readonly welcomeChannel = signal('general');
  readonly welcomeTemplate = signal('Welcome {member}!');

  private readonly savedChannel = 'general';
  private readonly savedTemplate = 'Welcome {member}!';
  private readonly savedEnabled = true;

  readonly staged = computed(() => {
    const rows = [];
    if (this.welcomeEnabled() !== this.savedEnabled) {
      rows.push({
        id: 'enabled',
        summary: 'Welcome messages',
        before: this.savedEnabled ? 'On' : 'Off',
        after: this.welcomeEnabled() ? 'On' : 'Off',
        origin: 'person' as const,
        status: 'staged' as const,
        risk: 'reversible' as const,
      });
    }
    if (this.welcomeChannel() !== this.savedChannel) {
      rows.push({
        id: 'channel',
        summary: 'Welcome message channel',
        before: `#${this.savedChannel}`,
        after: `#${this.welcomeChannel()}`,
        origin: 'person' as const,
        status: 'staged' as const,
        risk: 'reversible' as const,
      });
    }
    if (this.welcomeTemplate() !== this.savedTemplate) {
      rows.push({
        id: 'template',
        summary: 'Welcome message text',
        before: this.savedTemplate,
        after: this.welcomeTemplate(),
        origin: 'person' as const,
        status: 'staged' as const,
        risk: 'reversible' as const,
      });
    }
    return rows;
  });

  readonly changeGroups = computed<readonly CordlyChangeGroup[]>(() => [
    { id: 'night-library', label: 'Night Library', rows: this.staged() },
  ]);

  readonly changeCount = computed(() => this.staged().length);

  readonly templateError = computed(() =>
    this.welcomeTemplate().trim().length === 0 ? 'A welcome message cannot be empty.' : null,
  );

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

  readonly changeLabel = computed(() =>
    this.changeCount() === 1 ? '1 change staged' : `${this.changeCount()} changes staged`,
  );

  readonly resultLabel = computed(() => {
    const count = this.visibleModules().length;
    return count === 1 ? '1 module' : `${count} modules`;
  });

  applyTheme(value: string | null): void {
    this.theme.set(value);
    const element = document.documentElement;
    if (value === null || value === 'system') element.removeAttribute('data-cordly-theme');
    else element.setAttribute('data-cordly-theme', value);
  }

  discard(): void {
    this.welcomeEnabled.set(this.savedEnabled);
    this.welcomeChannel.set(this.savedChannel);
    this.welcomeTemplate.set(this.savedTemplate);
    this.toasts.show({ message: 'Draft discarded in Night Library.' });
  }

  apply(): void {
    this.reviewOpen.set(false);
    this.toasts.show({
      message: `Applied ${this.changeCount()} changes in Night Library.`,
      tone: 'success',
      action: { label: 'Undo', run: () => this.discard() },
    });
  }

  toggleLoading(): void {
    this.loading.update((value) => !value);
  }
}
