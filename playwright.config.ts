import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests run against their own database and port, so they never
 * touch development data. In CI the app is built and started; locally the dev
 * server is used unless E2E_PRODUCTION=1.
 */
const PORT = Number(process.env.E2E_PORT || 3100)
export const E2E_BASE_URL = `http://localhost:${PORT}`
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lte_e2e'

const serverEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'e2e-secret',
  SERVER_URL: E2E_BASE_URL,
  PORT: String(PORT),
  RATE_LIMIT_DISABLED: 'true',
  // The database is built from migrations in global setup; never push schema changes.
  PAYLOAD_DB_PUSH: 'false',
  SMTP_HOST: '',
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
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : undefined,
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // Phone layout. Real iPhone Safari and Android Chrome are covered by manual testing (Phase 5).
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /student\.e2e\.spec\.ts/,
    },
  ],
  webServer: {
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
})
