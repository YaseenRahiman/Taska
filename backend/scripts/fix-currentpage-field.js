const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;
let filesModified = [];

console.log('\n🔧 Fixing pagination field: .currentPage → .page\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Replace .currentPage with .page (in pagination context)
  const regex = /\.meta\.currentPage\b/g;
  const matches = content.match(regex);

  if (matches) {
    content = content.replace(regex, '.meta.page');
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
  console.log('\n✨ Success! Field references updated to .page');
  console.log('\n📋 Modified files:');
  filesModified.forEach(({ file, count }) => console.log(`    - ${file} (${count} changes)`));
} else {
  console.log('\n⚠️  No changes made. Files may already be fixed.');
}

console.log('');
