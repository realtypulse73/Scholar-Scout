import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SCHOLARSCOUT_E2E_BASE_URL;

if (!baseURL?.startsWith('https://127.0.0.1:')) {
  throw new Error('The release browser test requires the owned HTTPS fixture URL.');
}

export default defineConfig({
  testDir: './apps/web/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
