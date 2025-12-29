const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test', 'artisan-edge-cases.e2e-spec.ts');
let content = fs.readFileSync(filePath, 'utf8');
const originalContent = content;

console.log('\n🔧 Adding isDraft: false to artisan-edge-cases.e2e-spec.ts job data...\n');

// Pattern: Job data objects ending with longitude (no trailing comma, closing with })
const pattern = /(longitude:\s*[\d.-]+)\s*\n(\s+)\}/g;

let addedCount = 0;
content = content.replace(pattern, (match, longitude, indent) => {
  // Check if this block already has isDraft
  const contextStart = Math.max(0, content.indexOf(match) - 500);
  const context = content.substring(contextStart, content.indexOf(match) + match.length);

  if (context.includes('isDraft')) {
    return match; // Already has isDraft
  }

  addedCount++;
  return `${longitude},\n${indent}  isDraft: false // Publish job immediately for E2E testing\n${indent}}`;
});

if (content !== originalContent) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✅ artisan-edge-cases.e2e-spec.ts - Added isDraft: false to ${addedCount} job(s)`);
  console.log('\n✨ Success! All job data objects updated.');
} else {
  console.log('  ⚠️  No changes needed - all jobs already have isDraft.');
}

console.log('');
