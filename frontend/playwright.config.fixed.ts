import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Set TEST_USER_EXISTS if not already set
if (!process.env.TEST_USER_EXISTS) {
  process.env.TEST_USER_EXISTS = 'true';
}

/**
 * Playwright Test Configuration for Taska Platform
 * Optimized for test reliability and account management
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test configuration - FIXED for reliability
  fullyParallel: false, // Serial execution to prevent account conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once on failure
  workers: 1, // Single worker to prevent test conflicts and lockouts

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
    ['line'] // Add line reporter for better progress visibility
  ],

  // Shared settings for all tests
  use: {
    // Base URL for the application
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3001',

    // Collect trace on failure and retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser viewport
    viewport: { width: 1280, height: 720 },

    // Increased timeouts for reliability
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,

    // Wait for animations to finish
    hasTouch: false,

    // Locale and timezone
    locale: 'en-ZA',
    timezoneId: 'Africa/Johannesburg',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Additional chrome-specific settings for stability
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
    },

    // Uncomment for cross-browser testing (after main tests pass)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/setup/global-setup.ts'),
});
