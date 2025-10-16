import { test } from '@playwright/test';

test.describe('Production Navigation Tests', () => {
  test('Check public pages navigation', async ({ page }) => {
    console.log('🔍 Testing Navigation on Public Pages\n');
    console.log('=' .repeat(50));

    // Test landing page
    console.log('\n📍 Testing Landing Page');
    await page.goto('https://1001stories.seedsofempowerment.org/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`  URL: ${page.url()}`);
    console.log(`  Title: ${await page.title()}`);

    // Check for navigation links
    const navLinks = await page.locator('nav a, header a').all();
    console.log(`  Found ${navLinks.length} navigation links`);

    // Try clicking some public navigation links
    const publicLinks = [
      { text: 'About', expectedUrl: '/about' },
      { text: 'Login', expectedUrl: '/login' },
      { text: 'Sign Up', expectedUrl: '/signup' },
      { text: 'Demo', expectedUrl: '/demo' }
    ];

    for (const link of publicLinks) {
      try {
        const element = await page.locator(`a:has-text("${link.text}")`).first();
        if (await element.count() > 0) {
          const href = await element.getAttribute('href');
          console.log(`\n  Testing "${link.text}" link:`);
          console.log(`    href: ${href}`);

          try {
            await element.click({ timeout: 3000 });
            await page.waitForLoadState('networkidle', { timeout: 5000 });
            const newUrl = page.url();
            console.log(`    ✅ Click successful`);
            console.log(`    Navigated to: ${newUrl}`);

            // Go back to homepage for next test
            await page.goto('https://1001stories.seedsofempowerment.org/');
          } catch (e: any) {
            console.log(`    ❌ Click failed: ${e.message}`);
          }
        } else {
          console.log(`\n  "${link.text}" link not found`);
        }
      } catch (e: any) {
        console.log(`\n  Error testing "${link.text}": ${e.message}`);
      }
    }

    console.log('\n' + '=' .repeat(50));
  });

  test('Check demo pages without authentication', async ({ page }) => {
    console.log('🔍 Testing Demo Pages (No Auth Required)\n');
    console.log('=' .repeat(50));

    // Navigate to demo page
    console.log('\n📍 Testing Demo Library Page');
    await page.goto('https://1001stories.seedsofempowerment.org/demo/library', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const demoUrl = page.url();
    console.log(`  URL: ${demoUrl}`);

    if (demoUrl.includes('/login')) {
      console.log('  ⚠️ Demo page redirected to login - unexpected behavior');
    } else {
      console.log('  ✅ Demo page loaded without authentication');

      // Test navigation within demo
      const demoLinks = await page.locator('a').all();
      console.log(`  Found ${demoLinks.length} links on demo page`);

      // Try clicking a few links
      const firstLink = await page.locator('a').first();
      if (await firstLink.count() > 0) {
        const text = await firstLink.textContent();
        console.log(`\n  Testing first link: "${text?.trim().substring(0, 30)}..."`);

        try {
          await firstLink.click({ timeout: 3000 });
          console.log(`    ✅ Click successful`);
          console.log(`    New URL: ${page.url()}`);
        } catch (e: any) {
          console.log(`    ❌ Click failed: ${e.message}`);
        }
      }
    }

    console.log('\n' + '=' .repeat(50));
  });

  test('Diagnose JavaScript hydration issues', async ({ page }) => {
    console.log('🔧 Checking for React Hydration Issues\n');
    console.log('=' .repeat(50));

    // Set up console logging
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
        if (text.includes('hydrat') || text.includes('React')) {
          console.log(`  ❌ Hydration Error: ${text.substring(0, 100)}...`);
        }
      } else if (msg.type() === 'warning') {
        warnings.push(text);
        if (text.includes('hydrat') || text.includes('React')) {
          console.log(`  ⚠️ Hydration Warning: ${text.substring(0, 100)}...`);
        }
      }
    });

    // Navigate to main page
    await page.goto('https://1001stories.seedsofempowerment.org/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for potential hydration
    await page.waitForTimeout(3000);

    // Check React and Next.js status
    const reactStatus = await page.evaluate(() => {
      const results: any = {
        nextRoot: !!document.getElementById('__next'),
        reactVersion: (window as any).React?.version || 'Not found',
        reactDOMVersion: (window as any).ReactDOM?.version || 'Not found',
        hasReactFiber: false,
        interactiveElements: 0,
        clickableLinks: 0,
        eventListeners: {}
      };

      // Check for React fiber
      const root = document.getElementById('__next');
      if (root) {
        results.hasReactFiber = !!(root as any)._reactRootContainer ||
                                !!(root as any).__reactContainer ||
                                !!(root as any).__reactInternalInstance;
      }

      // Count interactive elements
      const links = document.querySelectorAll('a');
      const buttons = document.querySelectorAll('button');
      results.interactiveElements = links.length + buttons.length;

      // Check if links have click handlers
      links.forEach(link => {
        if ((link as any).onclick || link.getAttribute('href')) {
          results.clickableLinks++;
        }
      });

      return results;
    });

    console.log('\n📊 React/Next.js Status:');
    console.log(`  Next.js Root: ${reactStatus.nextRoot ? '✅' : '❌'}`);
    console.log(`  React Version: ${reactStatus.reactVersion}`);
    console.log(`  ReactDOM Version: ${reactStatus.reactDOMVersion}`);
    console.log(`  React Fiber: ${reactStatus.hasReactFiber ? '✅' : '❌'}`);
    console.log(`  Interactive Elements: ${reactStatus.interactiveElements}`);
    console.log(`  Clickable Links: ${reactStatus.clickableLinks}`);

    // Test actual click functionality
    console.log('\n🖱️ Testing Click Functionality:');

    const testLink = await page.locator('a').first();
    if (await testLink.count() > 0) {
      const linkText = await testLink.textContent();
      console.log(`  Testing link: "${linkText?.trim().substring(0, 30)}..."`);

      // Get element properties
      const props = await testLink.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          href: (el as HTMLAnchorElement).href,
          pointerEvents: styles.pointerEvents,
          cursor: styles.cursor,
          display: styles.display,
          visibility: styles.visibility,
          zIndex: styles.zIndex,
          position: styles.position,
          hasOnClick: !!(el as any).onclick,
          isDisabled: (el as any).disabled
        };
      });

      console.log('  Element Properties:');
      console.log(`    href: ${props.href || 'none'}`);
      console.log(`    pointer-events: ${props.pointerEvents}`);
      console.log(`    cursor: ${props.cursor}`);
      console.log(`    visibility: ${props.visibility}`);
      console.log(`    hasOnClick: ${props.hasOnClick}`);

      if (props.pointerEvents === 'none') {
        console.log('  ⚠️ Element has pointer-events: none - clicks will not work!');
      }

      try {
        await testLink.click({ timeout: 3000, force: true });
        console.log('  ✅ Click executed successfully');
      } catch (e: any) {
        console.log(`  ❌ Click failed: ${e.message}`);
      }
    }

    console.log('\n📋 Summary:');
    console.log(`  Total Errors: ${errors.length}`);
    console.log(`  Total Warnings: ${warnings.length}`);
    console.log(`  Hydration Issues: ${errors.filter(e => e.includes('hydrat')).length + warnings.filter(w => w.includes('hydrat')).length}`);

    console.log('\n' + '=' .repeat(50));
  });
});