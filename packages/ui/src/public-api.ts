/**
 * The public surface of `@cordly/ui`.
 *
 * Every export is named explicitly. There is no `export *` in this repository,
 * for a reason that shows up later rather than sooner: a barrel re-exports
 * whatever a file happens to declare, so an internal helper becomes public the
 * moment somebody exports it for a sibling, and removing it afterwards is a
 * breaking change nobody meant to make.
 *
 * The API report in `api/ui.api.md` is generated from this file, and a change
 * here that is not reflected there fails `npm run api:check`.
 */

export { CordlyButton } from './lib/button/button';
export type { CordlyButtonSize, CordlyButtonVariant } from './lib/button/button';

export { CordlyIconButton } from './lib/icon-button/icon-button';
export type { CordlyIconButtonSize, CordlyIconButtonVariant } from './lib/icon-button/icon-button';

export { CordlyLink } from './lib/link/link';

export { CordlyAvatar } from './lib/avatar/avatar';
export type { CordlyAvatarShape, CordlyAvatarSize } from './lib/avatar/avatar';

export { CordlyBadge } from './lib/badge/badge';
export type { CordlyTone } from './lib/badge/badge';

export { CordlyCard } from './lib/card/card';
export type { CordlyCardDensity, CordlyCardElevation } from './lib/card/card';

export { CordlyTextField } from './lib/field/field';
export type { CordlyFieldType } from './lib/field/field';

export { CordlySelectField } from './lib/select-field/select-field';
export type { CordlySelectOption } from './lib/select-field/select-field';

export { CordlySwitch } from './lib/switch/switch';

export { CordlyStatus } from './lib/status/status';
export { CordlySkeleton } from './lib/skeleton/skeleton';
export type { CordlySkeletonShape } from './lib/skeleton/skeleton';
export { CordlyEmptyState } from './lib/empty-state/empty-state';

export { CordlyToastRegion } from './lib/toast/toast-region';
export { CordlyToasts } from './lib/toast/toasts';
export type { CordlyToast, CordlyToastRequest } from './lib/toast/toasts';

export { CordlyDialog } from './lib/dialog/dialog';
export type { CordlyDialogCloseReason, CordlyDialogPlacement } from './lib/dialog/dialog';

export { CordlyMenu } from './lib/menu/menu';
export type { CordlyMenuItem } from './lib/menu/menu';

export { CordlyTooltip } from './lib/tooltip/tooltip';
export { CordlyTooltipPanel } from './lib/tooltip/tooltip-panel';

export { CordlySeparator } from './lib/separator/separator';
export type { CordlySeparatorOrientation } from './lib/separator/separator';

export { CordlyVisuallyHidden } from './lib/visually-hidden/visually-hidden';

export { CordlyReducedMotion, injectReducedMotion } from './lib/a11y/reduced-motion';
export { cordlyId } from './lib/a11y/unique-id';
