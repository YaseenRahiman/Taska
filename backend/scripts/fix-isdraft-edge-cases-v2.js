const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test', 'artisan-edge-cases.e2e-spec.ts');
let content = fs.readFileSync(filePath, 'utf8');
const originalContent = content;

console.log('\n🔧 Adding isDraft: false to artisan-edge-cases.e2e-spec.ts job data...\n');

// Split into lines for more precise matching
const lines = content.split('\n');
const newLines = [];
let addedCount = 0;
let inJobBlock = false;
let jobBlockHasIsDraft = false;
let jobBlockStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Detect start of job data block (title field is a good indicator)
  if (trimmed.match(/title:\s*['"`].*Test.*['"`],?/) && !trimmed.includes('//')) {
    inJobBlock = true;
    jobBlockHasIsDraft = false;
    jobBlockStart = i;
  }

  // Check if this job block has isDraft
  if (inJobBlock && trimmed.includes('isDraft:')) {
    jobBlockHasIsDraft = true;
  }

  // Detect end of job block (closing brace with closing paren on next line or semicolon)
  if (inJobBlock && trimmed === '}' && i > jobBlockStart) {
    // Look ahead to see if this is the end of a job object
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    if (nextLine.startsWith(')') || nextLine.startsWith(';') || nextLine.includes('jobs.push')) {
      // This is the end of a job block
      if (!jobBlockHasIsDraft) {
        // Add isDraft before the closing brace
        const prevLine = lines[i - 1];
        const indent = line.match(/^(\s*)/)[1];
        newLines.push(prevLine.endsWith(',') ? prevLine : prevLine + ',');
        newLines.push(`${indent}  isDraft: false // Publish job immediately for E2E testing`);
        newLines.push(line);
        addedCount++;
        i++; // Skip current line since we already added it
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
  console.log(`  ✅ artisan-edge-cases.e2e-spec.ts - Added isDraft: false to ${addedCount} job(s)`);
  console.log('\n✨ Success! All job data objects updated.');
} else {
  console.log('  ⚠️  No changes needed - all jobs already have isDraft.');
}

console.log('');
