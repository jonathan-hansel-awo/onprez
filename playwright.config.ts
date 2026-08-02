import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const externalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: 'artifacts/playwright/test-results',
  reporter: [
    ['line'],
    ['html', { outputFolder: 'artifacts/playwright/html-report', open: 'never' }],
  ],
  use: {
    baseURL,
    permissions: ['clipboard-read', 'clipboard-write'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: externalServer
    ? undefined
    : {
        command: 'npm run dev -- -H 127.0.0.1 -p 3000',
        env: {
          ...process.env,
          APP_URL: baseURL,
          NEXT_PUBLIC_APP_URL: baseURL,
          LOAD_TEST_DISABLE_EXTERNAL_SIDE_EFFECTS: 'true',
        },
        url: `${baseURL}/api/health`,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
