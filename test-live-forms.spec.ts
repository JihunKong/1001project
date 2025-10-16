import { test, expect } from '@playwright/test';

const LIVE_SITE_URL = 'http://3.128.143.122';

test.describe('Live Site Form Overflow Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for potentially slower server responses
    page.setDefaultTimeout(10000);
  });

  test('Desktop - Volunteer signup form category grid shows 4 columns', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to volunteer signup
    await page.goto(`${LIVE_SITE_URL}/signup/volunteer`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of the full page
    await page.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-desktop-full.png',
      fullPage: true
    });

    // Check if category selection exists and count columns
    const categoryGrid = page.locator('[class*="grid"][class*="col"]').first();
    if (await categoryGrid.isVisible()) {
      // Take screenshot of category grid specifically
      await categoryGrid.screenshot({
        path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-category-grid-desktop.png'
      });

      // Check grid classes for 4 columns on large screens
      const gridClasses = await categoryGrid.getAttribute('class');
      console.log('Category grid classes:', gridClasses);

      // Should have lg:grid-cols-4 (4 columns on large screens)
      expect(gridClasses).toContain('lg:grid-cols-4');
    }
  });

  test('Mobile - Volunteer signup form responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

    await page.goto(`${LIVE_SITE_URL}/signup/volunteer`);
    await page.waitForLoadState('networkidle');

    // Take mobile screenshot
    await page.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-mobile.png',
      fullPage: true
    });

    // Check that content doesn't overflow horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    console.log(`Mobile - Body width: ${bodyWidth}, Viewport width: ${viewportWidth}`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('Tablet - Story submission form layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

    // Try to navigate to story submission - might be behind auth
    await page.goto(`${LIVE_SITE_URL}/dashboard/volunteer`);

    // If redirected to login, that's expected - take screenshot anyway
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/story-submission-tablet.png',
      fullPage: true
    });
  });

  test('Desktop - Rich text editor toolbar overflow check', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to a form that might have rich text editor
    await page.goto(`${LIVE_SITE_URL}/signup/volunteer`);
    await page.waitForLoadState('networkidle');

    // Look for any rich text editor toolbars
    const richTextToolbar = page.locator('[class*="toolbar"], [class*="editor-toolbar"], .ql-toolbar');

    if (await richTextToolbar.isVisible()) {
      await richTextToolbar.screenshot({
        path: '/Users/jihunkong/1001project/1001-stories/test-results/rich-text-toolbar-desktop.png'
      });

      // Check toolbar doesn't overflow its container
      const toolbarBox = await richTextToolbar.boundingBox();
      const containerBox = await page.locator('body').boundingBox();

      if (toolbarBox && containerBox) {
        console.log(`Toolbar width: ${toolbarBox.width}, Container width: ${containerBox.width}`);
        expect(toolbarBox.x + toolbarBox.width).toBeLessThanOrEqual(containerBox.width);
      }
    }
  });

  test('Mobile - Rich text editor responsive behavior', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${LIVE_SITE_URL}/signup/volunteer`);
    await page.waitForLoadState('networkidle');

    // Look for rich text editor on mobile
    const richTextEditor = page.locator('[class*="editor"], .ql-editor, textarea');

    if (await richTextEditor.isVisible()) {
      await richTextEditor.screenshot({
        path: '/Users/jihunkong/1001project/1001-stories/test-results/rich-text-mobile.png'
      });
    }

    // Check no horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('Form accessibility and viewport boundaries', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1920, height: 1080, name: 'desktop-large' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto(`${LIVE_SITE_URL}/signup/volunteer`);
      await page.waitForLoadState('networkidle');

      // Take screenshot for each viewport
      await page.screenshot({
        path: `/Users/jihunkong/1001project/1001-stories/test-results/form-${viewport.name}.png`,
        fullPage: true
      });

      // Check all form elements are within viewport
      const formElements = await page.locator('input, select, textarea, button').all();

      for (const element of formElements) {
        if (await element.isVisible()) {
          const box = await element.boundingBox();
          if (box) {
            // Element should not extend beyond viewport width
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 5); // 5px tolerance
          }
        }
      }
    }
  });
});