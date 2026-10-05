import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'fs'

/**
 * End-to-end tests run against their own database and port, so they never
 * touch development data. In CI the app is built and started; locally the dev
 * server is used unless E2E_PRODUCTION=1.
 */
const PORT = Number(process.env.E2E_PORT || 3100)
export const E2E_BASE_URL = `http://localhost:${PORT}`
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lte_e2e'

// The Android/iOS app (mobile/), exported for the web by `npm run build:app-e2e` with its
// server address set to E2E_BASE_URL. Its tests run only when that build exists.
const APP_PORT = Number(process.env.E2E_APP_PORT || 3101)
const APP_URL = `http://localhost:${APP_PORT}`
const APP_BUILD = 'mobile/dist-e2e'
const withApp = existsSync(`${APP_BUILD}/index.html`)

const serverEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'e2e-secret',
  SERVER_URL: E2E_BASE_URL,
  PORT: String(PORT),
  RATE_LIMIT_DISABLED: 'true',
  // The database is built from migrations in global setup; never push schema changes.
  PAYLOAD_DB_PUSH: 'false',
  // Deterministic AI feedback; tests never call the real API.
  AI_FAKE: 'true',
  SMTP_HOST: '',
  // The app's web build calls the API from another origin.
  CORS_ORIGINS: APP_URL,
}

const production = process.env.CI || process.env.E2E_PRODUCTION

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // A fake microphone, so recording can be tested without a real device or a permission prompt.
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
    },
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile-app\.e2e\.spec\.ts/ },
    // Phone layout. Real iPhone Safari and Android Chrome are covered by manual testing (Phase 5).
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /(student|v4-student)\.e2e\.spec\.ts/,
    },
    // The native app's screens, at phone size, against the same server.
    ...(withApp
      ? [{ name: 'mobile-app', use: { ...devices['Pixel 7'], baseURL: APP_URL }, testMatch: /mobile-app\.e2e\.spec\.ts/ }]
      : []),
  ],
  webServer: [
    {
      // E2E_SKIP_BUILD=1 reuses an existing production build (CI builds in an earlier step).
      command: production
        ? `${process.env.E2E_SKIP_BUILD ? '' : 'npm run build && '}npm run start -- -p ${PORT}`
        : `npx next dev -p ${PORT}`,
      // A static file: the server is ready without starting Payload, so the
      // database is first touched by global setup (migrateFresh), not by this check.
      url: `${E2E_BASE_URL}/question-sets-template.csv`,
      env: serverEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: 'pipe',
    },
    ...(withApp
      ? [{ command: `node scripts/serve-static.mjs ${APP_BUILD} ${APP_PORT}`, url: APP_URL, reuseExistingServer: !process.env.CI }]
      : []),
  ],
})
