#!/bin/bash

# Exit on any error
set -e

echo "🔍 1001 Stories - Volunteer Submit Page Diagnostic Test"
echo "========================================================="
echo ""

# Create results directories
echo "📁 Creating test results directories..."
mkdir -p test-results playwright-report screenshots videos

# Clean previous results
echo "🧹 Cleaning previous test results..."
rm -rf test-results/* playwright-report/* screenshots/* videos/*

# Build Docker image
echo ""
echo "🐳 Building Docker image for Playwright..."
docker-compose -f docker-compose.playwright-test.yml build

# Run the test
echo ""
echo "🚀 Running diagnostic test..."
echo "Target URL: https://1001stories.seedsofempowerment.org/dashboard/volunteer/submit-text"
echo ""

# Run the test and capture output
docker-compose -f docker-compose.playwright-test.yml up --abort-on-container-exit

# Copy artifacts from container if needed
echo ""
echo "📦 Test artifacts location:"
echo "   - Screenshots: ./screenshots/"
echo "   - Videos: ./videos/"
echo "   - HTML Report: ./playwright-report/index.html"
echo "   - Test Results: ./test-results/"

# Clean up
echo ""
echo "🧹 Cleaning up Docker containers..."
docker-compose -f docker-compose.playwright-test.yml down

echo ""
echo "✅ Diagnostic test complete!"
echo ""
echo "📊 View detailed results:"
echo "   - Console output above shows all diagnostic information"
echo "   - Open ./playwright-report/index.html for HTML report"
echo "   - Check ./screenshots/ for visual captures"
echo ""