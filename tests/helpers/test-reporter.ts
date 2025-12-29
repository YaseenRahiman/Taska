import { TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Reporter Helper
 * Captures and exports test results for analysis
 */

export interface TestResults {
  testId: string;
  title: string;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';
  duration: number;
  errors: any[];
  attachments: any[];
  timestamp: string;
  stdout?: string[];
  stderr?: string[];
  screenshots?: string[];
}

/**
 * Capture test results and write to JSON file
 */
export async function captureTestResults(testInfo: TestInfo): Promise<TestResults> {
  const results: TestResults = {
    testId: testInfo.testId,
    title: testInfo.title,
    status: testInfo.status as any,
    duration: testInfo.duration,
    errors: testInfo.errors.map(e => ({
      message: e.message,
      stack: e.stack,
      value: e.value,
    })),
    attachments: testInfo.attachments.map(a => ({
      name: a.name,
      contentType: a.contentType,
      path: a.path,
    })),
    timestamp: new Date().toISOString(),
  };

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'claudedocs', 'test-reports', 'detailed');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write results to file
  const filename = `${testInfo.testId}-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);

  await fs.promises.writeFile(
    filepath,
    JSON.stringify(results, null, 2)
  );

  return results;
}

/**
 * Generate comprehensive test report
 */
export function generateTestReport(results: TestResults): string {
  const separator = '='.repeat(80);

  let report = `\n${separator}\n`;
  report += `📊 TEST EXECUTION REPORT\n`;
  report += `${separator}\n`;
  report += `Test: ${results.title}\n`;
  report += `Status: ${results.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}\n`;
  report += `Duration: ${(results.duration / 1000).toFixed(2)}s\n`;
  report += `Timestamp: ${results.timestamp}\n`;
  report += `Test ID: ${results.testId}\n`;

  if (results.errors.length > 0) {
    report += `\n❌ ERRORS (${results.errors.length}):\n`;
    results.errors.forEach((error, i) => {
      report += `\n  Error ${i + 1}:\n`;
      report += `  ${error.message}\n`;
      if (error.stack) {
        report += `  Stack: ${error.stack.substring(0, 200)}...\n`;
      }
    });
  }

  if (results.attachments.length > 0) {
    report += `\n📎 ATTACHMENTS (${results.attachments.length}):\n`;
    results.attachments.forEach(att => {
      report += `  - ${att.name} (${att.contentType})\n`;
      if (att.path) {
        report += `    Path: ${att.path}\n`;
      }
    });
  }

  report += `\n${separator}\n`;

  return report;
}

/**
 * Log test step with emoji indicator
 */
export function logStep(stepNumber: number, description: string, status: 'start' | 'complete' | 'error' = 'start') {
  const emoji = status === 'complete' ? '✅' : status === 'error' ? '❌' : '🔄';
  console.log(`${emoji} Step ${stepNumber}: ${description}`);
}

/**
 * Capture screenshot with descriptive name
 */
export async function captureScreenshot(
  page: any,
  name: string,
  options?: { fullPage?: boolean; path?: string }
): Promise<string> {
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filename = `${timestamp}-${name}.png`;
  const filepath = options?.path || path.join(screenshotDir, filename);

  await page.screenshot({
    path: filepath,
    fullPage: options?.fullPage ?? true,
  });

  console.log(`📸 Screenshot saved: ${filename}`);

  return filepath;
}

/**
 * Wait with logging
 */
export async function waitWithLog(ms: number, reason?: string) {
  if (reason) {
    console.log(`⏳ Waiting ${ms}ms: ${reason}`);
  } else {
    console.log(`⏳ Waiting ${ms}ms`);
  }
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract test statistics from results.json
 */
export async function extractTestStatistics(): Promise<any> {
  const resultsPath = path.join(
    process.cwd(),
    'claudedocs',
    'test-reports',
    'results.json'
  );

  if (!fs.existsSync(resultsPath)) {
    return null;
  }

  const content = await fs.promises.readFile(resultsPath, 'utf-8');
  const results = JSON.parse(content);

  return {
    stats: results.stats,
    tests: results.suites.flatMap((suite: any) =>
      suite.suites.flatMap((subsuite: any) =>
        subsuite.specs.map((spec: any) => ({
          title: spec.title,
          status: spec.tests[0]?.status,
          duration: spec.tests[0]?.results[0]?.duration,
        }))
      )
    ),
  };
}
