import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
// The testing entry point, compiled here for the same reason as everything
// else: a secondary entry point can build correctly and still be unreachable
// from an installed package if its `exports` map is wrong, and the first report
// of that is a consumer whose import fails.
import { installDialogShim, type DialogShim } from '@cordly/ui/testing';
import { FormsModule } from '@angular/forms';
import {
  CordlyBadge,
  CordlyButton,
  CordlyCard,
  CordlyDialog,
  CordlyAvatar,
  CordlyEmptyState,
  CordlyErrorState,
  CordlyIconButton,
  CordlyLink,
  CordlyMenu,
  CordlyReducedMotion,
  CordlySelectField,
  CordlySeparator,
  CordlySkeleton,
  CordlyStatus,
  CordlyStatusDot,
  CordlySwitch,
  CordlyTextField,
  CordlyToastRegion,
  CordlyToasts,
  CordlyTooltip,
  CordlyTooltipPanel,
  CordlyVisuallyHidden,
  cordlyId,
  injectReducedMotion,
  type CordlyAvatarShape,
  type CordlyAvatarSize,
  type CordlyButtonSize,
  type CordlyButtonVariant,
  type CordlyCardDensity,
  type CordlyCardElevation,
  type CordlyDialogCloseReason,
  type CordlyDialogPlacement,
  type CordlyFieldType,
  type CordlyIconButtonSize,
  type CordlyIconButtonVariant,
  type CordlyMenuItem,
  type CordlySelectOption,
  type CordlySeparatorOrientation,
  type CordlySkeletonShape,
  type CordlyStatusDotSize,
  type CordlyToast,
  type CordlyToastRequest,
  type CordlyTone,
} from '@cordly/ui';
import {
  CordlyAppFrame,
  CordlyCatalogue,
  CordlyChangeBar,
  CordlyEntityTile,
  CordlyPageHeader,
  CordlyPreferenceGroup,
  CordlyReviewList,
  CordlySection,
  CordlySettingsSection,
  CordlySideNav,
  CordlyStatRow,
  type CordlyCatalogueFilter,
  type CordlyChangeGroup,
  type CordlyChangeOrigin,
  type CordlyChangeRisk,
  type CordlyChangeRow,
  type CordlyChangeStatus,
  type CordlyEntityState,
  type CordlyNavGroup,
  type CordlyNavItem,
  type CordlyPreferenceOption,
  type CordlyStat,
} from '@cordly/widgets';
import { cssVar, themeAttribute, themes, tokenNames, minimumContrastRatio } from '@cordly/tokens';

/**
 * Every public export, referenced once.
 *
 * This exists to fail. If a package is built against a newer Angular than it
 * claims to support, if a declaration file references a type that version does
 * not have, or if a component's template uses syntax the floor of the range
 * cannot compile, the failure is here — at the *lowest* version in the peer
 * range, installed from the tarball, compiled ahead of time.
 *
 * The two fixtures already prove the packages work at the version the real
 * consumers pin. This proves the promise the `package.json` makes, which is a
 * different and wider claim: `^22.0.0` says 22.0.0 works, and nothing else in
 * this repository would notice if it did not.
 *
 * Every type is referenced too. A type-only export that disappears is a
 * breaking change consumers feel and no runtime test sees.
 */
type EveryUiType = [
  CordlyAvatarShape,
  CordlyAvatarSize,
  CordlyButtonSize,
  CordlyButtonVariant,
  CordlyCardDensity,
  CordlyCardElevation,
  CordlyDialogCloseReason,
  CordlyDialogPlacement,
  CordlyFieldType,
  CordlyIconButtonSize,
  CordlyIconButtonVariant,
  CordlyMenuItem,
  CordlySelectOption,
  CordlySeparatorOrientation,
  CordlySkeletonShape,
  CordlyStatusDotSize,
  CordlyToast,
  CordlyToastRequest,
  CordlyTone,
];

type EveryWidgetType = [
  CordlyCatalogueFilter,
  CordlyChangeGroup,
  CordlyChangeOrigin,
  CordlyChangeRisk,
  CordlyChangeRow,
  CordlyChangeStatus,
  CordlyEntityState,
  CordlyNavGroup,
  CordlyNavItem,
  CordlyPreferenceOption,
  CordlyStat,
];

@Component({
  selector: 'compat-root',
  imports: [
    FormsModule,
    CordlyAppFrame,
    CordlyBadge,
    CordlyButton,
    CordlyCard,
    CordlyCatalogue,
    CordlyChangeBar,
    CordlyDialog,
    CordlyAvatar,
    CordlyEmptyState,
    CordlyErrorState,
    CordlyEntityTile,
    CordlyIconButton,
    CordlyLink,
    CordlyMenu,
    CordlyPreferenceGroup,
    CordlyReviewList,
    CordlyPageHeader,
    CordlySection,
    CordlySelectField,
    CordlySeparator,
    CordlySettingsSection,
    CordlySideNav,
    CordlySkeleton,
    CordlyStatRow,
    CordlyStatus,
    CordlyStatusDot,
    CordlySwitch,
    CordlyTextField,
    CordlyToastRegion,
    CordlyTooltip,
    CordlyTooltipPanel,
    CordlyVisuallyHidden,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompatApp {
  readonly toasts = inject(CordlyToasts);
  readonly reducedMotion = injectReducedMotion();
  readonly reducedMotionService = inject(CordlyReducedMotion);
  readonly probeId = cordlyId('compat');

  readonly tokenSummary = `${tokenNames.length} tokens, ${themes.join('/')}, ${themeAttribute}, ${cssVar('color-accent')}, min ${minimumContrastRatio}:1`;

  readonly open = signal(false);
  readonly value = signal('a');
  readonly text = signal('');
  readonly enabled = signal(false);
  readonly theme = signal<string | null>('dark');
  readonly query = signal('');
  readonly filterId = signal<string | null>(null);
  readonly advanced = signal(false);

  readonly navGroups: readonly CordlyNavGroup[] = [
    { id: 'g', label: 'Group', items: [{ id: 'i', label: 'Item', current: true }] },
  ];
  readonly stats: readonly CordlyStat[] = [
    { id: 's', label: 'Stat', value: '1', meaning: 'One thing is true.' },
  ];
  readonly menuItems: readonly CordlyMenuItem[] = [{ id: 'm', label: 'Item' }];
  readonly options: readonly CordlySelectOption[] = [{ value: 'a', label: 'A' }];
  readonly filters: readonly CordlyCatalogueFilter[] = [{ id: 'f', label: 'Filter', count: 1 }];
  readonly preferences: readonly CordlyPreferenceOption[] = [{ id: 'dark', label: 'Dark' }];
  readonly groups: readonly CordlyChangeGroup[] = [
    {
      id: 'g',
      label: 'Group',
      rows: [
        {
          id: 'r',
          summary: 'Something',
          before: 'a',
          after: 'b',
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

  /** Referenced so the type aliases above are not elided as unused. */
  readonly typeProbe: [EveryUiType, EveryWidgetType] | null = null;

  /**
   * Not called — this harness compiles rather than runs. Naming the value and
   * its type is what makes the import a real one that ahead-of-time compilation
   * has to resolve.
   */
  readonly dialogShimProbe: (() => DialogShim) | null = installDialogShim;
}
