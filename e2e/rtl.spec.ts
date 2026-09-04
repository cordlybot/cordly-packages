import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The same fixture with the document flipped.
 *
 * Every size, inset, border, and padding in these packages is written logically
 * — `inline-size`, `inset-inline-start`, `border-inline-end` — and that is a
 * claim: that a component mirrors itself and no application has to restyle it.
 * The claim is cheap to make and was not true. `translate` has no logical form,
 * and each of the handful of places using one was a hole: a switch whose thumb
 * travelled out of its own track, a drawer that sat open when it should have
 * been off-screen, and two elements centred by a logical inset and a physical
 * half-width shift that pushed them a full width off-centre.
 *
 * The direction is set on the document rather than through a separate fixture
 * build, because that is how an application does it — one attribute, everything
 * below it mirrors.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
  });
});

test('the switch thumb travels toward the inline end, not toward the right', async ({ page }) => {
  // `translate: 1.25rem 0` moves the thumb right in both directions. Mirrored,
  // the thumb starts at the right of the track, so "on" pushed it out.
  const control = page.getByLabel('Enabled');

  const offsets = async () =>
    control.evaluate(async (element) => {
      const root = element.closest('cordly-switch') ?? element;
      const thumb = root.querySelector('.cordly-switch__thumb') as HTMLElement;
      await Promise.allSettled(thumb.getAnimations().map((animation) => animation.finished));
      const track = (
        root.querySelector('.cordly-switch__track') as HTMLElement
      ).getBoundingClientRect();
      const box = thumb.getBoundingClientRect();
      return {
        insideTrack: box.left >= track.left - 1 && box.right <= track.right + 1,
        left: box.left,
      };
    });

  const on = await offsets();
  await control.click();
  const off = await offsets();

  expect(on.insideTrack).toBe(true);
  expect(off.insideTrack).toBe(true);
  expect(on.left).not.toBe(off.left);
});

test('a tooltip stays centred on the control it belongs to', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'What is this?' });
  await trigger.hover();

  const panel = page.locator('cordly-tooltip-panel');
  await expect(panel).toBeVisible();

  const [triggerBox, panelBox] = await Promise.all([
    trigger.evaluate((element) => element.getBoundingClientRect().toJSON()),
    panel.evaluate((element) => element.getBoundingClientRect().toJSON()),
  ]);

  const triggerCentre = triggerBox.x + triggerBox.width / 2;
  const panelCentre = panelBox.x + panelBox.width / 2;

  // Half a panel width out is what an unflipped shift produces, so the
  // tolerance is deliberately far below that.
  expect(Math.abs(panelCentre - triggerCentre)).toBeLessThan(panelBox.width / 4);
});

test('nothing scrolls horizontally when the page is mirrored', async ({ page }) => {
  // The blunt one. A physical offset in a mirrored layout usually shows up as
  // something pushed off the far edge, and the page grows to hold it.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});

test('the menu opens inside the viewport on the mirrored side', async ({ page }) => {
  await page.getByRole('button', { name: 'Account menu' }).click();

  const panel = page.locator('.cordly-menu__panel');
  await expect(panel).toBeVisible();

  const box = await panel.evaluate((element) => element.getBoundingClientRect().toJSON());
  const width = await page.evaluate(() => document.documentElement.clientWidth);

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
});

test('has no detectable accessibility violation when mirrored', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
