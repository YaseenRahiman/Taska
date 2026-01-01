import { chromium, FullConfig } from '@playwright/test';
import { setupTestUser, TEST_USERS } from '../helpers/auth.helper';
import axios from 'axios';

/**
 * Global Setup for Playwright Tests
 * Runs once before all tests to prepare test environment
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

async function waitForBackend(maxAttempts: number = 30): Promise<boolean> {
  console.log('Waiting for backend to be ready...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✓ Backend is ready');
        return true;
      }
    } catch (error) {
      console.log(`Backend check attempt ${attempt}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.error('✗ Backend failed to become ready');
  return false;
}

async function waitForFrontend(maxAttempts: number = 30): Promise<boolean> {
  console.log('Waiting for frontend to be ready...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
      if (response.status === 200) {
        console.log('✓ Frontend is ready');
        return true;
      }
    } catch (error) {
      console.log(`Frontend check attempt ${attempt}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.error('✗ Frontend failed to become ready');
  return false;
}

async function createTestUsers(): Promise<void> {
  console.log('\nCreating test users...');

  try {
    // Create client test user
    await setupTestUser('client');
    console.log('✓ Client test user created/verified');
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log('✓ Client test user already exists');
    } else {
      console.error('✗ Failed to create client test user:', error.message);
    }
  }

  try {
    // Create artisan test user
    await setupTestUser('artisan');
    console.log('✓ Artisan test user created/verified');
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log('✓ Artisan test user already exists');
    } else {
      console.error('✗ Failed to create artisan test user:', error.message);
    }
  }

  try {
    // Create admin test user
    await setupTestUser('admin');
    console.log('✓ Admin test user created/verified');
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log('✓ Admin test user already exists');
    } else {
      console.error('✗ Failed to create admin test user:', error.message);
    }
  }
}

async function verifyTestEnvironment(): Promise<boolean> {
  console.log('\nVerifying test environment...');

  // Check environment variables
  const requiredEnvVars = [
    { key: 'NEXT_PUBLIC_API_URL', value: process.env.NEXT_PUBLIC_API_URL || API_URL, optional: true },
    { key: 'FRONTEND_URL', value: process.env.FRONTEND_URL || FRONTEND_URL, optional: true }
  ];

  console.log('Environment variables:');
  requiredEnvVars.forEach(({ key, value, optional }) => {
    if (value) {
      console.log(`  ✓ ${key}: ${value}`);
    } else if (!optional) {
      console.warn(`  ⚠ ${key}: Not set (using default)`);
    }
  });

  return true;
}

async function globalSetup(config: FullConfig) {
  console.log('\n========================================');
  console.log('Taska Platform - Test Environment Setup');
  console.log('========================================\n');

  try {
    // Step 1: Verify environment
    await verifyTestEnvironment();

    // Step 2: Wait for backend
    const backendReady = await waitForBackend();
    if (!backendReady) {
      throw new Error('Backend is not ready. Please start the backend server.');
    }

    // Step 3: Wait for frontend (or let webServer handle it)
    // Frontend might be started by playwright webServer config
    console.log('Waiting for frontend...');
    // Give webServer time to start if configured
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 4: Create test users
    try {
      await createTestUsers();
    } catch (error) {
      console.warn('⚠ Could not create test users - tests may fail if users do not exist');
      console.warn('  Error:', error);
    }

    console.log('\n========================================');
    console.log('Setup completed successfully!');
    console.log('========================================\n');

    console.log('Test Users Available:');
    console.log(`  Client:  ${TEST_USERS.client.email} / ${TEST_USERS.client.password}`);
    console.log(`  Artisan: ${TEST_USERS.artisan.email} / ${TEST_USERS.artisan.password}`);
    console.log(`  Admin:   ${TEST_USERS.admin.email} / ${TEST_USERS.admin.password}`);
    console.log('\nReady to run tests!\n');

  } catch (error) {
    console.error('\n✗ Setup failed:', error);
    throw error;
  }
}

export default globalSetup;
