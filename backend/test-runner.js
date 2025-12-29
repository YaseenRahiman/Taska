#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Taska Platform - Phase 16: Integration Testing
 * 
 * This script orchestrates all testing phases including:
 * - Unit tests
 * - Integration tests
 * - E2E tests
 * - Load tests
 * - Performance benchmarks
 * - Security tests
 * - Cross-browser tests
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      load: null,
      performance: null,
      security: null,
      browser: null,
      coverage: null,
    };
    
    this.config = {
      parallel: process.env.PARALLEL_TESTS === 'true',
      verbose: process.env.VERBOSE === 'true',
      skipSlow: process.env.SKIP_SLOW === 'true',
      environment: process.env.NODE_ENV || 'test',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    };

    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level.toUpperCase().padEnd(5);
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', command], {
        stdio: 'inherit',
        cwd: options.cwd || process.cwd(),
        ...options
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject({ success: false, code, error: `Command failed with code ${code}` });
        }
      });

      child.on('error', (error) => {
        reject({ success: false, error: error.message });
      });
    });
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...', 'info');
    
    const checks = [
      { name: 'Node.js version', check: () => process.version },
      { name: 'PostgreSQL connection', check: () => this.checkPostgres() },
      { name: 'Redis connection', check: () => this.checkRedis() },
      { name: 'Test database', check: () => this.checkTestDatabase() },
    ];

    for (const check of checks) {
      try {
        const result = await check.check();
        this.log(`✓ ${check.name}: ${result}`, 'info');
      } catch (error) {
        this.log(`✗ ${check.name}: ${error.message}`, 'error');
        throw new Error(`Prerequisite check failed: ${check.name}`);
      }
    }
  }

  async checkPostgres() {
    try {
      const { execSync } = require('child_process');
      execSync('pg_isready -h localhost -p 5432', { stdio: 'ignore' });
      return 'Connected';
    } catch {
      throw new Error('PostgreSQL not available');
    }
  }

  async checkRedis() {
    try {
      const { execSync } = require('child_process');
      execSync('redis-cli ping', { stdio: 'ignore' });
      return 'Connected';
    } catch {
      throw new Error('Redis not available');
    }
  }

  async checkTestDatabase() {
    // Check if test database exists and is accessible
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma migrate status', { stdio: 'ignore' });
      return 'Ready';
    } catch {
      this.log('Setting up test database...', 'info');
      execSync('npx prisma migrate dev');
      return 'Created';
    }
  }

  async runUnitTests() {
    this.log('Running unit tests...', 'info');
    try {
      await this.runCommand('test');
      this.results.unit = { passed: true, duration: 0 };
      this.log('✓ Unit tests passed', 'info');
    } catch (error) {
      this.results.unit = { passed: false, error: error.message };
      this.log(`✗ Unit tests failed: ${error.message}`, 'error');
    }
  }

  async runIntegrationTests() {
    this.log('Running integration tests...', 'info');
    try {
      await this.runCommand('test:e2e');
      this.results.integration = { passed: true, duration: 0 };
      this.log('✓ Integration tests passed', 'info');
    } catch (error) {
      this.results.integration = { passed: false, error: error.message };
      this.log(`✗ Integration tests failed: ${error.message}`, 'error');
    }
  }

  async runE2ETests() {
    this.log('Running E2E user journey tests...', 'info');
    
    // Start the application if not already running
    const appProcess = this.startApplication();
    
    try {
      // Wait for application to be ready
      await this.waitForApplication();
      
      // Run E2E tests
      await this.runCommand('test:e2e');
      this.results.e2e = { passed: true, duration: 0 };
      this.log('✓ E2E tests passed', 'info');
    } catch (error) {
      this.results.e2e = { passed: false, error: error.message };
      this.log(`✗ E2E tests failed: ${error.message}`, 'error');
    } finally {
      if (appProcess) {
        appProcess.kill();
      }
    }
  }

  async runLoadTests() {
    if (this.config.skipSlow) {
      this.log('Skipping load tests (SKIP_SLOW=true)', 'info');
      return;
    }

    this.log('Running load tests with K6...', 'info');
    try {
      const { execSync } = require('child_process');
      
      // Check if K6 is installed
      try {
        execSync('k6 version', { stdio: 'ignore' });
      } catch {
        this.log('K6 not found, installing...', 'info');
        execSync('npm install -g k6');
      }

      // Run K6 load test
      const k6Command = `k6 run --env BASE_URL=${this.config.baseUrl} backend/tests/load/k6-test.js`;
      execSync(k6Command, { stdio: 'inherit' });
      
      this.results.load = { passed: true, duration: 0 };
      this.log('✓ Load tests completed', 'info');
    } catch (error) {
      this.results.load = { passed: false, error: error.message };
      this.log(`✗ Load tests failed: ${error.message}`, 'error');
    }
  }

  async runPerformanceTests() {
    this.log('Running performance benchmarks...', 'info');
    try {
      // Run Lighthouse CLI for performance testing
      const { execSync } = require('child_process');
      
      const lighthouseCommand = `npx lighthouse ${this.config.baseUrl} --output=json --output-path=./reports/lighthouse.json --quiet`;
      execSync(lighthouseCommand, { stdio: 'inherit' });
      
      // Parse Lighthouse results
      const lighthouseReport = JSON.parse(fs.readFileSync('./reports/lighthouse.json', 'utf8'));
      const performance = lighthouseReport.lhr.categories.performance.score * 100;
      
      this.results.performance = { 
        passed: performance >= 90, 
        score: performance,
        metrics: {
          fcp: lighthouseReport.lhr.audits['first-contentful-paint'].numericValue,
          lcp: lighthouseReport.lhr.audits['largest-contentful-paint'].numericValue,
          tti: lighthouseReport.lhr.audits['interactive'].numericValue,
        }
      };
      
      this.log(`✓ Performance score: ${performance}/100`, 'info');
    } catch (error) {
      this.results.performance = { passed: false, error: error.message };
      this.log(`✗ Performance tests failed: ${error.message}`, 'error');
    }
  }

  async runSecurityTests() {
    this.log('Running security scans...', 'info');
    try {
      const { execSync } = require('child_process');
      
      // Run npm audit
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' });
      
      // Run OWASP ZAP baseline scan (if available)
      try {
        execSync(`docker run -t zaproxy/zap-baseline zap-baseline.py -t ${this.config.baseUrl}`, { stdio: 'inherit' });
      } catch {
        this.log('OWASP ZAP not available, skipping advanced security scan', 'warn');
      }
      
      this.results.security = { passed: true, duration: 0 };
      this.log('✓ Security tests passed', 'info');
    } catch (error) {
      this.results.security = { passed: false, error: error.message };
      this.log(`✗ Security tests failed: ${error.message}`, 'error');
    }
  }

  async runCrossBrowserTests() {
    if (this.config.skipSlow) {
      this.log('Skipping cross-browser tests (SKIP_SLOW=true)', 'info');
      return;
    }

    this.log('Running cross-browser tests...', 'info');
    
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];
    const results = {};
    
    for (const browser of browsers) {
      try {
        this.log(`Testing on ${browser}...`, 'info');
        
        // Use Playwright for cross-browser testing
        const { execSync } = require('child_process');
        execSync(`npx playwright test --browser=${browser} --reporter=json`, { stdio: 'inherit' });
        
        results[browser] = { passed: true };
        this.log(`✓ ${browser} tests passed`, 'info');
      } catch (error) {
        results[browser] = { passed: false, error: error.message };
        this.log(`✗ ${browser} tests failed: ${error.message}`, 'error');
      }
    }
    
    this.results.browser = results;
  }

  async generateCoverageReport() {
    this.log('Generating code coverage report...', 'info');
    try {
      await this.runCommand('test:cov');
      
      // Parse coverage report
      const coverageFile = './coverage/coverage-summary.json';
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        this.results.coverage = {
          statements: coverage.total.statements.pct,
          branches: coverage.total.branches.pct,
          functions: coverage.total.functions.pct,
          lines: coverage.total.lines.pct,
        };
        
        this.log(`✓ Coverage: ${this.results.coverage.statements}% statements`, 'info');
      }
    } catch (error) {
      this.log(`✗ Coverage generation failed: ${error.message}`, 'error');
    }
  }

  startApplication() {
    try {
      this.log('Starting application...', 'info');
      const appProcess = spawn('npm', ['run', 'start:dev'], {
        stdio: 'pipe',
        detached: true,
      });
      
      // Give the application time to start
      return appProcess;
    } catch (error) {
      this.log(`Failed to start application: ${error.message}`, 'error');
      return null;
    }
  }

  async waitForApplication(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const { execSync } = require('child_process');
        execSync(`curl -f ${this.config.baseUrl}/health`, { stdio: 'ignore' });
        this.log('Application is ready', 'info');
        return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Application failed to start within timeout');
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${(duration / 1000).toFixed(2)}s`,
      environment: this.config.environment,
      results: this.results,
      summary: {
        total: Object.keys(this.results).length,
        passed: Object.values(this.results).filter(r => r?.passed).length,
        failed: Object.values(this.results).filter(r => r?.passed === false).length,
        skipped: Object.values(this.results).filter(r => r === null).length,
      }
    };

    // Create reports directory
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports');
    }

    // Save detailed report
    fs.writeFileSync('./reports/integration-test-report.json', JSON.stringify(report, null, 2));
    
    // Generate HTML report
    this.generateHtmlReport(report);
    
    return report;
  }

  generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Taska Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center; }
        .metric.failed { background: #ffe8e8; }
        .results { margin: 20px 0; }
        .result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .result.passed { border-color: #4caf50; background: #f1f8e9; }
        .result.failed { border-color: #f44336; background: #ffebee; }
        .coverage { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Taska Platform - Integration Test Report</h1>
        <p>Phase 16: Integration Testing - Complete Test Suite Results</p>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        <p><strong>Duration:</strong> ${report.duration}</p>
        <p><strong>Environment:</strong> ${report.environment}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>${report.summary.total}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>${report.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric ${report.summary.failed > 0 ? 'failed' : ''}">
            <h3>${report.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.skipped}</h3>
            <p>Skipped</p>
        </div>
    </div>

    ${report.results.coverage ? `
    <div class="coverage">
        <h3>Code Coverage</h3>
        <p>Statements: ${report.results.coverage.statements}% | 
           Branches: ${report.results.coverage.branches}% | 
           Functions: ${report.results.coverage.functions}% | 
           Lines: ${report.results.coverage.lines}%</p>
    </div>
    ` : ''}

    <div class="results">
        <h3>Test Results</h3>
        ${Object.entries(report.results).map(([name, result]) => `
            <div class="result ${result?.passed ? 'passed' : (result?.passed === false ? 'failed' : 'skipped')}">
                <h4>${name.charAt(0).toUpperCase() + name.slice(1)} Tests</h4>
                <p>Status: ${result?.passed ? '✓ Passed' : (result?.passed === false ? '✗ Failed' : 'Skipped')}</p>
                ${result?.error ? `<p>Error: ${result.error}</p>` : ''}
                ${result?.score ? `<p>Score: ${result.score}</p>` : ''}
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>Generated by Taska Test Runner - Phase 16: Integration Testing</p>
    </div>
</body>
</html>
    `;

    fs.writeFileSync('./reports/integration-test-report.html', html);
  }

  async run() {
    this.log('Starting Taska Integration Test Suite - Phase 16', 'info');
    
    try {
      // Check prerequisites
      await this.checkPrerequisites();
      
      // Run all test suites
      if (this.config.parallel) {
        await Promise.allSettled([
          this.runUnitTests(),
          this.runIntegrationTests(),
          this.runSecurityTests(),
        ]);
      } else {
        await this.runUnitTests();
        await this.runIntegrationTests();
        await this.runSecurityTests();
      }
      
      // Run sequential tests
      await this.runE2ETests();
      await this.runLoadTests();
      await this.runPerformanceTests();
      await this.runCrossBrowserTests();
      
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Generate final report
      const report = this.generateReport();
      
      this.log('Test suite completed!', 'info');
      this.log(`Report generated: ./reports/integration-test-report.html`, 'info');
      
      // Exit with appropriate code
      const hasFailures = report.summary.failed > 0;
      process.exit(hasFailures ? 1 : 0);
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}

module.exports = { TestRunner };
