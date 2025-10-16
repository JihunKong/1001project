import { test, expect } from '@playwright/test';

test('test volunteer page navigation', async ({ page }) => {
  page.on('console', msg => {
    console.log('[Browser]:', msg.text());
  });

  page.on('pageerror', error => {
    console.log('[Error]:', error.message);
  });

  console.log('Navigating to volunteer page...');
  await page.goto('https://1001stories.seedsofempowerment.org/dashboard/writer/submit-text');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'tests/screenshots/volunteer-page.png', fullPage: true });
  console.log('Screenshot saved');

  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  if (currentUrl.includes('/login')) {
    console.log('Redirected to login - authentication required');
    return;
  }

  const sidebar = await page.locator('aside').count();
  console.log('Sidebar elements:', sidebar);

  const allLinks = await page.locator('a').count();
  console.log('Total links:', allLinks);

  const homeLink = await page.locator('a[href="/dashboard/writer"]').count();
  console.log('Home link found:', homeLink);

  if (homeLink > 0) {
    const homeLinkElement = page.locator('a[href="/dashboard/writer"]').first();
    const isVisible = await homeLinkElement.isVisible();
    console.log('Home link visible:', isVisible);

    try {
      console.log('Attempting to click home link...');
      await homeLinkElement.click({ timeout: 5000, force: true });
      console.log('Click succeeded');

      await page.waitForTimeout(1000);
      const newUrl = page.url();
      console.log('URL after click:', newUrl);
    } catch (e) {
      console.log('Click failed');
    }
  }

  const scriptTags = await page.locator('script[src*="_next"]').count();
  console.log('Next.js scripts loaded:', scriptTags);
});
