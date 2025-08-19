import { test, expect, Page } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  
  test.describe('Learner Role', () => {
    test.use({ storageState: 'tests/fixtures/auth/learner.json' });
    
    test('should access learner dashboard', async ({ page }) => {
      await page.goto('/dashboard/learner');
      
      // Verify dashboard elements
      await expect(page.locator('h1')).toContainText(/Learning Dashboard/i);
      await expect(page.locator('[data-testid="daily-goals"]')).toBeVisible();
      await expect(page.locator('[data-testid="course-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="recent-stories"]')).toBeVisible();
    });
    
    test('should NOT access teacher dashboard', async ({ page }) => {
      await page.goto('/dashboard/teacher');
      
      // Should redirect or show access denied
      await expect(page).toHaveURL(/.*\/(dashboard\/learner|403|auth)/);
      await expect(page.locator('text=/access denied|unauthorized/i')).toBeVisible();
    });
    
    test('should NOT access admin panel', async ({ page }) => {
      await page.goto('/admin');
      
      // Should redirect to login or show 403
      await expect(page).not.toHaveURL('/admin');
      await expect(page.locator('text=/access denied|unauthorized/i')).toBeVisible();
    });
    
    test('can view published stories', async ({ page }) => {
      await page.goto('/library');
      
      await expect(page.locator('[data-testid="story-card"]').first()).toBeVisible();
      
      // Click on a story
      await page.click('[data-testid="story-card"]');
      
      // Should be able to read
      await expect(page.locator('[data-testid="story-content"]')).toBeVisible();
    });
    
    test('can join a class with code', async ({ page }) => {
      await page.goto('/dashboard/learner');
      
      // Click join class button
      await page.click('button:has-text("Join Class")');
      
      // Enter class code
      await page.fill('input[name="classCode"]', 'MATH101');
      await page.click('button:has-text("Join")');
      
      // Check for success
      await expect(page.locator('[role="status"]')).toContainText(/joined.*successfully/i);
    });
  });
  
  test.describe('Teacher Role', () => {
    test.use({ storageState: 'tests/fixtures/auth/teacher.json' });
    
    test('should access teacher dashboard', async ({ page }) => {
      await page.goto('/dashboard/teacher');
      
      // Verify teacher-specific elements
      await expect(page.locator('h1')).toContainText(/Teacher Dashboard/i);
      await expect(page.locator('[data-testid="class-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="student-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="assignments"]')).toBeVisible();
    });
    
    test('can create a new class', async ({ page }) => {
      await page.goto('/dashboard/teacher');
      
      // Click create class
      await page.click('button:has-text("Create Class")');
      
      // Fill form
      await page.fill('input[name="className"]', 'Science 101');
      await page.selectOption('select[name="gradeLevel"]', 'Grade 6');
      await page.fill('input[name="subject"]', 'Science');
      
      await page.click('button:has-text("Create")');
      
      // Verify class created
      await expect(page.locator('text=Science 101')).toBeVisible();
      await expect(page.locator('[data-testid="class-code"]')).toBeVisible();
    });
    
    test('can assign stories to students', async ({ page }) => {
      await page.goto('/dashboard/teacher/classes/MATH101');
      
      // Click assign story
      await page.click('button:has-text("Assign Story")');
      
      // Select a story
      await page.click('[data-testid="story-select"] >> text=The Adventure Begins');
      
      // Set due date
      await page.fill('input[type="date"]', '2025-12-31');
      
      // Assign to all students
      await page.check('input[id="assignToAll"]');
      
      await page.click('button:has-text("Assign")');
      
      // Check for success
      await expect(page.locator('[role="status"]')).toContainText(/assigned.*successfully/i);
    });
    
    test('can view student progress', async ({ page }) => {
      await page.goto('/dashboard/teacher/students');
      
      // Should see student list
      await expect(page.locator('[data-testid="student-list"]')).toBeVisible();
      
      // Click on a student
      await page.click('[data-testid="student-row"]');
      
      // Should see detailed progress
      await expect(page.locator('[data-testid="reading-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="assignment-completion"]')).toBeVisible();
    });
    
    test('should NOT access admin panel', async ({ page }) => {
      await page.goto('/admin');
      
      await expect(page).not.toHaveURL('/admin');
      await expect(page.locator('text=/access denied|unauthorized/i')).toBeVisible();
    });
    
    test('should NOT access volunteer dashboard', async ({ page }) => {
      await page.goto('/dashboard/volunteer');
      
      // Should redirect to main dashboard
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });
  });
  
  test.describe('Institution Role', () => {
    test.use({ storageState: 'tests/fixtures/auth/institution.json' });
    
    test('should access institution dashboard', async ({ page }) => {
      await page.goto('/dashboard/institution');
      
      await expect(page.locator('h1')).toContainText(/Institution Dashboard/i);
      await expect(page.locator('[data-testid="program-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="volunteer-connections"]')).toBeVisible();
      await expect(page.locator('[data-testid="impact-reports"]')).toBeVisible();
    });
    
    test('can create volunteer projects', async ({ page }) => {
      await page.goto('/dashboard/institution/projects');
      
      await page.click('button:has-text("Create Project")');
      
      // Fill project details
      await page.fill('input[name="title"]', 'Summer Reading Program');
      await page.fill('textarea[name="description"]', 'Help children improve their reading skills');
      await page.fill('input[name="startDate"]', '2025-06-01');
      await page.fill('input[name="endDate"]', '2025-08-31');
      
      // Add required skills
      await page.fill('input[name="skills"]', 'Teaching, English');
      
      await page.click('button:has-text("Create Project")');
      
      await expect(page.locator('text=Summer Reading Program')).toBeVisible();
    });
    
    test('can view and approve volunteer applications', async ({ page }) => {
      await page.goto('/dashboard/institution/volunteers');
      
      // Should see pending applications
      await expect(page.locator('[data-testid="pending-applications"]')).toBeVisible();
      
      // Approve an application
      await page.click('[data-testid="application-row"] >> button:has-text("Review")');
      
      // View volunteer details
      await expect(page.locator('[data-testid="volunteer-profile"]')).toBeVisible();
      
      // Approve
      await page.click('button:has-text("Approve")');
      
      await expect(page.locator('[role="status"]')).toContainText(/approved/i);
    });
    
    test('can generate impact reports', async ({ page }) => {
      await page.goto('/dashboard/institution/reports');
      
      // Select report type
      await page.selectOption('select[name="reportType"]', 'monthly');
      
      // Generate report
      await page.click('button:has-text("Generate Report")');
      
      // Wait for report generation
      await page.waitForSelector('[data-testid="report-viewer"]', { timeout: 10000 });
      
      // Should see report data
      await expect(page.locator('[data-testid="total-volunteers"]')).toBeVisible();
      await expect(page.locator('[data-testid="stories-published"]')).toBeVisible();
      await expect(page.locator('[data-testid="children-reached"]')).toBeVisible();
      
      // Download report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('button:has-text("Download PDF")')
      ]);
      
      expect(download.suggestedFilename()).toContain('impact-report');
    });
    
    test('should NOT access volunteer dashboard', async ({ page }) => {
      await page.goto('/dashboard/volunteer');
      
      // Should redirect to main dashboard
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });
    
    test('should NOT access teacher dashboard', async ({ page }) => {
      await page.goto('/dashboard/teacher');
      
      // Should redirect to main dashboard
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });
  });
  
  test.describe('Volunteer Role', () => {
    test.use({ storageState: 'tests/fixtures/auth/volunteer.json' });
    
    test('should access volunteer hub', async ({ page }) => {
      await page.goto('/dashboard/volunteer');
      
      await expect(page.locator('h1')).toContainText(/Volunteer Hub/i);
      await expect(page.locator('[data-testid="project-discovery"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="community-features"]')).toBeVisible();
    });
    
    test('can browse and apply for projects', async ({ page }) => {
      await page.goto('/dashboard/volunteer/projects');
      
      // Filter projects
      await page.selectOption('select[name="location"]', 'Remote');
      await page.selectOption('select[name="skill"]', 'Translation');
      
      // View project details
      await page.click('[data-testid="project-card"]');
      
      await expect(page.locator('[data-testid="project-details"]')).toBeVisible();
      
      // Apply for project
      await page.fill('textarea[name="motivation"]', 'I would love to help translate stories');
      await page.click('button:has-text("Apply")');
      
      await expect(page.locator('[role="status"]')).toContainText(/application.*submitted/i);
    });
    
    test('can track volunteer hours', async ({ page }) => {
      await page.goto('/dashboard/volunteer/hours');
      
      // Log hours
      await page.click('button:has-text("Log Hours")');
      
      await page.selectOption('select[name="project"]', 'Story Translation Project');
      await page.fill('input[name="hours"]', '3');
      await page.fill('input[name="date"]', '2025-08-14');
      await page.fill('textarea[name="description"]', 'Translated 2 stories from English to Spanish');
      
      await page.click('button:has-text("Submit")');
      
      // Check logged hours appear
      await expect(page.locator('[data-testid="hours-table"]')).toContainText('3 hours');
      await expect(page.locator('[data-testid="total-hours"]')).toBeVisible();
    });
    
    test('can participate in community discussions', async ({ page }) => {
      await page.goto('/dashboard/volunteer/community');
      
      // View discussions
      await expect(page.locator('[data-testid="discussion-threads"]')).toBeVisible();
      
      // Create new discussion
      await page.click('button:has-text("New Discussion")');
      
      await page.fill('input[name="title"]', 'Translation Best Practices');
      await page.fill('textarea[name="content"]', 'What are your tips for translating children stories?');
      
      await page.click('button:has-text("Post")');
      
      await expect(page.locator('text=Translation Best Practices')).toBeVisible();
    });
    
    test('should NOT access teacher dashboard', async ({ page }) => {
      await page.goto('/dashboard/teacher');
      
      // Should redirect to main dashboard
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });
    
    test('should NOT access institution dashboard', async ({ page }) => {
      await page.goto('/dashboard/institution');
      
      // Should redirect to main dashboard
      await expect(page).toHaveURL(/.*\/dashboard$/);
    });
    
    test('should NOT access admin panel', async ({ page }) => {
      await page.goto('/admin');
      
      await expect(page).not.toHaveURL('/admin');
    });
  });
  
  test.describe('Admin Role', () => {
    test.use({ storageState: 'tests/fixtures/auth/admin.json' });
    
    test('should access admin panel', async ({ page }) => {
      await page.goto('/admin');
      
      await expect(page.locator('h1')).toContainText(/Admin Panel/i);
      await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
    });
    
    test('can manage story publishing workflow', async ({ page }) => {
      await page.goto('/admin/stories');
      
      // Should see kanban columns
      await expect(page.locator('[data-testid="column-draft"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-review"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-translation"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-illustration"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-editing"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-published"]')).toBeVisible();
      
      // Drag story from review to translation
      const storyCard = page.locator('[data-testid="story-card-123"]');
      const translationColumn = page.locator('[data-testid="column-translation"]');
      
      await storyCard.dragTo(translationColumn);
      
      // Verify moved
      await expect(translationColumn.locator('[data-testid="story-card-123"]')).toBeVisible();
    });
    
    test('can manage users', async ({ page }) => {
      await page.goto('/admin/users');
      
      // Search for user
      await page.fill('input[name="search"]', 'test.learner');
      await page.press('input[name="search"]', 'Enter');
      
      // Edit user
      await page.click('[data-testid="user-row"] >> button:has-text("Edit")');
      
      // Change role
      await page.selectOption('select[name="role"]', 'TEACHER');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      await expect(page.locator('[role="status"]')).toContainText(/updated.*successfully/i);
    });
    
    test('can view system analytics', async ({ page }) => {
      await page.goto('/admin/analytics');
      
      // Should see dashboard metrics
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-sessions"]')).toBeVisible();
      await expect(page.locator('[data-testid="stories-published"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    });
    
    test('can access all dashboards', async ({ page }) => {
      // Admin should be able to impersonate and access all dashboards
      const dashboards = [
        '/dashboard/learner',
        '/dashboard/teacher',
        '/dashboard/institution',
        '/dashboard/volunteer'
      ];
      
      for (const dashboard of dashboards) {
        await page.goto(dashboard);
        await expect(page).toHaveURL(dashboard);
        // Should not see access denied
        await expect(page.locator('text=/access denied|unauthorized/i')).not.toBeVisible();
      }
    });
  });
});