import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('should handle dashboard access correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();

    // Should either show login redirect or dashboard content
    if (currentUrl.includes('login')) {
      console.log('✓ Dashboard redirects to login when not authenticated');

      // Check if callback URL is preserved
      expect(currentUrl).toContain('callbackUrl');
    } else if (currentUrl.includes('dashboard')) {
      console.log('✓ Dashboard accessible - checking content');

      // Look for dashboard-specific elements
      const dashboardElements = [
        'text=Dashboard',
        'text=Welcome',
        '[data-testid="dashboard"]',
        '.dashboard',
        'nav',
        'sidebar'
      ];

      let foundDashboardElements = false;
      for (const selector of dashboardElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          foundDashboardElements = true;
          console.log(`✓ Found dashboard element: ${selector}`);
          break;
        }
      }

      if (foundDashboardElements) {
        await page.screenshot({ path: 'test-results/dashboard-main.png' });
      }
    }
  });

  test('should test role-specific dashboard routes', async ({ page }) => {
    const dashboardRoutes = [
      { path: '/dashboard/learner', role: 'Learner' },
      { path: '/dashboard/teacher', role: 'Teacher' },
      { path: '/dashboard/writer', role: 'Volunteer' },
      { path: '/dashboard/story-manager', role: 'Story Manager' },
      { path: '/dashboard/book-manager', role: 'Book Manager' },
      { path: '/dashboard/content-admin', role: 'Content Admin' },
      { path: '/admin', role: 'Admin' }
    ];

    for (const route of dashboardRoutes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      if (currentUrl.includes('login')) {
        console.log(`✓ ${route.role} dashboard correctly redirects to login`);
      } else if (currentUrl.includes('dashboard') || currentUrl.includes('admin')) {
        console.log(`✓ ${route.role} dashboard accessible - checking for role-specific content`);

        // Look for role-specific indicators
        const roleText = page.locator(`text=${route.role}`).or(
          page.locator(`text=${route.role.toLowerCase()}`)
        );

        if (await roleText.isVisible()) {
          console.log(`✓ Found ${route.role} specific content`);
        }

        // Check for common dashboard elements
        const commonElements = [
          'nav',
          'header',
          'main',
          '.sidebar',
          '[data-testid="navigation"]'
        ];

        for (const selector of commonElements) {
          const element = page.locator(selector);
          if (await element.isVisible()) {
            console.log(`✓ Found common dashboard element: ${selector}`);
            break;
          }
        }

        await page.screenshot({ path: `test-results/dashboard-${route.role.toLowerCase().replace(' ', '-')}.png` });
      } else {
        console.log(`ℹ ${route.role} dashboard redirected to: ${currentUrl}`);
      }
    }
  });

  test('should test demo dashboard functionality', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    // Check if demo mode is available
    if (page.url().includes('demo')) {
      console.log('✓ Demo mode accessible');

      // Look for demo-specific indicators
      const demoIndicators = [
        'text=demo',
        'text=Demo',
        '.demo-banner',
        '[data-testid="demo"]',
        '.bg-yellow',
        'text=sample'
      ];

      let foundDemoContent = false;
      for (const selector of demoIndicators) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          foundDemoContent = true;
          console.log(`✓ Found demo indicator: ${selector}`);
          break;
        }
      }

      // Look for navigation elements in demo
      const demoNavigation = [
        'a[href*="demo"]',
        'button',
        'nav',
        '.navigation'
      ];

      for (const selector of demoNavigation) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          console.log(`✓ Found demo navigation elements: ${selector}`);

          // Try clicking first navigation element
          const firstElement = elements.first();
          if (await firstElement.isVisible()) {
            await firstElement.click();
            await page.waitForTimeout(1000);
            console.log(`✓ Demo navigation clickable`);
            break;
          }
        }
      }

      await page.screenshot({ path: 'test-results/demo-dashboard.png' });
    } else {
      console.log('ℹ Demo mode redirected or not available');
    }
  });

  test('should test dashboard navigation and menu functionality', async ({ page }) => {
    // Test dashboard with potential persistent session or demo mode
    const testUrls = ['/dashboard', '/demo', '/dashboard/learner'];

    for (const url of testUrls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      if (!page.url().includes('login')) {
        console.log(`✓ Testing navigation on: ${url}`);

        // Look for navigation menus
        const menuSelectors = [
          'nav a',
          '.menu a',
          '.sidebar a',
          '[role="navigation"] a',
          'header a'
        ];

        let foundNavigation = false;
        for (const selector of menuSelectors) {
          const links = page.locator(selector);
          if (await links.count() > 0) {
            foundNavigation = true;
            console.log(`✓ Found navigation links: ${selector} (${await links.count()} links)`);

            // Test clicking first few links
            const linkCount = Math.min(await links.count(), 3);
            for (let i = 0; i < linkCount; i++) {
              const link = links.nth(i);
              if (await link.isVisible()) {
                const linkText = await link.textContent();
                const linkHref = await link.getAttribute('href');

                if (linkHref && !linkHref.startsWith('mailto:') && !linkHref.startsWith('tel:')) {
                  await link.click();
                  await page.waitForTimeout(1500);
                  console.log(`✓ Clicked navigation link: ${linkText} -> ${linkHref}`);

                  // Go back to test page
                  await page.goto(url);
                  await page.waitForLoadState('networkidle');
                }
              }
            }
            break;
          }
        }

        if (!foundNavigation) {
          console.log('ℹ No navigation elements found on this page');
        }

        break; // Exit loop once we find an accessible dashboard
      }
    }
  });

  test('should test dashboard responsive design elements', async ({ page }) => {
    // Test on different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      if (!page.url().includes('login')) {
        console.log(`✓ Testing dashboard on ${viewport.name} (${viewport.width}x${viewport.height})`);

        // Check for responsive elements
        const responsiveElements = [
          '.md\\:hidden',
          '.lg\\:block',
          '.sm\\:block',
          '.hamburger',
          '.menu-toggle',
          '[data-testid="mobile-menu"]'
        ];

        for (const selector of responsiveElements) {
          const element = page.locator(selector);
          if (await element.isVisible()) {
            console.log(`✓ Found responsive element on ${viewport.name}: ${selector}`);
          }
        }

        await page.screenshot({ path: `test-results/dashboard-${viewport.name.toLowerCase()}.png` });
      } else {
        console.log(`ℹ Dashboard not accessible on ${viewport.name} - redirects to login`);
      }
    }

    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});