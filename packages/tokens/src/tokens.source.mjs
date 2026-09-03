/**
 * The Cordly token source of truth.
 *
 * Everything under `generated/` is produced from this file by
 * `tools/build-tokens.mjs`, and `npm run tokens:check` regenerates and compares.
 * Editing a generated file by hand fails that gate, which is the point: a colour
 * is decided in one place and every consumable form is derived from it.
 *
 * Two rules hold the system together.
 *
 * **A name says what a value is for, never what it looks like.** `surface-raised`
 * survives a palette change; `grey-800` does not, and a component that asked for
 * grey has quietly opted out of theming.
 *
 * **Every colour is defined in both themes.** No colour has its only definition
 * inside a media query or a single theme block. That is the failure mode where
 * an interface looks finished until somebody toggles the theme.
 *
 * Colours are authored in OKLCH because it is perceptually uniform: two roles a
 * fixed lightness apart look a fixed amount apart, which is what makes a ladder
 * of surfaces read as a ladder. The generator also resolves each one to sRGB so
 * the contrast gate can check the pairs this system promises.
 */

/** Author a colour once, in OKLCH. `l` is 0-1, `c` is chroma, `h` is degrees. */
const oklch = (l, c, h, alpha) => ({
  kind: 'oklch',
  l,
  c,
  h,
  ...(alpha === undefined ? {} : { alpha }),
});

/**
 * Cordly's accent hue. Deliberately its own blue-violet: the panel sits beside
 * a chat client in a browser tab and should read as a different product.
 */
const ACCENT_HUE = 277;

/** Neutral hue. A trace of violet in the greys, so surfaces relate to the accent. */
const NEUTRAL = 290;

const DARK = {
  /* Ground and surfaces, in ascending elevation. */
  'color-canvas': oklch(0.145, 0.012, NEUTRAL),
  'color-surface': oklch(0.185, 0.013, NEUTRAL),
  'color-surface-raised': oklch(0.225, 0.016, 292),
  'color-surface-overlay': oklch(0.255, 0.017, 292),
  'color-surface-sunken': oklch(0.125, 0.011, NEUTRAL),

  /* The dim behind a modal. A backdrop nobody can see reads as a floating card
     and gives no signal that the page behind it is inert. */
  'color-scrim': oklch(0.08, 0.01, NEUTRAL, 0.66),

  /* Text, in descending prominence. All three are held to AA body contrast on
     every surface above, `text-subtle` included, because that is what a
     placeholder uses and a placeholder is text. */
  'color-text': oklch(0.97, 0.008, 300),
  'color-text-muted': oklch(0.79, 0.014, 292),
  'color-text-subtle': oklch(0.68, 0.014, 292),
  'color-text-inverse': oklch(0.16, 0.012, NEUTRAL),

  /* Lines. `border` separates, `border-strong` is a control edge carrying
     non-text contrast, `border-subtle` is a hairline inside a grouped surface. */
  'color-border': oklch(0.31, 0.016, 292),
  'color-border-strong': oklch(0.58, 0.018, 292),
  'color-border-subtle': oklch(0.25, 0.014, 292),

  /* Accent.
     `accent-text` is the accent used as a foreground, which needs more
     lightness than the accent used as a background.
     Hover and active go *darker* rather than lighter, which is the opposite of
     the reflex in a dark theme. The reason is the label: `on-accent` is white,
     and a lighter accent drops white below AA. Contrast on the text a person is
     about to press wins over the direction the fill moves. */
  'color-accent': oklch(0.56, 0.196, ACCENT_HUE),
  'color-accent-hover': oklch(0.52, 0.196, ACCENT_HUE),
  'color-accent-active': oklch(0.48, 0.19, ACCENT_HUE),
  'color-accent-subtle': oklch(0.28, 0.07, ACCENT_HUE),
  'color-accent-text': oklch(0.78, 0.105, ACCENT_HUE),
  'color-on-accent': oklch(1, 0, 0),

  /* Neutral controls: a secondary button, an unselected chip, an input. */
  'color-control': oklch(0.265, 0.017, 292),
  'color-control-hover': oklch(0.305, 0.018, 292),
  'color-control-active': oklch(0.235, 0.016, 292),
  'color-control-text': oklch(0.95, 0.008, 300),
  'color-control-border': oklch(0.58, 0.018, 292),

  /* Status. Five roles each: a tinted surface, its border, its text on that
     surface, a solid fill, and a foreground for the solid. */
  'color-info-surface': oklch(0.26, 0.055, 245),
  'color-info-border': oklch(0.5, 0.09, 245),
  'color-info-text': oklch(0.78, 0.112, 245),
  'color-info-solid': oklch(0.62, 0.13, 245),
  'color-on-info-solid': oklch(0.16, 0.02, 245),

  'color-success-surface': oklch(0.26, 0.055, 152),
  'color-success-border': oklch(0.5, 0.09, 152),
  'color-success-text': oklch(0.8, 0.16, 152),
  'color-success-solid': oklch(0.72, 0.14, 152),
  'color-on-success-solid': oklch(0.16, 0.03, 152),

  'color-warning-surface': oklch(0.27, 0.05, 75),
  'color-warning-border': oklch(0.52, 0.09, 75),
  'color-warning-text': oklch(0.8, 0.15, 82),
  'color-warning-solid': oklch(0.82, 0.145, 78),
  'color-on-warning-solid': oklch(0.2, 0.03, 78),

  'color-danger-surface': oklch(0.26, 0.06, 22),
  'color-danger-border': oklch(0.52, 0.13, 22),
  'color-danger-text': oklch(0.78, 0.12, 22),
  'color-danger-solid': oklch(0.58, 0.2, 25),
  'color-on-danger-solid': oklch(1, 0, 0),

  /* Focus. One ring for the whole system; nothing removes it without replacing
     it. The offset colour is what the ring is drawn against, so it stays
     visible on a raised surface as well as on the page ground. */
  'color-focus-ring': oklch(0.78, 0.105, ACCENT_HUE),
  'color-focus-ring-offset': oklch(0.145, 0.012, NEUTRAL),

  'color-selection': oklch(0.4, 0.13, ACCENT_HUE),

  /* A skeleton stands in for layout, so it is a surface rather than a tint of
     the text it replaces. */
  'color-skeleton': oklch(0.25, 0.015, 292),
  'color-skeleton-sheen': oklch(0.33, 0.018, 292),

  /* Elevation is tied to a surface level rather than to a component, so two
     components at the same level cannot disagree about their shadow. */
  'elevation-flat': 'none',
  'elevation-raised': '0 1px 2px oklch(0 0 0 / 0.32)',
  'elevation-overlay': '0 12px 32px -8px oklch(0 0 0 / 0.58)',
  'elevation-lifted': '0 10px 28px -12px oklch(0 0 0 / 0.52)',
};

const LIGHT = {
  'color-canvas': oklch(0.985, 0.003, NEUTRAL),
  'color-surface': oklch(1, 0, 0),
  'color-surface-raised': oklch(0.975, 0.005, NEUTRAL),
  'color-surface-overlay': oklch(1, 0, 0),
  'color-surface-sunken': oklch(0.955, 0.006, NEUTRAL),

  'color-scrim': oklch(0.25, 0.02, NEUTRAL, 0.45),

  'color-text': oklch(0.2, 0.014, NEUTRAL),
  'color-text-muted': oklch(0.44, 0.016, NEUTRAL),
  'color-text-subtle': oklch(0.5, 0.016, NEUTRAL),
  'color-text-inverse': oklch(0.99, 0.003, NEUTRAL),

  'color-border': oklch(0.89, 0.008, NEUTRAL),
  'color-border-strong': oklch(0.6, 0.012, NEUTRAL),
  'color-border-subtle': oklch(0.935, 0.006, NEUTRAL),

  'color-accent': oklch(0.49, 0.216, ACCENT_HUE),
  'color-accent-hover': oklch(0.44, 0.21, ACCENT_HUE),
  'color-accent-active': oklch(0.4, 0.2, ACCENT_HUE),
  'color-accent-subtle': oklch(0.94, 0.026, ACCENT_HUE),
  'color-accent-text': oklch(0.47, 0.216, ACCENT_HUE),
  'color-on-accent': oklch(1, 0, 0),

  'color-control': oklch(0.955, 0.006, NEUTRAL),
  'color-control-hover': oklch(0.925, 0.008, NEUTRAL),
  'color-control-active': oklch(0.895, 0.009, NEUTRAL),
  'color-control-text': oklch(0.24, 0.016, NEUTRAL),
  'color-control-border': oklch(0.6, 0.012, NEUTRAL),

  'color-info-surface': oklch(0.96, 0.018, 245),
  'color-info-border': oklch(0.62, 0.1, 245),
  'color-info-text': oklch(0.42, 0.1, 245),
  'color-info-solid': oklch(0.48, 0.115, 245),
  'color-on-info-solid': oklch(1, 0, 0),

  'color-success-surface': oklch(0.96, 0.03, 152),
  'color-success-border': oklch(0.62, 0.1, 152),
  'color-success-text': oklch(0.42, 0.1, 152),
  'color-success-solid': oklch(0.46, 0.11, 152),
  'color-on-success-solid': oklch(1, 0, 0),

  'color-warning-surface': oklch(0.965, 0.031, 82),
  'color-warning-border': oklch(0.62, 0.1, 82),
  'color-warning-text': oklch(0.42, 0.09, 70),
  'color-warning-solid': oklch(0.66, 0.135, 78),
  'color-on-warning-solid': oklch(0.2, 0.03, 78),

  'color-danger-surface': oklch(0.96, 0.017, 22),
  'color-danger-border': oklch(0.62, 0.12, 22),
  'color-danger-text': oklch(0.46, 0.178, 25),
  'color-danger-solid': oklch(0.5, 0.195, 25),
  'color-on-danger-solid': oklch(1, 0, 0),

  'color-focus-ring': oklch(0.49, 0.216, ACCENT_HUE),
  'color-focus-ring-offset': oklch(1, 0, 0),

  'color-selection': oklch(0.88, 0.055, ACCENT_HUE),

  'color-skeleton': oklch(0.93, 0.007, NEUTRAL),
  'color-skeleton-sheen': oklch(0.975, 0.004, NEUTRAL),

  'elevation-flat': 'none',
  'elevation-raised': '0 1px 2px oklch(0.2 0.02 290 / 0.08)',
  'elevation-overlay': '0 12px 32px -8px oklch(0.2 0.02 290 / 0.18)',
  'elevation-lifted': '0 10px 28px -14px oklch(0.2 0.02 290 / 0.26)',
};

/** Values that do not change with the theme. */
const CONSTANT = {
  /* Spacing on a 4px base, named by step rather than by pixel count so a
     density change is one edit here. */
  'space-3xs': '0.125rem',
  'space-2xs': '0.25rem',
  'space-xs': '0.5rem',
  'space-sm': '0.75rem',
  'space-md': '1rem',
  'space-lg': '1.5rem',
  'space-xl': '2rem',
  'space-2xl': '3rem',
  'space-3xl': '4rem',

  /* Three radius steps and nothing else: a control, a card, and a pill. */
  'radius-none': '0',
  'radius-control': '0.625rem',
  'radius-card': '1rem',
  'radius-pill': '9999px',

  'font-sans':
    "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  'font-mono': "ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, Consolas, monospace",

  /* A type scale in rem, so it follows the browser's font size and survives
     200% zoom. Nothing writes a raw `font-size`. */
  'font-size-2xs': '0.6875rem',
  'font-size-xs': '0.75rem',
  'font-size-sm': '0.875rem',
  'font-size-md': '1rem',
  'font-size-lg': '1.125rem',
  'font-size-xl': '1.375rem',
  'font-size-2xl': '1.75rem',
  'font-size-3xl': '2.25rem',

  'line-height-tight': '1.2',
  'line-height-snug': '1.35',
  'line-height-normal': '1.55',
  'line-height-relaxed': '1.7',

  'font-weight-regular': '400',
  'font-weight-medium': '500',
  'font-weight-semibold': '600',

  'letter-spacing-tight': '-0.01em',
  'letter-spacing-normal': '0',
  'letter-spacing-wide': '0.02em',

  /* Control geometry. `target-min` is the 44px minimum pointer target the UX
     plan requires; a control drawn smaller pads its hit area up to it. */
  'control-height-sm': '2rem',
  'control-height-md': '2.5rem',
  'control-height-lg': '2.75rem',
  'target-min': '2.75rem',

  'border-width': '1px',
  'border-width-strong': '2px',

  /* Focus, as geometry. The colour is per-theme above. */
  'focus-ring-width': '2px',
  'focus-ring-offset': '2px',

  /*
   * Motion, as a closed vocabulary named by intent rather than by number.
   *
   * `instant` is a control acknowledging a press, `fast` is a hover or a focus
   * ring, `slow` is a surface entering or leaving, and `ambient` is decoration
   * nobody waits on. A component that needs a fifth duration is usually doing
   * something the design does not ask for.
   */
  'duration-instant': '90ms',
  'duration-fast': '150ms',
  'duration-slow': '260ms',
  'duration-ambient': '24s',
  'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-ambient': 'cubic-bezier(0.45, 0, 0.55, 1)',

  /* One lift distance, so a grid of cards cannot end up with three hover
     heights. Reduced motion keeps the elevation and drops the travel. */
  'lift-distance': '-2px',

  /* Breakpoints as tokens, so a widget and a consumer agree on where tablet
     ends. Container queries are preferred inside a widget; these describe the
     page. */
  'breakpoint-sm': '30rem',
  'breakpoint-md': '48rem',
  'breakpoint-lg': '64rem',
  'breakpoint-xl': '80rem',

  /* A closed stacking order. Four layers is enough for this system, and an
     ad-hoc `z-index: 9999` is always a bug in one of them. */
  'layer-base': '0',
  'layer-sticky': '100',
  'layer-overlay': '200',
  'layer-toast': '300',

  /* The readable measure. Over-long lines are the most common typographic
     defect in an administrative interface. */
  'measure-prose': '68ch',
};

export const source = {
  prefix: 'cordly',
  /** Dark is the default theme and carries `:root`. */
  defaultTheme: 'dark',
  themes: { dark: DARK, light: LIGHT },
  constant: CONSTANT,
};

/**
 * The pairs the contrast gate enforces, as [foreground, background, minimum].
 *
 * 4.5 is WCAG 2.2 AA for body text. 3.0 is the non-text requirement (1.4.11)
 * and applies to a control edge, a focus ring, and anything else whose shape
 * carries the meaning. The list is deliberately explicit and checked in both
 * themes: a promise the system makes has to be written somewhere a test reads.
 */
const SURFACES = [
  'color-canvas',
  'color-surface',
  'color-surface-raised',
  'color-surface-overlay',
  'color-surface-sunken',
];

const STATUSES = ['info', 'success', 'warning', 'danger'];

export const contrastContract = [
  ...SURFACES.flatMap((bg) => [
    ['color-text', bg, 4.5],
    ['color-text-muted', bg, 4.5],
    ['color-text-subtle', bg, 4.5],
    ['color-accent-text', bg, 4.5],
    ['color-border-strong', bg, 3],
    ['color-control-border', bg, 3],
    ['color-focus-ring', bg, 3],
  ]),
  ['color-on-accent', 'color-accent', 4.5],
  ['color-on-accent', 'color-accent-hover', 4.5],
  ['color-on-accent', 'color-accent-active', 4.5],
  ['color-control-text', 'color-control', 4.5],
  ['color-control-text', 'color-control-hover', 4.5],
  ['color-control-text', 'color-control-active', 4.5],
  ['color-text-inverse', 'color-text', 4.5],
  ...STATUSES.flatMap((status) => [
    [`color-${status}-text`, `color-${status}-surface`, 4.5],
    [`color-${status}-text`, 'color-canvas', 4.5],
    [`color-${status}-text`, 'color-surface', 4.5],
    [`color-on-${status}-solid`, `color-${status}-solid`, 4.5],
    [`color-${status}-border`, 'color-surface', 3],
    [`color-${status}-solid`, 'color-surface', 3],
  ]),
];
