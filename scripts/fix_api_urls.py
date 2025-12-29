#!/usr/bin/env python3
"""Fix Android API Base URLs - Add /api/v1/ prefix"""

import shutil
import re

gradle_file = r"C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\taska-android\app\build.gradle.kts"
backup_file = gradle_file + ".backup"

print("Fixing Android API Base URLs...")
print(f"File: {gradle_file}")

# Create backup
print("Creating backup...")
shutil.copy2(gradle_file, backup_file)
print(f"Backup created: {backup_file}")

# Read file
print("Reading file...")
with open(gradle_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Apply fixes
print("Applying fixes...")
original_content = content

# Fix all https://api.taska.co.za URLs
content = content.replace(
    '"https://api.taska.co.za"',
    '"https://api.taska.co.za/api/v1/"'
)

# Fix all http://10.0.2.2:3000 URLs (debug/local)
content = content.replace(
    '"http://10.0.2.2:3000"',
    '"http://10.0.2.2:3000/api/v1/"'
)

# Write changes
if content != original_content:
    print("Writing changes...")
    with open(gradle_file, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
    print("SUCCESS: All API URLs fixed!")
    print("")
    print("Changes made:")
    print("   Line 27: https://api.taska.co.za -> https://api.taska.co.za/api/v1/")
    print("   Line 41: https://api.taska.co.za -> https://api.taska.co.za/api/v1/")
    print("   Line 46: http://10.0.2.2:3000 -> http://10.0.2.2:3000/api/v1/ (CRITICAL)")
    print("")
    print("Next steps:")
    print("   1. cd taska-android")
    print("   2. gradlew.bat clean assembleDebug")
    print("   3. Install and test registration")
else:
    print("No changes needed - URLs already correct!")
