const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;
let filesModified = [];

console.log('\n🔧 Fixing bid expiry field: expiryDate → expiresAt\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace expiryDate: with expiresAt:
  const regex = /\bexpiryDate:/g;
  const matches = content.match(regex);

  if (matches) {
    content = content.replace(regex, 'expiresAt:');
    const fixCount = matches.length;

    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed += fixCount;
    filesModified.push({ file: fileName, count: fixCount });
    console.log(`  ✅ ${fileName} - Fixed ${fixCount} occurrence(s)`);
  }
});

console.log('\n📊 Summary:');
console.log(`  Files modified: ${filesModified.length}`);
console.log(`  Total replacements: ${totalFixed}`);

if (totalFixed > 0) {
  console.log('\n✨ Success! All expiryDate fields renamed to expiresAt');
  console.log('\n📋 Modified files:');
  filesModified.forEach(({ file, count }) => console.log(`    - ${file} (${count} changes)`));
} else {
  console.log('\n⚠️  No changes made.');
}

console.log('');
