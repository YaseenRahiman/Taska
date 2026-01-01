import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced Error Reporting Utility
 * Provides comprehensive error capture and debugging information
 */

export interface ErrorContext {
  timestamp: string;
  testName: string;
  url: string;
  pageTitle: string;
  consoleErrors: string[];
  networkErrors: NetworkError[];
  domErrors: string[];
  screenshot?: string;
  htmlSnapshot?: string;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
}

export interface NetworkError {
  url: string;
  method: string;
  status?: number;
  errorText?: string;
  timestamp: string;
}

export class ErrorReporter {
  private static consoleErrors: string[] = [];
  private static networkErrors: NetworkError[] = [];
  private static errorCount = 0;

  /**
   * Initialize error tracking for a page
   */
  static initializeTracking(page: Page): void {
    this.consoleErrors = [];
    this.networkErrors = [];

    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const errorText = msg.text();
        this.consoleErrors.push(errorText);
        console.log(`🔴 Console Error: ${errorText.substring(0, 200)}`);
      }
    });

    // Track console warnings
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        const warnText = msg.text();
        console.log(`⚠️ Console Warning: ${warnText.substring(0, 200)}`);
      }
    });

    // Track network failures
    page.on('requestfailed', request => {
      const error: NetworkError = {
        url: request.url(),
        method: request.method(),
        errorText: request.failure()?.errorText,
        timestamp: new Date().toISOString(),
      };

      this.networkErrors.push(error);
      console.log(`🌐 Network Error: ${request.method()} ${request.url()} - ${error.errorText}`);
    });

    // Track failed responses
    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        const error: NetworkError = {
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          errorText: response.statusText(),
          timestamp: new Date().toISOString(),
        };

        this.networkErrors.push(error);
        console.log(`🌐 HTTP Error: ${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });
  }

  /**
   * Capture comprehensive error context
   */
  static async captureErrorContext(
    page: Page,
    testInfo: TestInfo,
    errorMessage: string
  ): Promise<ErrorContext> {
    const timestamp = new Date().toISOString();
    const screenshotDir = path.join(testInfo.project.outputDir, 'error-screenshots');

    // Ensure directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const context: ErrorContext = {
      timestamp,
      testName: testInfo.title,
      url: page.url(),
      pageTitle: await page.title().catch(() => 'Unknown'),
      consoleErrors: [...this.consoleErrors],
      networkErrors: [...this.networkErrors],
      domErrors: [],
    };

    // Capture screenshot
    try {
      const screenshotPath = path.join(
        screenshotDir,
        `error-${Date.now()}-${testInfo.title.replace(/[^a-z0-9]/gi, '-')}.png`
      );

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      context.screenshot = screenshotPath;
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    } catch (error: any) {
      console.warn(`⚠️ Could not capture screenshot: ${error.message}`);
    }

    // Capture HTML snapshot
    try {
      const htmlPath = path.join(
        screenshotDir,
        `error-${Date.now()}-${testInfo.title.replace(/[^a-z0-9]/gi, '-')}.html`
      );

      const html = await page.content();
      fs.writeFileSync(htmlPath, html, 'utf-8');

      context.htmlSnapshot = htmlPath;
      console.log(`📄 HTML snapshot saved: ${htmlPath}`);
    } catch (error: any) {
      console.warn(`⚠️ Could not capture HTML: ${error.message}`);
    }

    // Capture DOM errors
    try {
      const domErrors = await page.evaluate(() => {
        const errors: string[] = [];
        const errorElements = document.querySelectorAll(
          '[class*="error"], [role="alert"], .invalid-feedback, [aria-invalid="true"]'
        );

        errorElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text) {
            errors.push(text);
          }
        });

        return errors;
      });

      context.domErrors = domErrors;
    } catch (error: any) {
      console.warn(`⚠️ Could not capture DOM errors: ${error.message}`);
    }

    // Capture localStorage
    try {
      context.localStorage = await page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage[key] = localStorage.getItem(key) || '';
          }
        }
        return storage;
      });
    } catch (error: any) {
      console.warn(`⚠️ Could not capture localStorage: ${error.message}`);
    }

    // Capture sessionStorage
    try {
      context.sessionStorage = await page.evaluate(() => {
        const storage: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            storage[key] = sessionStorage.getItem(key) || '';
          }
        }
        return storage;
      });
    } catch (error: any) {
      console.warn(`⚠️ Could not capture sessionStorage: ${error.message}`);
    }

    return context;
  }

  /**
   * Generate detailed error report
   */
  static generateErrorReport(context: ErrorContext, error?: Error): string {
    const lines: string[] = [];

    lines.push('╔═══════════════════════════════════════════════════════════════╗');
    lines.push('║                    TEST FAILURE REPORT                        ║');
    lines.push('╚═══════════════════════════════════════════════════════════════╝');
    lines.push('');

    lines.push(`Test: ${context.testName}`);
    lines.push(`Timestamp: ${context.timestamp}`);
    lines.push(`URL: ${context.url}`);
    lines.push(`Page Title: ${context.pageTitle}`);
    lines.push('');

    if (error) {
      lines.push('═══ ERROR MESSAGE ═══');
      lines.push(error.message);
      if (error.stack) {
        lines.push('');
        lines.push('Stack Trace:');
        lines.push(error.stack);
      }
      lines.push('');
    }

    if (context.consoleErrors.length > 0) {
      lines.push('═══ CONSOLE ERRORS ═══');
      context.consoleErrors.forEach((err, idx) => {
        lines.push(`${idx + 1}. ${err}`);
      });
      lines.push('');
    }

    if (context.networkErrors.length > 0) {
      lines.push('═══ NETWORK ERRORS ═══');
      context.networkErrors.forEach((err, idx) => {
        lines.push(`${idx + 1}. [${err.method}] ${err.url}`);
        lines.push(`   Status: ${err.status || 'N/A'}`);
        lines.push(`   Error: ${err.errorText || 'Unknown'}`);
        lines.push(`   Time: ${err.timestamp}`);
      });
      lines.push('');
    }

    if (context.domErrors.length > 0) {
      lines.push('═══ DOM VALIDATION ERRORS ═══');
      context.domErrors.forEach((err, idx) => {
        lines.push(`${idx + 1}. ${err}`);
      });
      lines.push('');
    }

    if (context.screenshot) {
      lines.push('═══ ARTIFACTS ═══');
      lines.push(`Screenshot: ${context.screenshot}`);
      if (context.htmlSnapshot) {
        lines.push(`HTML Snapshot: ${context.htmlSnapshot}`);
      }
      lines.push('');
    }

    if (context.localStorage) {
      lines.push('═══ LOCAL STORAGE ═══');
      Object.entries(context.localStorage).forEach(([key, value]) => {
        const preview = value.substring(0, 100);
        lines.push(`${key}: ${preview}${value.length > 100 ? '...' : ''}`);
      });
      lines.push('');
    }

    lines.push('═══ DEBUGGING TIPS ═══');
    lines.push('1. Check screenshot for visual state at failure');
    lines.push('2. Review console errors for JavaScript issues');
    lines.push('3. Check network errors for API failures');
    lines.push('4. Review DOM errors for validation failures');
    lines.push('5. Examine localStorage for authentication state');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Save error report to file
   */
  static async saveErrorReport(
    context: ErrorContext,
    testInfo: TestInfo,
    error?: Error
  ): Promise<string> {
    const reportDir = path.join(testInfo.project.outputDir, 'error-reports');

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(
      reportDir,
      `error-${Date.now()}-${testInfo.title.replace(/[^a-z0-9]/gi, '-')}.txt`
    );

    const report = this.generateErrorReport(context, error);

    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`📝 Error report saved: ${reportPath}`);

    return reportPath;
  }

  /**
   * Get error summary
   */
  static getErrorSummary(): {
    consoleErrorCount: number;
    networkErrorCount: number;
    hasErrors: boolean;
  } {
    return {
      consoleErrorCount: this.consoleErrors.length,
      networkErrorCount: this.networkErrors.length,
      hasErrors: this.consoleErrors.length > 0 || this.networkErrors.length > 0,
    };
  }

  /**
   * Clear error tracking
   */
  static clearErrors(): void {
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  /**
   * Log assertion failure with context
   */
  static async logAssertionFailure(
    page: Page,
    testInfo: TestInfo,
    assertion: string,
    expected: any,
    actual: any
  ): Promise<void> {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('❌ ASSERTION FAILED');
    console.log('═══════════════════════════════════════');
    console.log(`Assertion: ${assertion}`);
    console.log(`Expected: ${JSON.stringify(expected, null, 2)}`);
    console.log(`Actual: ${JSON.stringify(actual, null, 2)}`);
    console.log('═══════════════════════════════════════');
    console.log('');

    const context = await this.captureErrorContext(
      page,
      testInfo,
      `Assertion failed: ${assertion}`
    );

    const report = this.generateErrorReport(context);
    console.log(report);

    await this.saveErrorReport(context, testInfo);
  }

  /**
   * Create enhanced error with context
   */
  static async createEnhancedError(
    page: Page,
    testInfo: TestInfo,
    message: string
  ): Promise<Error> {
    const context = await this.captureErrorContext(page, testInfo, message);

    const report = this.generateErrorReport(context);

    await this.saveErrorReport(context, testInfo);

    const error = new Error(message);
    error.stack = `${error.stack}\n\n${report}`;

    return error;
  }

  /**
   * Format error for console output
   */
  static formatErrorForConsole(error: Error | string): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    const lines: string[] = [];

    lines.push('');
    lines.push('┌─────────────────────────────────────────┐');
    lines.push('│           ❌ TEST ERROR                 │');
    lines.push('└─────────────────────────────────────────┘');
    lines.push('');
    lines.push(errorMessage);

    if (stack) {
      lines.push('');
      lines.push('Stack Trace:');
      lines.push(stack);
    }

    lines.push('');

    return lines.join('\n');
  }
}
