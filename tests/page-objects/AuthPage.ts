import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async navigateToLogin() {
    await this.page.goto('/login');
  }

  async navigateToSignup() {
    await this.page.goto('/signup');
  }

  async loginWithPassword(email: string, password: string) {
    await this.navigateToLogin();
    await this.page.waitForLoadState('networkidle');
    
    await this.page.fill('input[name="email"], input[type="email"]', email);
    await this.page.fill('input[name="password"], input[type="password"]', password);
    
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")')
    ]);
  }

  async loginWithMagicLink(email: string) {
    await this.navigateToLogin();
    await this.page.fill('input[name="email"], input[type="email"]', email);
    await this.page.click('button:has-text("Send Magic Link")');
    await this.page.waitForSelector('text=Check your email');
  }

  async logout() {
    const userMenuSelectors = [
      '[data-testid="user-menu"]',
      'button:has-text("Account")',
      '[aria-label="User menu"]',
      'img[alt*="avatar"]',
      'button:has(img[src*="avatar"])'
    ];

    for (const selector of userMenuSelectors) {
      try {
        await this.page.click(selector, { timeout: 5000 });
        break;
      } catch {
        continue;
      }
    }

    await this.page.click('button:has-text("Sign Out"), button:has-text("Logout")');
    await this.page.waitForURL('**/');
  }

  async verifyLoggedIn() {
    await expect(this.page).toHaveURL(/\/(dashboard|admin)/);
  }

  async verifyLoggedOut() {
    await expect(this.page).toHaveURL(/^((?!dashboard|admin).)*$/);
  }

  async selectRole(role: 'LEARNER' | 'TEACHER') {
    await this.page.click(`[data-role="${role}"], button:has-text("${role}")`, { timeout: 10000 });
  }
}