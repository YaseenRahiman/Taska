const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;
let filesModified = [];

console.log('\n🔧 Comprehensive isDraft fix for all test files...\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  const lines = content.split('\n');
  const newLines = [];
  let addedCount = 0;
  let inJobBlock = false;
  let jobBlockHasIsDraft = false;
  let jobBlockStart = -1;
  let jobBlockIndent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect start of job data block - look for title field with job-like content
    if ((trimmed.match(/title:\s*['"`].*['"`],?/) &&
         (trimmed.toLowerCase().includes('job') ||
          trimmed.toLowerCase().includes('test') ||
          trimmed.toLowerCase().includes('fix') ||
          trimmed.toLowerCase().includes('install'))) ||
        (trimmed.match(/title:\s*`.*\$\{.*\}`/))) { // Template literals
      inJobBlock = true;
      jobBlockHasIsDraft = false;
      jobBlockStart = i;
      jobBlockIndent = line.match(/^(\s*)/)[1];
    }

    // Check if this job block has isDraft
    if (inJobBlock && trimmed.includes('isDraft')) {
      jobBlockHasIsDraft = true;
    }

    // Detect end of job block
    if (inJobBlock && trimmed === '}' && i > jobBlockStart) {
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      // Check if this is end of a job object (followed by ), ; or similar)
      if (nextLine.startsWith(')') ||
          nextLine.startsWith(';') ||
          nextLine.includes('push(') ||
          nextLine.includes('await') ||
          nextLine === '' ||
          nextLine.startsWith('const ') ||
          nextLine.startsWith('expect(')) {

        if (!jobBlockHasIsDraft) {
          // Add isDraft before closing brace
          const prevLine = newLines[newLines.length - 1];
          const indent = line.match(/^(\s*)/)[1];

          // Ensure previous line has a comma
          if (prevLine && !prevLine.trim().endsWith(',') && !prevLine.trim().endsWith('{')) {
            newLines[newLines.length - 1] = prevLine + ',';
          }

          newLines.push(`${indent}  isDraft: false // Publish job immediately for E2E testing`);
          newLines.push(line);
          addedCount++;
          i++; // Skip current line
          inJobBlock = false;
          continue;
        }
        inJobBlock = false;
      }
    }

    newLines.push(line);
  }

  const newContent = newLines.join('\n');

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    totalFixed += addedCount;
    filesModified.push({ file: fileName, count: addedCount });
    console.log(`  ✅ ${fileName} - Added ${addedCount} isDraft field(s)`);
  }
});

console.log('\n📊 Summary:');
console.log(`  Files modified: ${filesModified.length}`);
console.log(`  Total isDraft additions: ${totalFixed}`);

if (totalFixed > 0) {
  console.log('\n✨ Success! All test job data updated.');
  console.log('\n📋 Modified files:');
  filesModified.forEach(({ file, count }) => console.log(`    - ${file} (${count} additions)`));
} else {
  console.log('\n⚠️  No changes needed.');
}

console.log('');
