import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * The server-rendering gates.
 *
 * Three separate questions, and each one has caught a different class of defect
 * in real design systems:
 *
 * 1. Does the markup exist before any JavaScript runs? A component that renders
 *    nothing on the server is invisible to a crawler and to anyone whose script
 *    failed to load.
 * 2. Does it hydrate without a warning? A hydration mismatch is silently
 *    recovered by re-rendering the subtree, so the only symptom is a console
 *    message and a slower page.
 * 3. Does a control rendered by the server work before Angular has booted?
 *    Without event replay a press in that window is simply lost.
 */

test('renders the whole page on the server, with no JavaScript involved', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Server-rendered fixture' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Night Library/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Server sections' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Staged changes' })).toBeVisible();
  await expect(page.getByLabel('Announcement channel')).toBeVisible();

  await context.close();
});

test('sends the theme in the first response, so no page corrects itself on hydration', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');

  const canvas = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--cordly-color-canvas').trim(),
  );

  expect(canvas).toContain('oklch');
  await context.close();
});

test('hydrates without a warning or an error', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') messages.push(message.text());
  });
  page.on('pageerror', (error) => messages.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Server-rendered fixture' })).toBeVisible();
  // Give hydration a chance to report a mismatch, which it does asynchronously.
  await page.waitForTimeout(1000);

  expect(messages).toEqual([]);
});

test('replays a press that landed before Angular finished booting', async ({ page }) => {
  const probe = page.getByRole('button', { name: /^Pressed/ });

  await page.goto('/', { waitUntil: 'commit' });
  await probe.click();

  await expect(probe).toHaveText('Pressed 1 times');
});

test('has no detectable accessibility violation in the server-rendered page', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('a form control keeps the value the server rendered', async ({ page }) => {
  // Hydration reuses the server's DOM. A control whose value is written on the
  // first client render instead would visibly reset here.
  await page.goto('/');

  await expect(page.getByLabel('Announcement channel')).toHaveValue('general');
  await expect(page.getByLabel('Message text')).toHaveValue('Welcome {member}!');
  await expect(page.getByRole('switch', { name: 'Enabled' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
