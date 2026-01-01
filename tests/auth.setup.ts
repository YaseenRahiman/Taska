import { test as setup, expect } from '@playwright/test';
import { TEST_USERS } from './helpers/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authentication Setup
 *
 * This setup file runs BEFORE all tests and creates authenticated storage states
 * for each user role. This allows tests to reuse authentication without logging
 * in every time, significantly speeding up test execution.
 *
 * Storage states are saved to tests/.auth/*.json
 */

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const authDir = path.join(__dirname, '.auth');

// Ensure .auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

/**
 * Setup CLIENT authentication
 */
setup('authenticate as CLIENT', async ({ page }) => {
  console.log('🔐 Setting up CLIENT authentication...');

  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', TEST_USERS.CLIENT.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USERS.CLIENT.password);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');

  // Wait for successful login (either dashboard URL or token in localStorage)
  await page.waitForFunction(
    () => localStorage.getItem('token') !== null,
    { timeout: 10000 }
  );

  // Verify we have auth token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  console.log('  ✅ CLIENT authenticated successfully');

  // Save storage state
  await page.context().storageState({ path: path.join(authDir, 'client.json') });
});

/**
 * Setup ARTISAN authentication
 */
setup('authenticate as ARTISAN', async ({ page }) => {
  console.log('🔐 Setting up ARTISAN authentication...');

  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', TEST_USERS.ARTISAN.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USERS.ARTISAN.password);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');

  // Wait for successful login
  await page.waitForFunction(
    () => localStorage.getItem('token') !== null,
    { timeout: 10000 }
  );

  // Verify we have auth token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  console.log('  ✅ ARTISAN authenticated successfully');

  // Save storage state
  await page.context().storageState({ path: path.join(authDir, 'artisan.json') });
});

/**
 * Setup ADMIN authentication
 */
setup('authenticate as ADMIN', async ({ page }) => {
  console.log('🔐 Setting up ADMIN authentication...');

  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', TEST_USERS.ADMIN.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USERS.ADMIN.password);

  // Submit and wait for redirect
  await page.click('button[type="submit"]');

  // Wait for successful login
  await page.waitForFunction(
    () => localStorage.getItem('token') !== null,
    { timeout: 10000 }
  );

  // Verify we have auth token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  console.log('  ✅ ADMIN authenticated successfully');

  // Save storage state
  await page.context().storageState({ path: path.join(authDir, 'admin.json') });
});

console.log('\n✅ Authentication setup complete!');
console.log(`📁 Storage states saved to: ${authDir}`);
console.log('🚀 Tests can now reuse authentication\n');
