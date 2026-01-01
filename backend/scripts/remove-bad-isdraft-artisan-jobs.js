const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test', 'artisan-jobs-flow.e2e-spec.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('\n🔧 Removing all isDraft lines added by script from artisan-jobs-flow...\n');

// Remove all lines containing "isDraft: false // Publish job immediately"
const lines = content.split('\n');
const cleanedLines = lines.filter(line =>
  !line.includes('isDraft: false // Publish job immediately')
);

const newContent = cleanedLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log('  ✅ Removed all isDraft lines');
console.log('\n✨ File restored\n');
