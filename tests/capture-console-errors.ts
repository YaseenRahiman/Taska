import { chromium } from 'playwright';

async function captureConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors: any[] = [];
  const warnings: any[] = [];
  const logs: any[] = [];

  // Capture console messages
  page.on('console', msg => {
    const entry = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    };

    if (msg.type() === 'error') {
      errors.push(entry);
      console.log('\x1b[31m%s\x1b[0m', `❌ ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(entry);
      console.log('\x1b[33m%s\x1b[0m', `⚠️ WARNING: ${msg.text()}`);
    } else {
      logs.push(entry);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    const errorEntry = {
      type: 'pageerror',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    errors.push(errorEntry);
    console.log('\x1b[31m%s\x1b[0m', `❌ PAGE ERROR: ${error.message}`);
    console.log(error.stack);
  });

  try {
    console.log('🚀 Navigating to login page...');
    await page.goto('http://localhost:3001/auth/login', { waitUntil: 'networkidle' });

    console.log('📝 Logging in...');
    await page.fill('input[type="email"]', 'Grahiman02@gmail.com');
    await page.fill('input[type="password"]', 'R4h1m@n!Y2025');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForURL('**/client/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait a bit more for any async operations
    await page.waitForTimeout(3000);

    console.log('\n📊 CONSOLE ERRORS REPORT');
    console.log('='.repeat(80));

    if (errors.length > 0) {
      console.log('\n🔴 ERRORS FOUND:', errors.length);
      errors.forEach((err, idx) => {
        console.log(`\n--- Error ${idx + 1} ---`);
        console.log('Type:', err.type);
        console.log('Message:', err.text || err.message);
        if (err.location) {
          console.log('Location:', `${err.location.url}:${err.location.lineNumber}:${err.location.columnNumber}`);
        }
        if (err.stack) {
          console.log('Stack:', err.stack);
        }
      });
    } else {
      console.log('\n✅ No errors found!');
    }

    if (warnings.length > 0) {
      console.log('\n\n🟡 WARNINGS FOUND:', warnings.length);
      warnings.forEach((warn, idx) => {
        console.log(`\n--- Warning ${idx + 1} ---`);
        console.log('Message:', warn.text);
        if (warn.location) {
          console.log('Location:', `${warn.location.url}:${warn.location.lineNumber}:${warn.location.columnNumber}`);
        }
      });
    }

    console.log('\n\n📋 INFO LOGS:', logs.length);

    // Take screenshot
    await page.screenshot({ path: 'tests/dashboard-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: tests/dashboard-screenshot.png');

    // Keep browser open for manual inspection
    console.log('\n⏸️ Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Script error:', error);
  } finally {
    await browser.close();
  }

  return { errors, warnings, logs };
}

captureConsoleErrors().then(result => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
