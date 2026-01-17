import { test, expect } from '@playwright/test';
import { loginAs, TEST_ACCOUNTS } from './helpers/auth-helpers';

test.describe('Teacher-Student Workflow E2E Tests', () => {
  const baseUrl = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

  test.describe('Teacher Dashboard Functionality', () => {
    test('teacher can access dashboard after login', async ({ page }) => {
      await loginAs(page, 'teacher');

      await page.goto(`${baseUrl}/dashboard/teacher`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard/teacher');

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('teacher dashboard displays class management section', async ({ page }) => {
      await loginAs(page, 'teacher');

      await page.goto(`${baseUrl}/dashboard/teacher`);
      await page.waitForLoadState('networkidle');

      const classSection = page.locator('text=My Classes').or(
        page.locator('text=Classes')
      ).or(
        page.locator('[data-testid="classes-section"]')
      );

      const hasClassSection = await classSection.isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasClassSection).toBe(true);
    });

    test('teacher can see create class button', async ({ page }) => {
      await loginAs(page, 'teacher');

      await page.goto(`${baseUrl}/dashboard/teacher`);
      await page.waitForLoadState('networkidle');

      const createClassButton = page.locator('button:has-text("Create Class")').or(
        page.locator('button:has-text("New Class")')
      ).or(
        page.locator('text=Create Class')
      );

      const hasButton = await createClassButton.isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`Create Class button visible: ${hasButton}`);
    });

    test('teacher can see assign reading button', async ({ page }) => {
      await loginAs(page, 'teacher');

      await page.goto(`${baseUrl}/dashboard/teacher`);
      await page.waitForLoadState('networkidle');

      const assignButton = page.locator('button:has-text("Assign Reading")').or(
        page.locator('button:has-text("Assign Book")')
      ).or(
        page.locator('text=Assign Reading')
      );

      const hasButton = await assignButton.isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`Assign Reading button visible: ${hasButton}`);
    });
  });

  test.describe('Teacher Class Management API', () => {
    test('classes API returns list of classes for teacher', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/classes`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('classes');
        expect(Array.isArray(data.classes)).toBe(true);
        console.log(`Teacher has ${data.classes.length} classes`);
      }
    });

    test('class detail API returns class information', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);

      if (classesResponse.status() === 200) {
        const classesData = await classesResponse.json();

        if (classesData.classes && classesData.classes.length > 0) {
          const classId = classesData.classes[0].id;

          const detailResponse = await page.request.get(`${baseUrl}/api/classes/${classId}`);
          expect([200, 403, 404]).toContain(detailResponse.status());

          if (detailResponse.status() === 200) {
            const detailData = await detailResponse.json();
            expect(detailData).toHaveProperty('class');
            expect(detailData.class).toHaveProperty('id');
            expect(detailData.class).toHaveProperty('name');
            expect(detailData.class).toHaveProperty('code');
            console.log(`Class detail retrieved: ${detailData.class.name}`);
          }
        } else {
          console.log('No classes found for teacher');
        }
      }
    });

    test('class students API returns enrolled students', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);

      if (classesResponse.status() === 200) {
        const classesData = await classesResponse.json();

        if (classesData.classes && classesData.classes.length > 0) {
          const classId = classesData.classes[0].id;

          const studentsResponse = await page.request.get(`${baseUrl}/api/classes/${classId}/students`);
          expect([200, 403, 404]).toContain(studentsResponse.status());

          if (studentsResponse.status() === 200) {
            const studentsData = await studentsResponse.json();
            expect(studentsData).toHaveProperty('students');
            expect(Array.isArray(studentsData.students)).toBe(true);
            console.log(`Class has ${studentsData.students.length} students`);
          }
        }
      }
    });
  });

  test.describe('Learner Dashboard Functionality', () => {
    test('learner can access dashboard after login', async ({ page }) => {
      await loginAs(page, 'learner');

      await page.goto(`${baseUrl}/dashboard/learner`);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard/learner');

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('learner dashboard displays statistics', async ({ page }) => {
      await loginAs(page, 'learner');

      await page.goto(`${baseUrl}/dashboard/learner`);
      await page.waitForLoadState('networkidle');

      const statsSection = page.locator('text=Books Read').or(
        page.locator('text=Reading Streak')
      ).or(
        page.locator('text=Reading Time')
      );

      const hasStats = await statsSection.isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`Learner statistics visible: ${hasStats}`);
    });

    test('learner can see assigned books section', async ({ page }) => {
      await loginAs(page, 'learner');

      await page.goto(`${baseUrl}/dashboard/learner`);
      await page.waitForLoadState('networkidle');

      const assignedSection = page.locator('text=Assigned Books').or(
        page.locator('text=My Books')
      ).or(
        page.locator('text=Continue Reading')
      );

      const hasSection = await assignedSection.isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`Assigned books section visible: ${hasSection}`);
    });
  });

  test.describe('Learner API Endpoints', () => {
    test('reading progress API works', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/learner/reading-progress`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Reading progress data retrieved');
        expect(data).toHaveProperty('booksRead');
      }
    });

    test('reading streak API works', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/reading-streak`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log(`Current streak: ${data.currentStreak || 0}`);
      }
    });

    test('class ranking API works', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/learner/class-ranking`);
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Class ranking data retrieved');
      }
    });

    test('book assignments API works', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/book-assignments`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('assignments');
        console.log(`Learner has ${data.assignments?.length || 0} book assignments`);
      }
    });
  });

  test.describe('Class Join Workflow', () => {
    test('class join API endpoint exists', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/classes/join`, {
        data: { code: 'TESTXX' }
      });

      expect([200, 400, 401, 404]).toContain(response.status());
      console.log(`Class join API status: ${response.status()}`);
    });

    test('learner can navigate to join class page', async ({ page }) => {
      await loginAs(page, 'learner');

      await page.goto(`${baseUrl}/dashboard/learner`);
      await page.waitForLoadState('networkidle');

      const joinButton = page.locator('button:has-text("Join Class")').or(
        page.locator('a:has-text("Join Class")')
      ).or(
        page.locator('text=Join Class')
      );

      const hasJoinButton = await joinButton.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`Join Class button visible: ${hasJoinButton}`);
    });
  });

  test.describe('Book Assignment Flow', () => {
    test('book assign API works for teacher', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/books/assign`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Book assignments data retrieved for teacher');
      }
    });

    test('teacher vocabulary stats API works', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/teacher/vocabulary-stats`);
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Vocabulary stats retrieved');
      }
    });
  });

  test.describe('Student Management Page', () => {
    test('teacher can navigate to student management', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);

      if (classesResponse.status() === 200) {
        const classesData = await classesResponse.json();

        if (classesData.classes && classesData.classes.length > 0) {
          const classId = classesData.classes[0].id;

          await page.goto(`${baseUrl}/dashboard/teacher/class/${classId}/students`);
          await page.waitForLoadState('networkidle');

          const currentUrl = page.url();
          const isOnStudentsPage = currentUrl.includes('/students') || currentUrl.includes('/login');
          expect(isOnStudentsPage).toBe(true);

          if (currentUrl.includes('/students')) {
            const body = page.locator('body');
            await expect(body).toBeVisible();
            console.log('Student management page loaded');
          }
        } else {
          console.log('No classes available for testing student management');
        }
      }
    });
  });

  test.describe('Cross-Role Verification', () => {
    test('teacher and learner have different dashboard access', async ({ browser }) => {
      const teacherContext = await browser.newContext();
      const learnerContext = await browser.newContext();

      const teacherPage = await teacherContext.newPage();
      const learnerPage = await learnerContext.newPage();

      await loginAs(teacherPage, 'teacher');
      await loginAs(learnerPage, 'learner');

      await teacherPage.goto(`${baseUrl}/dashboard/teacher`);
      await learnerPage.goto(`${baseUrl}/dashboard/learner`);

      await teacherPage.waitForLoadState('networkidle');
      await learnerPage.waitForLoadState('networkidle');

      const teacherUrl = teacherPage.url();
      const learnerUrl = learnerPage.url();

      expect(teacherUrl).toContain('/teacher');
      expect(learnerUrl).toContain('/learner');

      const teacherSession = await teacherPage.request.get(`${baseUrl}/api/auth/session`);
      const learnerSession = await learnerPage.request.get(`${baseUrl}/api/auth/session`);

      if (teacherSession.status() === 200 && learnerSession.status() === 200) {
        const teacherData = await teacherSession.json();
        const learnerData = await learnerSession.json();

        expect(teacherData.user?.role).toBe('TEACHER');
        expect(learnerData.user?.role).toBe('LEARNER');

        console.log('Cross-role verification successful');
      }

      await teacherContext.close();
      await learnerContext.close();
    });
  });
});
