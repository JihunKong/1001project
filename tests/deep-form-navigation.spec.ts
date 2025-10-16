import { test, expect } from '@playwright/test';

test.describe('Deep Form Navigation - Live Website', () => {
  const LIVE_WEBSITE_URL = 'https://1001stories.seedsofempowerment.org';

  test('Navigate through complete flow to find story submission form', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    console.log('Starting deep navigation to find story submission form...');

    await page.goto(LIVE_WEBSITE_URL);
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/deep-nav-01-homepage.png',
      fullPage: true
    });

    // Step 1: Look for all possible entry points
    const entryPoints = [
      'text=Demo',
      'text=Try Demo',
      'text=Volunteer',
      'text=Submit Story',
      'text=Get Started',
      'text=Sign Up',
      '[data-testid="demo-button"]',
      '[data-testid="volunteer-button"]',
      'a[href*="demo"]',
      'a[href*="volunteer"]',
      'a[href*="submit"]'
    ];

    let foundEntry = false;
    let entryPath = '';

    for (const selector of entryPoints) {
      const element = page.locator(selector).first();
      if (await element.count() > 0 && await element.isVisible()) {
        console.log(`Found entry point: ${selector}`);

        // Get the href if it's a link
        const href = await element.getAttribute('href');
        if (href) {
          entryPath = href;
          console.log(`Entry path: ${href}`);
        }

        await element.click();
        await page.waitForLoadState('networkidle');
        foundEntry = true;
        break;
      }
    }

    if (!foundEntry) {
      console.log('No entry points found, trying direct URLs...');
    }

    // Take screenshot after first navigation
    await page.screenshot({
      path: 'test-results/deep-nav-02-after-entry.png',
      fullPage: true
    });

    // Step 2: If we're on a signup/login page, look for role selection
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/signup') || currentUrl.includes('/login')) {
      console.log('On signup/login page, looking for role selection...');

      // Look for volunteer role card or button
      const volunteerSelectors = [
        'text=Volunteer',
        '[data-role="volunteer"]',
        '.role-card:has-text("Volunteer")',
        'button:has-text("Volunteer")',
        'a:has-text("Volunteer")'
      ];

      for (const selector of volunteerSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`Found volunteer role: ${selector}`);
          await element.click();
          await page.waitForLoadState('networkidle');
          break;
        }
      }

      // Take screenshot after role selection
      await page.screenshot({
        path: 'test-results/deep-nav-03-after-role.png',
        fullPage: true
      });
    }

    // Step 3: Look for demo-specific paths if we're in demo mode
    if (currentUrl.includes('/demo')) {
      console.log('In demo mode, looking for story submission...');

      const demoSubmitSelectors = [
        'text=Submit Story',
        'text=Add Story',
        'text=Create Story',
        'text=Write Story',
        '[data-testid="submit-story"]',
        '[data-testid="add-story"]',
        'button:has-text("Submit")',
        'a:has-text("Submit")'
      ];

      for (const selector of demoSubmitSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`Found demo submit button: ${selector}`);
          await element.click();
          await page.waitForLoadState('networkidle');
          break;
        }
      }
    }

    // Step 4: Try direct navigation to common form paths
    const formPaths = [
      '/demo/volunteer/submit',
      '/demo/submit',
      '/dashboard/volunteer',
      '/volunteer/submit',
      '/submit-story',
      '/story/submit',
      '/volunteer/dashboard',
      '/demo/story/submit'
    ];

    let foundForm = false;

    for (const path of formPaths) {
      try {
        console.log(`Trying path: ${path}`);
        await page.goto(`${LIVE_WEBSITE_URL}${path}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Check if we found form elements
        const hasCategoryGrid = await page.locator('.grid-cols-4, .grid-cols-5, [data-testid="category-grid"]').count() > 0;
        const hasRichText = await page.locator('.ql-editor, .rich-text-editor, [data-testid="rich-text-editor"]').count() > 0;
        const hasStoryForm = await page.locator('form').count() > 0;

        if (hasCategoryGrid || hasRichText || hasStoryForm) {
          console.log(`Found form elements at ${path}`);
          console.log(`- Category grid: ${hasCategoryGrid}`);
          console.log(`- Rich text editor: ${hasRichText}`);
          console.log(`- Form: ${hasStoryForm}`);

          foundForm = true;

          // Take detailed screenshots
          await page.screenshot({
            path: `test-results/deep-nav-04-found-form-${path.replace(/\//g, '-')}.png`,
            fullPage: true
          });

          // Test specific elements
          if (hasCategoryGrid) {
            await testCategoryGrid(page, path);
          }

          if (hasRichText) {
            await testRichTextEditor(page, path);
          }

          break;
        }
      } catch (error) {
        console.log(`Path ${path} failed: ${error}`);
      }
    }

    if (!foundForm) {
      console.log('No story submission form found. Analyzing current page...');

      // Analyze what's on the current page
      const allForms = await page.locator('form').count();
      const allInputs = await page.locator('input, textarea, select').count();
      const allButtons = await page.locator('button, input[type="submit"]').count();

      console.log(`Current page analysis:`);
      console.log(`- Forms: ${allForms}`);
      console.log(`- Inputs: ${allInputs}`);
      console.log(`- Buttons: ${allButtons}`);

      // Look for any text that might indicate story submission
      const storyKeywords = ['story', 'submit', 'write', 'publish', 'share'];
      for (const keyword of storyKeywords) {
        const count = await page.locator(`text=${keyword}`).count();
        if (count > 0) {
          console.log(`Found "${keyword}" text: ${count} instances`);
        }
      }
    }

    // Final screenshot
    await page.screenshot({
      path: 'test-results/deep-nav-05-final-state.png',
      fullPage: true
    });

    console.log('Deep navigation completed');
  });
});

// Helper function to test category grid
async function testCategoryGrid(page: any, pathContext: string) {
    console.log(`Testing category grid at ${pathContext}...`);

    const grids = page.locator('.grid-cols-4, .grid-cols-5, [data-testid="category-grid"]');
    const gridCount = await grids.count();

    for (let i = 0; i < gridCount; i++) {
      const grid = grids.nth(i);
      const classes = await grid.getAttribute('class') || '';

      console.log(`Grid ${i + 1} classes: ${classes}`);

      // Check for the fix (should be 4 columns, not 5)
      if (classes.includes('grid-cols-4')) {
        console.log(`✅ Grid ${i + 1}: Using 4 columns (fixed)`);
      } else if (classes.includes('grid-cols-5')) {
        console.log(`❌ Grid ${i + 1}: Still using 5 columns (not fixed)`);
      }

      // Check for overflow
      const rect = await grid.boundingBox();
      if (rect) {
        const viewport = await page.viewportSize();
        if (rect.width <= viewport.width) {
          console.log(`✅ Grid ${i + 1}: No overflow`);
        } else {
          console.log(`❌ Grid ${i + 1}: Overflow detected (${rect.width}px > ${viewport.width}px)`);
        }
      }
    }
}

// Helper function to test rich text editor
async function testRichTextEditor(page: any, pathContext: string) {
    console.log(`Testing rich text editor at ${pathContext}...`);

    const editors = page.locator('.ql-toolbar, .rich-text-editor .toolbar, [data-testid="rich-text-toolbar"]');
    const editorCount = await editors.count();

    for (let i = 0; i < editorCount; i++) {
      const toolbar = editors.nth(i);
      const classes = await toolbar.getAttribute('class') || '';

      console.log(`Toolbar ${i + 1} classes: ${classes}`);

      // Check for the fixes
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

      // Check for overflow
      const rect = await toolbar.boundingBox();
      if (rect) {
        const viewport = await page.viewportSize();
        if (rect.width <= viewport.width) {
          console.log(`✅ Toolbar ${i + 1}: No overflow`);
        } else {
          console.log(`❌ Toolbar ${i + 1}: Overflow detected (${rect.width}px > ${viewport.width}px)`);
        }
      }
    }
}

test.describe('Viewport Testing', () => {
  test('Test different viewport sizes on found form', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];

    // First find the form using a known working path
    await page.goto(`${LIVE_WEBSITE_URL}/demo`);
    await page.waitForLoadState('networkidle');

    // Try to navigate to a form
    const demoButton = page.locator('text=Submit Story').or(page.locator('text=Add Story')).first();
    if (await demoButton.count() > 0) {
      await demoButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Test on each viewport
    for (const viewport of viewports) {
      console.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000); // Allow layout to adjust

      // Check for horizontal overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const documentWidth = await page.evaluate(() => document.documentElement.clientWidth);

      if (bodyScrollWidth <= documentWidth + 50) {
        console.log(`✅ ${viewport.name}: No horizontal overflow`);
      } else {
        console.log(`❌ ${viewport.name}: Horizontal overflow detected (${bodyScrollWidth}px > ${documentWidth}px)`);
      }

      // Take screenshot
      await page.screenshot({
        path: `test-results/viewport-test-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });
    }
  });
});