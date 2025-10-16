# Manual Test Checklist - Volunteer Dashboard

## Quick Start Commands

```bash
# 1. Start Docker testing environment
cd /Users/jihunkong/1001project/1001-stories
./tests/run-docker-tests.sh

# 2. Or manually start Docker
docker-compose -f docker-compose.local.yml up -d --build

# 3. Access application
open http://localhost:8001/dashboard/volunteer
```

## Visual Verification Checklist

### Desktop View (1920x1080)
- [ ] **WriterLNB Sidebar**
  - [ ] Logo visible at top
  - [ ] Menu items properly aligned
  - [ ] Active state highlighting works
  - [ ] Hover effects visible
  - [ ] Icons display correctly

- [ ] **GlobalNavigationBar**
  - [ ] 1001 Stories logo on left
  - [ ] User menu on right
  - [ ] Notification bell with badge
  - [ ] Search bar (if applicable)
  - [ ] Breadcrumbs display

- [ ] **Main Content Area**
  - [ ] Stats cards display
  - [ ] Recent activity feed
  - [ ] Submission status widget
  - [ ] Charts render correctly
  - [ ] No overlapping elements

### Tablet View (768x1024)
- [ ] **Responsive Adjustments**
  - [ ] LNB collapses to hamburger menu
  - [ ] Content reflows to single column
  - [ ] Cards stack vertically
  - [ ] Text remains readable
  - [ ] Touch targets are 44x44px minimum

### Mobile View (375x667)
- [ ] **Mobile Navigation**
  - [ ] Bottom navigation bar appears
  - [ ] LNB is hidden
  - [ ] Hamburger menu in header
  - [ ] Swipe gestures work
  - [ ] Back navigation functions

## Functional Testing Checklist

### Navigation
- [ ] All LNB links navigate correctly
- [ ] Active state updates on navigation
- [ ] Browser back/forward works
- [ ] Deep linking functions
- [ ] Mobile bottom nav switches pages

### Form Submission
- [ ] Story submission form loads
- [ ] All fields accept input
- [ ] Validation messages appear
- [ ] Rich text editor works
- [ ] Submit button functions
- [ ] Success message displays
- [ ] Data persists in database

### User Interactions
- [ ] User menu dropdown opens
- [ ] Logout functionality works
- [ ] Profile link navigates correctly
- [ ] Notifications display
- [ ] Settings accessible

## Performance Checklist

### Load Times
- [ ] Initial page load < 3 seconds
- [ ] Navigation between pages < 1 second
- [ ] API responses < 500ms
- [ ] Images load progressively
- [ ] No visible layout shifts

### Resource Usage
- [ ] Memory usage < 512MB
- [ ] CPU usage reasonable
- [ ] No memory leaks on navigation
- [ ] Smooth scrolling
- [ ] Animations at 60fps

## Browser Compatibility

### Chrome
- [ ] All features work
- [ ] Console has no errors
- [ ] Developer tools show clean network tab

### Firefox
- [ ] Layout renders correctly
- [ ] Forms function properly
- [ ] No JavaScript errors

### Safari
- [ ] CSS displays correctly
- [ ] Touch gestures work on iOS
- [ ] No webkit-specific issues

## Accessibility

### Keyboard Navigation
- [ ] Tab through all elements
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] Skip links work

### Screen Reader
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Landmark regions defined
- [ ] Form labels associated
- [ ] Error messages announced

## Data Integrity

### Test Accounts
```
Email: volunteer1@test.com
Password: TestPassword123!

Email: volunteer2@test.com
Password: TestPassword123!

Email: volunteer3@test.com
Password: TestPassword123!
```

### Database Checks
- [ ] Users created successfully
- [ ] Submissions saved correctly
- [ ] Notifications appear
- [ ] Statistics update
- [ ] Relationships maintained

## Security Checks

### Authentication
- [ ] Login required for dashboard
- [ ] Session persists
- [ ] Logout clears session
- [ ] CSRF protection active
- [ ] XSS prevention working

### Authorization
- [ ] Role-based access enforced
- [ ] Volunteer can't access admin
- [ ] API endpoints protected
- [ ] File uploads validated

## Error Handling

### Network Issues
- [ ] Offline message appears
- [ ] Retry mechanisms work
- [ ] Loading states display
- [ ] Error boundaries catch crashes

### Form Errors
- [ ] Validation messages clear
- [ ] Required fields marked
- [ ] Error states styled
- [ ] Recovery possible

## Final Sign-off

- [ ] All critical paths tested
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile experience smooth
- [ ] Ready for production

## Test Evidence

### Screenshots
- Desktop: `/test-screenshots/volunteer-desktop.png`
- Mobile: `/test-screenshots/volunteer-mobile.png`

### Reports
- Playwright: `/playwright-report/index.html`
- Test Results: `/test-results/`

### Logs
- Application: `docker logs 1001-stories-app-local`
- Database: `docker logs 1001-stories-postgres-local`

## Rollback Plan

If issues found:

```bash
# 1. Stop current deployment
docker-compose -f docker-compose.local.yml down

# 2. Restore previous version
git stash
git checkout main
docker-compose -f docker-compose.local.yml up -d --build

# 3. Verify rollback
curl http://localhost:8001/api/health
```

---

**Tester:** _______________
**Date:** _______________
**Status:** [ ] PASS  [ ] FAIL
**Notes:** _______________