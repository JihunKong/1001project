import { test as base, Browser, BrowserContext, Page, expect } from '@playwright/test';
import { TEST_ACCOUNTS, UserRole } from '../helpers/page-objects/LoginPage';

type RolePages = Partial<Record<UserRole, Page>>;
type RoleContexts = Partial<Record<UserRole, BrowserContext>>;

interface MultiContextFixtures {
  rolePages: RolePages;
  roleContexts: RoleContexts;
  getPage: (role: UserRole) => Promise<Page>;
  closePage: (role: UserRole) => Promise<void>;
}

async function loginWithRole(page: Page, role: UserRole, baseURL: string): Promise<void> {
  const account = TEST_ACCOUNTS[role];
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      const emailInput = page.locator('input[type="email"], input[name="email"]');
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(account.email);
      await page.waitForTimeout(300);

      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      await passwordInput.fill(account.password);
      await page.waitForTimeout(300);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForURL(/\/dashboard\/|\/admin/, { timeout: 45000, waitUntil: 'domcontentloaded' });

      const finalUrl = page.url();
      if (!finalUrl.includes(account.dashboardPath)) {
        console.log(`[Multi-Context] ⚠️ Role mismatch for ${role}: expected ${account.dashboardPath}, got ${finalUrl}`);
        const response = await page.goto(`${baseURL}${account.dashboardPath}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

        if (response?.status() === 404) {
          throw new Error(`[Multi-Context] ❌ 404 error for ${role} at ${account.dashboardPath}`);
        }
        await page.waitForTimeout(1000);
      }

      const verifyUrl = page.url();
      if (!verifyUrl.includes(account.dashboardPath)) {
        throw new Error(`[Multi-Context] ❌ Role verification failed for ${role}: expected ${account.dashboardPath}, got ${verifyUrl}`);
      }

      const pageTitle = await page.title();
      const pageText = await page.locator('h1, h2, main').first().textContent().catch(() => '');
      const is404Page = (pageTitle.includes('404') || pageText?.includes('404')) &&
                        (pageText?.toLowerCase().includes('not found') || pageText?.toLowerCase().includes('page could not be found'));

      if (is404Page) {
        throw new Error(`[Multi-Context] ❌ 404 page detected for ${role} at ${account.dashboardPath} (title: ${pageTitle})`);
      }

      console.log(`[Multi-Context] ✅ ${role} verified at ${account.dashboardPath}`);
      return;
    } catch (error) {
      console.log(`Login attempt ${attempt}/${maxAttempts} failed for ${role}: ${error}`);
      if (attempt === maxAttempts) {
        throw new Error(`Failed to login as ${role} after ${maxAttempts} attempts`);
      }
      await page.waitForTimeout(2000);
    }
  }
}

export const test = base.extend<MultiContextFixtures>({
  rolePages: [async ({ browser }, use) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:8001';
    const pages: RolePages = {};
    const contexts: BrowserContext[] = [];

    const createRolePage = async (role: UserRole): Promise<Page> => {
      const context = await browser.newContext();
      contexts.push(context);
      const page = await context.newPage();

      await loginWithRole(page, role, baseURL);
      pages[role] = page;

      console.log(`[Multi-Context] Created page for ${role}`);
      return page;
    };

    const roles: UserRole[] = ['writer', 'storyManager', 'bookManager', 'contentAdmin'];

    console.log(`[Multi-Context] Logging in ${roles.length} roles in parallel...`);
    const startTime = Date.now();

    await Promise.all(roles.map(role => createRolePage(role)));

    const elapsed = Date.now() - startTime;
    console.log(`[Multi-Context] All ${roles.length} roles logged in (${elapsed}ms)`);

    await use(pages);

    for (const ctx of contexts) {
      try {
        await ctx.close();
      } catch (e) {
        console.log('[Multi-Context] Context already closed');
      }
    }
  }, { scope: 'test', timeout: 180000 }],

  roleContexts: [async ({ browser }, use) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:8001';
    const contexts: RoleContexts = {};
    const allContexts: BrowserContext[] = [];

    const createRoleContext = async (role: UserRole): Promise<BrowserContext> => {
      const context = await browser.newContext();
      allContexts.push(context);
      const page = await context.newPage();

      await loginWithRole(page, role, baseURL);
      contexts[role] = context;

      return context;
    };

    const roles: UserRole[] = ['writer', 'storyManager', 'bookManager', 'contentAdmin'];
    await Promise.all(roles.map(role => createRoleContext(role)));

    await use(contexts);

    for (const ctx of allContexts) {
      try {
        await ctx.close();
      } catch (e) {
        console.log('[Multi-Context] Context already closed');
      }
    }
  }, { scope: 'test', timeout: 180000 }],

  getPage: async ({ browser, rolePages }, use) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:8001';
    const additionalContexts: BrowserContext[] = [];

    const getPageFn = async (role: UserRole): Promise<Page> => {
      if (rolePages[role]) {
        return rolePages[role]!;
      }

      const context = await browser.newContext();
      additionalContexts.push(context);
      const page = await context.newPage();

      await loginWithRole(page, role, baseURL);
      rolePages[role] = page;

      console.log(`[Multi-Context] Lazily created page for ${role}`);
      return page;
    };

    await use(getPageFn);

    for (const ctx of additionalContexts) {
      try {
        await ctx.close();
      } catch (e) {
        console.log('[Multi-Context] Additional context already closed');
      }
    }
  },

  closePage: async ({ rolePages, roleContexts }, use) => {
    const closePageFn = async (role: UserRole): Promise<void> => {
      const page = rolePages[role];
      if (page) {
        try {
          await page.close();
          delete rolePages[role];
        } catch (e) {
          console.log(`[Multi-Context] Failed to close page for ${role}`);
        }
      }
    };

    await use(closePageFn);
  },
});

export { expect };
