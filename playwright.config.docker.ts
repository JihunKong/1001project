import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Test configuration for Docker environment
export default defineConfig({
  testDir: './tests/e2e',
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 4,
  
  // Global timeout settings
  timeout: 60000, // 60 seconds per test
  globalTimeout: 30 * 60 * 1000, // 30 minutes total
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  
  // Reporting configuration
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    ['json', { 
      outputFile: 'test-results/results.json' 
    }],
    ['junit', { 
      outputFile: 'test-results/junit.xml' 
    }],
    ['list'],
    ['github'],
  ],
  
  // Output directories
  outputDir: 'test-results',
  
  // Shared test configuration
  use: {
    // Base URL from environment or default
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
    
    // Artifact collection
    trace: process.env.TRACE || 'retain-on-failure',
    screenshot: process.env.SCREENSHOT || 'only-on-failure',
    video: process.env.VIDEO || 'retain-on-failure',
    
    // Browser settings
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Action settings
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Authentication state
    storageState: process.env.STORAGE ? path.join(__dirname, process.env.STORAGE) : undefined,
    
    // Locale settings
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Device emulation
    isMobile: false,
    hasTouch: false,
    
    // Custom context options
    contextOptions: {
      recordVideo: {
        dir: 'test-artifacts/videos',
        size: { width: 1920, height: 1080 }
      },
      // Accept downloads
      acceptDownloads: true,
    },
  },

  // Project configurations for different browsers and scenarios
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--no-sandbox',
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
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    
    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        isMobile: true,
        hasTouch: true,
      },
    },
    
    // Role-based test projects
    {
      name: 'learner',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/auth/learner.json',
      },
      testMatch: /.*learner.*\.spec\.ts/,
    },
    {
      name: 'teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/auth/teacher.json',
      },
      testMatch: /.*teacher.*\.spec\.ts/,
    },
    {
      name: 'institution',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/auth/institution.json',
      },
      testMatch: /.*institution.*\.spec\.ts/,
    },
    {
      name: 'volunteer',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/auth/volunteer.json',
      },
      testMatch: /.*volunteer.*\.spec\.ts/,
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/fixtures/auth/admin.json',
      },
      testMatch: /.*admin.*\.spec\.ts/,
    },
    
    // Performance testing
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--enable-precise-memory-info'],
        },
      },
      testMatch: /.*performance.*\.spec\.ts/,
    },
    
    // Accessibility testing
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*a11y.*\.spec\.ts/,
    },
    
    // Visual regression testing
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        // Ensure consistent screenshots
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
      },
      testMatch: /.*visual.*\.spec\.ts/,
    },
  ],

  // Web server configuration (not used in Docker, handled by docker-compose)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});