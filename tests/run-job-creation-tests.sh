#!/bin/bash

# Job Creation Test Suite Runner
# Runs all job creation tests and generates comprehensive report

echo "🧪 Taska Job Creation Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if servers are running
echo "🔍 Checking if servers are running..."

if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend server not running on port 3001${NC}"
    echo "Please start frontend: cd frontend && npm run dev"
    exit 1
fi

if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend server not running on port 3000${NC}"
    echo "Please start backend: cd backend && npm run start:dev"
    exit 1
fi

echo -e "${GREEN}✅ Servers are running${NC}"
echo ""

# Create output directories
mkdir -p claudedocs/test-reports/detailed
mkdir -p test-results/screenshots

# Test execution
echo "🚀 Running Job Creation Tests..."
echo ""

# Run tests based on argument or run all
if [ "$1" = "direct" ]; then
    echo "📝 Running: Direct Page Flow Test"
    npx playwright test tests/e2e/job-creation-category-fix.spec.ts --project=chromium
elif [ "$1" = "modal" ]; then
    echo "📝 Running: Dashboard Modal Flow Test"
    npx playwright test tests/e2e/job-creation-dashboard-modal.spec.ts --project=chromium
elif [ "$1" = "db" ]; then
    echo "📝 Running: Database Verification Test"
    npx playwright test tests/e2e/job-creation-database-verification.spec.ts --project=chromium
elif [ "$1" = "comprehensive" ]; then
    echo "📝 Running: Comprehensive Test Suite"
    npx playwright test tests/e2e/job-creation-comprehensive.spec.ts --project=chromium
else
    echo "📝 Running: All Job Creation Tests"
    npx playwright test tests/e2e/job-creation-*.spec.ts --project=chromium
fi

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
fi

# Generate report summary
echo "📊 Test Report Summary"
echo "======================"
echo ""

if [ -f "claudedocs/test-reports/results.json" ]; then
    echo "📄 Detailed results: claudedocs/test-reports/results.json"
    echo "📄 JUnit report: claudedocs/test-reports/junit.xml"
    echo "🌐 HTML report: claudedocs/test-reports/html/index.html"
    echo ""

    # Extract stats from results.json
    if command -v jq &> /dev/null; then
        echo "Test Statistics:"
        jq -r '.stats | "  Total: \(.expected + .unexpected + .skipped)\n  Passed: \(.expected)\n  Failed: \(.unexpected)\n  Skipped: \(.skipped)\n  Duration: \(.duration / 1000)s"' claudedocs/test-reports/results.json
    fi
fi

echo ""
echo "📸 Screenshots: test-results/"
echo "📋 Detailed reports: claudedocs/test-reports/detailed/"
echo ""

# Open HTML report if available
if [ -f "claudedocs/test-reports/html/index.html" ]; then
    echo "💡 To view HTML report, run:"
    echo "   npx playwright show-report claudedocs/test-reports/html"
fi

echo ""
echo "✅ Test execution complete!"
