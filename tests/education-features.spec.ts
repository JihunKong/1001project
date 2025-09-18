import { test, expect } from '@playwright/test';

test.describe('Educational Platform Features', () => {
  
  test.describe('Teacher Class Management', () => {
    test('teacher can create a class with unique code', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'teacher@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/teacher/classes');
      await page.click('button:has-text("Create Class")');
      
      await page.fill('input[name="name"]', 'Test English Class');
      await page.fill('input[name="subject"]', 'English');
      await page.fill('input[name="gradeLevel"]', 'Grade 5');
      await page.fill('input[name="maxStudents"]', '30');
      
      await page.click('button[type="submit"]');
      
      const classCode = await page.locator('.class-code').textContent();
      expect(classCode).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    });
    
    test('teacher can assign books to class', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'teacher@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/teacher/books');
      await page.click('[data-book-id="test-book-1"]');
      await page.click('button:has-text("Assign to Class")');
      
      await page.selectOption('select[name="classId"]', 'class-123');
      await page.fill('textarea[name="instructions"]', 'Read chapters 1-3');
      await page.fill('input[name="dueDate"]', '2025-12-31');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.toast-success')).toContainText('Successfully assigned');
    });
  });
  
  test.describe('Student Book Access', () => {
    test('student can only see assigned books', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/learner/books');
      
      const assignedBooksSection = page.locator('[data-section="assigned-books"]');
      await expect(assignedBooksSection).toBeVisible();
      
      const librarySection = page.locator('[data-section="library-books"]');
      await expect(librarySection).not.toBeVisible();
      
      const bookCount = await page.locator('.book-card').count();
      expect(bookCount).toBeGreaterThan(0);
      
      const firstBook = page.locator('.book-card').first();
      await expect(firstBook).toHaveAttribute('data-assigned', 'true');
    });
    
    test('student can join class with code', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/learner/classes');
      await page.click('button:has-text("Join Class")');
      
      await page.fill('input[name="classCode"]', 'ABC-123');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.toast-success')).toContainText('Successfully joined');
      await expect(page.locator('.class-list')).toContainText('Test English Class');
    });
  });
  
  test.describe('Publishing Workflow', () => {
    test('volunteer can submit story for review', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'volunteer@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/volunteer/submissions');
      await page.click('button:has-text("New Submission")');
      
      await page.fill('input[name="title"]', 'My Test Story');
      await page.fill('textarea[name="content"]', 'Once upon a time...');
      await page.fill('input[name="authorName"]', 'Test Author');
      
      await page.click('button:has-text("Submit for Review")');
      
      await expect(page.locator('.workflow-status')).toContainText('IN_REVIEW');
    });
    
    test('story manager can review submissions', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'story.manager@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/review-queue');
      
      const reviewItem = page.locator('.review-item').first();
      await expect(reviewItem).toBeVisible();
      
      await reviewItem.click();
      await page.click('button:has-text("Approve Story")');
      
      await expect(page.locator('.workflow-status')).toContainText('STORY_APPROVED');
    });
  });
  
  test.describe('Vocabulary Bank', () => {
    test('student can add words to vocabulary bank', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/books/test-book-1/read');
      
      await page.dblclick('span:has-text("difficult")');
      await page.click('button:has-text("Add to Vocabulary")');
      
      await page.goto('/dashboard/learner/vocabulary');
      await expect(page.locator('.vocabulary-word')).toContainText('difficult');
    });
    
    test('vocabulary explanations are age-appropriate', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/dashboard/learner/vocabulary');
      await page.click('.vocabulary-word:has-text("difficult")');
      
      const explanation = page.locator('.word-explanation');
      await expect(explanation).toBeVisible();
      await expect(explanation).toContainText('something that is hard to do');
    });
  });
  
  test.describe('Book Club Features', () => {
    test('teacher can create book club', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'teacher@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/book-clubs');
      await page.click('button:has-text("Create Book Club")');
      
      await page.fill('input[name="name"]', 'Summer Reading Club');
      await page.selectOption('select[name="bookId"]', 'test-book-1');
      await page.fill('input[name="maxMembers"]', '20');
      
      await page.click('button[type="submit"]');
      
      const joinCode = await page.locator('.join-code').textContent();
      expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);
    });
    
    test('students can participate in discussions', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/book-clubs/club-123/discussions');
      await page.click('button:has-text("New Discussion")');
      
      await page.fill('input[name="title"]', 'What did you think of Chapter 3?');
      await page.fill('textarea[name="content"]', 'I found the ending surprising!');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.discussion-item')).toContainText('What did you think of Chapter 3?');
    });
  });
  
  test.describe('AI Features', () => {
    test('image generation for stories', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'volunteer@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/books/test-book-1/edit');
      await page.click('button:has-text("Generate Illustration")');
      
      await page.fill('textarea[name="prompt"]', 'A friendly dragon reading a book');
      await page.click('button:has-text("Generate")');
      
      await page.waitForSelector('img.generated-illustration', { timeout: 30000 });
      await expect(page.locator('img.generated-illustration')).toBeVisible();
    });
    
    test('TTS shows error message only', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      await page.goto('/books/test-book-1/read');
      await page.click('button:has-text("Read Aloud")');
      
      await expect(page.locator('.toast-error')).toContainText('Sound generation failed');
      
      const audioElements = await page.locator('audio').count();
      expect(audioElements).toBe(0);
    });
  });
  
  test.describe('Role-Based Access Control', () => {
    const roles = [
      { email: 'learner@test.com', role: 'LEARNER', canCreateClass: false },
      { email: 'teacher@test.com', role: 'TEACHER', canCreateClass: true },
      { email: 'volunteer@test.com', role: 'VOLUNTEER', canCreateClass: false },
      { email: 'story.manager@test.com', role: 'STORY_MANAGER', canCreateClass: false },
      { email: 'book.manager@test.com', role: 'BOOK_MANAGER', canCreateClass: false },
      { email: 'content.admin@test.com', role: 'CONTENT_ADMIN', canCreateClass: false },
      { email: 'admin@test.com', role: 'ADMIN', canCreateClass: true },
    ];
    
    for (const user of roles) {
      test(`${user.role} permissions are correctly enforced`, async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', user.email);
        await page.click('button[type="submit"]');
        
        await page.goto('/dashboard');
        
        if (user.canCreateClass) {
          await expect(page.locator('button:has-text("Create Class")')).toBeVisible();
        } else {
          await expect(page.locator('button:has-text("Create Class")')).not.toBeVisible();
        }
      });
    }
  });
  
  test.describe('Performance and Caching', () => {
    test('assigned books are cached with Redis', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.click('button[type="submit"]');
      
      const startTime = Date.now();
      await page.goto('/dashboard/learner/books');
      const firstLoadTime = Date.now() - startTime;
      
      await page.reload();
      const secondStartTime = Date.now();
      await page.waitForSelector('.book-card');
      const secondLoadTime = Date.now() - secondStartTime;
      
      expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.5);
    });
  });
});

test.describe('Security Tests', () => {
  test('student cannot access unassigned books via direct URL', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.click('button[type="submit"]');
    
    await page.goto('/books/unassigned-book-id/read');
    
    await expect(page.locator('.error-message')).toContainText('not have access');
    expect(page.url()).not.toContain('/read');
  });
  
  test('non-teacher cannot create classes', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.click('button[type="submit"]');
    
    const response = await page.request.post('/api/classes/create', {
      data: {
        name: 'Hacker Class',
        subject: 'Hacking',
        gradeLevel: 'Grade 13',
      }
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('permission');
  });
});