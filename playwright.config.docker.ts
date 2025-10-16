import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration optimized for Docker container execution
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Test match pattern
  testMatch: '**/*.spec.ts',

  // Timeout configurations
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for expect assertions
  },

  // Parallel execution configuration
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4, // Fewer workers in CI to prevent resource issues

  // Retry configuration
  retries: process.env.CI ? 2 : 1,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never' // Don't try to open browser in container
    }],
    ['json', {
      outputFile: 'test-results/results.json'
    }],
    ['junit', {
      outputFile: 'test-results/junit.xml'
    }],
  ],

  // Global test configuration
  use: {
    // Base URL from environment or default
    baseURL: process.env.BASE_URL || 'http://app-test:3000',

    // Artifact collection
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Browser context options
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },

    // Timeout for actions
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,

    // Headless mode (required in Docker)
    headless: true,

    // Browser launch options
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Required for Docker Alpine
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--deterministic-fetch',
      ],
    },
  },

  // Project configuration for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Docker-specific Chrome flags
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
          },
        },
      },
    },
    // WebKit often has issues in Docker, so it's optional
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results',

  // Global setup and teardown
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  // Web server configuration (if needed)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});