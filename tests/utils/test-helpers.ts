import { Page, expect, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Authentication helpers
 */
export class AuthHelper {
  constructor(private page: Page) {}
  
  async login(email: string, password: string): Promise<void> {
    await this.page.goto('/auth/signin');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/dashboard/**');
  }
  
  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('text=Sign Out');
    await this.page.waitForURL('/');
  }
  
  async loginWithMagicLink(email: string): Promise<void> {
    await this.page.goto('/auth/signin');
    await this.page.click('text=Sign in with email');
    await this.page.fill('input[name="email"]', email);
    await this.page.click('button:has-text("Send Magic Link")');
    
    // In test environment, we would fetch the link from MailHog
    const magicLink = await this.getMagicLinkFromEmail(email);
    await this.page.goto(magicLink);
  }
  
  private async getMagicLinkFromEmail(email: string): Promise<string> {
    // Fetch from MailHog API
    const response = await fetch('http://localhost:8025/api/v2/messages');
    const data = await response.json();
    
    const message = data.items.find((item: any) => 
      item.To[0].Mailbox === email.split('@')[0]
    );
    
    if (!message) {
      throw new Error(`No email found for ${email}`);
    }
    
    // Extract magic link from email body
    const body = message.Content.Body;
    const linkMatch = body.match(/http:\/\/localhost:3001\/auth\/verify\?token=[a-zA-Z0-9]+/);
    
    if (!linkMatch) {
      throw new Error('Magic link not found in email');
    }
    
    return linkMatch[0];
  }
  
  async saveAuthState(context: BrowserContext, filepath: string): Promise<void> {
    await context.storageState({ path: filepath });
  }
}

/**
 * Data generation helpers
 */
export class DataHelper {
  static generateUser(role: string) {
    return {
      email: faker.internet.email().toLowerCase(),
      password: 'TestPass123!',
      name: faker.person.fullName(),
      role: role
    };
  }
  
  static generateStory() {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(5),
      tags: faker.lorem.words(3).split(' '),
      language: faker.helpers.arrayElement(['en', 'ko'])
    };
  }
  
  static generateClass() {
    return {
      name: `${faker.lorem.word()} Class`,
      gradeLevel: faker.helpers.arrayElement(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']),
      subject: faker.helpers.arrayElement(['Math', 'Science', 'English', 'History', 'Art']),
      code: faker.string.alphanumeric(6).toUpperCase()
    };
  }
  
  static generateProject() {
    return {
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      startDate: faker.date.future().toISOString().split('T')[0],
      endDate: faker.date.future({ years: 1 }).toISOString().split('T')[0],
      skills: faker.lorem.words(3).split(' '),
      location: faker.helpers.arrayElement(['Remote', 'New York', 'Seoul', 'London', 'Tokyo'])
    };
  }
}

/**
 * Wait helpers
 */
export class WaitHelper {
  constructor(private page: Page) {}
  
  async waitForAPIResponse(url: string | RegExp, timeout = 10000): Promise<any> {
    const response = await this.page.waitForResponse(url, { timeout });
    return response.json();
  }
  
  async waitForElementAndClick(selector: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout, state: 'visible' });
    await this.page.click(selector);
  }
  
  async waitForText(text: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }
  
  async waitForLoadComplete(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }
  
  async waitForAnimation(): Promise<void> {
    await this.page.waitForTimeout(500); // Wait for animations to complete
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelper {
  constructor(private page: Page) {}
  
  async assertToastMessage(message: string | RegExp): Promise<void> {
    const toast = this.page.locator('[role="status"], [role="alert"]').filter({ hasText: message });
    await expect(toast).toBeVisible();
  }
  
  async assertErrorMessage(message: string | RegExp): Promise<void> {
    const error = this.page.locator('[role="alert"], .error-message').filter({ hasText: message });
    await expect(error).toBeVisible();
  }
  
  async assertPageTitle(title: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(title);
  }
  
  async assertURL(url: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(url);
  }
  
  async assertElementCount(selector: string, count: number): Promise<void> {
    await expect(this.page.locator(selector)).toHaveCount(count);
  }
  
  async assertTableRowCount(count: number): Promise<void> {
    await expect(this.page.locator('tbody tr')).toHaveCount(count);
  }
}

/**
 * Database helpers
 */
export class DatabaseHelper {
  private dbUrl: string;
  
  constructor(dbUrl = process.env.DATABASE_URL || 'postgresql://test_user:test_password_123@localhost:5433/stories_test_db') {
    this.dbUrl = dbUrl;
  }
  
  async resetDatabase(): Promise<void> {
    // Run prisma reset
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('npx prisma migrate reset --force', (error: any, stdout: any, stderr: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
  
  async seedDatabase(): Promise<void> {
    // Run prisma seed
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('npx prisma db seed', (error: any, stdout: any, stderr: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
  
  async cleanupTestData(prefix = 'test_'): Promise<void> {
    // Clean up test data with specific prefix
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: prefix
          }
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  }
}

/**
 * API helpers
 */
export class APIHelper {
  constructor(private page: Page) {}
  
  async callAPI(method: string, endpoint: string, data?: any): Promise<any> {
    const response = await this.page.evaluate(async ({ method, endpoint, data }) => {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : undefined
      });
      return {
        status: res.status,
        data: await res.json()
      };
    }, { method, endpoint, data });
    
    return response;
  }
  
  async getAuthToken(): Promise<string> {
    const cookies = await this.page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    return sessionCookie?.value || '';
  }
  
  async mockAPIResponse(url: string | RegExp, response: any): Promise<void> {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
  
  async interceptAPICall(url: string | RegExp): Promise<any[]> {
    const calls: any[] = [];
    
    await this.page.route(url, route => {
      calls.push({
        url: route.request().url(),
        method: route.request().method(),
        headers: route.request().headers(),
        postData: route.request().postData()
      });
      route.continue();
    });
    
    return calls;
  }
}

/**
 * Screenshot helpers
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}
  
  async takeFullPageScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `test-artifacts/screenshots/${name}.png`,
      fullPage: true
    });
  }
  
  async takeElementScreenshot(selector: string, name: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.screenshot({
      path: `test-artifacts/screenshots/${name}.png`
    });
  }
  
  async compareScreenshots(name: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(name, {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  }
}

/**
 * Accessibility helpers
 */
export class AccessibilityHelper {
  constructor(private page: Page) {}
  
  async checkAccessibility(options?: any): Promise<any> {
    const AxeBuilder = require('@axe-core/playwright').default;
    const results = await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    return results;
  }
  
  async checkColorContrast(): Promise<boolean> {
    const results = await this.checkAccessibility();
    const contrastViolations = results.violations.filter(
      (v: any) => v.id === 'color-contrast'
    );
    return contrastViolations.length === 0;
  }
  
  async checkKeyboardNavigation(): Promise<boolean> {
    // Tab through page and check if all interactive elements are reachable
    const elements = await this.page.evaluate(() => {
      const interactive = document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      return interactive.length;
    });
    
    for (let i = 0; i < elements; i++) {
      await this.page.keyboard.press('Tab');
      const focused = await this.page.evaluate(() => {
        return document.activeElement !== document.body;
      });
      if (!focused) return false;
    }
    
    return true;
  }
}

/**
 * Performance helpers
 */
export class PerformanceHelper {
  constructor(private page: Page) {}
  
  async measurePageLoad(): Promise<number> {
    const startTime = Date.now();
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }
  
  async getWebVitals(): Promise<any> {
    return this.page.evaluate(() => {
      return new Promise((resolve) => {
        let fcp, lcp, cls, fid, ttfb;
        
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          fcp = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['paint'] });
        
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          lcp = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        setTimeout(() => {
          resolve({ fcp, lcp, cls, fid, ttfb });
        }, 3000);
      });
    });
  }
  
  async measureAPIResponseTime(endpoint: string): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForResponse(response => 
      response.url().includes(endpoint) && response.status() === 200
    );
    return Date.now() - startTime;
  }
}