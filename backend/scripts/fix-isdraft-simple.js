const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;
let filesModified = [];

console.log('\n🔧 Adding isDraft: false to all test job data...\n');

testFiles.forEach(fileName => {
  const filePath = path.join(testDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Pattern: Find lines that end job data objects (have trailing properties before };)
  // and don't already have isDraft

  // Match various common endings and add isDraft before the closing };
  const patterns = [
    // Ending with requirements: []
    {
      regex: /(requirements:\s*\[\])\s*\n(\s+)\};/g,
      replace: '$1,\n$2  isDraft: false // Publish job immediately for E2E testing\n$2};'
    },
    // Ending with images: []
    {
      regex: /(images:\s*\[\])\s*\n(\s+)\};/g,
      replace: '$1,\n$2  isDraft: false // Publish job immediately for E2E testing\n$2};'
    },
    // Ending with startDate
    {
      regex: /(startDate:\s*new Date[^,\n]+)\s*\n(\s+)\};/g,
      replace: '$1,\n$2  isDraft: false // Publish job immediately for E2E testing\n$2};'
    },
    // Ending with longitude (no images or requirements after)
    {
      regex: /(longitude:\s*[\d.-]+)\s*\n(\s+)\};/g,
      replace: '$1,\n$2  isDraft: false // Publish job immediately for E2E testing\n$2};'
    }
  ];

  let addedCount = 0;

  patterns.forEach(({ regex, replace }) => {
    // Count matches before replacement
    const beforeMatches = (content.match(regex) || []).length;

    // Only replace if the block doesn't already have isDraft
    const tempContent = content.replace(regex, (match) => {
      // Check if this specific match already has isDraft somewhere in it
      if (match.includes('isDraft')) {
        return match; // Don't modify
      }
      addedCount++;
      return match.replace(regex, replace);
    });

    content = tempContent;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed += addedCount;
    filesModified.push(fileName);
    console.log(`  ✅ ${fileName} - Added isDraft: false`);
  }
});

console.log('\n📊 Summary:');
console.log(`  Files modified: ${filesModified.length}`);
console.log(`  Estimated fixes: ${totalFixed}`);

if (filesModified.length > 0) {
  console.log('\n✨ Success! Test files updated.');
  console.log('\n📋 Modified files:');
  filesModified.forEach(f => console.log(`    - ${f}`));
} else {
  console.log('\n⚠️  No changes made. Files may already have isDraft.');
}

console.log('');
