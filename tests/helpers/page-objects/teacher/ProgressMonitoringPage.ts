import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface StudentProgress {
  studentName: string;
  booksAssigned: number;
  booksCompleted: number;
  percentComplete: number;
}

export class ProgressMonitoringPage extends BasePage {
  get pageTitle(): string {
    return 'Student Progress';
  }

  get url(): string {
    return '/dashboard/teacher/progress';
  }

  private get classFilter() {
    return this.page.locator('select[name="classId"], [data-testid="class-filter"]');
  }

  private get studentRows() {
    return this.page.locator('[data-testid^="student-"], .student-row, tr.student-entry');
  }

  private get overallProgressCard() {
    return this.page.locator('[data-testid="overall-progress"], .progress-overview, .stat-card:has-text("Progress")');
  }

  private get exportButton() {
    return this.page.locator('button:has-text("Export"), button:has-text("Download")');
  }

  async filterByClass(className: string): Promise<void> {
    await this.classFilter.selectOption({ label: className });
    await this.waitForPageLoad();
  }

  async getStudentCount(): Promise<number> {
    return await this.studentRows.count();
  }

  async getStudentProgress(studentName: string): Promise<StudentProgress | null> {
    const studentRow = this.page.locator(`[data-testid^="student-"]:has-text("${studentName}")`);

    if (!(await studentRow.isVisible())) {
      return null;
    }

    const assignedElement = studentRow.locator('[data-testid="books-assigned"], .books-assigned');
    const completedElement = studentRow.locator('[data-testid="books-completed"], .books-completed');
    const progressElement = studentRow.locator('[data-testid="percent-complete"], .progress-percent');

    const assigned = parseInt((await assignedElement.textContent()) || '0');
    const completed = parseInt((await completedElement.textContent()) || '0');

    const progressText = await progressElement.textContent();
    const percentMatch = progressText?.match(/(\d+)/);
    const percent = percentMatch ? parseInt(percentMatch[1]) : 0;

    return {
      studentName,
      booksAssigned: assigned,
      booksCompleted: completed,
      percentComplete: percent,
    };
  }

  async getAllStudentNames(): Promise<string[]> {
    const names: string[] = [];
    const count = await this.studentRows.count();

    for (let i = 0; i < count; i++) {
      const nameElement = this.studentRows.nth(i).locator('.student-name, [data-testid="student-name"]');
      const name = await nameElement.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  async getOverallProgress(): Promise<{ average: number; total: number }> {
    const progressText = await this.overallProgressCard.textContent();

    const percentMatch = progressText?.match(/(\d+)%/);
    const totalMatch = progressText?.match(/(\d+)\s*students?/i);

    return {
      average: percentMatch ? parseInt(percentMatch[1]) : 0,
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
    };
  }

  async clickStudentDetails(studentName: string): Promise<void> {
    const studentRow = this.page.locator(`[data-testid^="student-"]:has-text("${studentName}")`);
    await studentRow.click();
    await this.waitForPageLoad();
  }

  async exportProgress(): Promise<void> {
    if (await this.exportButton.isVisible()) {
      await this.exportButton.click();
      await this.waitForPageLoad();
    }
  }

  async verifyProgressLoaded(): Promise<void> {
    const hasStudents = (await this.getStudentCount()) > 0;
    const hasOverview = await this.overallProgressCard.isVisible();

    expect(hasStudents || hasOverview).toBe(true);
  }
}
