import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });     // Root .env.test (if exists)
dotenv.config({ path: path.resolve(__dirname, '../backend/.env.test') }); // Backend test config
dotenv.config({ path: path.resolve(__dirname, '.env.test') });        // Frontend test config

// Set TEST_USER_EXISTS if not already set
if (!process.env.TEST_USER_EXISTS) {
  process.env.TEST_USER_EXISTS = 'true';
}

/**
 * Playwright Test Configuration for Taska Platform
 * Comprehensive E2E testing setup
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test configuration
  // Disable full parallelization to prevent race conditions with shared test data
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests serially to prevent account lockout and race conditions

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Shared settings for all tests
  use: {
    // Base URL for the application
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3001',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser viewport
    viewport: { width: 1280, height: 720 },

    // Default timeout for actions
    actionTimeout: 15000,

    // Default navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web server configuration
  // ✅ FIX: Start BOTH backend (port 3000) and frontend (port 3001) using custom script
  webServer: {
    command: 'node scripts/start-test-servers.js',
    cwd: path.resolve(__dirname, '..'),  // Run from ROOT directory
    url: 'http://localhost:3001',        // Health check frontend
    reuseExistingServer: !process.env.CI,
    timeout: 180000,                     // 3 minutes for both servers to start
    env: {
      NODE_ENV: 'test',                  // Use test environment
    },
  },
});
