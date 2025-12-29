const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Setting up test database...\n');

const DATABASE_URL = 'postgresql://postgres:x@localhost:5432/taska_test?schema=public';

try {
  console.log('📦 Pushing schema to test database...');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit'
  });
  
  console.log('\n✅ Test database setup complete!');
} catch (error) {
  console.error('\n❌ Failed to setup test database:', error.message);
  process.exit(1);
}
