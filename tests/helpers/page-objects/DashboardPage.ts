import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage, UserRole, TEST_ACCOUNTS } from './LoginPage';

export abstract class DashboardPage extends BasePage {
  protected loginPage: LoginPage;
  protected abstract readonly role: UserRole;

  constructor(page: Page) {
    super(page);
    this.loginPage = new LoginPage(page);
  }

  get url(): string {
    return TEST_ACCOUNTS[this.role].dashboardPath;
  }

  async ensureLoggedIn(): Promise<void> {
    const currentUrl = await this.getCurrentUrl();
    if (!currentUrl.includes(this.url)) {
      await this.loginPage.loginAs(this.role);
    }
  }

  async navigateAndVerify(): Promise<void> {
    await this.ensureLoggedIn();
    await this.navigate();
    await this.verifyPageLoaded();
  }

  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.url));
    await this.waitForPageLoad();
  }

  async getStats(): Promise<Record<string, string>> {
    const stats: Record<string, string> = {};
    const statCards = this.page.locator('[data-testid^="stat-"], .stat-card, .metric-card');
    const count = await statCards.count();

    for (let i = 0; i < count; i++) {
      const card = statCards.nth(i);
      const label = await card.locator('.stat-label, .metric-label, h3, h4').textContent();
      const value = await card.locator('.stat-value, .metric-value, .text-2xl, .text-3xl').textContent();
      if (label && value) {
        stats[label.trim()] = value.trim();
      }
    }

    return stats;
  }

  async clickNavItem(text: string): Promise<void> {
    const navItem = this.page.locator(`nav a:has-text("${text}"), aside a:has-text("${text}")`);
    await navItem.click();
    await this.waitForPageLoad();
  }

  async verifyUserInfo(): Promise<void> {
    const account = TEST_ACCOUNTS[this.role];
    const userInfo = this.page.locator('[data-testid="user-info"], .user-email, .user-name');
    if (await userInfo.isVisible()) {
      await expect(userInfo).toContainText(new RegExp(account.email.split('@')[0], 'i'));
    }
  }
}
