import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface InstitutionAnalytics {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  averageProgress: number;
  booksAssigned: number;
  booksCompleted: number;
}

export class AnalyticsPage extends BasePage {
  get pageTitle(): string {
    return 'Analytics';
  }

  get url(): string {
    return '/dashboard/institution/analytics';
  }

  private get dateRangeSelector() {
    return this.page.locator('select[name="dateRange"], [data-testid="date-range"]');
  }

  private get summaryCards() {
    return this.page.locator('.stat-card, .analytics-card, [data-testid^="analytics-"]');
  }

  private get progressChart() {
    return this.page.locator('[data-testid="progress-chart"], .progress-chart, canvas');
  }

  private get teacherPerformanceTable() {
    return this.page.locator('[data-testid="teacher-performance"], .teacher-table, table');
  }

  private get exportButton() {
    return this.page.locator('button:has-text("Export"), button:has-text("Download")');
  }

  async selectDateRange(range: 'week' | 'month' | 'quarter' | 'year'): Promise<void> {
    await this.dateRangeSelector.selectOption(range);
    await this.waitForPageLoad();
  }

  async getAnalyticsSummary(): Promise<Partial<InstitutionAnalytics>> {
    const stats: Partial<InstitutionAnalytics> = {};

    const cards = await this.summaryCards.all();

    for (const card of cards) {
      const text = await card.textContent();
      if (!text) continue;

      const numberMatch = text.match(/(\d+)/);
      const value = numberMatch ? parseInt(numberMatch[1]) : 0;

      if (text.toLowerCase().includes('teacher')) {
        stats.totalTeachers = value;
      } else if (text.toLowerCase().includes('student') || text.toLowerCase().includes('learner')) {
        stats.totalStudents = value;
      } else if (text.toLowerCase().includes('class')) {
        stats.totalClasses = value;
      } else if (text.toLowerCase().includes('progress')) {
        stats.averageProgress = value;
      } else if (text.toLowerCase().includes('assigned')) {
        stats.booksAssigned = value;
      } else if (text.toLowerCase().includes('completed')) {
        stats.booksCompleted = value;
      }
    }

    return stats;
  }

  async hasProgressChart(): Promise<boolean> {
    return await this.progressChart.isVisible();
  }

  async hasTeacherPerformanceTable(): Promise<boolean> {
    return await this.teacherPerformanceTable.isVisible();
  }

  async exportAnalytics(): Promise<void> {
    if (await this.exportButton.isVisible()) {
      await this.exportButton.click();
      await this.waitForPageLoad();
    }
  }

  async verifyAnalyticsLoaded(): Promise<void> {
    const hasCards = (await this.summaryCards.count()) > 0;
    const hasChart = await this.hasProgressChart();
    const hasTable = await this.hasTeacherPerformanceTable();

    expect(hasCards || hasChart || hasTable).toBe(true);
  }

  async getTeacherPerformance(): Promise<Array<{ name: string; students: number; progress: number }>> {
    const performance: Array<{ name: string; students: number; progress: number }> = [];

    if (!(await this.hasTeacherPerformanceTable())) {
      return performance;
    }

    const rows = this.teacherPerformanceTable.locator('tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');

      const name = (await cells.nth(0).textContent()) || '';
      const studentsText = (await cells.nth(1).textContent()) || '0';
      const progressText = (await cells.nth(2).textContent()) || '0';

      const studentsMatch = studentsText.match(/(\d+)/);
      const progressMatch = progressText.match(/(\d+)/);

      performance.push({
        name: name.trim(),
        students: studentsMatch ? parseInt(studentsMatch[1]) : 0,
        progress: progressMatch ? parseInt(progressMatch[1]) : 0,
      });
    }

    return performance;
  }
}
