import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.CI ? 2 : process.env.WORKERS ? parseInt(process.env.WORKERS) : 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ...(process.env.CI ? [['github'] as const] : [])
  ],
  
  // Global test configuration
  use: {
    // Base URL for staging environment
    baseURL: process.env.STAGING_URL || 'https://localhost:8080',
    
    // Browser options
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 720 },
    
    // Test behavior
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // SSL configuration for self-signed certificates
    ignoreHTTPSErrors: true,
    
    // Storage state for authentication
    storageState: undefined, // Will be set per test
  },

  // Test timeout
  timeout: 120000,
  expect: {
    timeout: 30000,
  },

  // Projects for different test categories
  projects: [
    // Setup project for authentication states
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Core role system tests
    {
      name: 'role-system',
      testDir: './tests/role-system',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Authentication flow tests
    {
      name: 'auth-flow',
      testDir: './tests/role-system',
      testMatch: '**/auth-flow.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Database migration tests
    {
      name: 'migration',
      testDir: './tests/role-system',
      testMatch: '**/database-migration.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Longer timeout for database operations
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
      dependencies: ['setup'],
    },

    // Admin panel tests
    {
      name: 'admin-panel',
      testDir: './tests/role-system',
      testMatch: '**/admin-panel.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/auth/admin-auth.json',
      },
      dependencies: ['setup'],
    },

    // User dashboard tests
    {
      name: 'dashboard',
      testDir: './tests/role-system',
      testMatch: '**/dashboard.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'test-results/auth/customer-auth.json',
      },
      dependencies: ['setup'],
    },

    // Cross-browser testing
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/setup/**'],
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: ['**/setup/**', '**/database-migration.spec.ts'],
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: ['**/setup/**', '**/database-migration.spec.ts'],
      dependencies: ['setup'],
    },

    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testIgnore: ['**/admin-panel.spec.ts', '**/database-migration.spec.ts'],
      dependencies: ['setup'],
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testIgnore: ['**/admin-panel.spec.ts', '**/database-migration.spec.ts'],
      dependencies: ['setup'],
    },

    // Performance testing
    {
      name: 'performance',
      testDir: './tests/performance',
      use: {
        ...devices['Desktop Chrome'],
        // Performance-specific settings
        headless: true,
        video: 'off',
        screenshot: 'off',
      },
      dependencies: ['setup'],
    },

    // Accessibility testing
    {
      name: 'accessibility',
      testDir: './tests/accessibility',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Visual regression testing
    {
      name: 'visual',
      testDir: './tests/visual',
      use: {
        ...devices['Desktop Chrome'],
        // Visual testing specific settings
        headless: true,
        screenshot: 'on',
      },
      dependencies: ['setup'],
    },
  ],

  // Output directories
  outputDir: 'test-results',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/utils/global-setup.ts'),
  globalTeardown: require.resolve('./tests/utils/global-teardown.ts'),

  // Web server configuration for staging tests
  webServer: process.env.CI ? undefined : {
    command: 'docker-compose -f docker-compose.staging.yml up',
    url: 'https://localhost:8080/api/health',
    timeout: 120000,
    reuseExistingServer: true,
    ignoreHTTPSErrors: true,
  },
});