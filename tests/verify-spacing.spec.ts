import { test, expect } from '@playwright/test';

test.describe('Volunteer Dashboard Spacing Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as volunteer
    await page.goto('/login');
    await page.fill('input[type="email"]', 'volunteer@test.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/volunteer', { timeout: 10000 });
  });

  test('should have correct spacing between GNB and content', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Stories")', { timeout: 5000 });

    // Get GNB bottom position
    const gnb = page.locator('header.fixed.top-0');
    const gnbBox = await gnb.boundingBox();
    expect(gnbBox).not.toBeNull();

    // Get Stories title top position
    const storiesTitle = page.locator('h1:has-text("Stories")');
    const titleBox = await storiesTitle.boundingBox();
    expect(titleBox).not.toBeNull();

    // Calculate spacing
    const spacing = titleBox!.y - gnbBox!.bottom;

    console.log(`GNB bottom: ${gnbBox!.bottom}px`);
    console.log(`Stories title top: ${titleBox!.y}px`);
    console.log(`Spacing between GNB and content: ${spacing}px`);

    // Should have at least 40px spacing (pt-[80px] layout + pt-6 page - GNB height)
    expect(spacing).toBeGreaterThan(40);
  });

  test('should have proper layout container padding', async ({ page }) => {
    await page.waitForSelector('h1:has-text("Stories")', { timeout: 5000 });

    // Check the main content container
    const mainContent = page.locator('div.lg\\:ml-60');
    const styles = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).paddingTop;
    });

    console.log(`Main content padding-top: ${styles}`);

    // Should be 80px (pt-[80px])
    expect(styles).toBe('80px');
  });
});
