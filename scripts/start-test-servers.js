#!/usr/bin/env node

/**
 * Custom Test Server Startup Script
 *
 * This script ensures both backend (port 3000) and frontend (port 3001)
 * servers start successfully before Playwright tests begin execution.
 *
 * Features:
 * - Sequential startup (backend first, then frontend)
 * - Health check verification
 * - Graceful shutdown handling
 * - Detailed logging for debugging
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Configuration
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 3001;
const BACKEND_HEALTH_URL = `http://localhost:${BACKEND_PORT}/api/v1/health`;
const FRONTEND_HEALTH_URL = `http://localhost:${FRONTEND_PORT}`;
const BACKEND_STARTUP_WAIT = 30000; // 30 seconds
const FRONTEND_STARTUP_WAIT = 20000; // 20 seconds
const HEALTH_CHECK_INTERVAL = 1000; // 1 second
const HEALTH_CHECK_MAX_ATTEMPTS = 60; // 60 attempts = 60 seconds max

let backendProcess = null;
let frontendProcess = null;

/**
 * Check if a URL is responding
 */
async function checkHealth(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 304) {
        console.log(`✅ ${name} health check PASSED`);
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Wait for service to become healthy
 */
async function waitForHealthy(url, name, maxAttempts = HEALTH_CHECK_MAX_ATTEMPTS) {
  console.log(`⏳ Waiting for ${name} to become healthy...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isHealthy = await checkHealth(url, name);

    if (isHealthy) {
      console.log(`✅ ${name} is ready! (attempt ${attempt}/${maxAttempts})`);
      return true;
    }

    if (attempt % 10 === 0) {
      console.log(`⏳ ${name} not ready yet... (attempt ${attempt}/${maxAttempts})`);
    }

    await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
  }

  console.error(`❌ ${name} failed to become healthy after ${maxAttempts} attempts`);
  return false;
}

/**
 * Start the backend server
 */
async function startBackend() {
  console.log('\n🚀 Starting Backend Server (NestJS on port 3000)...\n');

  return new Promise((resolve, reject) => {
    const backendDir = path.join(__dirname, '../backend');

    backendProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: backendDir,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: BACKEND_PORT.toString(),
        DATABASE_URL: 'postgresql://postgres:x@localhost:5432/taska_test?schema=public',
      },
      shell: true,
      stdio: 'pipe',
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Backend] ${output}`);
      }

      // Check if backend has started successfully
      if (output.includes('Nest application successfully started')) {
        console.log('✅ Backend process started successfully');
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('DeprecationWarning')) {
        console.error(`[Backend ERROR] ${output}`);
      }
    });

    backendProcess.on('error', (error) => {
      console.error(`❌ Backend process error: ${error.message}`);
      reject(error);
    });

    backendProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Backend process exited with code ${code}`);
      }
    });

    // Give backend time to start, then resolve
    setTimeout(() => {
      console.log('⏳ Backend startup wait period complete');
      resolve();
    }, BACKEND_STARTUP_WAIT);
  });
}

/**
 * Start the frontend server
 */
async function startFrontend() {
  console.log('\n🚀 Starting Frontend Server (Next.js on port 3001)...\n');

  return new Promise((resolve, reject) => {
    const frontendDir = path.join(__dirname, '../frontend');

    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: FRONTEND_PORT.toString(),
      },
      shell: true,
      stdio: 'pipe',
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Frontend] ${output}`);
      }

      // Check if frontend has started successfully
      if (output.includes('ready') || output.includes('started server')) {
        console.log('✅ Frontend process started successfully');
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('DeprecationWarning')) {
        console.error(`[Frontend ERROR] ${output}`);
      }
    });

    frontendProcess.on('error', (error) => {
      console.error(`❌ Frontend process error: ${error.message}`);
      reject(error);
    });

    frontendProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Frontend process exited with code ${code}`);
      }
    });

    // Give frontend time to start, then resolve
    setTimeout(() => {
      console.log('⏳ Frontend startup wait period complete');
      resolve();
    }, FRONTEND_STARTUP_WAIT);
  });
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers() {
  const shutdown = (signal) => {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);

    if (backendProcess) {
      console.log('🛑 Stopping backend server...');
      backendProcess.kill('SIGTERM');
    }

    if (frontendProcess) {
      console.log('🛑 Stopping frontend server...');
      frontendProcess.kill('SIGTERM');
    }

    // Force exit after 5 seconds if processes don't terminate
    setTimeout(() => {
      console.log('⚠️  Force exiting...');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('exit', () => {
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Custom Test Server Startup Script                   ║');
  console.log('║   Starting Backend + Frontend for E2E Testing         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  setupShutdownHandlers();

  try {
    // Step 1: Start backend
    await startBackend();

    // Step 2: Wait for backend to be healthy
    const backendHealthy = await waitForHealthy(
      BACKEND_HEALTH_URL,
      'Backend',
      HEALTH_CHECK_MAX_ATTEMPTS
    );

    if (!backendHealthy) {
      console.error('\n❌ Backend failed to start properly');
      console.error('⚠️  Cannot proceed without backend API');
      process.exit(1);
    }

    console.log('\n✅ Backend is ready and healthy!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 3: Start frontend
    await startFrontend();

    // Step 4: Wait for frontend to be healthy
    const frontendHealthy = await waitForHealthy(
      FRONTEND_HEALTH_URL,
      'Frontend',
      HEALTH_CHECK_MAX_ATTEMPTS
    );

    if (!frontendHealthy) {
      console.error('\n❌ Frontend failed to start properly');
      console.error('⚠️  Cannot proceed without frontend');
      process.exit(1);
    }

    console.log('\n✅ Frontend is ready and healthy!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 5: Both servers ready
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          ✅ BOTH SERVERS READY FOR TESTING            ║');
    console.log('║                                                        ║');
    console.log('║  Backend:  http://localhost:3000                       ║');
    console.log('║  Frontend: http://localhost:3001                       ║');
    console.log('║                                                        ║');
    console.log('║  Playwright can now run E2E tests...                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Keep process alive
    // Playwright will terminate this when tests complete
    await new Promise(() => {}); // Infinite wait

  } catch (error) {
    console.error('\n❌ Fatal error during server startup:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
