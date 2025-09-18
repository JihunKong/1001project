import { defineConfig, devices } from '@playwright/test';

/**
 * Simple Playwright configuration for local admin upload functionality testing
 * This configuration works directly with the local development server
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/upload-local.spec.ts'],
  
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  
  reporter: [
    ['html', { outputFolder: 'playwright-report-local-upload' }],
    ['list']
  ],
  
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-local-upload',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1024 }
      },
    }
  ]
});