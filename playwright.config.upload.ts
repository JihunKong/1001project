import { defineConfig, devices } from '@playwright/test';

/**
 * Specialized Playwright configuration for admin upload functionality testing
 * This configuration is optimized for file upload testing with appropriate timeouts
 * and artifact collection settings.
 */
export default defineConfig({
  testDir: './tests',
  // Only run admin upload tests
  testMatch: ['**/admin-upload*.spec.ts'],
  
  fullyParallel: false, // Sequential execution for upload tests to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2, // Limited workers for upload testing
  
  reporter: [
    ['html', { outputFolder: 'playwright-report-upload' }],
    ['json', { outputFile: 'test-results/upload-test-results.json' }],
    ['junit', { outputFile: 'test-results/upload-test-results.xml' }],
  ],
  
  // Global test timeout for upload operations
  timeout: 60000, // 1 minute per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  use: {
    baseURL: 'http://localhost:3000',
    
    // Enhanced tracing for upload debugging
    trace: 'on-first-retry',
    
    // Always capture screenshots and videos for upload tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Slower navigation timeout for file processing
    navigationTimeout: 30000,
    actionTimeout: 15000,
    
    // Keep artifacts for debugging
    contextOptions: {
      recordVideo: {
        dir: 'test-results/upload-videos/',
        size: { width: 1280, height: 720 }
      }
    },
  },

  projects: [
    {
      name: 'chromium-upload',
      use: { 
        ...devices['Desktop Chrome'],
        // Increase viewport for better form visibility
        viewport: { width: 1280, height: 1024 }
      },
    },
    
    {
      name: 'firefox-upload',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 1024 }
      },
    },
    
    {
      name: 'webkit-upload',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 1024 }
      },
    },
    
    // Mobile upload testing
    {
      name: 'mobile-chrome-upload',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'mobile-safari-upload',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    
    // Set environment variables for testing
    env: {
      NODE_ENV: 'test',
      UPLOAD_TEST_MODE: 'true',
    },
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/utils/global-setup'),
  globalTeardown: require.resolve('./tests/utils/global-teardown'),

  // Output directories
  outputDir: 'test-results/upload-artifacts',
  
  // Metadata for test reporting
  metadata: {
    testType: 'Admin Upload Functionality',
    environment: 'localhost:3000',
    purpose: 'End-to-end testing of book and product upload forms'
  },
});