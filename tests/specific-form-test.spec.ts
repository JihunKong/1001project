import { test, expect } from '@playwright/test';

test.describe('Specific Form Testing - Live Website', () => {
  const LIVE_WEBSITE_URL = 'https://1001stories.seedsofempowerment.org';

  test('Test story submission form at /demo/volunteer/submit', async ({ page }) => {
    console.log('Testing story submission form...');

    // Navigate directly to the form
    await page.goto(`${LIVE_WEBSITE_URL}/demo/volunteer/submit`);
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/form-test-01-initial.png',
      fullPage: true
    });

    console.log(`Current URL: ${page.url()}`);

    // Check for form elements
    const forms = await page.locator('form').count();
    const categoryGrids = await page.locator('.grid-cols-4, .grid-cols-5, [data-testid="category-grid"]').count();
    const richTextEditors = await page.locator('.ql-editor, .rich-text-editor, [data-testid="rich-text-editor"]').count();
    const richTextToolbars = await page.locator('.ql-toolbar, .rich-text-editor .toolbar, [data-testid="rich-text-toolbar"]').count();

    console.log(`Form analysis:`);
    console.log(`- Forms: ${forms}`);
    console.log(`- Category grids: ${categoryGrids}`);
    console.log(`- Rich text editors: ${richTextEditors}`);
    console.log(`- Rich text toolbars: ${richTextToolbars}`);

    // If category grids found, test them
    if (categoryGrids > 0) {
      console.log('Testing category grids...');

      const grids = page.locator('.grid-cols-4, .grid-cols-5, [data-testid="category-grid"]');

      for (let i = 0; i < categoryGrids; i++) {
        const grid = grids.nth(i);
        const classes = await grid.getAttribute('class') || '';

        console.log(`Grid ${i + 1} classes: ${classes}`);

        if (classes.includes('grid-cols-4')) {
          console.log(`✅ Grid ${i + 1}: Using 4 columns (FIXED)`);
        } else if (classes.includes('grid-cols-5')) {
          console.log(`❌ Grid ${i + 1}: Still using 5 columns (NOT FIXED)`);
        }
      }
    }

    // If rich text toolbars found, test them
    if (richTextToolbars > 0) {
      console.log('Testing rich text editor toolbars...');

      const toolbars = page.locator('.ql-toolbar, .rich-text-editor .toolbar, [data-testid="rich-text-toolbar"]');

      for (let i = 0; i < richTextToolbars; i++) {
        const toolbar = toolbars.nth(i);
        const classes = await toolbar.getAttribute('class') || '';

        console.log(`Toolbar ${i + 1} classes: ${classes}`);

        if (classes.includes('overflow-x-auto')) {
          console.log(`✅ Toolbar ${i + 1}: Has overflow-x-auto fix`);
        } else {
          console.log(`❌ Toolbar ${i + 1}: Missing overflow-x-auto fix`);
        }

        if (classes.includes('flex-shrink-0')) {
          console.log(`✅ Toolbar ${i + 1}: Has flex-shrink-0 fix`);
        } else {
          console.log(`❌ Toolbar ${i + 1}: Missing flex-shrink-0 fix`);
        }
      }
    }

    // Try to find any grid layouts
    const allGrids = await page.locator('[class*="grid"]').count();
    if (allGrids > 0) {
      console.log(`Found ${allGrids} elements with grid classes`);

      const gridElements = page.locator('[class*="grid"]');
      for (let i = 0; i < Math.min(allGrids, 10); i++) {
        const element = gridElements.nth(i);
        const classes = await element.getAttribute('class') || '';

        if (classes.includes('grid-cols')) {
          console.log(`Grid element ${i + 1}: ${classes}`);
        }
      }
    }

    // Look for any Quill editor elements
    const quillElements = await page.locator('[class*="ql-"]').count();
    if (quillElements > 0) {
      console.log(`Found ${quillElements} Quill editor elements`);

      const quillItems = page.locator('[class*="ql-"]');
      for (let i = 0; i < Math.min(quillElements, 10); i++) {
        const element = quillItems.nth(i);
        const classes = await element.getAttribute('class') || '';
        const tagName = await element.evaluate(el => el.tagName);

        console.log(`Quill element ${i + 1} (${tagName}): ${classes}`);
      }
    }

    // Final screenshot
    await page.screenshot({
      path: 'test-results/form-test-02-analyzed.png',
      fullPage: true
    });
  });

  // Test multiple viewport sizes on the specific form
  test('Test form responsiveness on different viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11 Pro' },
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
      { width: 1200, height: 800, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${LIVE_WEBSITE_URL}/demo/volunteer/submit`);
      await page.waitForLoadState('networkidle');

      // Check for horizontal overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const documentWidth = await page.evaluate(() => document.documentElement.clientWidth);

      if (bodyScrollWidth <= documentWidth + 50) {
        console.log(`✅ ${viewport.name}: No horizontal overflow`);
      } else {
        console.log(`❌ ${viewport.name}: Horizontal overflow detected (${bodyScrollWidth}px > ${documentWidth}px)`);
      }

      // Test specific elements on large screens
      if (viewport.width >= 1024) {
        const categoryGrids = page.locator('.grid-cols-5');
        const gridCount = await categoryGrids.count();

        if (gridCount > 0) {
          console.log(`❌ ${viewport.name}: Found ${gridCount} 5-column grids (should be 4 columns)`);
        } else {
          console.log(`✅ ${viewport.name}: No 5-column grids found`);
        }
      }

      // Take screenshot for each viewport
      await page.screenshot({
        path: `test-results/form-responsive-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });
    }
  });
});