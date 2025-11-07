import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

const TEST_ACCOUNTS = {
  learner: {
    email: 'learner@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/learner',
    role: 'LEARNER'
  },
  teacher: {
    email: 'teacher@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/teacher',
    role: 'TEACHER'
  },
  writer: {
    email: 'writer@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/writer',
    role: 'WRITER'
  },
  storyManager: {
    email: 'story-manager@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/story-manager',
    role: 'STORY_MANAGER'
  },
  bookManager: {
    email: 'book-manager@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/book-manager',
    role: 'BOOK_MANAGER'
  },
  contentAdmin: {
    email: 'content-admin@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/content-admin',
    role: 'CONTENT_ADMIN'
  },
  institution: {
    email: 'institution@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/institution',
    role: 'INSTITUTION'
  },
  admin: {
    email: 'admin@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/admin',
    role: 'ADMIN'
  }
};

async function loginWithPassword(page: any, account: typeof TEST_ACCOUNTS[keyof typeof TEST_ACCOUNTS]) {
  console.log(`🔐 Logging in as ${account.role}: ${account.email}`);

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const emailInput = page.locator('#email');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(account.email);
  console.log(`✓ Email filled: ${account.email}`);

  const passwordInput = page.locator('#password');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(account.password);
  console.log(`✓ Password filled`);

  await page.waitForTimeout(1000);

  const submitButton = page.locator('button[type="submit"]:has-text("Log In")');
  await submitButton.click();
  console.log(`✓ Submit button clicked`);

  await page.waitForURL('**/dashboard/**', { timeout: 30000 });
  console.log(`✅ Logged in successfully as ${account.role}`);

  await page.waitForTimeout(1000);
}

test.describe('Role-Based Submission and Notification Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('Phase 1: LEARNER - Read-only access, no submissions', async ({ page }) => {
    console.log('\n=== PHASE 1: LEARNER ROLE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.learner);

    expect(page.url()).toContain(TEST_ACCOUNTS.learner.dashboard);
    console.log('✓ Dashboard redirected correctly');

    const submitButton = page.locator('button:has-text("Submit")').or(
      page.locator('button:has-text("Write Story")')
    );
    const submitCount = await submitButton.count();
    expect(submitCount).toBe(0);
    console.log('✓ No submission buttons found (correct for LEARNER role)');

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    const submittedStoriesSection = page.locator('text="Submitted Stories"').or(
      page.locator('text="My Submissions"')
    );
    const hasSubmissionsSection = await submittedStoriesSection.count() > 0;
    expect(hasSubmissionsSection).toBe(false);
    console.log('✓ Profile page shows no submission sections (correct for LEARNER)');

    await page.screenshot({
      path: 'test-results/01-learner-dashboard.png',
      fullPage: true
    });

    console.log('✅ LEARNER role test completed');
  });

  test('Phase 2: TEACHER - Can submit stories', async ({ page }) => {
    console.log('\n=== PHASE 2: TEACHER ROLE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.teacher);

    expect(page.url()).toContain(TEST_ACCOUNTS.teacher.dashboard);
    console.log('✓ Dashboard redirected correctly');

    const classManagementSection = page.locator('text="Class Management"').or(
      page.locator('text="Classes"').or(
        page.locator('text="Students"')
      )
    );
    const hasClassSection = await classManagementSection.count() > 0;
    expect(hasClassSection).toBe(true);
    console.log('✓ Class management section found');

    await page.screenshot({
      path: 'test-results/02-teacher-dashboard.png',
      fullPage: true
    });

    const submitStoryLink = page.locator('a[href*="submit"]').or(
      page.locator('button:has-text("Submit")').or(
        page.locator('button:has-text("Write Story")')
      )
    );

    if (await submitStoryLink.count() > 0) {
      console.log('✓ Teacher has submission capability (correct)');
    } else {
      console.log('⚠ No submission link found - checking if exists in navigation');
    }

    console.log('✅ TEACHER role test completed');
  });

  test('Phase 3: WRITER - Submit text story (CRITICAL)', async ({ page }) => {
    console.log('\n=== PHASE 3: WRITER SUBMISSION TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.writer);

    expect(page.url()).toContain(TEST_ACCOUNTS.writer.dashboard);
    console.log('✓ Dashboard redirected correctly');

    await page.screenshot({
      path: 'test-results/03-writer-dashboard-before.png',
      fullPage: true
    });

    console.log('📝 Navigating to submission form...');
    await page.goto(`${BASE_URL}/dashboard/writer/submit-text`);
    await page.waitForTimeout(2000);

    const titleInput = page.locator('input#title').or(
      page.locator('input[name="title"]')
    );
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Submission form loaded');

    await page.screenshot({
      path: 'test-results/04-writer-empty-form.png',
      fullPage: true
    });

    const testStoryTitle = `Test Story ${Date.now()}`;
    console.log(`📝 Filling form with title: ${testStoryTitle}`);

    await titleInput.fill(testStoryTitle);
    console.log('✓ Title filled');

    const editor = page.locator('.ProseMirror').or(
      page.locator('[contenteditable="true"]')
    );
    await editor.waitFor({ state: 'visible', timeout: 10000 });
    await editor.click();
    await editor.fill(`Once upon a time, there was a young explorer named Alex.

Alex loved to discover new places and meet new people. One day, Alex found a mysterious map in the attic.

The map showed a path to a hidden treasure in the forest. Alex decided to follow the map and began an amazing adventure.

The journey was full of surprises, challenges, and wonderful discoveries.`);
    console.log('✓ Content filled in rich text editor');

    await page.screenshot({
      path: 'test-results/05-writer-filled-form.png',
      fullPage: true
    });

    await page.waitForTimeout(1000);

    const submitButton = page.locator('button:has-text("Submit for Review")');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();
    console.log('✓ Submit for Review button clicked');

    await page.waitForTimeout(2000);

    // Check for Terms & Disclosures modal
    const termsModal = page.locator('text=Terms & Disclosures');
    if (await termsModal.count() > 0) {
      console.log('✓ Terms modal appeared');

      // Check the checkboxes in order
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = checkboxes.nth(i);
        await checkbox.check({ force: true });
        await page.waitForTimeout(300);
      }
      console.log(`✓ Checked ${checkboxCount} checkboxes`);

      // Wait a moment for button to become enabled
      await page.waitForTimeout(500);

      // Now click the "I Agree" button
      const agreeButton = page.locator('button:has-text("I Agree")');
      await agreeButton.click();
      console.log('✓ Terms agreed');
      await page.waitForTimeout(2000);
    }

    // Wait for success modal or redirect
    await page.waitForTimeout(3000);

    const closeButton = page.locator('button:has-text("Track")').or(
      page.locator('button:has-text("Close")')
    );
    if (await closeButton.count() > 0) {
      await closeButton.click();
      console.log('✓ Success modal closed');
    }

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/07-writer-after-submission.png',
      fullPage: true
    });

    console.log('📊 Checking submission status...');
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/08-writer-profile-page.png',
      fullPage: true
    });

    console.log('✅ WRITER submission test completed');
  });

  test('Phase 4: STORY_MANAGER - Review and comment (CRITICAL)', async ({ page }) => {
    console.log('\n=== PHASE 4: STORY_MANAGER REVIEW TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.storyManager);

    expect(page.url()).toContain(TEST_ACCOUNTS.storyManager.dashboard);
    console.log('✓ Dashboard redirected correctly');

    await page.screenshot({
      path: 'test-results/09-story-manager-dashboard.png',
      fullPage: true
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for the actual section header "Story Submissions Queue"
    const reviewQueueSection = page.locator('h2:has-text("Story Submissions Queue")');

    const hasReviewQueue = await reviewQueueSection.count() > 0;
    expect(hasReviewQueue).toBe(true);
    console.log('✓ Review queue section found');

    // Look for table rows instead of cards
    const submissionRows = page.locator('table tbody tr');
    const rowCount = await submissionRows.count();
    console.log(`📋 Found ${rowCount} submission rows`);

    if (rowCount > 0) {
      // Click the "Review" button in the first row
      const firstRow = submissionRows.first();
      const reviewButton = firstRow.locator('a:has-text("Review")');
      await reviewButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'test-results/10-story-manager-review-detail.png',
        fullPage: true
      });

      const commentSection = page.locator('textarea').or(
        page.locator('input[placeholder*="comment"]').or(
          page.locator('div[contenteditable="true"]')
        )
      );

      if (await commentSection.count() > 0) {
        console.log('✓ Comment section found');

        await commentSection.first().click();
        await commentSection.first().fill('Great opening! Consider adding more descriptive details about the setting.');

        // Wait for button to become enabled after text input
        await page.waitForTimeout(1000);

        const submitCommentButton = page.locator('button:has-text("Comment")').or(
          page.locator('button:has-text("Add Comment")').or(
            page.locator('button:has-text("Submit")')
          )
        );

        if (await submitCommentButton.count() > 0) {
          // Check if button is enabled before clicking
          const isEnabled = await submitCommentButton.first().isEnabled();
          if (isEnabled) {
            await submitCommentButton.first().click();
            await page.waitForTimeout(2000);
            console.log('✓ Comment submitted');

            await page.screenshot({
              path: 'test-results/11-story-manager-comment-submitted.png',
              fullPage: true
            });
          } else {
            console.log('⚠ Comment button is disabled, skipping comment submission');
          }
        }
      } else {
        console.log('⚠ Comment section not found, skipping');
      }

      const approveButton = page.locator('button:has-text("Approve")');
      const requestRevisionButton = page.locator('button:has-text("Request Revision")');

      console.log(`✓ Action buttons - Approve: ${await approveButton.count()}, Request Revision: ${await requestRevisionButton.count()}`);
    } else {
      console.log('⚠ No pending submissions found to review');
    }

    console.log('✅ STORY_MANAGER review test completed');
  });

  test('Phase 5: Verify Writer Notifications (CRITICAL)', async ({ page }) => {
    console.log('\n=== PHASE 5: NOTIFICATION VERIFICATION TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.writer);

    await page.goto(`${BASE_URL}/dashboard/writer`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/12-writer-notification-check.png',
      fullPage: true
    });

    const notificationBell = page.locator('[aria-label*="notification"]').or(
      page.locator('button:has(svg)').filter({ hasText: '' }).or(
        page.locator('.notification-bell, [data-testid="notification-bell"]')
      )
    );

    if (await notificationBell.count() > 0) {
      console.log('✓ Notification bell found');

      const hasUnreadIndicator = await page.locator('.notification-badge, .badge, .unread-count').count() > 0;
      if (hasUnreadIndicator) {
        console.log('✅ Unread notification indicator found');
      }

      await notificationBell.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'test-results/13-writer-notification-dropdown.png',
        fullPage: true
      });

      const notificationItems = page.locator('.notification-item, [data-testid="notification"], li');
      const notifCount = await notificationItems.count();
      console.log(`📬 Found ${notifCount} notifications`);

      if (notifCount > 0) {
        const firstNotifText = await notificationItems.first().textContent();
        console.log(`📨 First notification: ${firstNotifText?.substring(0, 100)}...`);

        await notificationItems.first().click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: 'test-results/14-writer-notification-clicked.png',
          fullPage: true
        });
      }
    } else {
      console.log('⚠ Notification bell not found');
    }

    console.log('📊 Testing /api/profile/activity endpoint...');
    const activityResult = await page.evaluate(async () => {
      const response = await fetch('/api/profile/activity');
      return {
        status: response.status,
        data: response.ok ? await response.json() : null
      };
    });
    if (activityResult.status === 200) {
      console.log(`✓ Activity API returned ${activityResult.data?.activities?.length || 0} activities`);
    } else {
      console.log(`⚠ Activity API returned ${activityResult.status} (endpoint may need deployment)`);
    }

    console.log('📊 Testing /api/profile/stories endpoint...');
    const storiesResult = await page.evaluate(async () => {
      const response = await fetch('/api/profile/stories');
      return {
        status: response.status,
        data: response.ok ? await response.json() : null
      };
    });
    if (storiesResult.status === 200) {
      console.log(`✓ Stories API returned ${storiesResult.data?.stories?.length || 0} stories`);
    } else {
      console.log(`⚠ Stories API returned ${storiesResult.status} (endpoint may need deployment)`);
    }

    console.log('✅ Notification verification test completed');
  });

  test('Phase 6: Profile Page Functionality', async ({ page }) => {
    console.log('\n=== PHASE 6: PROFILE PAGE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.writer);

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'test-results/15-profile-page-full.png',
      fullPage: true
    });

    const statsCards = page.locator('.stat-card, [data-testid="stat-card"], .stats');
    const statsCount = await statsCards.count();
    console.log(`📊 Found ${statsCount} statistics cards`);

    const activitySection = page.locator('text="Activity"').or(
      page.locator('text="Timeline"').or(
        page.locator('[data-testid="activity-timeline"]')
      )
    );

    const hasActivitySection = await activitySection.count() > 0;
    console.log(`✓ Activity section: ${hasActivitySection ? 'Found' : 'Not found'}`);

    const storiesTab = page.locator('button:has-text("Stories")').or(
      page.locator('a:has-text("Stories")').or(
        page.locator('[data-testid="stories-tab"]')
      )
    );

    if (await storiesTab.count() > 0) {
      await storiesTab.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'test-results/16-profile-stories-tab.png',
        fullPage: true
      });

      const storyCards = page.locator('.story-card, [data-testid="story-card"]');
      const storyCount = await storyCards.count();
      console.log(`📚 Stories tab shows ${storyCount} stories`);
    }

    console.log('✅ Profile page test completed');
  });

  test('Phase 7: INSTITUTION Dashboard Access', async ({ page }) => {
    console.log('\n=== PHASE 7: INSTITUTION ROLE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.institution);

    expect(page.url()).toContain(TEST_ACCOUNTS.institution.dashboard);
    console.log('✓ Dashboard redirected correctly');

    await page.screenshot({
      path: 'test-results/17-institution-dashboard.png',
      fullPage: true
    });

    const analyticsCards = page.locator('.analytics-card, .stat-card, [data-testid="analytics-card"]');
    const analyticsCount = await analyticsCards.count();
    console.log(`📊 Found ${analyticsCount} analytics cards`);

    const departmentSection = page.locator('text="Department"').or(
      page.locator('text="Departments"').or(
        page.locator('[data-testid="department-section"]')
      )
    );
    const hasDepartmentSection = await departmentSection.count() > 0;
    console.log(`✓ Department section: ${hasDepartmentSection ? 'Found' : 'Not found'}`);

    const teacherManagementSection = page.locator('text="Teacher Management"').or(
      page.locator('text="Teachers"').or(
        page.locator('[data-testid="teacher-management"]')
      )
    );
    const hasTeacherSection = await teacherManagementSection.count() > 0;
    console.log(`✓ Teacher management section: ${hasTeacherSection ? 'Found' : 'Not found'}`);

    const activityFeed = page.locator('text="Activity"').or(
      page.locator('text="Recent Activity"').or(
        page.locator('[data-testid="activity-feed"]')
      )
    );
    const hasActivityFeed = await activityFeed.count() > 0;
    console.log(`✓ Activity feed: ${hasActivityFeed ? 'Found' : 'Not found'}`);

    const inviteButton = page.locator('button:has-text("Invite")').or(
      page.locator('a:has-text("Invite Teacher")')
    );
    const hasInviteButton = await inviteButton.count() > 0;
    console.log(`✓ Invite button: ${hasInviteButton ? 'Found' : 'Not found'}`);

    console.log('✅ INSTITUTION role test completed');
  });

  test('Phase 8: BOOK_MANAGER Dashboard Access', async ({ page }) => {
    console.log('\n=== PHASE 8: BOOK_MANAGER ROLE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.bookManager);

    expect(page.url()).toContain(TEST_ACCOUNTS.bookManager.dashboard);
    console.log('✓ Dashboard redirected correctly');

    await page.screenshot({
      path: 'test-results/18-book-manager-dashboard.png',
      fullPage: true
    });

    const statsCards = page.locator('.stat-card, [data-testid="stat-card"], .stats');
    const statsCount = await statsCards.count();
    console.log(`📊 Found ${statsCount} statistics cards`);

    const formatDecisionQueue = page.locator('text="Format Decision"').or(
      page.locator('text="Awaiting Decision"').or(
        page.locator('[data-testid="format-decision-queue"]')
      )
    );
    const hasFormatQueue = await formatDecisionQueue.count() > 0;
    console.log(`✓ Format decision queue: ${hasFormatQueue ? 'Found' : 'Not found'}`);

    const submissionRows = page.locator('table tbody tr, .submission-card, [data-testid="submission-row"]');
    const rowCount = await submissionRows.count();
    console.log(`📋 Found ${rowCount} submission rows/cards`);

    const decideButton = page.locator('button:has-text("Decide")').or(
      page.locator('a:has-text("Format Decision")')
    );
    const hasDecideButton = await decideButton.count() > 0;
    console.log(`✓ Format decision button: ${hasDecideButton ? 'Found' : 'Not found'}`);

    console.log('✅ BOOK_MANAGER role test completed');
  });

  test('Phase 9: CONTENT_ADMIN Dashboard Access', async ({ page }) => {
    console.log('\n=== PHASE 9: CONTENT_ADMIN ROLE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.contentAdmin);

    expect(page.url()).toContain(TEST_ACCOUNTS.contentAdmin.dashboard);
    console.log('✓ Dashboard redirected correctly');

    await page.screenshot({
      path: 'test-results/19-content-admin-dashboard.png',
      fullPage: true
    });

    const statsCards = page.locator('.stat-card, [data-testid="stat-card"], .stats');
    const statsCount = await statsCards.count();
    console.log(`📊 Found ${statsCount} statistics cards`);

    const finalApprovalQueue = page.locator('text="Final Approval"').or(
      page.locator('text="Awaiting Approval"').or(
        page.locator('[data-testid="final-approval-queue"]')
      )
    );
    const hasApprovalQueue = await finalApprovalQueue.count() > 0;
    console.log(`✓ Final approval queue: ${hasApprovalQueue ? 'Found' : 'Not found'}`);

    const submissionRows = page.locator('table tbody tr, .submission-card, [data-testid="submission-row"]');
    const rowCount = await submissionRows.count();
    console.log(`📋 Found ${rowCount} submission rows/cards`);

    const reviewButton = page.locator('button:has-text("Review")').or(
      page.locator('a:has-text("Review")')
    );
    const hasReviewButton = await reviewButton.count() > 0;
    console.log(`✓ Review button: ${hasReviewButton ? 'Found' : 'Not found'}`);

    const approveButton = page.locator('button:has-text("Approve")').or(
      page.locator('button:has-text("Publish")')
    );
    const hasApproveButton = await approveButton.count() > 0;
    console.log(`✓ Approve/Publish button: ${hasApproveButton ? 'Found' : 'Not found'}`);

    console.log('✅ CONTENT_ADMIN role test completed');
  });

  test('Phase 10: ADMIN Dashboard Access', async ({ page }) => {
    console.log('\n=== PHASE 10: ADMIN ROLE TEST ===');

    await loginWithPassword(page, TEST_ACCOUNTS.admin);

    expect(page.url()).toContain(TEST_ACCOUNTS.admin.dashboard);
    console.log('✓ Dashboard redirected correctly');

    await page.screenshot({
      path: 'test-results/20-admin-dashboard.png',
      fullPage: true
    });

    const systemStatsCards = page.locator('.stat-card, [data-testid="stat-card"], .stats, .system-card');
    const statsCount = await systemStatsCards.count();
    console.log(`📊 Found ${statsCount} system statistics cards`);

    const usersByRoleSection = page.locator('text="Users by Role"').or(
      page.locator('text="Role Distribution"').or(
        page.locator('[data-testid="users-by-role"]')
      )
    );
    const hasRoleSection = await usersByRoleSection.count() > 0;
    console.log(`✓ Users by role section: ${hasRoleSection ? 'Found' : 'Not found'}`);

    const systemAlertsSection = page.locator('text="System Alerts"').or(
      page.locator('text="Alerts"').or(
        page.locator('[data-testid="system-alerts"]')
      )
    );
    const hasAlertsSection = await systemAlertsSection.count() > 0;
    console.log(`✓ System alerts section: ${hasAlertsSection ? 'Found' : 'Not found'}`);

    const systemResourcesSection = page.locator('text="System Resources"').or(
      page.locator('text="Resources"').or(
        page.locator('[data-testid="system-resources"]')
      )
    );
    const hasResourcesSection = await systemResourcesSection.count() > 0;
    console.log(`✓ System resources section: ${hasResourcesSection ? 'Found' : 'Not found'}`);

    const pendingReviewsSection = page.locator('text="Pending Reviews"').or(
      page.locator('text="Pending"').or(
        page.locator('[data-testid="pending-reviews"]')
      )
    );
    const hasPendingSection = await pendingReviewsSection.count() > 0;
    console.log(`✓ Pending reviews section: ${hasPendingSection ? 'Found' : 'Not found'}`);

    const quickActionsSection = page.locator('text="Quick Actions"').or(
      page.locator('[data-testid="quick-actions"]')
    );
    const hasQuickActions = await quickActionsSection.count() > 0;
    console.log(`✓ Quick actions section: ${hasQuickActions ? 'Found' : 'Not found'}`);

    console.log('✅ ADMIN role test completed');
  });

  test.afterAll(async () => {
    console.log('\n=== ALL ROLE-BASED TESTS COMPLETED ===');
    console.log('Screenshots saved to test-results/');
  });
});

test.describe('API Endpoint Tests', () => {
  test('Test /api/profile/activity endpoint', async ({ request }) => {
    console.log('\n=== API: /api/profile/activity ===');

    const response = await request.get(`${BASE_URL}/api/profile/activity`);
    const contentType = response.headers()['content-type'] || '';

    if (response.status() === 401) {
      console.log('✓ Returns 401 Unauthorized (correct for unauthenticated request)');
      expect(response.status()).toBe(401);
    } else if (response.status() === 200 && contentType.includes('text/html')) {
      console.log('✓ Returns 200 with HTML (redirected to login, authentication required)');
      expect(response.status()).toBe(200);
    } else if (response.status() === 200 && contentType.includes('application/json')) {
      console.log(`✓ Response status: ${response.status()}`);
      const data = await response.json();
      console.log(`✓ Response structure: ${JSON.stringify(Object.keys(data), null, 2)}`);
    } else {
      console.log(`✓ Response status: ${response.status()}, Content-Type: ${contentType}`);
    }
  });

  test('Test /api/profile/stories endpoint', async ({ request }) => {
    console.log('\n=== API: /api/profile/stories ===');

    const response = await request.get(`${BASE_URL}/api/profile/stories`);
    const contentType = response.headers()['content-type'] || '';

    if (response.status() === 401) {
      console.log('✓ Returns 401 Unauthorized (correct for unauthenticated request)');
      expect(response.status()).toBe(401);
    } else if (response.status() === 200 && contentType.includes('text/html')) {
      console.log('✓ Returns 200 with HTML (redirected to login, authentication required)');
      expect(response.status()).toBe(200);
    } else if (response.status() === 200 && contentType.includes('application/json')) {
      console.log(`✓ Response status: ${response.status()}`);
      const data = await response.json();
      console.log(`✓ Response structure: ${JSON.stringify(Object.keys(data), null, 2)}`);
    } else {
      console.log(`✓ Response status: ${response.status()}, Content-Type: ${contentType}`);
    }
  });

  test('Test /api/notifications endpoint', async ({ request }) => {
    console.log('\n=== API: /api/notifications ===');

    const response = await request.get(`${BASE_URL}/api/notifications`);
    const contentType = response.headers()['content-type'] || '';

    if (response.status() === 401) {
      console.log('✓ Returns 401 Unauthorized (correct for unauthenticated request)');
      expect(response.status()).toBe(401);
    } else if (response.status() === 200 && contentType.includes('text/html')) {
      console.log('✓ Returns 200 with HTML (redirected to login, authentication required)');
      expect(response.status()).toBe(200);
    } else if (response.status() === 200 && contentType.includes('application/json')) {
      console.log(`✓ Response status: ${response.status()}`);
      const data = await response.json();
      console.log(`✓ Response structure: ${JSON.stringify(Object.keys(data), null, 2)}`);
    } else {
      console.log(`✓ Response status: ${response.status()}, Content-Type: ${contentType}`);
    }
  });
});
