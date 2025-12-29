const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;
let filesModified = [];

console.log('\n🔧 Starting automated job status fix...\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;
  let addedCount = 0;

  // Find all jobData object definitions and add isDraft if missing
  // Pattern: const jobData = { ... }; where it ends with various fields

  // Split by lines to process more reliably
  const lines = content.split('\n');
  const newLines = [];
  let inJobData = false;
  let jobDataIndent = '';
  let lastLineBeforeClosing = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect start of jobData object
    if (trimmed.match(/const\s+jobData\s*=\s*\{/)) {
      inJobData = true;
      jobDataIndent = line.match(/^(\s*)/)[1];
      lastLineBeforeClosing = -1;
    }

    // Detect end of jobData object
    if (inJobData && trimmed === '};') {
      // Check if we already have isDraft
      const hasIsDraft = lines.slice(Math.max(0, lastLineBeforeClosing - 10), i)
        .some(l => l.includes('isDraft'));

      if (!hasIsDraft && lastLineBeforeClosing >= 0) {
        // Add isDraft before the closing brace
        newLines.push(lines[lastLineBeforeClosing]);
        newLines.push(`${jobDataIndent}  isDraft: false // Publish job immediately for E2E testing`);
        newLines.push(line);
        modified = true;
        addedCount++;
        inJobData = false;

        // Skip the lastLineBeforeClosing since we already added it
        i++;
        continue;
      }
      inJobData = false;
    }

    // Track last non-empty line before closing
    if (inJobData && trimmed && trimmed !== '};' && !trimmed.startsWith('//')) {
      lastLineBeforeClosing = newLines.length;
    }

    newLines.push(line);
  }

  if (modified) {
    const newContent = newLines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    totalFixed += addedCount;
    filesModified.push(fileName);
    console.log(`  ✅ ${fileName} - Added isDraft to ${addedCount} job data object(s)`);
  }
});

console.log('\n📊 Summary:');
console.log(`  Files modified: ${filesModified.length}`);
console.log(`  Total job data objects fixed: ${totalFixed}`);

if (totalFixed > 0) {
  console.log('\n✨ Success! All test files have been updated.');
  console.log('\n📋 Modified files:');
  filesModified.forEach(f => console.log(`    - ${f}`));
} else {
  console.log('\n⚠️  No changes made. Files may already be fixed.');
}

console.log('');
