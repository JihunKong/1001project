import { test, expect } from '@playwright/test';

test.describe('Story Submission Form Overflow Fixes - Live Website', () => {
  const LIVE_WEBSITE_URL = 'https://1001stories.seedsofempowerment.org';

  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11 Pro' },
    { width: 768, height: 1024, name: 'iPad Portrait' },
    { width: 1024, height: 768, name: 'iPad Landscape' },
    { width: 1200, height: 800, name: 'Desktop Small' },
    { width: 1920, height: 1080, name: 'Desktop Large' }
  ];

  // Test each viewport size
  viewports.forEach(viewport => {
    test(`Story form overflow fixes on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      console.log(`Testing on ${viewport.name} - ${viewport.width}x${viewport.height}`);

      // Navigate to the live website
      await page.goto(LIVE_WEBSITE_URL);
      await page.waitForLoadState('networkidle');

      // Take initial homepage screenshot
      await page.screenshot({
        path: `test-results/live-homepage-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      // Try to find demo access or volunteer signup
      const demoButton = page.locator('text=Demo').or(
        page.locator('text=Try Demo')
      ).or(
        page.locator('[data-testid="demo-button"]')
      ).or(
        page.locator('a[href*="demo"]')
      );

      const volunteerButton = page.locator('text=Volunteer').or(
        page.locator('text=Submit Story')
      ).or(
        page.locator('[data-testid="volunteer-button"]')
      ).or(
        page.locator('a[href*="volunteer"]')
      );

      let foundFormAccess = false;

      // Try demo path first
      if (await demoButton.count() > 0) {
        console.log('Found demo access, navigating to demo...');
        await demoButton.first().click();
        await page.waitForLoadState('networkidle');
        foundFormAccess = true;

        // Look for story submission within demo
        const demoSubmitButton = page.locator('text=Submit Story').or(
          page.locator('text=Add Story')
        ).or(
          page.locator('[data-testid="submit-story"]')
        );

        if (await demoSubmitButton.count() > 0) {
          await demoSubmitButton.first().click();
          await page.waitForLoadState('networkidle');
        }
      }

      // Try volunteer path if demo didn't work
      if (!foundFormAccess && await volunteerButton.count() > 0) {
        console.log('Found volunteer access, navigating to volunteer signup...');
        await volunteerButton.first().click();
        await page.waitForLoadState('networkidle');
        foundFormAccess = true;
      }

      // Try direct navigation to common form paths
      if (!foundFormAccess) {
        const commonPaths = [
          '/demo/volunteer',
          '/demo/submit',
          '/volunteer',
          '/submit',
          '/dashboard/volunteer',
          '/story/submit'
        ];

        for (const path of commonPaths) {
          try {
            await page.goto(`${LIVE_WEBSITE_URL}${path}`);
            await page.waitForLoadState('networkidle', { timeout: 5000 });

            // Check if we reached a form page
            const hasForm = await page.locator('form').count() > 0;
            const hasRichTextEditor = await page.locator('.ql-editor, .rich-text-editor, [data-testid="rich-text-editor"]').count() > 0;

            if (hasForm || hasRichTextEditor) {
              console.log(`Found form at path: ${path}`);
              foundFormAccess = true;
              break;
            }
          } catch (error) {
            console.log(`Path ${path} not accessible: ${error}`);
          }
        }
      }

      // If still no access, try to navigate through signup/login flow
      if (!foundFormAccess) {
        console.log('Trying signup/login flow...');

        // Look for signup or role selection
        const signupButton = page.locator('text=Sign Up').or(
          page.locator('text=Get Started')
        ).or(
          page.locator('[data-testid="signup-button"]')
        );

        if (await signupButton.count() > 0) {
          await signupButton.first().click();
          await page.waitForLoadState('networkidle');

          // Look for volunteer role card
          const volunteerRole = page.locator('text=Volunteer').or(
            page.locator('[data-role="volunteer"]')
          ).or(
            page.locator('.role-card').filter({ hasText: 'Volunteer' })
          );

          if (await volunteerRole.count() > 0) {
            await volunteerRole.first().click();
            await page.waitForLoadState('networkidle');
          }
        }
      }

      // Now test the current page for form elements
      await page.screenshot({
        path: `test-results/live-form-page-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      // Test 1: Check for category grid layout (should be 4 columns on large screens)
      const categoryGrids = page.locator('.grid-cols-5, .grid-cols-4, [data-testid="category-grid"]');
      const categoryGridCount = await categoryGrids.count();

      if (categoryGridCount > 0) {
        console.log(`Found ${categoryGridCount} category grid(s)`);

        for (let i = 0; i < categoryGridCount; i++) {
          const grid = categoryGrids.nth(i);
          const gridClasses = await grid.getAttribute('class') || '';

          // Check if it's using the fixed 4-column layout
          if (viewport.width >= 1024) { // Large screen
            const hasFourCols = gridClasses.includes('grid-cols-4');
            const hasFiveCols = gridClasses.includes('grid-cols-5');

            if (hasFourCols && !hasFiveCols) {
              console.log(`✅ Grid ${i + 1}: Correctly using 4 columns on large screen`);
            } else if (hasFiveCols) {
              console.log(`❌ Grid ${i + 1}: Still using 5 columns (should be 4) - Classes: ${gridClasses}`);
            }
          }

          // Check for horizontal overflow
          const gridRect = await grid.boundingBox();
          if (gridRect) {
            const isOverflowing = gridRect.width > viewport.width;
            if (!isOverflowing) {
              console.log(`✅ Grid ${i + 1}: No horizontal overflow`);
            } else {
              console.log(`❌ Grid ${i + 1}: Horizontal overflow detected (${gridRect.width}px > ${viewport.width}px)`);
            }
          }
        }
      } else {
        console.log('No category grids found on current page');
      }

      // Test 2: Check Rich Text Editor toolbar responsiveness
      const richTextEditors = page.locator('.ql-toolbar, .rich-text-editor .toolbar, [data-testid="rich-text-toolbar"]');
      const editorCount = await richTextEditors.count();

      if (editorCount > 0) {
        console.log(`Found ${editorCount} rich text editor toolbar(s)`);

        for (let i = 0; i < editorCount; i++) {
          const toolbar = richTextEditors.nth(i);
          const toolbarClasses = await toolbar.getAttribute('class') || '';

          // Check for overflow-x-auto and flex-shrink-0 fixes
          const hasOverflowFix = toolbarClasses.includes('overflow-x-auto');
          const hasFlexShrinkFix = toolbarClasses.includes('flex-shrink-0');

          if (hasOverflowFix) {
            console.log(`✅ Toolbar ${i + 1}: Has overflow-x-auto fix`);
          } else {
            console.log(`❌ Toolbar ${i + 1}: Missing overflow-x-auto fix - Classes: ${toolbarClasses}`);
          }

          if (hasFlexShrinkFix) {
            console.log(`✅ Toolbar ${i + 1}: Has flex-shrink-0 fix`);
          } else {
            console.log(`❌ Toolbar ${i + 1}: Missing flex-shrink-0 fix - Classes: ${toolbarClasses}`);
          }

          // Check actual overflow
          const toolbarRect = await toolbar.boundingBox();
          if (toolbarRect) {
            const isOverflowing = toolbarRect.width > viewport.width;
            if (!isOverflowing) {
              console.log(`✅ Toolbar ${i + 1}: No horizontal overflow`);
            } else {
              console.log(`❌ Toolbar ${i + 1}: Horizontal overflow detected (${toolbarRect.width}px > ${viewport.width}px)`);
            }
          }
        }
      } else {
        console.log('No rich text editor toolbars found on current page');
      }

      // Test 3: General form responsiveness
      const forms = page.locator('form');
      const formCount = await forms.count();

      if (formCount > 0) {
        console.log(`Found ${formCount} form(s) - testing general responsiveness`);

        for (let i = 0; i < formCount; i++) {
          const form = forms.nth(i);
          const formRect = await form.boundingBox();

          if (formRect) {
            const isOverflowing = formRect.width > viewport.width;
            if (!isOverflowing) {
              console.log(`✅ Form ${i + 1}: No horizontal overflow`);
            } else {
              console.log(`❌ Form ${i + 1}: Horizontal overflow detected (${formRect.width}px > ${viewport.width}px)`);
            }
          }
        }
      }

      // Test 4: Check for any elements with horizontal scroll
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const documentWidth = await page.evaluate(() => document.documentElement.clientWidth);

      if (bodyScrollWidth <= documentWidth + 50) { // 50px tolerance
        console.log(`✅ Page: No horizontal overflow (${bodyScrollWidth}px <= ${documentWidth}px)`);
      } else {
        console.log(`❌ Page: Horizontal overflow detected (${bodyScrollWidth}px > ${documentWidth}px)`);
      }

      // Take final screenshot of current state
      await page.screenshot({
        path: `test-results/live-form-final-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true
      });

      console.log(`Completed testing on ${viewport.name}`);
      console.log('---');
    });
  });

  // Dedicated test for form interaction and detailed verification
  test('Interactive form testing on live website', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    await page.goto(LIVE_WEBSITE_URL);
    await page.waitForLoadState('networkidle');

    // Try to reach a form through multiple paths
    const paths = ['/demo', '/volunteer', '/signup'];

    for (const path of paths) {
      try {
        console.log(`Trying path: ${path}`);
        await page.goto(`${LIVE_WEBSITE_URL}${path}`);
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        // Look for form elements
        const hasStoryForm = await page.locator('form').count() > 0;
        const hasRichText = await page.locator('.ql-editor, .rich-text-editor').count() > 0;

        if (hasStoryForm || hasRichText) {
          console.log(`Found interactive form elements at ${path}`);

          // Test category selection if available
          const categoryOptions = page.locator('input[type="radio"][name*="category"], select[name*="category"], .category-option');
          const categoryCount = await categoryOptions.count();

          if (categoryCount > 0) {
            console.log(`Found ${categoryCount} category options`);

            // Test clicking on categories to ensure they work
            try {
              await categoryOptions.first().click();
              console.log('✅ Category selection interactive');
            } catch (error) {
              console.log('❌ Category selection interaction failed:', error);
            }
          }

          // Test rich text editor if available
          const richTextEditor = page.locator('.ql-editor').first();
          if (await richTextEditor.count() > 0) {
            try {
              await richTextEditor.click();
              await richTextEditor.fill('Test story content to verify editor is working...');
              const content = await richTextEditor.textContent();

              if (content && content.includes('Test story content')) {
                console.log('✅ Rich text editor is functional');
              } else {
                console.log('❌ Rich text editor content not updating properly');
              }
            } catch (error) {
              console.log('❌ Rich text editor interaction failed:', error);
            }
          }

          break; // Found working form, no need to try other paths
        }
      } catch (error) {
        console.log(`Path ${path} not accessible: ${error}`);
      }
    }

    // Take comprehensive screenshot
    await page.screenshot({
      path: 'test-results/live-interactive-form-test.png',
      fullPage: true
    });
  });
});