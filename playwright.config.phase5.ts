import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Phase 5 Text Publishing Workflow Test Configuration
// Specifically configured for testing the production-like Docker environment
export default defineConfig({
  testDir: './tests/phase5',
  
  // Test execution settings optimized for comprehensive workflow testing
  fullyParallel: false, // Sequential for workflow integrity
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2,
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 2,
  
  // Increased timeouts for complex workflow operations
  timeout: 120000, // 2 minutes per test
  globalTimeout: 60 * 60 * 1000, // 1 hour total
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },
  
  // Comprehensive reporting for production testing
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report/phase5',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { 
      outputFile: 'test-results/phase5-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/phase5-junit.xml' 
    }],
    ['list'],
    ['github'],
    // Custom reporter for Phase 5 specific metrics
    ['./tests/utils/phase5-reporter.ts'],
  ],
  
  // Output directories
  outputDir: 'test-results/phase5',
  
  // Production environment configuration
  use: {
    // Production server URL with SSL
    baseURL: process.env.TEST_BASE_URL || 'https://3.128.143.122',
    
    // Enhanced artifact collection for debugging
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // SSL and security settings for production testing
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true, // Required for self-signed certificates
    
    // Increased timeouts for production environment
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    // Locale settings
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Security settings
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
    },
    
    // Custom context options
    contextOptions: {
      recordVideo: {
        dir: 'test-artifacts/phase5/videos',
        size: { width: 1920, height: 1080 }
      },
      acceptDownloads: true,
      // Reduce memory usage for long-running tests
      deviceScaleFactor: 1,
    },
  },

  // Comprehensive project configurations for Phase 5 testing
  projects: [
    // Text Submission Workflow Tests
    {
      name: 'text-submission',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*text-submission.*\.spec\.ts/,
    },
    
    // Story Manager Review Workflow Tests
    {
      name: 'story-review',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*story-review.*\.spec\.ts/,
    },
    
    // Library Integration Tests
    {
      name: 'library-integration',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*library-integration.*\.spec\.ts/,
    },
    
    // ESL Reader Integration Tests
    {
      name: 'esl-integration',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*esl-integration.*\.spec\.ts/,
    },
    
    // Multi-Role Permission Tests
    {
      name: 'role-permissions',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*role-permissions.*\.spec\.ts/,
    },
    
    // Mobile Responsiveness Tests
    {
      name: 'mobile-responsive',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*mobile.*\.spec\.ts/,
    },
    
    // Tablet Testing
    {
      name: 'tablet-responsive',
      use: {
        ...devices['iPad Pro'],
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: [
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*tablet.*\.spec\.ts/,
    },
    
    // Performance Testing for Text Workflows
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--disable-web-security',
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
      testMatch: /.*performance.*\.spec\.ts/,
    },
  ],

  // Global setup for Phase 5 testing
  globalSetup: require.resolve('./tests/phase5/global-setup.ts'),
  globalTeardown: require.resolve('./tests/phase5/global-teardown.ts'),
});
