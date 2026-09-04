import { defineConfig, devices } from '@playwright/test';

/**
 * The browser gates run against the two fixture consumers, and both consumers
 * are installed from packed tarballs rather than linked to this source tree.
 *
 * That is the difference between this suite and the unit tests. A unit test
 * renders a component in jsdom, where there is no layout, no real focus ring, no
 * `<dialog>` top layer, and no forced-colours mode — so an accessibility
 * guarantee proved only there is a guarantee about a simulation. These run in a
 * real browser against the built artefact a consumer would install.
 *
 * Both servers are started by Playwright and both are the *production* build,
 * for the same reason: the development server applies different CSS ordering and
 * skips the budget, and neither is what ships.
 *
 * This lives in its own npm project. Playwright and its browsers are most of an
 * install, and the gate that runs on every push has no use for either — keeping
 * them here took a cold `npm ci` for that gate from five minutes to thirty
 * seconds. The fixtures and the compatibility harness are separate projects for
 * a different reason, but the shape is the same one.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node tools/serve-static.mjs fixtures/browser/dist/browser 4400',
      cwd: '..',
      url: 'http://localhost:4400/',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
    {
      command: 'node fixtures/ssr/dist/server/server.mjs',
      cwd: '..',
      url: 'http://localhost:4401/',
      env: { PORT: '4401' },
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'browser',
      testMatch: /browser\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4400' },
    },
    {
      // The same fixture at a phone width, because the drawer, the bottom-safe
      // change bar, and the touch targets only exist below the medium
      // breakpoint and are therefore never exercised by the desktop project.
      name: 'mobile',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4400' },
    },
    {
      // The same fixture in Windows High Contrast mode.
      //
      // Its own project because forced colours is a browser-level setting, not
      // something a test can turn on partway through. It earns a gate of its
      // own because it is the one mode that removes a category of styling
      // outright: every box-shadow is dropped, and every author colour that is
      // not a system keyword is replaced. Several components documented forced
      // colours as the reason for a design decision and then expressed that
      // decision in a box-shadow, which is exactly the thing that does not
      // survive.
      // Forced colours itself is turned on per page rather than here. The
      // context-level `forcedColors` option is accepted and silently does
      // nothing in this Chromium — `matchMedia('(forced-colors: active)')`
      // stays false — so a suite that trusted it would assert against an
      // ordinary page and pass for the wrong reason. `page.emulateMedia` does
      // work, and Chromium then applies the real treatment: box-shadows go, and
      // author colours are substituted. The project exists for the file split.
      name: 'forced-colors',
      testMatch: /forced-colors.spec.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4400' },
    },
    {
      // The same fixture with the document flipped.
      //
      // Every size, inset, border, and padding in these packages is written
      // logically, which is a claim that they work in either direction. The
      // handful of `translate` values are the exceptions — `translate` has no
      // logical form — and each one was a hole in that claim until something
      // measured it.
      name: 'rtl',
      testMatch: /rtl.spec.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4400' },
    },
    {
      name: 'ssr',
      testMatch: /ssr\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4401' },
    },
  ],
});
