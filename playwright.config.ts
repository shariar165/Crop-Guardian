import { defineConfig } from '@playwright/test'

// Smoke tests for the bugs judges would hit, against a production build (the service worker and
// showcase mode only behave as in production there). Uses the installed Chrome, so Playwright
// downloads no browser. Run: npm run test:e2e
const PORT = 3100

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    channel: 'chrome',
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 360, height: 640 },
    isMobile: true,
    hasTouch: true,
    locale: 'bn-BD',
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/offline`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    // Showcase mode, so /account and /officer open without signing in.
    env: { SHOWCASE_UNTIL: '2999-12-31' },
  },
})
