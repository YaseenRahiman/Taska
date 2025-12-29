const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.e2e-spec.ts'));

let totalFixed = 0;

testFiles.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern 1: Find jobData objects that end with images: [] and don't have isDraft
  const pattern1 = /(const jobData = \{[^}]*images:\s*\[\])\s*\n(\s*)\};/g;
  const newContent1 = content.replace(pattern1, (match, before, indent) => {
    if (!match.includes('isDraft')) {
      modified = true;
      totalFixed++;
      return `${before},\n${indent}  isDraft: false // Publish job immediately for E2E testing\n${indent}};`;
    }
    return match;
  });

  // Pattern 2: Find jobData objects that don't have images array and don't have isDraft
  const pattern2 = /(const jobData = \{[^}]*longitude:\s*[\d.-]+)\s*\n(\s*)\};/g;
  const newContent2 = newContent1.replace(pattern2, (match, before, indent) => {
    if (!match.includes('isDraft') && !match.includes('images')) {
      modified = true;
      totalFixed++;
      return `${before},\n${indent}  isDraft: false // Publish job immediately for E2E testing\n${indent}};`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent2, 'utf8');
    console.log(`✅ Fixed ${file}`);
  }
});

console.log(`\n🎯 Total job data objects fixed: ${totalFixed}`);
