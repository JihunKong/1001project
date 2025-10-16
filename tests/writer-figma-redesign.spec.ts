import { test, expect } from '@playwright/test';

/**
 * Phase 1 Volunteer Dashboard Figma Redesign Tests
 *
 * Tests the new Figma design system components:
 * - VolunteerLNB (Left Navigation Bar)
 * - GlobalNavigationBar (Top Navigation)
 * - Accessibility features (WCAG 2.1 AA)
 * - No infinite redirect loops
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8001';
const VOLUNTEER_EMAIL = 'volunteer@test.1001stories.org';
const VOLUNTEER_PASSWORD = 'test123';

test.describe('Volunteer Dashboard - Phase 1 Figma Redesign', () => {

  test('should login successfully without infinite redirects', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);

    // Click Password tab
    await page.click('button:has-text("Password")');

    // Fill in credentials
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to volunteer dashboard
    // CRITICAL: Should not infinite redirect
    await page.waitForURL(`${BASE_URL}/dashboard/writer`, { timeout: 10000 });

    // Verify we're on the correct page
    expect(page.url()).toBe(`${BASE_URL}/dashboard/writer`);
  });

  test('should display VolunteerLNB (Left Navigation Bar) on desktop', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Check LNB is visible on desktop
    const lnb = page.locator('aside.lg\\:flex'); // Desktop sidebar
    await expect(lnb).toBeVisible();

    // Verify LNB width is 240px (Figma spec)
    const lnbWidth = await lnb.evaluate(el => window.getComputedStyle(el).width);
    expect(lnbWidth).toBe('240px');

    // Check for navigation items (use more specific selector to avoid logo link)
    const homeLink = page.locator('aside a[href="/dashboard/writer"]').first();
    await expect(homeLink).toBeVisible();
  });

  test('should display mobile bottom navigation on mobile', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Desktop sidebar should be hidden
    const desktopLnb = page.locator('aside.lg\\:flex');
    await expect(desktopLnb).toBeHidden();

    // Mobile bottom nav should be visible
    const mobileNav = page.locator('nav.lg\\:hidden.fixed.bottom-0');
    await expect(mobileNav).toBeVisible();
  });

  test('should display GlobalNavigationBar with user dropdown', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Check GlobalNavigationBar is visible
    const gnb = page.locator('header.fixed.top-0');
    await expect(gnb).toBeVisible();

    // Check for user dropdown button
    const userDropdownBtn = page.locator('button[aria-haspopup="true"]');
    await expect(userDropdownBtn).toBeVisible();

    // Click to open dropdown
    await userDropdownBtn.click();

    // Check dropdown menu is visible
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Check for sign out button
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await expect(signOutBtn).toBeVisible();
  });

  test('should close user dropdown with Escape key (keyboard trap)', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Open user dropdown
    const userDropdownBtn = page.locator('button[aria-haspopup="true"]');
    await userDropdownBtn.click();

    // Verify dropdown is open
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Press Escape key
    await page.keyboard.press('Escape');

    // Verify dropdown is closed
    await expect(dropdownMenu).toBeHidden();
  });

  test('should trap focus within user dropdown menu (Tab key)', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Open user dropdown
    const userDropdownBtn = page.locator('button[aria-haspopup="true"]');
    await userDropdownBtn.click();

    // Get all focusable elements in menu
    const menuItems = page.locator('[role="menu"] a, [role="menu"] button');
    const firstItem = menuItems.first();
    const lastItem = menuItems.last();

    // Focus first item
    await firstItem.focus();

    // Tab through to last item
    const itemCount = await menuItems.count();
    for (let i = 0; i < itemCount - 1; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify focus is on last item
    await expect(lastItem).toBeFocused();

    // Tab again - should cycle to first item
    await page.keyboard.press('Tab');
    await expect(firstItem).toBeFocused();
  });

  test('should have skip navigation link for accessibility', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Tab to skip link (it becomes visible on focus)
    await page.keyboard.press('Tab');

    // Check for skip link
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();

    // Click skip link
    await skipLink.click();

    // Verify main content is focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should use WCAG AA compliant colors (4.5:1 contrast ratio)', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Check that inactive text uses #6B7280 (not #8E8E93)
    const inactiveText = page.locator('.text-figma-gray-inactive').first();
    const color = await inactiveText.evaluate(el => window.getComputedStyle(el).color);

    // RGB for #6B7280 is rgb(107, 114, 128)
    expect(color).toBe('rgb(107, 114, 128)');
  });

  test('should handle sign out correctly', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Open user dropdown
    const userDropdownBtn = page.locator('button[aria-haspopup="true"]');
    await userDropdownBtn.click();

    // Click sign out
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    await signOutBtn.click();

    // Should redirect to login or home page
    await page.waitForURL(/\/(login)?$/, { timeout: 10000 });

    // Verify we're logged out (should not be able to access dashboard)
    await page.goto(`${BASE_URL}/dashboard/writer`);
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 10000 });
  });

  test('should display volunteer dashboard with Figma design system', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Check for Figma design system classes
    const page_element = page.locator('[data-role="writer"]');
    await expect(page_element).toBeVisible();

    // Check for main content area
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Check page title
    await expect(page).toHaveTitle(/1001 Stories/);
  });

  test('should have correct spacing between GNB and main content', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.click('button:has-text("Password")');
    await page.fill('input[name="email"]', VOLUNTEER_EMAIL);
    await page.fill('input[name="password"]', VOLUNTEER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard/writer`);

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Stories")', { timeout: 5000 });

    // Check main content container has correct padding-top
    const mainContent = page.locator('div.lg\\:ml-60');
    const paddingTop = await mainContent.evaluate(el => window.getComputedStyle(el).paddingTop);

    console.log(`Main content padding-top: ${paddingTop}`);

    // Should be 80px (pt-[80px] from layout.tsx)
    expect(paddingTop).toBe('80px');

    // Measure actual spacing between GNB bottom and Stories title
    const gnb = page.locator('header.fixed.top-0');
    const gnbBox = await gnb.boundingBox();

    const storiesTitle = page.locator('h1:has-text("Stories")');
    const titleBox = await storiesTitle.boundingBox();

    if (gnbBox && titleBox) {
      const spacing = titleBox.y - gnbBox.bottom;
      console.log(`GNB bottom: ${gnbBox.bottom}px`);
      console.log(`Stories title top: ${titleBox.y}px`);
      console.log(`Spacing: ${spacing}px`);

      // Should have at least 40px spacing
      expect(spacing).toBeGreaterThan(40);
    }
  });
});
