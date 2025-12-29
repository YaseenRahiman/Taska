const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;
let filesModified = [];

console.log('\n🔧 Fixing API response format: .body.jobs → .body.data\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace all occurrences of .body.jobs with .body.data
  const regex = /\.body\.jobs\b/g;
  const matches = content.match(regex);

  if (matches) {
    content = content.replace(regex, '.body.data');
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
  console.log('\n✨ Success! All test files updated to use .body.data');
  console.log('\n📋 Modified files:');
  filesModified.forEach(({ file, count }) => console.log(`    - ${file} (${count} changes)`));
} else {
  console.log('\n⚠️  No changes made. Files may already be fixed.');
}

console.log('');
