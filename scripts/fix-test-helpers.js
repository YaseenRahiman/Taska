const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing test helper wait conditions...\n');

const testHelperPath = path.join(__dirname, '../frontend/tests/e2e/helpers/user-management.helper.ts');

// Read the file
let content = fs.readFileSync(testHelperPath, 'utf8');

// Backup
fs.writeFileSync(testHelperPath + '.backup', content);
console.log('💾 Backup created: user-management.helper.ts.backup\n');

// Fix 1: Add wait after first waitForURL in createUser
const fix1Find = `    await page.waitForURL(/\\/(client|artisan|admin)\\/dashboard|auth\\/login/, { timeout: 30000 });

    // If redirected to login, log in with the new credentials`;

const fix1Replace = `    await page.waitForURL(/\\/(client|artisan|admin)\\/dashboard|auth\\/login/, { timeout: 30000 });

    // Wait for dashboard content to render
    await page.waitForSelector('h1, main, [role="main"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => console.warn('Dashboard content not found, continuing'));

    // If redirected to login, log in with the new credentials`;

if (content.includes(fix1Find)) {
  content = content.replace(fix1Find, fix1Replace);
  console.log('✅ Fix 1 applied: Added dashboard content wait in createUser');
} else {
  console.log('⚠️  Fix 1 not found - may already be applied');
}

// Fix 2: Add wait after second waitForURL in createUser (after login)
const fix2Find = `      // Wait for login redirect with increased timeout
      await page.waitForURL(/\\/(client|artisan|admin)\\/dashboard/, { timeout: 30000 });
    }

    // Wait for dashboard to load`;

const fix2Replace = `      // Wait for login redirect with increased timeout
      await page.waitForURL(/\\/(client|artisan|admin)\\/dashboard/, { timeout: 30000 });

      // Wait for dashboard content to render
      await page.waitForSelector('h1, main, [role="main"]', {
        state: 'visible',
        timeout: 10000
      }).catch(() => console.warn('Dashboard content not found, continuing'));
    }

    // Wait for dashboard to load`;

if (content.includes(fix2Find)) {
  content = content.replace(fix2Find, fix2Replace);
  console.log('✅ Fix 2 applied: Added dashboard content wait after login in createUser');
} else {
  console.log('⚠️  Fix 2 not found - may already be applied');
}

// Fix 3: Add wait in loginWithUser
const fix3Find = `    await page.waitForURL(/\\/(client|artisan|admin)\\/dashboard/, { timeout: 30000 });

    // Wait for dashboard to fully load`;

const fix3Replace = `    await page.waitForURL(/\\/(client|artisan|admin)\\/dashboard/, { timeout: 30000 });

    // Wait for dashboard content to render
    await page.waitForSelector('h1, main, [role="main"]', {
      state: 'visible',
      timeout: 10000
    }).catch(() => console.warn('Dashboard content not found, continuing'));

    // Wait for dashboard to fully load`;

if (content.includes(fix3Find)) {
  content = content.replace(fix3Find, fix3Replace);
  console.log('✅ Fix 3 applied: Added dashboard content wait in loginWithUser');
} else {
  console.log('⚠️  Fix 3 not found - may already be applied');
}

// Write the fixed content
fs.writeFileSync(testHelperPath, content);

console.log('\n✨ Test helper fixes completed!');
console.log('\n📋 Next step: Run tests');
console.log('   cd frontend && npx playwright test\n');
