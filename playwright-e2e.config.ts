import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
        }
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'echo "Using existing server on port 3001"',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 5000,
  },
});