import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Windows High Contrast, and what it takes away.
 *
 * In forced colours the user's palette replaces the author's: every colour that
 * is not a system keyword is substituted, `background-image` is dropped, and
 * every `box-shadow` is forced to `none`. A component that says something with
 * a shadow says nothing at all here — and several components in this package
 * cited forced colours as the reason for a decision and then wrote that
 * decision as an inset `box-shadow`.
 *
 * Chromium applies the real treatment under `page.emulateMedia`, so these are
 * measurements rather than a check that some rules exist. Note that the mode is
 * turned on per page: the context-level `forcedColors` option is accepted and
 * does nothing here, which is its own trap — a suite using it runs against an
 * ordinary page and passes without testing anything.
 */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
});

test('nothing that carries meaning is carried by a shadow', async ({ page }) => {
  // The blunt version of every assertion below. Any element still holding a
  // box-shadow here is holding nothing, so what matters is that none of them
  // needed it.
  const shadows = await page
    .locator('.cordly-side-nav__item, .cordly-switch__track, .cordly-button')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).boxShadow));

  expect(new Set(shadows)).toEqual(new Set(['none']));
});

test('the current navigation item is marked by a border, not by a shadow', async ({ page }) => {
  // This was an inset box-shadow, beside a comment saying it existed so the
  // current destination would survive forced colours. It was the one property
  // that does not.
  const marker = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return { width: style.borderInlineStartWidth, colour: style.borderInlineStartColor };
      });

  const current = await marker('.cordly-side-nav__item[aria-current="page"]');
  const other = await marker('.cordly-side-nav__item:not([aria-current])');
  const background = await page
    .locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  // Reserved on every item, so becoming current shifts nothing.
  expect(current.width).toBe(other.width);
  expect(current.width).not.toBe('0px');

  expect(current.colour).not.toBe(other.colour);
  // And the unmarked one is genuinely unmarked. `transparent` does not survive
  // the substitution — left alone, every item wears a visible rule and the
  // marker means nothing — so the mixin paints it in the page's own Canvas.
  expect(other.colour).toBe(background);
});

test('the current menu entry is marked the same way', async ({ page }) => {
  await page.getByRole('button', { name: 'Account menu' }).click();

  const widths = await page
    .locator('.cordly-menu__item')
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).borderInlineStartWidth),
    );

  expect(widths.length).toBeGreaterThan(1);
  expect(new Set(widths).size).toBe(1);
  expect(widths[0]).not.toBe('0px');
});

test('a switch still says on or off once the fills are one colour', async ({ page }) => {
  // Chromium substitutes the background of anything inside a button for its
  // own, so both track fills come out the same white and the thumb with them —
  // and a switch whose two states look identical has stopped saying the only
  // thing it says.
  //
  // What is left to the author is the track's border and the thumb's position,
  // and position is the one thing forced colours cannot touch at all.
  const control = page.getByLabel('Enabled');
  const settled = () =>
    page
      .locator('.cordly-switch__thumb')
      .first()
      .evaluate(async (element) => {
        await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
        const thumb = getComputedStyle(element);
        const track = getComputedStyle(element.closest('.cordly-switch__track')!);
        return {
          position: thumb.translate,
          outline: thumb.outlineWidth,
          trackBorder: track.borderTopColor,
        };
      });

  const on = await settled();
  await control.click();
  const off = await settled();

  expect(on.position).not.toBe(off.position);
  expect(on.trackBorder).not.toBe(off.trackBorder);
  // And the thumb whose position carries that has an edge of its own, so it is
  // visible against a track the substitution has painted the same colour.
  expect(off.outline).not.toBe('0px');
});

test('every button keeps a visible boundary', async ({ page }) => {
  // A quiet button is a transparent fill inside a transparent border. Once the
  // fills that separate the variants are replaced by one system colour, the
  // border is the only thing left saying "this is a control" — which is also
  // how the platform draws its own buttons in this mode.
  const background = await page
    .locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  const borders = await page
    .locator('.cordly-button')
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).borderTopColor));

  expect(borders.length).toBeGreaterThan(0);
  expect(borders.filter((colour) => colour === background)).toEqual([]);
  expect(borders.filter((colour) => /rgba\(0, 0, 0, 0\)|transparent/.test(colour))).toEqual([]);
});

test('has no detectable accessibility violation in forced colours', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('the selected preference is outlined, not just heavier', async ({ page }) => {
  // Chosen is a raised fill, a weight, and a lift. The fill is repainted, the
  // lift is deleted, and this control clips its native radio away — so without
  // the outline, weight alone says which option is selected.
  const options = page.locator('.cordly-preference-group__option');
  const outlines = await options.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const checked = element.querySelector<HTMLInputElement>('input')?.checked ?? false;
      return { checked, colour: style.outlineColor, width: style.outlineWidth };
    }),
  );

  const selected = outlines.filter((option) => option.checked);
  const rest = outlines.filter((option) => !option.checked);

  expect(selected).toHaveLength(1);
  expect(rest.length).toBeGreaterThan(0);
  expect(selected[0].width).not.toBe('0px');
  for (const option of rest) expect(option.colour).not.toBe(selected[0].colour);
});
