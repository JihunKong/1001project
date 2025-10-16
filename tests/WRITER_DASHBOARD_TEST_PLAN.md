# Writer Dashboard Docker Testing Strategy
## 1001 Stories - Comprehensive Testing Plan

---

## 1. Docker Environment Setup

### Prerequisites Check
```bash
# 1.1 Check Docker Desktop status on macOS
docker --version
docker compose version
docker ps

# 1.2 Start Docker Desktop if not running
open -a Docker

# 1.3 Wait for Docker to be ready (30 seconds)
while ! docker system info > /dev/null 2>&1; do
  echo "Waiting for Docker to start..."
  sleep 2
done
echo "Docker is ready!"
```

### Clean Environment Setup
```bash
# 1.4 Stop any existing containers
cd /Users/jihunkong/1001project/1001-stories
docker-compose -f docker-compose.local.yml down -v

# 1.5 Remove old containers and volumes
docker container prune -f
docker volume prune -f
docker image prune -f

# 1.6 Clear old build cache
docker builder prune -f

# 1.7 Remove local artifacts
rm -rf .next node_modules/.cache
rm -rf test-results playwright-report
```

### Build Fresh Containers
```bash
# 1.8 Build with no cache for clean state
docker-compose -f docker-compose.local.yml build --no-cache

# 1.9 Start services
docker-compose -f docker-compose.local.yml up -d

# 1.10 Monitor startup logs
docker-compose -f docker-compose.local.yml logs -f app &
LOGS_PID=$!
sleep 30
kill $LOGS_PID
```

### Health Check Verification
```bash
# 1.11 Check all services are healthy
docker-compose -f docker-compose.local.yml ps

# 1.12 Verify application health endpoint
curl -f http://localhost:8001/api/health || echo "Health check failed!"

# 1.13 Check database connection
docker exec 1001-stories-app-local npx prisma db push

# 1.14 Verify Redis connection
docker exec 1001-stories-redis-local redis-cli --pass 5DlvWlSxaxHNQbrHawza9EnhCDYMIfvIc55kkGpb1SM= ping
```

---

## 2. Visual Testing Strategy

### Component Verification Checklist

#### Desktop View (1920x1080)
- [ ] WriterLNB sidebar visibility and positioning
- [ ] GlobalNavigationBar header with user menu
- [ ] All 9 Figma components rendering correctly
- [ ] Proper spacing and alignment
- [ ] Color scheme consistency
- [ ] Typography hierarchy
- [ ] Icon visibility and quality
- [ ] Hover states working
- [ ] Active state indicators

#### Tablet View (768x1024)
- [ ] LNB transforms to collapsible menu
- [ ] GlobalNavigationBar responsive adjustments
- [ ] Content reflow without overlap
- [ ] Touch-friendly button sizes
- [ ] Readable text sizes

#### Mobile View (375x667)
- [ ] LNB hidden, bottom navigation visible
- [ ] GlobalNavigationBar mobile menu
- [ ] Vertical stacking of components
- [ ] Smooth scrolling
- [ ] No horizontal overflow
- [ ] Touch targets minimum 44x44px

### Manual Visual Testing Commands
```bash
# 2.1 Open in Chrome Desktop
open http://localhost:8001/dashboard/writer

# 2.2 Chrome DevTools Responsive Testing
# Press Cmd+Option+I → Toggle device toolbar
# Test these viewports:
# - iPhone SE (375x667)
# - iPad (768x1024)
# - Desktop (1920x1080)

# 2.3 Take screenshots for comparison
mkdir -p /Users/jihunkong/1001project/1001-stories/test-screenshots
docker exec 1001-stories-app-local npx playwright screenshot \
  http://localhost:8001/dashboard/writer \
  test-screenshots/writer-desktop.png \
  --viewport-size=1920,1080

docker exec 1001-stories-app-local npx playwright screenshot \
  http://localhost:8001/dashboard/writer \
  test-screenshots/writer-mobile.png \
  --viewport-size=375,667
```

---

## 3. Functional Testing

### Core Functionality Tests

#### Navigation Testing
```bash
# 3.1 Test LNB Navigation
curl -I http://localhost:8001/dashboard/writer
curl -I http://localhost:8001/dashboard/writer/library
curl -I http://localhost:8001/dashboard/writer/submit-text
curl -I http://localhost:8001/dashboard/writer/notifications

# 3.2 Test API Endpoints
curl http://localhost:8001/api/writer/submissions
curl http://localhost:8001/api/writer/stats
curl http://localhost:8001/api/writer/profile
```

#### Authentication Flow
```bash
# 3.3 Test writer role access
curl -X POST http://localhost:8001/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"writer@test.com","role":"WRITER"}'
```

#### Form Submission
```bash
# 3.4 Test story submission endpoint
curl -X POST http://localhost:8001/api/writer/submit \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Story",
    "content":"This is a test story content.",
    "authorAge":12,
    "country":"Kenya"
  }'
```

---

## 4. Playwright E2E Test Plan

### Test File Creation
Create `/Users/jihunkong/1001project/1001-stories/tests/writer-dashboard-redesign.spec.ts`

### Test Scenarios

#### Desktop Tests
1. **LNB Navigation Flow**
   - Click each menu item
   - Verify URL changes
   - Check active states
   - Test hover effects

2. **GlobalNavigationBar Interactions**
   - Open user menu
   - Test logout functionality
   - Verify user info display
   - Check notification badge

3. **Content Area Functionality**
   - Submit new story
   - View library items
   - Check submission status
   - Edit draft stories

#### Mobile Tests
1. **Bottom Navigation**
   - Tap each nav item
   - Verify transitions
   - Check icon highlighting
   - Test back navigation

2. **Mobile Menu**
   - Open hamburger menu
   - Test menu overlay
   - Verify close on selection
   - Check swipe gestures

### Run E2E Tests
```bash
# 4.1 Install Playwright browsers in container
docker exec 1001-stories-app-local npx playwright install

# 4.2 Run all writer dashboard tests
docker exec 1001-stories-app-local npx playwright test writer-dashboard-redesign

# 4.3 Run with UI mode for debugging
docker exec -it 1001-stories-app-local npx playwright test --ui

# 4.4 Generate HTML report
docker exec 1001-stories-app-local npx playwright show-report
```

---

## 5. Data Preparation

### Database Seeding
```bash
# 5.1 Create test writer accounts
docker exec 1001-stories-app-local npx tsx prisma/seed-writers.ts

# 5.2 Add sample submissions
docker exec 1001-stories-app-local npx tsx prisma/seed-writer-content.ts

# 5.3 Verify data
docker exec 1001-stories-app-local npx prisma studio
```

### Test Account Credentials
```
Writer 1: writer1@test.com
Writer 2: writer2@test.com
Writer 3: writer3@test.com
Admin: admin@test.com
```

### Sample Data Requirements
- 10 published stories
- 5 draft submissions
- 3 pending reviews
- 15 library items
- Notification samples

---

## 6. Performance Testing

### Load Testing
```bash
# 6.1 Basic load test
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" \
    http://localhost:8001/dashboard/writer &
done
wait

# 6.2 Concurrent user simulation
docker run --rm -v /Users/jihunkong/1001project/1001-stories:/data \
  loadimpact/k6 run /data/tests/k6-writer-load.js
```

### Memory Monitoring
```bash
# 6.3 Check container resources
docker stats 1001-stories-app-local --no-stream

# 6.4 Monitor for memory leaks
docker exec 1001-stories-app-local node --trace-gc server.js
```

---

## 7. Security Testing

### Basic Security Checks
```bash
# 7.1 Check for exposed ports
docker-compose -f docker-compose.local.yml port app 3000

# 7.2 Verify authentication required
curl -I http://localhost:8001/dashboard/writer
# Should redirect to login

# 7.3 Test CSRF protection
curl -X POST http://localhost:8001/api/writer/submit \
  -H "Content-Type: application/json" \
  -d '{"title":"CSRF Test"}'
# Should fail without proper token
```

---

## 8. Debugging Tools

### Container Access
```bash
# 8.1 Enter app container
docker exec -it 1001-stories-app-local sh

# 8.2 Check logs
docker-compose -f docker-compose.local.yml logs app --tail=100

# 8.3 Database queries
docker exec -it 1001-stories-postgres-local psql -U stories_user -d stories_db
```

### Network Inspection
```bash
# 8.4 Check network configuration
docker network inspect 1001-stories_local-network

# 8.5 Test internal connectivity
docker exec 1001-stories-app-local ping -c 3 postgres
```

---

## 9. Rollback Plan

### If Issues Found

#### Immediate Actions
```bash
# 9.1 Capture current state
docker-compose -f docker-compose.local.yml logs > failure-logs.txt
docker exec 1001-stories-app-local npm run build 2> build-errors.txt

# 9.2 Take database backup
docker exec 1001-stories-postgres-local pg_dump -U stories_user stories_db > backup.sql
```

#### Rollback Steps
```bash
# 9.3 Stop current deployment
docker-compose -f docker-compose.local.yml down

# 9.4 Restore previous version
git stash  # Save current changes
git checkout main  # or last stable branch
docker-compose -f docker-compose.local.yml up -d --build

# 9.5 Verify rollback
curl http://localhost:8001/api/health
```

#### Recovery Actions
```bash
# 9.6 If database corrupted
docker exec -i 1001-stories-postgres-local psql -U stories_user stories_db < backup.sql

# 9.7 Clear Redis cache
docker exec 1001-stories-redis-local redis-cli --pass 5DlvWlSxaxHNQbrHawza9EnhCDYMIfvIc55kkGpb1SM= FLUSHALL

# 9.8 Restart all services
docker-compose -f docker-compose.local.yml restart
```

---

## 10. Continuous Monitoring

### Automated Health Checks
```bash
# 10.1 Create monitoring script
cat > /Users/jihunkong/1001project/1001-stories/tests/monitor.sh << 'EOF'
#!/bin/bash
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/health)
  if [ $STATUS -ne 200 ]; then
    echo "$(date): Health check failed with status $STATUS"
    docker-compose -f docker-compose.local.yml logs app --tail=50
  fi
  sleep 30
done
EOF

chmod +x /Users/jihunkong/1001project/1001-stories/tests/monitor.sh
```

### Log Aggregation
```bash
# 10.2 Collect all logs
docker-compose -f docker-compose.local.yml logs -f > all-logs.txt 2>&1 &

# 10.3 Watch for errors
tail -f all-logs.txt | grep -i error
```

---

## Test Execution Summary

### Quick Test Command Sequence
```bash
# Complete test run
cd /Users/jihunkong/1001project/1001-stories

# 1. Clean start
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d --build

# 2. Wait for services
sleep 30

# 3. Run health checks
curl http://localhost:8001/api/health

# 4. Seed test data
docker exec 1001-stories-app-local npx tsx prisma/seed-demo.ts

# 5. Run E2E tests
docker exec 1001-stories-app-local npx playwright test

# 6. Check results
docker exec 1001-stories-app-local npx playwright show-report
```

### Success Criteria
- All health checks pass
- No console errors in browser
- All navigation works
- Forms submit successfully
- Responsive design functions correctly
- Performance metrics within limits:
  - Page load < 3 seconds
  - API responses < 500ms
  - Memory usage < 512MB
  - No memory leaks detected

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Port 8001 Already in Use
```bash
lsof -i :8001
kill -9 <PID>
```

#### Docker Build Fails
```bash
docker system prune -a
docker-compose -f docker-compose.local.yml build --no-cache
```

#### Database Connection Errors
```bash
docker exec 1001-stories-app-local npx prisma migrate reset --force
docker exec 1001-stories-app-local npx prisma db push
```

#### Playwright Tests Timeout
```bash
# Increase timeout in playwright.config.ts
# timeout: 120000 (2 minutes)
```

#### Memory Issues
```bash
# Increase Docker memory allocation
# Docker Desktop → Preferences → Resources → Memory: 4GB minimum
```

---

## Report Template

### Test Execution Report
```
Date: [DATE]
Tester: [NAME]
Environment: Docker Local (Port 8001)

Desktop Testing:
- [ ] LNB Navigation: PASS/FAIL
- [ ] GlobalNavigationBar: PASS/FAIL
- [ ] All Components Render: PASS/FAIL

Mobile Testing:
- [ ] Bottom Navigation: PASS/FAIL
- [ ] Responsive Layout: PASS/FAIL
- [ ] Touch Interactions: PASS/FAIL

Functional Testing:
- [ ] Authentication: PASS/FAIL
- [ ] Form Submission: PASS/FAIL
- [ ] API Endpoints: PASS/FAIL

Performance:
- Page Load Time: [X]ms
- Memory Usage: [X]MB
- Error Count: [X]

Issues Found:
1. [Issue description]
2. [Issue description]

Recommendations:
- [Action item]
- [Action item]
```

---

This testing plan ensures thorough verification of the writer dashboard redesign in an isolated Docker environment before deployment.