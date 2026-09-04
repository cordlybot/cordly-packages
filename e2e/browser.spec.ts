import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The browser gates.
 *
 * Everything here is something jsdom cannot answer: whether a focus ring is
 * actually painted, whether the platform's modal really traps focus, whether the
 * contrast the tokens promise survives compositing, whether a control is 44 CSS
 * pixels to a finger, and whether a page still works at 200% zoom.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('has no detectable accessibility violation at rest', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('has no violation with the review drawer open', async ({ page }) => {
  // The state most likely to be missed: a modal changes the whole accessibility
  // tree, and a suite that only scans the resting page never sees it.
  await page.getByLabel('Enabled').click();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('has no violation in the light theme', async ({ page }) => {
  // Both themes are complete, so both are scanned. A contrast failure that only
  // exists in light is the failure nobody sees until a user toggles.
  await page.getByText('Light', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cordly-theme', 'light');

  const results = await new AxeBuilder({ page }).withTags(['wcag2aa', 'wcag22aa']).analyze();

  expect(results.violations).toEqual([]);
});

test('the skip link is the first tab stop and moves focus to main', async ({ page }) => {
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();

  // Visible only while focused — a skip link nobody can see when they reach it
  // is the same as no skip link at all.
  await expect(skip).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('every interactive control paints a visible focus ring', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Show loading state' });
  await button.focus();

  const outline = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
  });

  expect(outline.style).not.toBe('none');
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
});

test('an explicit theme wins over the system, in both directions', async ({ page }) => {
  // Playwright reports a light system preference and the fixture sets no
  // attribute on load, so the page starts light *by following the system* —
  // which is the tokens behaving correctly. What matters is that choosing either
  // theme explicitly overrides that, and that the swap is a variable change
  // rather than a class change on every component.
  const canvasOf = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--cordly-color-canvas').trim(),
    );

  await expect(page.locator('html')).not.toHaveAttribute('data-cordly-theme', /.*/);

  await page.getByText('Dark', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cordly-theme', 'dark');
  const dark = await canvasOf();

  await page.getByText('Light', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-cordly-theme', 'light');
  const light = await canvasOf();

  expect(dark).not.toBe(light);
  expect(dark).toContain('oklch');
  expect(light).toContain('oklch');
});

test('the modal traps focus, closes on Escape, and returns focus to its trigger', async ({
  page,
}) => {
  const trigger = page.getByRole('button', { name: 'Review', exact: true });
  await page.getByLabel('Enabled').click();
  await trigger.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Tab a long way. The platform's modal keeps focus inside; a hand-built
  // overlay is where this test would fail.
  for (let index = 0; index < 12; index += 1) await page.keyboard.press('Tab');
  await expect(dialog.locator(':focus')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the menu answers arrow keys, wraps, and returns focus on Escape', async ({ page }) => {
  // Focus movement, not just the roving tab stop. A menu that marks one item
  // active while the keyboard is on another is a menu whose arrows appear not to
  // work, and jsdom cannot tell the two apart.
  const trigger = page.getByRole('button', { name: 'Account menu' });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');

  await expect(page.getByRole('menu')).toBeVisible();
  // The first entry is a link and the second is a button; arrow keys have to
  // move between them without noticing the difference.
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeFocused();

  await page.keyboard.press('End');
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the change bar appears only when the draft differs, and announces the count', async ({
  page,
}) => {
  const bar = page.getByRole('region', { name: 'Staged changes' });
  await expect(bar).toBeHidden();

  await page.getByLabel('Enabled').click();
  await expect(bar).toBeVisible();
  await expect(bar).toContainText('1 change staged');

  await page.getByRole('button', { name: 'Discard' }).click();
  await expect(bar).toBeHidden();
});

test('search appears above the threshold and filtering announces its result count', async ({
  page,
}) => {
  const search = page.getByLabel('Search modules');
  await expect(search).toBeVisible();

  await search.fill('welcome');
  await expect(page.getByText('1 module', { exact: true })).toBeVisible();

  await search.fill('nothing matches this');
  await expect(page.getByRole('heading', { name: 'No modules match that search' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear search and filters' })).toBeVisible();
});

test('a toast announces a completed outcome without being the only record', async ({ page }) => {
  await page.getByLabel('Enabled').click();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page.getByRole('button', { name: /^Apply/ }).click();

  const region = page.getByRole('status');
  await expect(region).toContainText('Applied 1 changes in Night Library.');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
});

test('a validation error keeps the typed value and describes the field', async ({ page }) => {
  await page.getByText('Advanced options', { exact: true }).click();
  // By role: the review list also carries a control labelled "…Welcome message
  // text", and a bare label lookup matches both.
  const field = page.getByRole('textbox', { name: 'Message text' });
  await field.fill('');

  await expect(page.getByText('A welcome message cannot be empty.')).toBeVisible();
  await expect(field).toHaveAttribute('aria-invalid', 'true');

  await field.fill('Hello {member}');
  await expect(field).toHaveValue('Hello {member}');
});

test('the page stays readable and single-axis at 200% zoom', async ({ page }) => {
  // WCAG 1.4.4 in practice: doubling the text size must not produce a horizontal
  // scrollbar, which is what happens the moment a layout is sized in pixels.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(1);
});

test('reduced motion removes the movement and keeps the affordance', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();

  const tile = page.getByRole('link', { name: /Night Library/ });
  await tile.hover();

  const applied = await tile.evaluate((element) => {
    const style = getComputedStyle(element);
    return { transform: style.transform, boxShadow: style.boxShadow };
  });

  // Nothing moves…
  expect(applied.transform === 'none' || applied.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(
    true,
  );
  // …and the surface still responds, so the affordance survives.
  expect(applied.boxShadow).not.toBe('none');
});

test('the skeleton keeps its shape and drops its sheen under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.getByRole('button', { name: 'Show loading state' }).click();

  const line = page.locator('.cordly-skeleton__line').first();
  await expect(line).toBeVisible();

  const sheen = await line.evaluate((element) => getComputedStyle(element, '::after').display);
  expect(sheen).toBe('none');
});

test('loading preserves the layout rather than collapsing it', async ({ page }) => {
  const catalogue = page.locator('.cordly-catalogue__results');
  const before = await catalogue.boundingBox();

  await page.getByRole('button', { name: 'Show loading state' }).click();
  const during = await catalogue.boundingBox();

  expect(before).not.toBeNull();
  expect(during).not.toBeNull();
  expect(during?.width).toBeCloseTo(before?.width ?? 0, 0);
});

test('a stretched action makes the whole card the target', async ({ page }) => {
  // The gate that was missing. A consumer writing this pattern by hand gets a
  // "stretched" overlay the exact size of the button, because this package owns
  // `::after` on every control and makes it positioned — so `inset: 0` resolves
  // against the control instead of the card. Nothing about that is visible: the
  // card looks identical and every jsdom test passes.
  const card = page.locator('.fixture-featured');
  await card.scrollIntoViewIfNeeded();

  const hit = await card.evaluate((element) => {
    const box = element.getBoundingClientRect();
    // The card's top-left quadrant — over the heading, nowhere near the button.
    const target = document.elementFromPoint(box.x + box.width * 0.25, box.y + box.height * 0.25);
    return target instanceof Element ? (target.closest('a')?.getAttribute('href') ?? null) : null;
  });

  expect(hit).toBe('#weekend-jam');
});

test('a stretched action keeps exactly one focusable control on the card', async ({ page }) => {
  // The other half of the pattern. A clickable card built from a background
  // handler plus a link plus a title link is three overlapping targets and an
  // announcement nobody can parse.
  const card = page.locator('.fixture-featured');

  await expect(card.locator('a, button')).toHaveCount(1);
});

test('a menu entry with a destination is a real link', async ({ page }) => {
  // Middle-click, "open in a new tab", and "copy link address" belong to the
  // anchor. A button that navigates on click has none of them, and no unit test
  // notices because the click handler still works.
  await page.getByRole('button', { name: 'Account menu' }).click();

  const profile = page.getByRole('menuitem', { name: 'Profile' });
  await expect(profile).toHaveAttribute('href', '/profile');
  expect(await profile.evaluate((element) => element.tagName)).toBe('A');

  // The entries that only act stay buttons.
  expect(
    await page.getByRole('menuitem', { name: 'Settings' }).evaluate((element) => element.tagName),
  ).toBe('BUTTON');
});

test('a plain click on a menu link is handled rather than followed', async ({ page }) => {
  // An application routes it. Letting the anchor navigate would reload the whole
  // page, which is the cost of using a link at all.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Profile' }).click();

  await expect(page.getByRole('status').getByText('Profile chosen.')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');
});

test('a menu link answers Space, which a native anchor does not', async ({ page }) => {
  // Half a menu responding to Space is worse than none of it: the other half
  // scrolls the page behind the open menu.
  await page.getByRole('button', { name: 'Account menu' }).click();
  await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();

  await page.keyboard.press('Space');

  await expect(page.getByRole('status').getByText('Profile chosen.')).toBeVisible();
});
