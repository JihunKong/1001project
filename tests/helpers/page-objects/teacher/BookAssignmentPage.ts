import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface AssignmentData {
  bookId?: string;
  bookTitle?: string;
  classId?: string;
  className?: string;
  dueDate?: string;
  notes?: string;
}

export class BookAssignmentPage extends BasePage {
  get pageTitle(): string {
    return 'Book Assignments';
  }

  get url(): string {
    return '/dashboard/teacher/assignments';
  }

  private get assignmentItems() {
    return this.page.locator('[data-testid^="assignment-"], .assignment-card, .assignment-item');
  }

  private get assignBookButton() {
    return this.page.locator('button:has-text("Assign Book"), button:has-text("New Assignment"), a:has-text("Assign")');
  }

  private get bookSelect() {
    return this.page.locator('select[name="bookId"], [data-testid="book-select"]');
  }

  private get classSelect() {
    return this.page.locator('select[name="classId"], [data-testid="class-select"]');
  }

  private get dueDateInput() {
    return this.page.locator('input[type="date"], input[name="dueDate"]');
  }

  private get notesInput() {
    return this.page.locator('textarea[name="notes"], input[name="notes"]');
  }

  private get submitButton() {
    return this.page.locator('button:has-text("Assign"), button:has-text("Save"), button[type="submit"]');
  }

  private get emptyAssignmentsMessage() {
    return this.page.locator('[data-testid="empty-assignments"], .empty-state, :has-text("No assignments")');
  }

  async getAssignmentCount(): Promise<number> {
    return await this.assignmentItems.count();
  }

  async hasAssignments(): Promise<boolean> {
    return (await this.getAssignmentCount()) > 0;
  }

  async openAssignBookModal(): Promise<void> {
    await this.assignBookButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectBook(bookTitle: string): Promise<void> {
    const bookOption = this.page.locator(`option:has-text("${bookTitle}")`);

    if (await bookOption.isVisible()) {
      await this.bookSelect.selectOption({ label: bookTitle });
    } else {
      // May be a searchable dropdown
      const searchInput = this.page.locator('input[placeholder*="book" i], input[placeholder*="search" i]');
      if (await searchInput.isVisible()) {
        await searchInput.fill(bookTitle);
        await this.page.keyboard.press('Enter');
      }
    }
  }

  async selectClass(className: string): Promise<void> {
    const classOption = this.page.locator(`option:has-text("${className}")`);

    if (await classOption.isVisible()) {
      await this.classSelect.selectOption({ label: className });
    }
  }

  async setDueDate(date: string): Promise<void> {
    await this.dueDateInput.fill(date);
  }

  async addNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes);
  }

  async submitAssignment(): Promise<void> {
    await this.submitButton.click();
    await this.waitForPageLoad();
  }

  async assignBook(data: AssignmentData): Promise<void> {
    await this.openAssignBookModal();

    if (data.bookTitle) {
      await this.selectBook(data.bookTitle);
    }

    if (data.className) {
      await this.selectClass(data.className);
    }

    if (data.dueDate) {
      await this.setDueDate(data.dueDate);
    }

    if (data.notes) {
      await this.addNotes(data.notes);
    }

    await this.submitAssignment();
  }

  async getAllAssignmentTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.assignmentItems.count();

    for (let i = 0; i < count; i++) {
      const titleElement = this.assignmentItems.nth(i).locator('.book-title, h3, h4, [data-testid="book-title"]');
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async removeAssignment(bookTitle: string): Promise<void> {
    const assignment = this.page.locator(`[data-testid^="assignment-"]:has-text("${bookTitle}")`);
    const removeButton = assignment.locator('button:has-text("Remove"), [aria-label="Remove"]');

    await removeButton.click();

    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Yes")');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForPageLoad();
  }

  async verifyEmptyAssignments(): Promise<void> {
    await expect(this.emptyAssignmentsMessage).toBeVisible();
  }
}
