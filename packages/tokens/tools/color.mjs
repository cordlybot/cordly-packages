/**
 * OKLCH to sRGB, and WCAG relative contrast.
 *
 * Written out rather than pulled from a dependency for one reason: the contrast
 * gate is a release promise, and a release promise should not depend on a
 * transitive package resolving to whatever version a lockfile happened to pick.
 * The maths is Bjorn Ottosson's published Oklab conversion plus the sRGB
 * transfer function and the WCAG 2.x luminance formula.
 */

/** Oklab -> linear sRGB. */
function oklabToLinearSrgb(L, a, b) {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l * l * l;
  const m3 = m * m * m;
  const s3 = s * s * s;

  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Linear channel -> gamma-encoded sRGB, both 0-1. */
function encodeSrgb(channel) {
  const c = clamp01(channel);
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Gamma-encoded sRGB channel (0-1) -> linear, for the luminance formula. */
function decodeSrgb(channel) {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * An OKLCH token to 8-bit sRGB.
 *
 * Out-of-gamut colours are clamped per channel. That is a lossy answer, so
 * `inGamut` reports whether clamping happened: a token that only reaches its
 * stated chroma outside sRGB is not the colour it claims to be, and the token
 * gate refuses it rather than shipping a silently different value.
 */
export function oklchToRgb({ l, c, h }) {
  const hueRad = (h * Math.PI) / 180;
  const linear = oklabToLinearSrgb(l, c * Math.cos(hueRad), c * Math.sin(hueRad));
  const epsilon = 1e-4;
  const inGamut = linear.every((channel) => channel >= -epsilon && channel <= 1 + epsilon);
  const rgb = linear.map((channel) => Math.round(encodeSrgb(channel) * 255));
  return { rgb, inGamut };
}

export function toHex(rgb) {
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG 2.x relative luminance from 8-bit sRGB. */
export function relativeLuminance([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map((v) => decodeSrgb(v / 255));
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** WCAG 2.x contrast ratio, 1 to 21. */
export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Composite a colour that may carry alpha over an opaque backdrop.
 *
 * Only the scrim uses alpha today, but a contrast check against a translucent
 * value is meaningless without this, and getting it wrong would make the gate
 * pass on a pair a user cannot read.
 */
export function over(foreground, backdrop, alpha) {
  return foreground.map((channel, index) =>
    Math.round(channel * alpha + backdrop[index] * (1 - alpha)),
  );
}
