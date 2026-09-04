import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The same fixture at a phone width.
 *
 * These are not duplicates of the desktop gates. The drawer, the bottom-safe
 * change bar, and the full-width actions only exist below the medium breakpoint,
 * so a suite that runs at 1280 pixels never renders them at all — and the touch
 * target requirement is a promise about a finger, which is what this viewport
 * has.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('has no detectable accessibility violation at a phone width', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('the navigation collapses into a drawer that a trigger opens and a scrim closes', async ({
  page,
}) => {
  const navigation = page.getByRole('navigation', { name: 'Server sections' });
  const trigger = page.getByRole('button', { name: 'Show server sections' });

  await expect(trigger).toBeVisible();
  await expect(navigation).not.toBeInViewport();

  await trigger.click();
  await expect(navigation).toBeInViewport();

  // Clicked near the trailing edge: the drawer covers most of a phone screen,
  // so the centre of the scrim is behind it.
  await page.locator('.cordly-app-frame__scrim').click({ position: { x: 380, y: 400 } });
  await expect(navigation).not.toBeInViewport();
});

test('every pointer target is at least 44 by 44 CSS pixels', async ({ page }) => {
  // The UX plan makes this a release gate. A chip painted 32 pixels tall passes
  // a visual review and fails a finger, so the assertion is on the hit area
  // rather than on the painted box.
  const controls = page.locator(
    '.cordly-catalogue__filter, .cordly-side-nav__item, .cordly-preference-group__option, button[cordlyButton], .cordly-change-bar__review, .cordly-change-bar__discard',
  );

  await page.getByLabel('Enabled').click();

  const count = await controls.count();
  expect(count).toBeGreaterThan(4);

  const undersized: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (!(await control.isVisible())) continue;

    const size = await control.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const after = getComputedStyle(element, '::after');
      // A control may reach the minimum through a padded hit area rather than
      // through its painted height; both count, neither is assumed.
      const padded = Number.parseFloat(after.minHeight);
      return {
        width: box.width,
        height: Math.max(box.height, Number.isNaN(padded) ? 0 : padded),
        text: (element.textContent ?? '').trim().slice(0, 40),
      };
    });

    if (size.height < 44 || size.width < 44) {
      undersized.push(`${size.text || '(unlabelled)'} is ${size.width}x${size.height}`);
    }
  }

  expect(undersized).toEqual([]);
});

test('the change bar sits above the safe area and spans the width', async ({ page }) => {
  await page.getByLabel('Enabled').click();

  const bar = page.getByRole('region', { name: 'Staged changes' });
  await expect(bar).toBeVisible();
  await expect(bar).toBeInViewport();

  const viewport = page.viewportSize();
  const box = await bar.boundingBox();
  expect(box?.width).toBeCloseTo(viewport?.width ?? 0, 0);
});

test('nothing scrolls horizontally at a phone width', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);
});

test('the drawer keeps an edge when its shadow is taken away', async ({ page }) => {
  // The drawer floats over the page on elevation alone. Forced colours drops
  // every shadow and paints both surfaces the user's background, so without a
  // border the drawer and the page it covers become one sheet — on the only
  // viewport where the drawer is the navigation.
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Show server sections' }).click();

  const drawer = page.locator('.cordly-app-frame__navigation');
  await expect(page.getByRole('navigation', { name: 'Server sections' })).toBeInViewport();

  const edge = await drawer.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.borderInlineEndWidth, colour: style.borderInlineEndColor };
  });
  const background = await page
    .locator('body')
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  expect(edge.width).not.toBe('0px');
  expect(edge.colour).not.toBe(background);
});

test('the drawer starts off-screen when the page is mirrored', async ({ page }) => {
  // `translate: -100% 0` puts the drawer off the inline-start edge, and the
  // inline-start edge is the right-hand one in a mirrored page — where that
  // same shift slides it into view instead. A drawer that is open before
  // anybody opens it covers the page it is meant to navigate.
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
  });

  const navigation = page.getByRole('navigation', { name: 'Server sections' });
  await expect(navigation).not.toBeInViewport();

  await page.getByRole('button', { name: 'Show server sections' }).click();
  await expect(navigation).toBeInViewport();
});
