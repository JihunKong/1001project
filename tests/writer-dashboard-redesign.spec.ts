import { test, expect, Page } from '@playwright/test';

const VOLUNTEER_EMAIL = 'volunteer@test.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8001';

test.describe('Volunteer Dashboard Redesign Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/writer`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Desktop View Tests (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('LNB sidebar navigation components render correctly', async ({ page }) => {
      const lnb = page.locator('[data-testid="volunteer-lnb"]');
      await expect(lnb).toBeVisible();

      const menuItems = [
        { text: 'Dashboard', href: '/dashboard/writer' },
        { text: 'Library', href: '/dashboard/writer/library' },
        { text: 'Submit Story', href: '/dashboard/writer/submit-text' },
        { text: 'My Submissions', href: '/dashboard/writer/submissions' },
        { text: 'Notifications', href: '/dashboard/writer/notifications' }
      ];

      for (const item of menuItems) {
        const link = lnb.locator(`a:has-text("${item.text}")`);
        await expect(link).toBeVisible();
        const href = await link.getAttribute('href');
        expect(href).toBe(item.href);
      }
    });

    test('GlobalNavigationBar displays correctly with user menu', async ({ page }) => {
      const navbar = page.locator('[data-testid="global-navigation-bar"]');
      await expect(navbar).toBeVisible();

      const logo = navbar.locator('img[alt*="1001 Stories"]');
      await expect(logo).toBeVisible();

      const userMenu = navbar.locator('[data-testid="user-menu-button"]');
      await expect(userMenu).toBeVisible();

      await userMenu.click();
      const dropdown = page.locator('[data-testid="user-menu-dropdown"]');
      await expect(dropdown).toBeVisible();

      const menuOptions = ['Profile', 'Settings', 'Help', 'Logout'];
      for (const option of menuOptions) {
        await expect(dropdown.locator(`text=${option}`)).toBeVisible();
      }
    });

    test('LNB navigation updates active state correctly', async ({ page }) => {
      const lnb = page.locator('[data-testid="volunteer-lnb"]');

      const libraryLink = lnb.locator('a:has-text("Library")');
      await libraryLink.click();
      await page.waitForURL('**/volunteer/library');

      const activeItem = lnb.locator('[data-active="true"]');
      await expect(activeItem).toHaveText('Library');

      const submitLink = lnb.locator('a:has-text("Submit Story")');
      await submitLink.click();
      await page.waitForURL('**/volunteer/submit-text');

      const newActiveItem = lnb.locator('[data-active="true"]');
      await expect(newActiveItem).toHaveText('Submit Story');
    });

    test('All 9 Figma components render without errors', async ({ page }) => {
      const components = [
        '[data-testid="stats-card"]',
        '[data-testid="recent-activity"]',
        '[data-testid="submission-status"]',
        '[data-testid="featured-stories"]',
        '[data-testid="achievement-badges"]',
        '[data-testid="contribution-chart"]',
        '[data-testid="community-feed"]',
        '[data-testid="upcoming-events"]',
        '[data-testid="quick-actions"]'
      ];

      for (const component of components) {
        const element = page.locator(component);
        await expect(element).toBeVisible({ timeout: 10000 });
      }

      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);
      expect(consoleErrors).toHaveLength(0);
    });

    test('Story submission form works correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/writer/submit-text`);
      await page.waitForLoadState('networkidle');

      const titleInput = page.locator('input[name="title"]');
      const contentEditor = page.locator('[data-testid="content-editor"]');
      const ageInput = page.locator('input[name="authorAge"]');
      const countrySelect = page.locator('select[name="country"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(titleInput).toBeVisible();
      await expect(contentEditor).toBeVisible();
      await expect(submitButton).toBeVisible();

      await titleInput.fill('Test Story Title');
      await contentEditor.fill('This is a test story content with some meaningful text.');
      await ageInput.fill('12');
      await countrySelect.selectOption('Kenya');

      const titleValue = await titleInput.inputValue();
      expect(titleValue).toBe('Test Story Title');

      await submitButton.click();

      const successMessage = page.locator('[data-testid="success-message"]');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    });

    test('Hover states work correctly on interactive elements', async ({ page }) => {
      const lnb = page.locator('[data-testid="volunteer-lnb"]');
      const menuItems = lnb.locator('a');
      const firstItem = menuItems.first();

      const initialBg = await firstItem.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      await firstItem.hover();
      await page.waitForTimeout(500);

      const hoverBg = await firstItem.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      expect(initialBg).not.toBe(hoverBg);
    });
  });

  test.describe('Tablet View Tests (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('LNB transforms to collapsible menu on tablet', async ({ page }) => {
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      await expect(hamburgerMenu).toBeVisible();

      const lnb = page.locator('[data-testid="volunteer-lnb"]');
      const isHidden = await lnb.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.transform.includes('translateX(-100%)');
      });
      expect(isHidden).toBeTruthy();

      await hamburgerMenu.click();
      await expect(lnb).toBeVisible();

      const overlay = page.locator('[data-testid="menu-overlay"]');
      await expect(overlay).toBeVisible();

      await overlay.click();
      await expect(lnb).not.toBeVisible();
    });

    test('Content reflows properly without horizontal scroll', async ({ page }) => {
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();

      const mainContent = page.locator('main');
      const box = await mainContent.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(768);
    });
  });

  test.describe('Mobile View Tests (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Bottom navigation appears and LNB is hidden', async ({ page }) => {
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
      await expect(bottomNav).toBeVisible();

      const lnb = page.locator('[data-testid="volunteer-lnb"]');
      await expect(lnb).not.toBeVisible();

      const navItems = bottomNav.locator('[data-testid="nav-item"]');
      await expect(navItems).toHaveCount(5);

      const expectedIcons = ['home', 'library', 'add', 'list', 'bell'];
      for (let i = 0; i < expectedIcons.length; i++) {
        const icon = navItems.nth(i).locator(`[data-icon="${expectedIcons[i]}"]`);
        await expect(icon).toBeVisible();
      }
    });

    test('Mobile navigation works correctly', async ({ page }) => {
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');

      const libraryButton = bottomNav.locator('[data-testid="nav-item-library"]');
      await libraryButton.click();
      await page.waitForURL('**/volunteer/library');
      expect(page.url()).toContain('/volunteer/library');

      const activeIndicator = bottomNav.locator('[data-active="true"]');
      await expect(activeIndicator).toHaveAttribute('data-testid', 'nav-item-library');
    });

    test('Touch targets meet minimum size requirements', async ({ page }) => {
      const touchElements = page.locator('button, a, [role="button"]');
      const count = await touchElements.count();

      for (let i = 0; i < count; i++) {
        const element = touchElements.nth(i);
        const box = await element.boundingBox();

        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('Mobile menu overlay works with swipe gestures', async ({ page }) => {
      const hamburgerMenu = page.locator('[data-testid="hamburger-menu"]');
      await hamburgerMenu.click();

      const menu = page.locator('[data-testid="mobile-menu"]');
      await expect(menu).toBeVisible();

      await menu.evaluate(el => {
        const touch = new Touch({
          identifier: 1,
          target: el,
          clientX: 250,
          clientY: 300
        });

        const touchStart = new TouchEvent('touchstart', {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch]
        });

        const touchEnd = new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: [new Touch({
            identifier: 1,
            target: el,
            clientX: 50,
            clientY: 300
          })]
        });

        el.dispatchEvent(touchStart);
        el.dispatchEvent(touchEnd);
      });

      await expect(menu).not.toBeVisible({ timeout: 1000 });
    });

    test('No horizontal overflow on mobile', async ({ page }) => {
      const viewportWidth = 375;

      const elements = page.locator('*');
      const count = await elements.count();

      for (let i = 0; i < Math.min(count, 50); i++) {
        const element = elements.nth(i);
        const box = await element.boundingBox();

        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
        }
      }
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    const browsers = ['chromium', 'firefox', 'webkit'];

    browsers.forEach(browserName => {
      test(`Renders correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        if (currentBrowser !== browserName) {
          test.skip();
        }

        await page.goto(`${BASE_URL}/dashboard/writer`);
        await page.waitForLoadState('networkidle');

        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible();

        const screenshot = await page.screenshot({ fullPage: true });
        expect(screenshot).toBeTruthy();
      });
    });
  });

  test.describe('Performance Tests', () => {
    test('Page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/dashboard/writer`);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);

      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          loadComplete: perf.loadEventEnd - perf.loadEventStart
        };
      });

      expect(metrics.domContentLoaded).toBeLessThan(1500);
      expect(metrics.loadComplete).toBeLessThan(2500);
    });

    test('No memory leaks during navigation', async ({ page }) => {
      const getMemoryUsage = () => page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      const initialMemory = await getMemoryUsage();

      for (let i = 0; i < 10; i++) {
        await page.goto(`${BASE_URL}/dashboard/writer`);
        await page.goto(`${BASE_URL}/dashboard/writer/library`);
        await page.goto(`${BASE_URL}/dashboard/writer/submit-text`);
      }

      await page.evaluate(() => {
        if (global.gc) global.gc();
      });

      await page.waitForTimeout(2000);

      const finalMemory = await getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });
  });

  test.describe('Accessibility Tests', () => {
    test('Keyboard navigation works correctly', async ({ page }) => {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      expect(focusedElement).toBeTruthy();

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      await page.keyboard.press('Enter');

      const urlChanged = await page.waitForURL(url => url !== `${BASE_URL}/dashboard/writer`, {
        timeout: 5000
      }).catch(() => false);

      expect(urlChanged).toBeTruthy();
    });

    test('ARIA labels are present', async ({ page }) => {
      const elementsWithAria = await page.locator('[aria-label], [aria-describedby], [role]').count();
      expect(elementsWithAria).toBeGreaterThan(10);

      const navigation = page.locator('nav[aria-label]');
      await expect(navigation).toHaveCount(1);

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const hasAccessibleName = await button.evaluate(el => {
          return !!(el.textContent?.trim() || el.getAttribute('aria-label'));
        });
        expect(hasAccessibleName).toBeTruthy();
      }
    });

    test('Color contrast meets WCAG standards', async ({ page }) => {
      const contrastIssues = await page.evaluate(() => {
        const getContrast = (rgb1: number[], rgb2: number[]) => {
          const getLuminance = (rgb: number[]) => {
            const [r, g, b] = rgb.map(val => {
              val = val / 255;
              return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };

          const l1 = getLuminance(rgb1);
          const l2 = getLuminance(rgb2);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        const issues: string[] = [];
        const elements = document.querySelectorAll('*');

        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;

          if (color && bgColor && color !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
            const colorMatch = color.match(/\d+/g);
            const bgMatch = bgColor.match(/\d+/g);

            if (colorMatch && bgMatch) {
              const colorRgb = colorMatch.slice(0, 3).map(Number);
              const bgRgb = bgMatch.slice(0, 3).map(Number);
              const contrast = getContrast(colorRgb, bgRgb);

              if (contrast < 4.5 && el.textContent?.trim()) {
                issues.push(`Low contrast: ${contrast.toFixed(2)} on ${el.tagName}`);
              }
            }
          }
        });

        return issues;
      });

      expect(contrastIssues.length).toBe(0);
    });
  });
});

test.describe('API Endpoint Tests', () => {
  test('Volunteer API endpoints respond correctly', async ({ request }) => {
    const endpoints = [
      { path: '/api/health', expectedStatus: 200 },
      { path: '/api/writer/stats', expectedStatus: 200 },
      { path: '/api/writer/submissions', expectedStatus: 200 },
      { path: '/api/writer/profile', expectedStatus: 200 }
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint.path}`);
      expect(response.status()).toBe(endpoint.expectedStatus);

      if (endpoint.expectedStatus === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
      }
    }
  });

  test('Story submission API validates input', async ({ request }) => {
    const invalidData = {
      title: '', // Empty title
      content: 'Test',
      authorAge: 150, // Invalid age
      country: 'InvalidCountry'
    };

    const response = await request.post(`${BASE_URL}/api/writer/submit`, {
      data: invalidData,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.errors).toBeDefined();
  });
});

test.describe('Data Integrity Tests', () => {
  test('User session persists across navigation', async ({ page, context }) => {
    await context.addCookies([{
      name: 'test-session',
      value: 'volunteer-session-token',
      domain: 'localhost',
      path: '/'
    }]);

    await page.goto(`${BASE_URL}/dashboard/writer`);
    const sessionCookie = await context.cookies();
    expect(sessionCookie.find(c => c.name === 'test-session')).toBeDefined();

    await page.goto(`${BASE_URL}/dashboard/writer/library`);
    const sessionAfterNav = await context.cookies();
    expect(sessionAfterNav.find(c => c.name === 'test-session')).toBeDefined();
  });

  test('Form data persists during navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/writer/submit-text`);

    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill('Test Story in Progress');

    await page.goto(`${BASE_URL}/dashboard/writer/library`);
    await page.goBack();

    const titleValue = await titleInput.inputValue();
    expect(titleValue).toBe('Test Story in Progress');
  });
});