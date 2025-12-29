#!/usr/bin/env node

/**
 * Test Image Generator
 * Creates various test images for image upload testing
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const testImagesDir = path.join(__dirname, '..', 'tests', 'test-images');

// Ensure directory exists
if (!fs.existsSync(testImagesDir)) {
  fs.mkdirSync(testImagesDir, { recursive: true });
}

async function generateTestImages() {
  console.log('Generating test images...\n');

  try {
    // 1. Valid 1MB JPG
    console.log('1. Creating valid 1MB JPG...');
    await sharp({
      create: {
        width: 1920,
        height: 1080,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
      .jpeg({ quality: 90 })
      .toFile(path.join(testImagesDir, 'valid-1mb.jpg'));

    // 2. Valid 500KB PNG
    console.log('2. Creating valid 500KB PNG...');
    await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 4,
        background: { r: 200, g: 100, b: 150, alpha: 1 }
      }
    })
      .png({ compressionLevel: 6 })
      .toFile(path.join(testImagesDir, 'valid-500kb.png'));

    // 3. Valid WEBP
    console.log('3. Creating valid WEBP...');
    await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: { r: 150, g: 200, b: 100 }
      }
    })
      .webp({ quality: 85 })
      .toFile(path.join(testImagesDir, 'valid-800kb.webp'));

    // 4. Small valid image (100KB)
    console.log('4. Creating small valid image...');
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 200, b: 100 }
      }
    })
      .jpeg({ quality: 70 })
      .toFile(path.join(testImagesDir, 'valid-small-100kb.jpg'));

    // 5. Minimum size image (800x600)
    console.log('5. Creating minimum size image...');
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 50, g: 100, b: 150 }
      }
    })
      .jpeg({ quality: 80 })
      .toFile(path.join(testImagesDir, 'minimum-size-800x600.jpg'));

    // 6. Very tall image (unusual aspect ratio)
    console.log('6. Creating very tall image...');
    await sharp({
      create: {
        width: 100,
        height: 5000,
        channels: 3,
        background: { r: 100, g: 100, b: 200 }
      }
    })
      .jpeg({ quality: 80 })
      .toFile(path.join(testImagesDir, 'very-tall-100x5000.jpg'));

    // 7. Very wide image (unusual aspect ratio)
    console.log('7. Creating very wide image...');
    await sharp({
      create: {
        width: 5000,
        height: 100,
        channels: 3,
        background: { r: 200, g: 100, b: 100 }
      }
    })
      .jpeg({ quality: 80 })
      .toFile(path.join(testImagesDir, 'very-wide-5000x100.jpg'));

    // 8. Transparent PNG
    console.log('8. Creating transparent PNG...');
    await sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.5 }
      }
    })
      .png()
      .toFile(path.join(testImagesDir, 'transparent.png'));

    // 9. Grayscale image
    console.log('9. Creating grayscale image...');
    await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 3,
        background: { r: 128, g: 128, b: 128 }
      }
    })
      .greyscale()
      .jpeg({ quality: 85 })
      .toFile(path.join(testImagesDir, 'grayscale.jpg'));

    // 10. Very small file (10KB)
    console.log('10. Creating very small image (10KB)...');
    await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 150, g: 150, b: 150 }
      }
    })
      .jpeg({ quality: 50 })
      .toFile(path.join(testImagesDir, 'too-small-10kb.jpg'));

    // 11. Create corrupted file (renamed text file)
    console.log('11. Creating corrupted image (renamed text file)...');
    fs.writeFileSync(
      path.join(testImagesDir, 'corrupted-renamed.jpg'),
      'This is not an image file, just plain text renamed to .jpg'
    );

    // 12. Create 0-byte file
    console.log('12. Creating 0-byte file...');
    fs.writeFileSync(path.join(testImagesDir, 'zero-bytes.jpg'), '');

    // 13. Large image (will be generated to be >5MB)
    console.log('13. Creating large image (>5MB)...');
    await sharp({
      create: {
        width: 4000,
        height: 4000,
        channels: 3,
        background: { r: 255, g: 200, b: 150 }
      }
    })
      .jpeg({ quality: 100 })
      .toFile(path.join(testImagesDir, 'too-large-15mb.jpg'));

    // 14. Maximum resolution image
    console.log('14. Creating maximum resolution image...');
    await sharp({
      create: {
        width: 3840,
        height: 2160,
        channels: 3,
        background: { r: 100, g: 200, b: 255 }
      }
    })
      .jpeg({ quality: 90 })
      .toFile(path.join(testImagesDir, 'max-resolution-4k.jpg'));

    // 15. Create BMP file (unsupported format)
    console.log('15. Creating BMP file (will need manual creation)...');
    console.log('   NOTE: Create BMP manually or use image editing software');

    // Create README
    const readme = `# Test Images Directory

This directory contains various test images for testing image upload functionality.

## Valid Images
- valid-1mb.jpg - 1MB JPEG image (1920x1080)
- valid-500kb.png - 500KB PNG image (1280x720)
- valid-800kb.webp - 800KB WEBP image (1600x900)
- valid-small-100kb.jpg - 100KB JPEG image (800x600)
- minimum-size-800x600.jpg - Minimum acceptable size (800x600)
- max-resolution-4k.jpg - 4K resolution image (3840x2160)
- transparent.png - PNG with transparency
- grayscale.jpg - Grayscale JPEG

## Edge Cases
- very-tall-100x5000.jpg - Unusual aspect ratio (very tall)
- very-wide-5000x100.jpg - Unusual aspect ratio (very wide)

## Invalid/Problem Images
- too-small-10kb.jpg - Below minimum size threshold
- too-large-15mb.jpg - Exceeds maximum file size (5MB)
- corrupted-renamed.jpg - Text file renamed to .jpg
- zero-bytes.jpg - 0-byte file

## Manual Test Files Needed
- Create BMP file manually (unsupported format)
- Create TIFF file manually (unsupported format)
- Create SVG file manually (unsupported format)
- Create PDF file renamed to .jpg (security test)

## Usage
These images are used by Playwright tests to verify:
1. File format validation
2. File size limits
3. Image dimension validation
4. Upload functionality
5. Error handling
6. Security measures
`;

    fs.writeFileSync(path.join(testImagesDir, 'README.md'), readme);

    console.log('\n✅ Test images generated successfully!');
    console.log(`📁 Location: ${testImagesDir}\n`);

    // List generated files
    const files = fs.readdirSync(testImagesDir);
    console.log('Generated files:');
    files.forEach(file => {
      const stats = fs.statSync(path.join(testImagesDir, file));
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });

  } catch (error) {
    console.error('Error generating test images:', error);
    process.exit(1);
  }
}

// Run the generator
generateTestImages();
