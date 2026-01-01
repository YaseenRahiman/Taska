# Taska Platform Testing Guide - Phase 16: Integration Testing

## Overview

This document provides comprehensive guidance for running and understanding the Taska platform's testing infrastructure, implemented as part of Phase 16: Integration Testing.

## Test Architecture

### Test Types

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - API endpoint and service integration
3. **E2E Tests** - Complete user journey workflows
4. **Load Tests** - Performance and scalability testing
5. **Security Tests** - Vulnerability and security scanning
6. **Cross-Browser Tests** - Multi-browser compatibility

### Test Structure

```
backend/
├── test/                    # E2E and integration tests
│   ├── jest-e2e.json      # E2E Jest configuration
│   ├── setup-e2e.ts       # Test utilities and helpers
│   ├── user-journeys.e2e-spec.ts  # User workflow tests
│   └── api-integration.e2e-spec.ts # API integration tests
├── tests/
│   └── load/               # Load testing
│       ├── k6-test.js      # K6 load test scenarios
│       └── artillery.yml   # Artillery load test config
├── test-runner.js          # Master test orchestrator
└── reports/                # Generated test reports
    ├── integration-test-report.html
    ├── integration-test-report.json
    ├── lighthouse.json
    └── coverage/
```

## Quick Start

### Prerequisites

1. **Database Setup**
   ```bash
   # Ensure PostgreSQL is running
   pg_isready -h localhost -p 5432
   
   # Setup test database
   npm run db:migrate
   npm run db:seed
   ```

2. **Dependencies**
   ```bash
   # Install all dependencies
   npm install
   
   # Install global testing tools (optional)
   npm install -g k6 lighthouse
   ```

### Running Tests

#### Complete Test Suite
```bash
# Run all tests with comprehensive reporting
npm run test:integration

# Run all tests in parallel (faster)
PARALLEL_TESTS=true npm run test:integration

# Skip slow tests (load, cross-browser)
SKIP_SLOW=true npm run test:integration
```

#### Individual Test Types
```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:cov

# E2E tests only
npm run test:e2e

# Load tests only
npm run test:load

# Security tests only
npm run test:security

# Performance tests only
npm run test:performance
```

## Test Scenarios

### User Journey Tests

#### Client Journey
1. **Registration** - New client account creation
2. **Job Posting** - Multi-step job creation with validation
3. **Bid Review** - Viewing and comparing artisan bids
4. **Bid Acceptance** - Selecting and accepting best bid
5. **Payment** - Processing payment through escrow
6. **Job Completion** - Marking job as completed
7. **Review Submission** - Rating and reviewing artisan

#### Artisan Journey
1. **Registration** - New artisan account with specializations
2. **Job Discovery** - Finding available jobs by category/location
3. **Bid Submission** - Creating competitive bids with portfolios
4. **Work Execution** - Managing accepted jobs
5. **Progress Updates** - Communicating with clients
6. **Job Completion** - Delivering finished work
7. **Payment Receipt** - Receiving payment through wallet

#### Admin Journey
1. **Platform Monitoring** - Viewing system health and metrics
2. **User Management** - Moderating users and verifications
3. **Content Moderation** - Reviewing reported content
4. **Dispute Resolution** - Handling conflicts between users
5. **Analytics Review** - Platform performance and usage

### Load Testing Scenarios

#### Load Test Progression
1. **Warm Up** - 10 users for 1 minute
2. **Ramp Up** - 50 users for 2 minutes
3. **Sustained Load** - 100 users for 10 minutes
4. **Spike Test** - 200 users for 5 minutes
5. **High Load** - 500 users for 5 minutes
6. **Peak Load** - 1000 users for 2 minutes
7. **Ramp Down** - Back to 0 users

#### Performance Thresholds
- **95% of requests** under 2 seconds
- **99% of requests** under 5 seconds
- **Error rate** below 5%
- **Custom error rate** below 10%

## Environment Configuration

### Environment Variables

```bash
# Basic Configuration
NODE_ENV=test                    # Environment type
BASE_URL=http://localhost:3000   # Application URL
DATABASE_URL=postgresql://...    # Test database connection

# Test Configuration
PARALLEL_TESTS=false            # Enable parallel test execution
VERBOSE=false                   # Enable verbose logging
SKIP_SLOW=false                 # Skip load and browser tests

# Security Testing
OWASP_ZAP_ENABLED=true         # Enable OWASP ZAP scanning
SECURITY_SCAN_TARGET=localhost  # Security scan target

# Performance Testing
LIGHTHOUSE_ENABLED=true         # Enable Lighthouse audits
PERFORMANCE_THRESHOLD=90        # Minimum performance score
```

### Test Data Management

#### Automatic Test Users
- **Client User** - `client@test.com` / `password123`
- **Artisan User** - `artisan@test.com` / `password123`
- **Admin User** - `admin@test.com` / `admin123`
- **Assessor User** - `assessor@test.com` / `assessor123`

#### Test Categories
- **Plumbing** - ID: 1
- **Electrical** - ID: 2
- **Carpentry** - ID: 3

## Reporting

### HTML Reports

After running tests, comprehensive HTML reports are generated:

```bash
# View latest test report
open reports/integration-test-report.html
```

The HTML report includes:
- **Executive Summary** - Pass/fail counts and overall status
- **Test Results** - Detailed results for each test type
- **Performance Metrics** - Lighthouse scores and timings
- **Coverage Report** - Code coverage percentages
- **Error Details** - Detailed error information for failures

### JSON Reports

Machine-readable reports for CI/CD integration:

```bash
# Access JSON report
cat reports/integration-test-report.json
```

### Coverage Reports

Detailed code coverage analysis:

```bash
# Generate coverage report
npm run test:cov

# View coverage HTML report
open coverage/lcov-report/index.html
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup database
      run: |
        npm run db:migrate
        npm run db:seed
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/taska_test
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/taska_test
        SKIP_SLOW: true
    
    - name: Upload test reports
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-reports
        path: reports/
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset test database
dropdb taska_test && createdb taska_test
npm run db:migrate
```

#### Redis Connection Errors
```bash
# Check Redis is running
redis-cli ping

# Start Redis if not running
redis-server
```

#### Port Conflicts
```bash
# Check what's running on port 3000
lsof -i :3000

# Kill processes if needed
kill -9 $(lsof -ti:3000)
```

## Best Practices

### Test Development

1. **Isolation** - Each test should be independent
2. **Cleanup** - Always clean up test data
3. **Assertions** - Use descriptive assertion messages
4. **Test Data** - Use factories for consistent test data
5. **Mocking** - Mock external services appropriately

### Performance

1. **Parallel Execution** - Use parallel tests for faster feedback
2. **Test Grouping** - Group related tests together
3. **Resource Management** - Properly manage database connections
4. **Caching** - Use test result caching when appropriate

### Security Considerations

1. **Isolated Database** - Use separate test database
2. **Mock Services** - Don't test against production services
3. **Test Data** - Use synthetic test data only
4. **Credentials** - Never use production credentials in tests

This comprehensive testing guide ensures the Taska platform maintains high quality, performance, and security standards through automated testing and continuous integration.
