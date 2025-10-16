import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8001';
const WRITER_EMAIL = 'writer@test.1001stories.org';
const WRITER_PASSWORD = 'test123';

test.describe('Writer Dashboard - Alignment Verification', () => {

  test('LNB logo section and GNB should have exact same height', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', WRITER_EMAIL);
    await page.fill('input[name="password"]', WRITER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Stories")', { timeout: 5000 });

    // Get LNB logo section height
    const lnbLogoSection = page.locator('aside.lg\\:flex > div').first();
    const lnbHeight = await lnbLogoSection.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);
      return {
        height: rect.height,
        computedHeight: computedStyle.height
      };
    });

    console.log(`LNB logo section height: ${lnbHeight.height}px (computed: ${lnbHeight.computedHeight})`);

    // Get GNB container height
    const gnbContainer = page.locator('header.fixed.top-0 > div');
    const gnbHeight = await gnbContainer.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);
      return {
        height: rect.height,
        computedHeight: computedStyle.height
      };
    });

    console.log(`GNB container height: ${gnbHeight.height}px (computed: ${gnbHeight.computedHeight})`);

    // Both should be exactly 60px
    expect(lnbHeight.height).toBe(60);
    expect(gnbHeight.height).toBe(60);

    // Heights should match exactly
    expect(lnbHeight.height).toBe(gnbHeight.height);
  });

  test('Border lines should align perfectly', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', WRITER_EMAIL);
    await page.fill('input[name="password"]', WRITER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Stories")', { timeout: 5000 });

    // Get LNB logo section bottom position
    const lnbLogoSection = page.locator('aside.lg\\:flex > div').first();
    const lnbBottom = await lnbLogoSection.evaluate(el => {
      return el.getBoundingClientRect().bottom;
    });

    console.log(`LNB logo section bottom: ${lnbBottom}px`);

    // Get GNB bottom position
    const gnb = page.locator('header.fixed.top-0');
    const gnbBottom = await gnb.evaluate(el => {
      return el.getBoundingClientRect().bottom;
    });

    console.log(`GNB bottom: ${gnbBottom}px`);

    // The border lines should be at the same position (allowing 1px tolerance for rendering)
    expect(Math.abs(lnbBottom - gnbBottom)).toBeLessThanOrEqual(1);
  });
});
