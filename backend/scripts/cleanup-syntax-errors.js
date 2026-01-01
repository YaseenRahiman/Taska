const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

console.log('\n🔧 Cleaning up syntax errors from isDraft script...\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Remove duplicate consecutive lines
  const lines = content.split('\n');
  const cleanedLines = [];
  let prevLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip if this line is identical to previous (duplicate)
    if (line === prevLine && (trimmed.startsWith('longitude:') || trimmed.startsWith('latitude:'))) {
      console.log(`  Removing duplicate in ${fileName}: ${trimmed}`);
      continue;
    }

    cleanedLines.push(line);
    prevLine = line;
  }

  const newContent = cleanedLines.join('\n');

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✅ ${fileName} - Cleaned up duplicates`);
  }
});

console.log('\n✨ Cleanup complete!\n');
