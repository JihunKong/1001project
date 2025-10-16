# Docker Playwright Testing Infrastructure

## Overview
This document describes the containerized E2E testing setup created for the 1001 Stories project using Docker and Playwright.

## Files Created

### 1. Dockerfile.playwright
```dockerfile
# Containerized Playwright testing environment
FROM mcr.microsoft.com/playwright:v1.40.0-focal
# Includes Docker network access and security best practices
```

### 2. docker-compose.playwright.yml
```yaml
# Orchestration for running Playwright tests against Docker application
# Connects to existing 1001-stories-local network
```

### 3. Test Files Created

#### Core Authentication Tests
- `volunteer-docker-magic-link-complete.spec.ts` - Comprehensive magic link flow
- `volunteer-direct-magic-link-test.spec.ts` - Direct magic link testing with log capture
- `volunteer-dashboard-verification.spec.ts` - Dashboard functionality verification
- `simple-dashboard-capture.spec.ts` - Screenshot capture and state analysis
- `final-magic-link-dashboard-test.spec.ts` - End-to-end authentication test

#### Key Features
- **Docker Log Integration**: Captures magic links from Docker container logs
- **Screenshot Capture**: Comprehensive visual documentation
- **Session Management**: Tests authentication state persistence
- **Error Handling**: Graceful handling of timeout and navigation issues
- **API Validation**: Verifies session endpoints and authentication status

## Usage Instructions

### Run Containerized Tests
```bash
# Build and run Playwright container
docker-compose -f docker-compose.playwright.yml up --build

# Run specific test
npx playwright test tests/simple-dashboard-capture.spec.ts --project=chromium
```

### Manual Magic Link Testing
```bash
# 1. Generate magic link via UI or API
curl -X POST http://localhost:8001/api/auth/signin/email \
  -H "Content-Type: application/json" \
  -d '{"email":"volunteer@test.1001stories.org"}'

# 2. Capture magic link from logs
docker-compose logs app --tail=10 | grep "Magic link"

# 3. Test authentication
curl -L "http://localhost:8001/api/auth/callback/email?..."
```

### Screenshot Analysis
All tests generate comprehensive screenshots in `test-results/`:
- Login forms and states
- Authentication success/failure
- Dashboard layouts and functionality
- Error states and diagnostics

## Architecture Benefits

### 1. Network Isolation
- Tests run in isolated Docker environment
- Access to application via `host.docker.internal:8001`
- No interference with host system

### 2. Reproducible Environment
- Consistent browser versions across systems
- Standardized testing environment
- Version-locked Playwright installation

### 3. CI/CD Ready
- Container can be used in GitHub Actions
- Parallel test execution support
- Artifact collection configured

### 4. Security Best Practices
- Non-root user execution
- Minimal container surface area
- Read-only Docker socket access

## Configuration Details

### Environment Variables
```env
HEADLESS=true                    # Headless browser execution
BASE_URL=http://host.docker.internal:8001  # Application URL
CI=false                        # Local development mode
```

### Network Configuration
```yaml
networks:
  1001-stories-local_default:   # Connects to existing app network
    external: true
```

### Volume Mounts
```yaml
volumes:
  - ./test-results:/app/test-results      # Test artifacts
  - ./playwright-report:/app/playwright-report  # HTML reports
```

## Test Result Artifacts

### Generated Files
- `test-results/*.png` - Screenshots at key test points
- `playwright-report/` - HTML test reports
- `test-results/results.json` - Machine-readable test results
- `test-results/VOLUNTEER_MAGIC_LINK_TEST_REPORT.md` - Comprehensive analysis

### Screenshot Categories
1. **Authentication Flow** - Login forms, magic link states
2. **Dashboard Access** - Protected route behavior
3. **Error States** - Application errors and diagnostics
4. **Success States** - Authenticated user interface

## Maintenance Notes

### Regular Tasks
- Update Playwright version in Dockerfile
- Monitor test stability and timing
- Review screenshot diffs for UI changes
- Clean up old test artifacts

### Debugging
```bash
# Run tests with debug output
DEBUG=pw:api npx playwright test

# Access container for debugging
docker-compose -f docker-compose.playwright.yml exec playwright-tests bash

# View test traces
npx playwright show-trace test-results/trace.zip
```

## Integration with Project

This testing infrastructure integrates with:
- Existing `playwright.config.ts` configuration
- Current Docker Compose setup (`docker-compose.yml`)
- Project test patterns and conventions
- CI/CD pipeline requirements

The setup provides a robust foundation for comprehensive E2E testing of the authentication system and can be extended for additional testing scenarios.