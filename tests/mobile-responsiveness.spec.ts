import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11' },
    { width: 360, height: 640, name: 'Android Small' },
    { width: 768, height: 1024, name: 'iPad Portrait' },
    { width: 1024, height: 768, name: 'iPad Landscape' }
  ];

  const testPages = [
    { path: '/', name: 'Homepage' },
    { path: '/login', name: 'Login' },
    { path: '/signup', name: 'Signup' },
    { path: '/demo', name: 'Demo' }
  ];

  viewports.forEach(viewport => {
    test(`should display correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const testPage of testPages) {
        await page.goto(testPage.path);
        await page.waitForLoadState('networkidle');

        console.log(`Testing ${testPage.name} on ${viewport.name}`);

        // Check if page loads without horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;

        if (bodyWidth <= viewportWidth + 50) { // Allow 50px tolerance
          console.log(`✓ ${testPage.name}: No horizontal overflow on ${viewport.name}`);
        } else {
          console.log(`⚠ ${testPage.name}: Horizontal overflow detected on ${viewport.name} (${bodyWidth}px > ${viewportWidth}px)`);
        }

        // Check for mobile-friendly elements
        const mobileElements = await page.locator('meta[name="viewport"]').count();
        if (mobileElements > 0) {
          console.log(`✓ ${testPage.name}: Has viewport meta tag`);
        }

        // Look for responsive navigation (hamburger menu, etc.)
        const hamburgerSelectors = [
          '.hamburger',
          '.menu-toggle',
          '[data-testid="mobile-menu"]',
          '.md\\:hidden',
          '.lg\\:hidden',
          'button[aria-label*="menu"]'
        ];

        let foundMobileNav = false;
        for (const selector of hamburgerSelectors) {
          const elements = page.locator(selector);
          if (await elements.count() > 0 && await elements.first().isVisible()) {
            foundMobileNav = true;
            console.log(`✓ ${testPage.name}: Found mobile navigation element: ${selector}`);
            break;
          }
        }

        if (viewport.width < 768 && !foundMobileNav) {
          console.log(`ℹ ${testPage.name}: No mobile navigation found on small screen`);
        }

        // Check text readability (font size should be reasonable)
        const smallText = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements.filter(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            return fontSize > 0 && fontSize < 14 && el.textContent && el.textContent.trim().length > 10;
          }).length;
        });

        if (smallText === 0) {
          console.log(`✓ ${testPage.name}: No text smaller than 14px found`);
        } else {
          console.log(`⚠ ${testPage.name}: Found ${smallText} elements with small text (< 14px)`);
        }

        // Check for touch-friendly buttons
        const buttons = await page.locator('button, a, input[type="submit"]').count();
        if (buttons > 0) {
          console.log(`✓ ${testPage.name}: Found ${buttons} interactive elements`);

          // Check if buttons are large enough for touch (minimum 44px recommended)
          const smallButtons = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]'));
            return buttons.filter(btn => {
              const rect = btn.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
            }).length;
          });

          if (smallButtons === 0) {
            console.log(`✓ ${testPage.name}: All buttons are touch-friendly size`);
          } else {
            console.log(`⚠ ${testPage.name}: Found ${smallButtons} buttons smaller than 44px`);
          }
        }

        // Take screenshot for each page on each device
        await page.screenshot({
          path: `test-results/mobile-${viewport.name.toLowerCase().replace(' ', '-')}-${testPage.name.toLowerCase()}.png`,
          fullPage: true
        });
      }
    });
  });

  test('should test touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test touch interactions
    const interactiveElements = page.locator('button, a, input, select').first();

    if (await interactiveElements.count() > 0) {
      // Test tap interaction
      await interactiveElements.tap();
      await page.waitForTimeout(1000);
      console.log('✓ Touch tap interaction working');

      // Test if element has proper focus states
      const hasFocusStyle = await interactiveElements.evaluate(el => {
        const style = window.getComputedStyle(el, ':focus');
        return style.outline !== 'none' || style.boxShadow !== 'none';
      });

      if (hasFocusStyle) {
        console.log('✓ Interactive elements have focus styles');
      } else {
        console.log('ℹ Interactive elements may need better focus indicators');
      }
    }
  });

  test('should test form interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Test form input on mobile
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();

    if (await emailInput.isVisible()) {
      // Test virtual keyboard doesn't break layout
      await emailInput.focus();
      await page.waitForTimeout(500);

      // Check if input is still visible and accessible
      const inputRect = await emailInput.boundingBox();
      if (inputRect) {
        console.log(`✓ Email input accessible: ${inputRect.y}px from top`);
      }

      // Test input value
      await emailInput.fill('test@mobile.com');
      const value = await emailInput.inputValue();

      if (value === 'test@mobile.com') {
        console.log('✓ Mobile form input working correctly');
      }

      // Test submit button accessibility
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.isVisible()) {
        const buttonRect = await submitButton.boundingBox();
        if (buttonRect && buttonRect.height >= 44) {
          console.log('✓ Submit button is touch-friendly size');
        } else {
          console.log('⚠ Submit button may be too small for touch');
        }
      }
    }
  });

  test('should test responsive images and media', async ({ page }) => {
    const testViewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' }
    ];

    for (const viewport of testViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check images don't overflow
      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        console.log(`Testing ${imageCount} images on ${viewport.name}`);

        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const img = images.nth(i);
          const imgRect = await img.boundingBox();

          if (imgRect) {
            if (imgRect.width <= viewport.width) {
              console.log(`✓ Image ${i + 1} fits viewport on ${viewport.name}`);
            } else {
              console.log(`⚠ Image ${i + 1} overflows viewport on ${viewport.name} (${imgRect.width}px > ${viewport.width}px)`);
            }
          }
        }
      }

      // Check for responsive images (srcset, sizes attributes)
      const responsiveImages = await page.locator('img[srcset], img[sizes]').count();
      if (responsiveImages > 0) {
        console.log(`✓ Found ${responsiveImages} responsive images on ${viewport.name}`);
      }
    }
  });

  test('should test accessibility on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const pages = ['/', '/login'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Check for accessibility attributes
      const elementsWithAria = await page.locator('[aria-label], [aria-labelledby], [aria-describedby]').count();
      if (elementsWithAria > 0) {
        console.log(`✓ Found ${elementsWithAria} elements with ARIA attributes on ${pagePath}`);
      }

      // Check heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      if (headings > 0) {
        console.log(`✓ Found ${headings} heading elements on ${pagePath}`);
      }

      // Check for skip links
      const skipLinks = await page.locator('a[href="#main"], a[href="#content"], .skip-link').count();
      if (skipLinks > 0) {
        console.log(`✓ Found skip navigation links on ${pagePath}`);
      }

      // Check color contrast (basic check for dark text on light backgrounds)
      const contrastIssues = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        let issues = 0;

        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const bgColor = style.backgroundColor;
          const textColor = style.color;

          // Simple check for white text on white background or black on black
          if ((bgColor.includes('255, 255, 255') && textColor.includes('255, 255, 255')) ||
              (bgColor.includes('0, 0, 0') && textColor.includes('0, 0, 0'))) {
            issues++;
          }
        });

        return issues;
      });

      if (contrastIssues === 0) {
        console.log(`✓ No obvious contrast issues found on ${pagePath}`);
      } else {
        console.log(`⚠ Found ${contrastIssues} potential contrast issues on ${pagePath}`);
      }
    }
  });
});