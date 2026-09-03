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
 */
export default defineConfig({
  testDir: './e2e',
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
      url: 'http://localhost:4400/',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
    {
      command: 'node fixtures/ssr/dist/server/server.mjs',
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
      name: 'ssr',
      testMatch: /ssr\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4401' },
    },
  ],
});
