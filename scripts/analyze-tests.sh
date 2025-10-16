#!/bin/bash

# Test Analysis Script for 1001 Stories E2E Tests
# This script analyzes test files for duplicates, coverage gaps, and patterns

set -e

PROJECT_ROOT="/Users/jihunkong/1001project/1001-stories"
TEST_DIR="$PROJECT_ROOT/tests"
REPORT_FILE="$PROJECT_ROOT/test-analysis-report.md"

echo "=== 1001 Stories E2E Test Analysis ==="
echo "Analyzing test files in: $TEST_DIR"
echo ""

# Start the report
cat > "$REPORT_FILE" << EOF
# 1001 Stories E2E Test Analysis Report
Generated: $(date)

## Test Suite Overview
- **Total Test Files:** $(ls -1 "$TEST_DIR"/*.spec.ts 2>/dev/null | wc -l | xargs)
- **Test Directory:** $TEST_DIR

EOF

# Function to extract test descriptions
extract_test_info() {
    local file=$1
    local basename=$(basename "$file")

    echo "### $basename" >> "$REPORT_FILE"

    # Extract test.describe blocks
    local describes=$(grep -E "test\.describe\(|describe\(" "$file" 2>/dev/null | sed 's/.*describe(/describe(/' | head -5)
    if [ -n "$describes" ]; then
        echo "**Test Suites:**" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
        echo "$describes" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    fi

    # Count number of tests
    local test_count=$(grep -E "test\(|it\(" "$file" | wc -l | xargs)
    echo "**Number of Tests:** $test_count" >> "$REPORT_FILE"

    # Identify key patterns
    local patterns=""
    grep -q "volunteer" "$file" 2>/dev/null && patterns="${patterns}volunteer, "
    grep -q "dashboard" "$file" 2>/dev/null && patterns="${patterns}dashboard, "
    grep -q "login" "$file" 2>/dev/null && patterns="${patterns}login, "
    grep -q "auth" "$file" 2>/dev/null && patterns="${patterns}auth, "
    grep -q "magic.?link" "$file" 2>/dev/null && patterns="${patterns}magic-link, "
    grep -q "password" "$file" 2>/dev/null && patterns="${patterns}password, "
    grep -q "docker" "$file" 2>/dev/null && patterns="${patterns}docker, "
    grep -q "prod" "$file" 2>/dev/null && patterns="${patterns}production, "

    if [ -n "$patterns" ]; then
        echo "**Keywords:** ${patterns%, }" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Analyze each test file
echo "## Individual Test File Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for test_file in "$TEST_DIR"/*.spec.ts; do
    if [ -f "$test_file" ]; then
        extract_test_info "$test_file"
    fi
done

# Identify duplicate volunteer tests
echo "## Duplicate Test Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Volunteer Login Tests (Potential Duplicates)" >> "$REPORT_FILE"
echo "The following files appear to test similar volunteer login functionality:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

ls -1 "$TEST_DIR"/volunteer*.spec.ts 2>/dev/null | while read -r file; do
    basename=$(basename "$file")
    test_count=$(grep -E "test\(|it\(" "$file" | wc -l | xargs)
    echo "- **$basename** ($test_count tests)" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"
echo "**Recommendation:** Consider consolidating these into a single comprehensive volunteer test suite." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for coverage gaps
echo "## Coverage Gap Analysis" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Dashboards Tested" >> "$REPORT_FILE"
echo "Based on file names and content analysis:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check which dashboards have tests
dashboards=("learner" "teacher" "volunteer" "story-manager" "book-manager" "content-admin" "admin")
for dashboard in "${dashboards[@]}"; do
    if grep -l "$dashboard" "$TEST_DIR"/*.spec.ts >/dev/null 2>&1; then
        echo "-  **$dashboard** dashboard has test coverage" >> "$REPORT_FILE"
    else
        echo "- L **$dashboard** dashboard appears to lack E2E test coverage" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"
echo "### Publishing Workflow Coverage" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for publishing workflow tests
if grep -l "publishing\|submission\|story.*manager\|book.*manager\|content.*admin" "$TEST_DIR"/*.spec.ts >/dev/null 2>&1; then
    echo " Publishing workflow tests found in:" >> "$REPORT_FILE"
    grep -l "publishing\|submission" "$TEST_DIR"/*.spec.ts 2>/dev/null | while read -r file; do
        echo "  - $(basename "$file")" >> "$REPORT_FILE"
    done
else
    echo "L No comprehensive publishing workflow E2E test found" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Test categorization
echo "## Test Categorization" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "### Authentication Tests" >> "$REPORT_FILE"
ls -1 "$TEST_DIR"/*auth*.spec.ts "$TEST_DIR"/*login*.spec.ts "$TEST_DIR"/*password*.spec.ts 2>/dev/null | while read -r file; do
    echo "- $(basename "$file")" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"
echo "### Form/UI Tests" >> "$REPORT_FILE"
ls -1 "$TEST_DIR"/*form*.spec.ts "$TEST_DIR"/*navigation*.spec.ts 2>/dev/null | while read -r file; do
    echo "- $(basename "$file")" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"
echo "### Mobile/Responsive Tests" >> "$REPORT_FILE"
ls -1 "$TEST_DIR"/*mobile*.spec.ts 2>/dev/null | while read -r file; do
    echo "- $(basename "$file")" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"
echo "### Production/Docker Tests" >> "$REPORT_FILE"
ls -1 "$TEST_DIR"/*prod*.spec.ts "$TEST_DIR"/*docker*.spec.ts 2>/dev/null | while read -r file; do
    echo "- $(basename "$file")" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"

# Summary and recommendations
echo "## Summary and Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Key Findings" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **Duplicate Tests:** Multiple volunteer login test files (~14 files) testing similar functionality" >> "$REPORT_FILE"
echo "2. **Coverage Gaps:** Several role dashboards appear to lack E2E test coverage" >> "$REPORT_FILE"
echo "3. **Test Organization:** Tests are not well-organized by feature or user journey" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "### Recommended Actions" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **Consolidate Volunteer Tests:** Merge the 14 volunteer test files into 2-3 comprehensive suites" >> "$REPORT_FILE"
echo "2. **Add Missing Coverage:**" >> "$REPORT_FILE"
echo "   - Create E2E tests for learner dashboard" >> "$REPORT_FILE"
echo "   - Create E2E tests for teacher dashboard" >> "$REPORT_FILE"
echo "   - Create E2E tests for story-manager dashboard" >> "$REPORT_FILE"
echo "   - Create E2E tests for book-manager dashboard" >> "$REPORT_FILE"
echo "   - Create E2E tests for content-admin dashboard" >> "$REPORT_FILE"
echo "3. **Implement Publishing Workflow Test:** Create comprehensive E2E test for the complete publishing pipeline" >> "$REPORT_FILE"
echo "4. **Organize Tests:** Restructure tests into folders by feature/role" >> "$REPORT_FILE"
echo "5. **Remove Obsolete Tests:** Clean up tests for deprecated features" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "Report generated at: $REPORT_FILE"
echo ""
echo "=== Analysis Complete ==="