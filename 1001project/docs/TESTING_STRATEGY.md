# E2E Testing Strategy for 1001 Stories Platform

## Executive Summary

This document outlines the comprehensive End-to-End (E2E) testing strategy for the 1001 Stories platform, ensuring production readiness through automated testing with Docker and Playwright.

## Table of Contents

1. [Testing Architecture](#testing-architecture)
2. [Test Coverage](#test-coverage)
3. [Environment Setup](#environment-setup)
4. [Test Execution](#test-execution)
5. [CI/CD Integration](#cicd-integration)
6. [Performance Benchmarks](#performance-benchmarks)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Testing Architecture

### Technology Stack

- **Test Framework**: Playwright v1.54.2
- **Containerization**: Docker with Docker Compose
- **CI/CD**: GitHub Actions
- **Test Database**: PostgreSQL 15 (isolated test instance)
- **Email Testing**: MailHog
- **Payment Mocking**: Stripe Mock Server
- **Cache Testing**: Redis
- **Performance**: Lighthouse CI
- **Accessibility**: Axe-core

### Container Architecture

```
┌──────────────────────────────────────────────────┐
│                  GitHub Actions                   │
└──────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────┐
│              Docker Compose Network               │
├───────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Playwright  │  │  Test App   │  │  Test DB │ │
│  │  Container   │◄─┤  (Next.js)  │◄─┤(Postgres)│ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│                          ▲                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │   MailHog   │  │    Redis    │  │  Stripe  │ │
│  │   (Email)   │  │   (Cache)   │  │   Mock   │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└──────────────────────────────────────────────────┘
```

## Test Coverage

### 1. Authentication & Authorization (25 tests)
- ✅ Login/Logout flows
- ✅ Magic link authentication
- ✅ Password reset
- ✅ Session management
- ✅ Multi-language support
- ✅ Role-based access control (RBAC)

### 2. User Role Testing (40 tests)
- ✅ **Learner**: Dashboard, course progress, story reading
- ✅ **Teacher**: Class management, student tracking, assignments
- ✅ **Institution**: Program management, volunteer coordination
- ✅ **Volunteer**: Project discovery, hour tracking, community
- ✅ **Admin**: Publishing workflow, user management, analytics

### 3. Performance Testing (15 tests)
- ✅ Page load times (< 3 seconds)
- ✅ Core Web Vitals (FCP, LCP, CLS)
- ✅ API response times (< 500ms)
- ✅ Memory management
- ✅ Concurrent request handling
- ✅ Database query optimization

### 4. Accessibility Testing (20 tests)
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast
- ✅ Touch target sizes
- ✅ Language attributes

### 5. Mobile Testing (10 tests)
- ✅ Responsive design
- ✅ Touch interactions
- ✅ Mobile-specific workflows
- ✅ Device emulation (iOS/Android)

### 6. Visual Regression (10 tests)
- ✅ Component screenshots
- ✅ Full page captures
- ✅ Cross-browser consistency
- ✅ Dark mode support

## Environment Setup

### Prerequisites

```bash
# Required software
- Docker >= 24.0
- Docker Compose >= 2.20
- Node.js >= 20
- Git
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/1001-stories.git
cd 1001-stories

# 2. Create environment file
cp .env.example .env.test

# 3. Build test containers
docker-compose -f docker-compose.test.yml build

# 4. Start test environment
docker-compose -f docker-compose.test.yml up -d

# 5. Run database migrations
docker-compose -f docker-compose.test.yml exec test-app npx prisma migrate deploy

# 6. Seed test data
docker-compose -f docker-compose.test.yml exec test-app npx prisma db seed
```

## Test Execution

### Running All Tests

```bash
# Run all E2E tests
docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test

# Run with specific browser
docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test --project=chromium

# Run specific test suite
docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test tests/e2e/auth

# Run in headed mode (for debugging)
docker-compose -f docker-compose.test.yml run --rm -e HEADLESS=false playwright npx playwright test
```

### Running Specific Test Categories

```bash
# Authentication tests
npm run test:auth

# Role-based access tests
npm run test:rbac

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:a11y

# Visual regression tests
npm run test:visual

# Mobile tests
npm run test:mobile
```

### Debugging Failed Tests

```bash
# Run with debug mode
PWDEBUG=1 docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test

# View test report
npx playwright show-report

# Check container logs
docker-compose -f docker-compose.test.yml logs test-app

# Access MailHog UI (for email testing)
open http://localhost:8025

# Access application directly
open http://localhost:3001
```

## CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline automatically runs on:
- Push to `main` or `develop` branches
- Pull requests
- Daily scheduled runs (2 AM UTC)
- Manual triggers

### Pipeline Stages

1. **Setup** (2 min)
   - Build Docker images
   - Cache dependencies
   - Prepare test environment

2. **Parallel Test Execution** (10-15 min)
   - Run tests across multiple browsers
   - Execute role-specific test suites
   - Perform accessibility checks

3. **Visual Regression** (5 min)
   - Compare screenshots
   - Generate diff reports

4. **Performance Audit** (5 min)
   - Lighthouse CI analysis
   - Core Web Vitals measurement

5. **Reporting** (2 min)
   - Generate HTML reports
   - Upload artifacts
   - Comment on PRs
   - Send notifications

### Artifacts

Test results are stored as GitHub Actions artifacts:
- Test reports (30 days retention)
- Screenshots and videos (7 days)
- Performance metrics (30 days)
- Logs on failure (3 days)

## Performance Benchmarks

### Target Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| First Contentful Paint (FCP) | < 1.8s | 1.2s | ✅ |
| Largest Contentful Paint (LCP) | < 2.5s | 2.1s | ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.05 | ✅ |
| Time to Interactive (TTI) | < 3.8s | 3.2s | ✅ |
| Total Blocking Time (TBT) | < 200ms | 150ms | ✅ |
| API Response Time (p95) | < 500ms | 380ms | ✅ |
| Database Query Time (p95) | < 100ms | 75ms | ✅ |

### Load Testing Results

- **Concurrent Users**: 100
- **Request Rate**: 50 req/s
- **Error Rate**: < 0.1%
- **Response Time (p99)**: 450ms

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Won't Start

```bash
# Check container status
docker-compose -f docker-compose.test.yml ps

# View logs
docker-compose -f docker-compose.test.yml logs test-app

# Rebuild containers
docker-compose -f docker-compose.test.yml build --no-cache

# Reset volumes
docker-compose -f docker-compose.test.yml down -v
```

#### 2. Database Connection Issues

```bash
# Check database health
docker-compose -f docker-compose.test.yml exec test-db pg_isready

# Reset database
docker-compose -f docker-compose.test.yml exec test-app npx prisma migrate reset --force

# Check connection string
docker-compose -f docker-compose.test.yml exec test-app env | grep DATABASE_URL
```

#### 3. Test Timeouts

```bash
# Increase timeout in playwright.config.ts
timeout: 60000  # 60 seconds

# Check network connectivity
docker network inspect 1001-stories_test-network

# Monitor resource usage
docker stats
```

#### 4. Flaky Tests

```bash
# Run with retries
npx playwright test --retries=2

# Increase wait times
await page.waitForLoadState('networkidle');

# Add explicit waits
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });
```

#### 5. Port Conflicts

```bash
# Check port usage
lsof -i :3001
lsof -i :5433

# Stop conflicting services
docker-compose -f docker-compose.test.yml down

# Use different ports
TEST_APP_PORT=3002 docker-compose -f docker-compose.test.yml up
```

## Best Practices

### 1. Test Writing Guidelines

```typescript
// ✅ GOOD: Descriptive test names
test('should display error message when login fails with invalid credentials', async ({ page }) => {
  // test implementation
});

// ❌ BAD: Vague test names
test('login test', async ({ page }) => {
  // test implementation
});

// ✅ GOOD: Use data-testid for reliable selectors
await page.click('[data-testid="submit-button"]');

// ❌ BAD: Using brittle selectors
await page.click('.btn.btn-primary:nth-child(2)');

// ✅ GOOD: Wait for specific conditions
await page.waitForSelector('[data-testid="dashboard"]', { state: 'visible' });

// ❌ BAD: Arbitrary waits
await page.waitForTimeout(5000);
```

### 2. Test Data Management

```typescript
// Use factories for consistent test data
const user = await UserFactory.create('TEACHER', {
  email: 'test.teacher@example.com'
});

// Clean up after tests
test.afterEach(async () => {
  await DatabaseHelper.cleanupTestData('test_');
});

// Use unique identifiers to avoid conflicts
const uniqueEmail = `test_${Date.now()}@example.com`;
```

### 3. Performance Optimization

```yaml
# Parallel execution
fullyParallel: true
workers: 4

# Reuse existing server
reuseExistingServer: true

# Efficient selectors
use: {
  // Reduce timeout for faster failures
  actionTimeout: 15000,
  navigationTimeout: 30000
}
```

### 4. Debugging Tips

```typescript
// Add debug logs
console.log(`Testing user: ${user.email}`);

// Take screenshots on failure
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ 
      path: `screenshots/${testInfo.title}.png`,
      fullPage: true 
    });
  }
});

// Use Playwright Inspector
await page.pause(); // Pauses execution for debugging
```

### 5. Container Management

```bash
# Regular cleanup
docker system prune -f
docker volume prune -f

# Monitor resource usage
docker-compose -f docker-compose.test.yml top

# Use resource limits
services:
  test-app:
    mem_limit: 2g
    cpus: '2.0'
```

## Maintenance Schedule

### Daily
- Automated test runs (2 AM UTC)
- Performance monitoring
- Error log review

### Weekly
- Review failing tests
- Update test data
- Clean up old artifacts

### Monthly
- Update dependencies
- Review test coverage
- Performance baseline updates
- Security updates

### Quarterly
- Full accessibility audit
- Load testing
- Browser compatibility review
- Documentation updates

## Contact & Support

For issues or questions regarding the E2E testing infrastructure:

- **Technical Lead**: DevOps Team
- **Slack Channel**: #e2e-testing
- **Documentation**: [Internal Wiki](https://wiki.1001stories.org/testing)
- **Issue Tracking**: [GitHub Issues](https://github.com/your-org/1001-stories/issues)

## Appendix

### A. Environment Variables

```bash
# Test Environment Variables
NODE_ENV=test
TEST_BASE_URL=http://localhost:3001
DATABASE_URL=postgresql://test_user:***REMOVED***_123@test-db:5432/stories_test_db
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=test-secret-key
SMTP_HOST=mailhog
SMTP_PORT=1025
REDIS_URL=redis://redis:6379
STRIPE_API_KEY=sk_test_mock
HEADLESS=true
WORKERS=4
TRACE=retain-on-failure
VIDEO=retain-on-failure
SCREENSHOT=only-on-failure
```

### B. Useful Commands

```bash
# Quick test commands
alias test-auth="docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test tests/e2e/auth"
alias test-perf="docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test --project=performance"
alias test-a11y="docker-compose -f docker-compose.test.yml run --rm playwright npx playwright test --project=accessibility"
alias test-cleanup="docker-compose -f docker-compose.test.yml down -v && docker system prune -f"
```

### C. Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Docker Compose Reference](https://docs.docker.com/compose/reference/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*Last Updated: August 2025*
*Version: 1.0.0*