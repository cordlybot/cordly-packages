/**
 * The public surface of `@cordly/widgets`.
 *
 * Named exports only, for the same reason as `@cordly/ui`: a barrel makes an
 * internal helper public the moment somebody exports it for a sibling.
 *
 * The line every widget here stays on: **a widget is shareable only when its
 * public API can be explained without naming an application route, a backend
 * endpoint, a Discord object, or a Cordly permission.** Everything below takes
 * plain strings and typed view models the application has already resolved and
 * translated, and emits plain events. Nothing imports a router, an HTTP client,
 * a store, or a translation service, and nothing here can.
 */

export { CordlyAppFrame } from './lib/app-frame/app-frame';

export { CordlySideNav } from './lib/side-nav/side-nav';
export type { CordlyNavGroup, CordlyNavItem } from './lib/side-nav/side-nav';

export { CordlyStatRow } from './lib/stat-row/stat-row';
export type { CordlyStat } from './lib/stat-row/stat-row';

export { CordlySettingsSection } from './lib/settings-section/settings-section';

export { CordlyCatalogue } from './lib/catalogue/catalogue';
export type { CordlyCatalogueFilter } from './lib/catalogue/catalogue';

export { CordlyEntityTile } from './lib/entity-tile/entity-tile';
export type { CordlyEntityState } from './lib/entity-tile/entity-tile';

export { CordlyChangeBar } from './lib/change-bar/change-bar';

export { CordlyReviewList } from './lib/review-list/review-list';
export type {
  CordlyChangeGroup,
  CordlyChangeOrigin,
  CordlyChangeRisk,
  CordlyChangeRow,
  CordlyChangeStatus,
} from './lib/review-list/review-list';

export { CordlyPreferenceGroup } from './lib/preference-group/preference-group';
export type { CordlyPreferenceOption } from './lib/preference-group/preference-group';
