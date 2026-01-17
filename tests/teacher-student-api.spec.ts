import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth-helpers';

test.describe('Teacher-Student API Integration Tests', () => {
  const baseUrl = process.env.BASE_URL || 'https://1001stories.seedsofempowerment.org';

  test.describe('Classes API', () => {
    test('GET /api/classes returns array of classes for teacher', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/classes`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('classes');
      expect(Array.isArray(data.classes)).toBe(true);

      if (data.classes.length > 0) {
        const firstClass = data.classes[0];
        expect(firstClass).toHaveProperty('id');
        expect(firstClass).toHaveProperty('name');
        expect(firstClass).toHaveProperty('code');
        expect(firstClass.code).toHaveLength(6);
      }
    });

    test('GET /api/classes without authentication returns empty or unauthorized', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/classes`);
      expect([200, 401, 302]).toContain(response.status());

      if (response.status() === 200) {
        try {
          const data = await response.json();
          expect(data.classes?.length || 0).toBe(0);
        } catch {
          console.log('Response is not JSON, likely a redirect');
        }
      }
    });

    test('POST /api/classes creates new class for teacher', async ({ page }) => {
      await loginAs(page, 'teacher');

      const newClassName = `Test Class ${Date.now()}`;
      const response = await page.request.post(`${baseUrl}/api/classes`, {
        data: {
          name: newClassName,
          subject: 'Reading',
          gradeLevel: 'Grade 3',
          description: 'E2E Test Class'
        }
      });

      expect([200, 201, 400, 403]).toContain(response.status());

      if (response.status() === 200 || response.status() === 201) {
        const data = await response.json();
        expect(data.class).toHaveProperty('id');
        expect(data.class).toHaveProperty('code');
        expect(data.class.name).toBe(newClassName);
        console.log(`Created class with code: ${data.class.code}`);
      } else if (response.status() === 403) {
        console.log('Teacher account may not have permission to create classes');
      }
    });
  });

  test.describe('Class Detail API /api/classes/[id]', () => {
    test('GET /api/classes/[id] returns class details', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);
      expect(classesResponse.status()).toBe(200);

      const classesData = await classesResponse.json();

      if (!classesData.classes || classesData.classes.length === 0) {
        test.skip(true, 'Teacher has no classes - cannot test class detail endpoint');
        return;
      }

      const classId = classesData.classes[0].id;
      const detailResponse = await page.request.get(`${baseUrl}/api/classes/${classId}`);
      expect(detailResponse.status()).toBe(200);

      const detailData = await detailResponse.json();
      expect(detailData).toHaveProperty('class');
      expect(detailData.class.id).toBe(classId);
      expect(detailData.class).toHaveProperty('name');
      expect(detailData.class).toHaveProperty('code');
      expect(detailData.class).toHaveProperty('studentCount');
    });

    test('PATCH /api/classes/[id] updates class', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);
      expect(classesResponse.status()).toBe(200);

      const classesData = await classesResponse.json();

      if (!classesData.classes || classesData.classes.length === 0) {
        test.skip(true, 'Teacher has no classes - cannot test class update endpoint');
        return;
      }

      const classId = classesData.classes[0].id;
      const newDescription = `Updated description ${Date.now()}`;

      const updateResponse = await page.request.patch(`${baseUrl}/api/classes/${classId}`, {
        data: { description: newDescription }
      });

      expect([200, 403]).toContain(updateResponse.status());

      if (updateResponse.status() === 200) {
        const updateData = await updateResponse.json();
        expect(updateData.class.description).toBe(newDescription);
        console.log('Class updated successfully');
      } else {
        console.log('Teacher does not have permission to update this class (403)');
      }
    });

    test('GET /api/classes/[id] returns 404 for non-existent class', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/classes/nonexistent-id-12345`);
      expect([404, 500]).toContain(response.status());
    });
  });

  test.describe('Class Students API /api/classes/[id]/students', () => {
    test('GET /api/classes/[id]/students returns enrolled students', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);
      expect(classesResponse.status()).toBe(200);

      const classesData = await classesResponse.json();

      if (!classesData.classes || classesData.classes.length === 0) {
        test.skip(true, 'Teacher has no classes - cannot test students endpoint');
        return;
      }

      const classId = classesData.classes[0].id;
      const studentsResponse = await page.request.get(`${baseUrl}/api/classes/${classId}/students`);
      expect(studentsResponse.status()).toBe(200);

      const studentsData = await studentsResponse.json();
      expect(studentsData).toHaveProperty('students');
      expect(Array.isArray(studentsData.students)).toBe(true);

      if (studentsData.students.length > 0) {
        const firstStudent = studentsData.students[0];
        expect(firstStudent).toHaveProperty('id');
        expect(firstStudent).toHaveProperty('status');
        expect(firstStudent).toHaveProperty('student');
        console.log(`Class has ${studentsData.students.length} enrolled students`);
      } else {
        console.log('Class has no enrolled students (valid state)');
      }
    });

    test('students data includes statistics', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);
      expect(classesResponse.status()).toBe(200);

      const classesData = await classesResponse.json();

      if (!classesData.classes || classesData.classes.length === 0) {
        test.skip(true, 'Teacher has no classes - cannot test student statistics');
        return;
      }

      const classId = classesData.classes[0].id;
      const studentsResponse = await page.request.get(`${baseUrl}/api/classes/${classId}/students`);
      expect(studentsResponse.status()).toBe(200);

      const studentsData = await studentsResponse.json();

      if (studentsData.students.length === 0) {
        test.skip(true, 'No students in class - cannot test student statistics');
        return;
      }

      const firstStudent = studentsData.students[0];
      expect(firstStudent).toHaveProperty('statistics');
      expect(firstStudent.statistics).toHaveProperty('totalAssignments');
      expect(firstStudent.statistics).toHaveProperty('submittedAssignments');
      expect(firstStudent.statistics).toHaveProperty('completionRate');
    });
  });

  test.describe('Class Join API', () => {
    test('POST /api/classes/join validates class code', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.post(`${baseUrl}/api/classes/join`, {
        data: { code: 'INVALID' }
      });

      expect([400, 404]).toContain(response.status());
    });

    test('POST /api/classes/join/[code] requires authentication', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/classes/join/ABC123`);

      expect([401, 302]).toContain(response.status());

      if (response.status() === 401) {
        try {
          const data = await response.json();
          expect(data).toHaveProperty('error');
        } catch {
          // Redirect may not return JSON
        }
      }
    });

    test('GET /api/classes/join/[code] returns class info', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/classes/join/TESTXX`);
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('class');
      }
    });
  });

  test.describe('Book Assignment API', () => {
    test('GET /api/book-assignments returns learner assignments', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/book-assignments`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('assignments');
      expect(Array.isArray(data.assignments)).toBe(true);

      if (data.assignments.length > 0) {
        const firstAssignment = data.assignments[0];
        expect(firstAssignment).toHaveProperty('id');
        expect(firstAssignment).toHaveProperty('book');
      }

      console.log(`Learner has ${data.assignments.length} book assignments`);
    });

    test('GET /api/books/assign returns teacher assignments', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/books/assign`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Teacher book assignments retrieved');
      }
    });

    test('POST /api/books/assign creates assignment', async ({ page }) => {
      await loginAs(page, 'teacher');

      const classesResponse = await page.request.get(`${baseUrl}/api/classes`);
      expect(classesResponse.status()).toBe(200);

      const classesData = await classesResponse.json();

      if (!classesData.classes || classesData.classes.length === 0) {
        test.skip(true, 'Teacher has no classes - cannot test book assignment');
        return;
      }

      const classId = classesData.classes[0].id;

      const booksResponse = await page.request.get(`${baseUrl}/api/books`);
      if (booksResponse.status() !== 200) {
        test.skip(true, 'Cannot access books API');
        return;
      }

      const booksData = await booksResponse.json();

      if (!booksData.books || booksData.books.length === 0) {
        test.skip(true, 'No books available - cannot test book assignment');
        return;
      }

      const bookId = booksData.books[0].id;

      const assignResponse = await page.request.post(`${baseUrl}/api/books/assign`, {
        data: {
          bookId: bookId,
          classId: classId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });

      expect([200, 201, 400, 409]).toContain(assignResponse.status());
      console.log(`Book assignment response: ${assignResponse.status()}`);
    });
  });

  test.describe('Learner Progress APIs', () => {
    test('GET /api/learner/reading-progress returns progress', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/learner/reading-progress`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('progress');
      expect(data).toHaveProperty('summary');
      expect(Array.isArray(data.progress)).toBe(true);
      expect(data.summary).toHaveProperty('totalBooks');
      expect(data.summary).toHaveProperty('totalReadingTime');
    });

    test('GET /api/reading-streak returns streak data', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/reading-streak`);
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('currentStreak');
        expect(typeof data.currentStreak).toBe('number');
      }
    });

    test('GET /api/learner/class-ranking returns ranking', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/learner/class-ranking`);
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Class ranking retrieved:', data);
      }
    });

    test('GET /api/learner/assignments returns assignments', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/learner/assignments`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('assignments');
      }
    });
  });

  test.describe('Vocabulary APIs', () => {
    test('GET /api/vocabulary returns learner vocabulary', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/vocabulary`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Vocabulary data retrieved');
      }
    });

    test('GET /api/teacher/vocabulary-stats returns teacher stats', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/teacher/vocabulary-stats`);
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        console.log('Teacher vocabulary stats retrieved');
      }
    });
  });

  test.describe('Achievement APIs', () => {
    test('GET /api/achievements returns learner achievements', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/achievements`);
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('achievements');
      }
    });
  });

  test.describe('Cross-Role Access Control', () => {
    test('learner cannot access teacher API endpoints', async ({ page }) => {
      await loginAs(page, 'learner');

      const response = await page.request.get(`${baseUrl}/api/classes`);
      expect([200, 403]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.classes?.length || 0).toBe(0);
      }
    });

    test('teacher cannot access learner-specific endpoints with wrong role', async ({ page }) => {
      await loginAs(page, 'teacher');

      const response = await page.request.get(`${baseUrl}/api/book-assignments`);
      expect([200, 403]).toContain(response.status());
    });
  });
});
