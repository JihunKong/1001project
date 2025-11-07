import { Page, BrowserContext } from '@playwright/test';

export interface TestAccount {
  email: string;
  password: string;
  dashboard: string;
  role: string;
}

export const TEST_ACCOUNTS = {
  learner: {
    email: 'learner@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/learner',
    role: 'LEARNER',
  },
  teacher: {
    email: 'teacher@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/teacher',
    role: 'TEACHER',
  },
  writer: {
    email: 'writer@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/writer',
    role: 'WRITER',
  },
  institution: {
    email: 'institution@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/institution',
    role: 'INSTITUTION',
  },
  storyManager: {
    email: 'story-manager@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/story-manager',
    role: 'STORY_MANAGER',
  },
  bookManager: {
    email: 'book-manager@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/book-manager',
    role: 'BOOK_MANAGER',
  },
  contentAdmin: {
    email: 'content-admin@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/content-admin',
    role: 'CONTENT_ADMIN',
  },
  admin: {
    email: 'admin@test.1001stories.org',
    password: 'test1234',
    dashboard: '/dashboard/admin',
    role: 'ADMIN',
  },
} as const;

async function loginWithPassword(
  page: Page,
  account: TestAccount
): Promise<void> {
  console.log(`🔐 Logging in as ${account.role}: ${account.email}`);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[name="email"], input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(account.email);
  console.log(`✓ Email filled: ${account.email}`);

  const passwordInput = page.locator('input[name="password"], input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(account.password);
  console.log('✓ Password filled');

  const submitButton = page.locator(
    'button[type="submit"]:has-text("Sign in"), button[type="submit"]:has-text("Log in"), button:has-text("Sign in"), button:has-text("Log in")'
  );
  await submitButton.click();
  console.log('✓ Submit button clicked');

  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15000,
  });

  console.log(`✅ Logged in successfully as ${account.role}`);
}

async function loginAs(
  page: Page,
  roleName: keyof typeof TEST_ACCOUNTS
): Promise<void> {
  const account = TEST_ACCOUNTS[roleName];
  await loginWithPassword(page, account);
}

async function logoutUser(page: Page): Promise<void> {
  console.log('🚪 Logging out user...');

  const logoutButton = page.locator(
    'button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), a:has-text("Sign out")'
  );

  if (await logoutButton.count() > 0) {
    await logoutButton.first().click();
    await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname === '/', {
      timeout: 10000,
    });
    console.log('✅ User logged out successfully');
  } else {
    await page.goto('/api/auth/signout');
    await page.waitForLoadState('networkidle');
    console.log('✅ User logged out via API');
  }
}

async function switchUserContext(
  context: BrowserContext,
  newRoleName: keyof typeof TEST_ACCOUNTS
): Promise<Page> {
  console.log(`🔄 Switching to ${newRoleName} context...`);

  const newPage = await context.newPage();
  await loginAs(newPage, newRoleName);

  console.log(`✅ Switched to ${newRoleName} context`);
  return newPage;
}

async function getAuthCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();

  const sessionCookie = cookies.find(
    (cookie) =>
      cookie.name === 'next-auth.session-token' ||
      cookie.name === '__Secure-next-auth.session-token' ||
      cookie.name.includes('session')
  );

  if (sessionCookie) {
    console.log(`✅ Found auth cookie: ${sessionCookie.name}`);
    return sessionCookie.value;
  }

  console.log('⚠️  No auth cookie found');
  return null;
}

async function isAuthenticated(page: Page): Promise<boolean> {
  const authCookie = await getAuthCookie(page);
  return authCookie !== null;
}

async function waitForDashboardLoad(
  page: Page,
  expectedDashboard: string,
  timeout: number = 15000
): Promise<void> {
  console.log(`⏳ Waiting for dashboard ${expectedDashboard} to load...`);

  await page.waitForURL((url) => url.pathname.includes(expectedDashboard), {
    timeout,
  });

  await page.waitForLoadState('networkidle');

  console.log('✅ Dashboard loaded successfully');
}

async function ensureLoggedIn(
  page: Page,
  roleName: keyof typeof TEST_ACCOUNTS
): Promise<void> {
  const authenticated = await isAuthenticated(page);

  if (!authenticated) {
    console.log('⚠️  Not authenticated, logging in...');
    await loginAs(page, roleName);
  } else {
    console.log('✅ Already authenticated');
  }
}

async function verifyUserRole(
  page: Page,
  expectedRole: string
): Promise<boolean> {
  console.log(`🔍 Verifying user role: ${expectedRole}`);

  const response = await page.request.get('/api/auth/session');

  if (!response.ok()) {
    console.log('❌ Failed to fetch session');
    return false;
  }

  const session = await response.json();
  const actualRole = session.user?.role;

  if (actualRole === expectedRole) {
    console.log(`✅ Role verified: ${actualRole}`);
    return true;
  } else {
    console.log(`❌ Role mismatch: expected ${expectedRole}, got ${actualRole}`);
    return false;
  }
}

export {
  loginWithPassword,
  loginAs,
  logoutUser,
  switchUserContext,
  getAuthCookie,
  isAuthenticated,
  waitForDashboardLoad,
  ensureLoggedIn,
  verifyUserRole,
};
