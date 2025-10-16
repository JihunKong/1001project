import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],

  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  outputDir: 'test-results/',

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  // No webServer for production testing
});