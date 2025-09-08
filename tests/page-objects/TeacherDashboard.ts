import { Page, expect } from '@playwright/test';

export class TeacherDashboard {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/dashboard/teacher');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDashboardLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/teacher/);
    const dashboardHeadings = [
      'text=Teacher Dashboard',
      'text=My Classes',
      'text=Students',
      'h1:has-text("Dashboard")'
    ];
    
    for (const heading of dashboardHeadings) {
      const element = await this.page.$(heading);
      if (element) {
        await expect(element).toBeVisible();
        return;
      }
    }
  }

  async viewStudentList() {
    const studentSelectors = [
      'button:has-text("Students")',
      'a:has-text("Students")',
      '[data-testid="students-tab"]',
      'text=View Students'
    ];

    for (const selector of studentSelectors) {
      try {
        await this.page.click(selector, { timeout: 5000 });
        break;
      } catch {
        continue;
      }
    }
    await this.page.waitForSelector('table, [data-testid="student-list"]', { timeout: 10000 });
  }

  async viewStudentProgress(studentName: string) {
    await this.page.click(`tr:has-text("${studentName}") button:has-text("View Progress")`);
    await expect(this.page).toHaveURL(/\/student\/\d+\/progress/);
  }

  async createAssignment(title: string, description: string, bookId?: string) {
    await this.page.click('button:has-text("Create Assignment"), button:has-text("New Assignment")');
    await this.page.fill('input[name="title"], input[placeholder*="Title"]', title);
    await this.page.fill('textarea[name="description"], textarea[placeholder*="Description"]', description);
    
    if (bookId) {
      await this.page.selectOption('select[name="bookId"]', bookId);
    }
    
    await this.page.click('button:has-text("Create"), button:has-text("Save")');
    await this.page.waitForSelector(`text=${title}`, { timeout: 10000 });
  }

  async viewAssignments() {
    await this.page.click('button:has-text("Assignments"), a:has-text("Assignments")');
    await this.page.waitForSelector('[data-testid="assignments-list"], table');
  }

  async assignBookToStudent(bookTitle: string, studentName: string) {
    await this.page.click('button:has-text("Assign Book")');
    await this.page.selectOption('select[name="book"]', bookTitle);
    await this.page.selectOption('select[name="student"]', studentName);
    await this.page.click('button:has-text("Assign")');
    await this.page.waitForSelector('text=Book assigned successfully', { timeout: 5000 });
  }

  async viewClassMaterials() {
    await this.page.click('button:has-text("Class Materials"), a:has-text("Materials")');
    await this.page.waitForSelector('[data-testid="materials-list"], .materials-grid');
  }

  async provideFeedback(studentName: string, feedback: string) {
    await this.viewStudentProgress(studentName);
    await this.page.fill('textarea[name="feedback"], textarea[placeholder*="feedback"]', feedback);
    await this.page.click('button:has-text("Submit Feedback"), button:has-text("Send")');
    await this.page.waitForSelector('text=Feedback submitted', { timeout: 5000 });
  }

  async getStudentCount(): Promise<number> {
    await this.viewStudentList();
    const rows = await this.page.$$('tbody tr, [data-testid="student-row"]');
    return rows.length;
  }

  async verifyStudentProgressVisible(studentName: string) {
    await this.viewStudentProgress(studentName);
    await expect(this.page.locator('text=Reading Progress')).toBeVisible();
    await expect(this.page.locator('text=Vocabulary Learned')).toBeVisible();
  }

  async checkNotifications() {
    await this.page.click('[data-testid="notifications"], button[aria-label="Notifications"]');
    await this.page.waitForSelector('[data-testid="notifications-panel"]');
  }

  async viewAnalytics() {
    await this.page.click('button:has-text("Analytics"), a:has-text("Analytics")');
    await this.page.waitForSelector('[data-testid="analytics-chart"], canvas');
  }
}