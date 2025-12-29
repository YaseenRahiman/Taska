# SSL Issue Quick Fix Guide

## Problem
Build fails with: `peer not authenticated` when downloading dependencies from Maven Central.

## Quick Diagnosis
Run this to test if it's a network issue:
```bash
curl -I https://repo.maven.apache.org/maven2/
```

If this fails with SSL errors, it confirms the network issue.

---

## Fix 1: Corporate Proxy (Most Common)

### Step 1: Get proxy details from IT
You need:
- Proxy host (e.g., `proxy.company.com`)
- Proxy port (e.g., `8080`)
- Your username and password (if required)

### Step 2: Update `gradle.properties`
Add these lines:
```properties
systemProp.http.proxyHost=proxy.company.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=proxy.company.com
systemProp.https.proxyPort=8080

# If authentication required
systemProp.http.proxyUser=your-username
systemProp.http.proxyPassword=your-password
systemProp.https.proxyUser=your-username
systemProp.https.proxyPassword=your-password

# Skip proxy for local
systemProp.http.nonProxyHosts=localhost|127.0.0.1
```

### Step 3: Rebuild
```bash
./gradlew.bat clean assembleDebug
```

---

## Fix 2: Try Different Network

### Option A: Mobile Hotspot
1. Enable mobile hotspot on your phone
2. Connect laptop to hotspot
3. Run build again

### Option B: Home Network
1. Take laptop home
2. Connect to home WiFi
3. Run build again

**Why this works:** Corporate networks often have SSL inspection. Personal networks typically don't.

---

## Fix 3: Disable Antivirus SSL Scanning

### Windows Defender
1. Open Windows Security
2. Virus & threat protection → Manage settings
3. Add exclusion for:
   - `C:\Users\Yaseen\.gradle\`
   - `C:\Users\Yaseen\OneDrive\Documents\Investments\Taska\taska-android\`

### Other Antivirus (Kaspersky, Norton, etc.)
1. Open antivirus settings
2. Find "SSL scanning" or "HTTPS scanning"
3. Add Gradle and Java to exceptions

---

## Fix 4: Import Corporate Certificate

### Step 1: Export certificate from browser
1. Open Chrome/Edge
2. Go to: https://repo.maven.apache.org/maven2/
3. Click padlock → Certificate → Details
4. Export as `maven-cert.cer`

### Step 2: Import to Java
```bash
# Find Java location
where java

# Import certificate (requires admin)
keytool -import -trustcacerts \
  -keystore "C:\Program Files\Microsoft\jdk-11.0.12.7-hotspot\lib\security\cacerts" \
  -storepass changeit \
  -alias maven-central \
  -file maven-cert.cer
```

---

## Fix 5: Temporary SSL Bypass (DEV ONLY!)

⚠️ **WARNING:** Only for local development testing!

Edit `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8 \
  -Djavax.net.ssl.trustAll=true \
  -Djavax.net.ssl.trustAllHosts=true
```

**DO NOT use this for production builds!**

---

## Fix 6: Use Gradle Offline Mode

### If you have dependencies cached elsewhere:

1. Copy `.gradle/caches` from another working machine
2. Copy to: `C:\Users\Yaseen\.gradle\caches`
3. Build with offline mode:
```bash
./gradlew.bat assembleDebug --offline
```

---

## Verify Fix Worked

After applying any fix, test with:
```bash
# Stop Gradle daemon
./gradlew.bat --stop

# Clean rebuild
./gradlew.bat clean assembleDebug
```

Look for:
- ✅ **Success:** `BUILD SUCCESSFUL`
- ❌ **Still failing:** Try next fix

---

## Still Not Working?

### Check Java SSL Configuration
```bash
java -Djavax.net.debug=ssl:handshake -version
```

### Check Network Connectivity
```bash
# Test Maven Central
curl -v https://repo.maven.apache.org/maven2/

# Test Google Maven
curl -v https://dl.google.com/dl/android/maven2/
```

### Get Detailed Gradle Logs
```bash
./gradlew.bat assembleDebug --debug > gradle-debug.log 2>&1
```

Then search `gradle-debug.log` for:
- `peer not authenticated`
- `SSL`
- `certificate`
- `proxy`

---

## Most Likely Solution

**90% of the time:** It's a corporate proxy/firewall issue.

**Quick Test:**
1. Try building from mobile hotspot
2. If it works → Apply Fix 1 (corporate proxy settings)
3. If still fails → Contact IT department

---

## Need More Help?

**Create GitHub issue with:**
1. Full error output from `./gradlew.bat assembleDebug --stacktrace`
2. Network environment (corporate/home/public)
3. Java version: `java -version`
4. Gradle version: `./gradlew.bat --version`
5. Output from: `curl -v https://repo.maven.apache.org/maven2/`
