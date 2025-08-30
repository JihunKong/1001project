# Admin Upload Functionality Testing Guide

This guide explains how to test the admin dashboard upload functionality for both book and product uploads in the 1001 Stories application.

## Overview

The test suite covers:

1. **Book Upload Functionality** (`/admin/library/upload`)
   - Form rendering and accessibility
   - File type and size validation
   - Required field validation
   - CSRF protection
   - Advanced options display
   - Success/error handling

2. **Product Upload Functionality** (`/admin/shop/products/new`)
   - Product form rendering
   - Multiple image upload with drag-and-drop
   - Category selection
   - Creator information validation
   - Impact metrics validation
   - Image removal functionality

## Test Files Structure

```
tests/
├── admin-upload-functionality.spec.ts    # Main UI/functional tests
├── admin-upload-integration.spec.ts      # API integration tests
├── utils/
│   └── admin-upload-helpers.ts           # Test helper functions
└── fixtures/
    └── uploads/
        ├── sample-book.pdf               # Valid PDF for testing
        ├── sample-product.png            # Valid images for testing
        ├── sample-product-2.png
        ├── sample-product-3.png
        └── invalid-file.txt              # Invalid file for validation tests
```

## Quick Start

### 1. Basic Test Run

```bash
# Run all upload tests
./scripts/run-upload-tests.sh

# Run with visible browser (headed mode)
./scripts/run-upload-tests.sh --headed

# Run specific browser
./scripts/run-upload-tests.sh --browser firefox
```

### 2. Using Playwright Directly

```bash
# Run upload tests only
npx playwright test --config=playwright.config.upload.ts

# Run with UI mode for debugging
npx playwright test --config=playwright.config.upload.ts --ui

# Run specific test
npx playwright test tests/admin-upload-functionality.spec.ts
```

### 3. Docker Testing

```bash
# Run tests in isolated Docker environment
./scripts/run-upload-tests.sh --docker

# With parallel execution
./scripts/run-upload-tests.sh --docker --parallel
```

## Test Categories

### Authentication & Access Control
- ✅ Redirects to login when not authenticated
- ✅ Allows admin access after authentication
- ✅ Rejects non-admin users

### Book Upload Form Tests
- ✅ Renders all required form elements
- ✅ Validates required fields (title, author, summary)
- ✅ Validates PDF file types and sizes
- ✅ Shows advanced options without cover files
- ✅ CSRF protection verification
- ✅ Accessibility compliance
- ✅ Success/error message handling

### Product Upload Form Tests
- ✅ Renders complete product form
- ✅ Validates all required fields
- ✅ Supports drag-and-drop image uploads
- ✅ Limits to maximum 5 images
- ✅ Image removal functionality
- ✅ Category selection validation
- ✅ Price and impact value validation
- ✅ Creator information requirements

### API Integration Tests
- ✅ Book upload API endpoint testing
- ✅ Product upload API endpoint testing
- ✅ File signature validation
- ✅ File size limits enforcement
- ✅ Authentication and authorization
- ✅ CSRF token validation

### Cross-browser & Mobile
- ✅ Chrome, Firefox, Safari compatibility
- ✅ Mobile responsive design testing
- ✅ Touch interaction support

## Running Specific Test Scenarios

### Debug a Failing Test
```bash
# Run in debug mode with visible browser
./scripts/run-upload-tests.sh --debug --test "book upload"

# Or use Playwright debug mode
npx playwright test tests/admin-upload-functionality.spec.ts --debug
```

### Test File Validation
```bash
# Run only validation tests
npx playwright test --grep "validation"

# Test specific file type validation
npx playwright test --grep "file type"
```

### Test Mobile Experience
```bash
# Run mobile-specific tests
./scripts/run-upload-tests.sh --browser mobile-chrome-upload
```

### Performance Testing
```bash
# Run with performance monitoring
npx playwright test --project=performance tests/admin-upload-*.spec.ts
```

## Expected Test Results

### Successful Upload Flow
1. User navigates to upload page → **Form renders correctly**
2. User fills required fields → **No validation errors**
3. User uploads valid file → **File accepted and displayed**
4. User submits form → **Success message shown**
5. Form resets → **Ready for next upload**

### Validation Error Flow
1. User submits empty form → **Required field errors shown**
2. User uploads invalid file → **File type error displayed**
3. User corrects errors → **Error messages disappear**
4. User submits valid data → **Upload succeeds**

## Troubleshooting

### Common Issues

1. **Tests fail with "Application not ready"**
   ```bash
   # Ensure your dev server is running
   npm run dev
   
   # Or let the test script start it automatically
   ./scripts/run-upload-tests.sh
   ```

2. **File upload tests fail**
   ```bash
   # Check if test fixtures exist
   ls tests/fixtures/uploads/
   
   # Verify file permissions
   chmod 644 tests/fixtures/uploads/*
   ```

3. **Authentication tests fail**
   ```bash
   # Check if admin user exists in test database
   # The tests use mock authentication for simplicity
   ```

4. **CSRF protection tests fail**
   ```bash
   # Verify CSRF implementation is active
   # Check lib/csrf-context.tsx usage in forms
   ```

### Getting Help

1. **View test reports**: Open `playwright-report-upload/index.html`
2. **Check screenshots**: Look in `test-results/screenshots/`
3. **Review videos**: Check `test-results/upload-videos/` for failure recordings
4. **Enable debug mode**: Use `--debug` flag for step-by-step execution

## Test Configuration

### Environment Variables
```bash
# Required for testing
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_pass@localhost:5433/test_db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret

# Optional for enhanced testing
UPLOAD_TEST_MODE=true
SKIP_ENV_VALIDATION=true
```

### Custom Configuration
Edit `playwright.config.upload.ts` to:
- Change test timeouts
- Modify browser settings
- Adjust screenshot/video capture
- Set different base URLs

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Admin Upload Tests
on: [push, pull_request]

jobs:
  upload-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run upload tests
        run: ./scripts/run-upload-tests.sh --docker
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: upload-test-results
          path: |
            playwright-report-upload/
            test-results/
```

## Best Practices

1. **Run tests before deployment** to ensure upload functionality works
2. **Test with realistic file sizes** to validate performance
3. **Check mobile experience** as many admins use tablets
4. **Verify accessibility** for users with different abilities
5. **Test error scenarios** to ensure graceful failure handling
6. **Monitor test execution time** and optimize slow tests

## Adding New Tests

To add new test scenarios:

1. **Extend existing test files**:
   ```typescript
   test('should handle new upload scenario', async ({ page }) => {
     const adminHelper = new AdminUploadHelper(page);
     await adminHelper.loginAsAdmin();
     // Your test logic here
   });
   ```

2. **Add new helper methods**:
   ```typescript
   // In tests/utils/admin-upload-helpers.ts
   async testNewFeature(): Promise<void> {
     // Helper implementation
   }
   ```

3. **Create new test fixtures**:
   ```bash
   # Add files to tests/fixtures/uploads/
   cp new-test-file.pdf tests/fixtures/uploads/
   ```

This comprehensive test suite ensures the admin upload functionality is robust, accessible, and works consistently across different browsers and devices.