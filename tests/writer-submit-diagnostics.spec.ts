import { test, expect } from '@playwright/test';

test.describe('Volunteer Submit Text Page Diagnostics', () => {
  test('Check page interactivity and navigation', async ({ page, context }) => {
    // Set up console logging
    const consoleLogs: { type: string; text: string }[] = [];
    page.on('console', (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Set up request/response logging
    const networkRequests: { url: string; status?: number; type: string }[] = [];
    page.on('request', (request) => {
      if (request.url().includes('.js') || request.url().includes('.css')) {
        networkRequests.push({
          url: request.url(),
          type: request.resourceType()
        });
      }
    });

    page.on('response', (response) => {
      const request = response.request();
      if (request.url().includes('.js') || request.url().includes('.css')) {
        const existing = networkRequests.find(r => r.url === request.url());
        if (existing) {
          existing.status = response.status();
        }
      }
    });

    // Navigate to the page
    console.log('🔍 Navigating to volunteer submit-text page...');
    const response = await page.goto('https://1001stories.seedsofempowerment.org/dashboard/writer/submit-text', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`📍 Final URL: ${page.url()}`);
    console.log(`📊 Response status: ${response?.status()}`);

    // Check if redirected to login
    const currentUrl = page.url();
    const wasRedirected = currentUrl.includes('/login');

    if (wasRedirected) {
      console.log('⚠️ Page redirected to login - Authentication required');
      console.log(`   Current URL: ${currentUrl}`);

      // Take screenshot of login page
      await page.screenshot({
        path: '/test-results/login-redirect.png',
        fullPage: true
      });

      console.log('\n📋 Console Logs:');
      consoleLogs.forEach(log => {
        console.log(`   [${log.type}] ${log.text}`);
      });

      return;
    }

    console.log('✅ Page loaded without redirect');

    // Wait for React to hydrate
    console.log('⏳ Waiting for React hydration...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: '/test-results/initial-page.png',
      fullPage: true
    });

    // Check for React root
    const hasReactRoot = await page.evaluate(() => {
      const root = document.getElementById('__next');
      return {
        exists: !!root,
        hasContent: root ? root.children.length > 0 : false,
        reactFiber: root ? !!(root as any)._reactRootContainer || !!(root as any).__reactContainer : false
      };
    });
    console.log('🔧 React Root Check:', JSON.stringify(hasReactRoot, null, 2));

    // Check for hydration errors
    const hydrationErrors = consoleLogs.filter(log =>
      log.text.toLowerCase().includes('hydrat') ||
      log.text.includes('Warning: Did not expect server HTML') ||
      log.text.includes('Text content does not match')
    );

    if (hydrationErrors.length > 0) {
      console.log('❌ Hydration Errors Detected:');
      hydrationErrors.forEach(error => {
        console.log(`   ${error.text}`);
      });
    }

    // Check JavaScript bundle loading
    console.log('\n📦 JavaScript Bundle Status:');
    const jsFiles = networkRequests.filter(r => r.type === 'script');
    jsFiles.forEach(file => {
      const filename = file.url.split('/').pop()?.split('?')[0];
      const status = file.status || 'pending';
      const icon = status === 200 ? '✅' : '❌';
      console.log(`   ${icon} ${filename}: ${status}`);
    });

    // Test navigation elements
    console.log('\n🔗 Testing Navigation Elements:');

    const navigationTests = [
      { selector: 'a[href="/dashboard/writer"]', name: 'Home link' },
      { selector: 'a:has-text("Library")', name: 'Library link' },
      { selector: 'a:has-text("Stories")', name: 'Stories link' },
      { selector: 'a:has-text("Submit Story")', name: 'Submit Story link' },
      { selector: 'button:has-text("Submit")', name: 'Submit button' },
      { selector: 'nav a', name: 'Any nav link' }
    ];

    for (const test of navigationTests) {
      try {
        const element = await page.locator(test.selector).first();
        const exists = await element.count() > 0;

        if (exists) {
          // Check if element is visible
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();

          // Get computed styles
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              pointerEvents: computed.pointerEvents,
              cursor: computed.cursor,
              opacity: computed.opacity,
              visibility: computed.visibility,
              display: computed.display,
              zIndex: computed.zIndex
            };
          });

          console.log(`\n   📌 ${test.name}:`);
          console.log(`      Exists: ${exists}`);
          console.log(`      Visible: ${isVisible}`);
          console.log(`      Enabled: ${isEnabled}`);
          console.log(`      Styles: ${JSON.stringify(styles, null, 2)}`);

          if (isVisible && isEnabled) {
            try {
              // Try to click with force
              console.log(`      Attempting click...`);
              await element.click({ timeout: 5000, force: true });
              console.log(`      ✅ Click successful`);

              // Check if URL changed
              const newUrl = page.url();
              if (newUrl !== currentUrl) {
                console.log(`      ➡️ Navigated to: ${newUrl}`);
                await page.goBack();
                await page.waitForLoadState('networkidle');
              }
            } catch (clickError: any) {
              console.log(`      ❌ Click failed: ${clickError.message}`);

              // Try JavaScript click as fallback
              try {
                await element.evaluate((el) => (el as HTMLElement).click());
                console.log(`      ⚡ JavaScript click executed`);
              } catch (jsError: any) {
                console.log(`      ❌ JavaScript click also failed: ${jsError.message}`);
              }
            }
          }
        } else {
          console.log(`   ❌ ${test.name}: Not found`);
        }
      } catch (error: any) {
        console.log(`   ❌ ${test.name}: Error - ${error.message}`);
      }
    }

    // Check for event listeners
    console.log('\n🎯 Checking Event Listeners:');
    const eventListenerCheck = await page.evaluate(() => {
      const links = document.querySelectorAll('a, button');
      const results: any[] = [];

      links.forEach((link, index) => {
        if (index < 5) { // Check first 5 elements
          const listeners = (link as any).getEventListeners ? (link as any).getEventListeners() : {};
          results.push({
            tag: link.tagName,
            text: link.textContent?.trim().substring(0, 30),
            hasOnClick: !!link.onclick,
            hasListeners: Object.keys(listeners).length > 0,
            href: (link as HTMLAnchorElement).href
          });
        }
      });

      return results;
    });

    eventListenerCheck.forEach(el => {
      console.log(`   ${el.tag}: "${el.text}"`);
      console.log(`      onClick: ${el.hasOnClick}, Listeners: ${el.hasListeners}, href: ${el.href}`);
    });

    // Check for blocking overlays
    console.log('\n🔍 Checking for Blocking Overlays:');
    const overlays = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const blocking: any[] = [];

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex) || 0;

        if (zIndex > 100 && styles.position !== 'static') {
          blocking.push({
            tag: el.tagName,
            class: el.className,
            zIndex: zIndex,
            position: styles.position,
            pointerEvents: styles.pointerEvents
          });
        }
      });

      return blocking.sort((a, b) => b.zIndex - a.zIndex).slice(0, 5);
    });

    if (overlays.length > 0) {
      console.log('   ⚠️ High z-index elements found:');
      overlays.forEach(el => {
        console.log(`      ${el.tag}.${el.class}: z-index=${el.zIndex}, position=${el.position}`);
      });
    } else {
      console.log('   ✅ No blocking overlays detected');
    }

    // Test form elements if present
    console.log('\n📝 Testing Form Elements:');
    const formElements = [
      { selector: 'input[type="text"]', name: 'Text input' },
      { selector: 'textarea', name: 'Textarea' },
      { selector: 'select', name: 'Select dropdown' }
    ];

    for (const element of formElements) {
      try {
        const el = await page.locator(element.selector).first();
        if (await el.count() > 0) {
          const isEnabled = await el.isEnabled();
          console.log(`   ${element.name}: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);

          if (isEnabled) {
            try {
              await el.fill('Test input');
              console.log(`      ✅ Can type in field`);
              await el.clear();
            } catch (error: any) {
              console.log(`      ❌ Cannot type: ${error.message}`);
            }
          }
        } else {
          console.log(`   ${element.name}: Not found`);
        }
      } catch (error: any) {
        console.log(`   ${element.name}: Error - ${error.message}`);
      }
    }

    // Final console log summary
    console.log('\n📋 All Console Logs:');
    consoleLogs.forEach(log => {
      const icon = log.type === 'error' ? '❌' : log.type === 'warning' ? '⚠️' : '📝';
      console.log(`   ${icon} [${log.type}] ${log.text.substring(0, 200)}`);
    });

    // Take final screenshot
    await page.screenshot({
      path: '/test-results/final-page.png',
      fullPage: true
    });

    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY:');
    console.log(`   Page loaded: ${!wasRedirected}`);
    console.log(`   Console errors: ${consoleLogs.filter(l => l.type === 'error').length}`);
    console.log(`   Console warnings: ${consoleLogs.filter(l => l.type === 'warning').length}`);
    console.log(`   Hydration issues: ${hydrationErrors.length > 0}`);
    console.log(`   JS bundles loaded: ${jsFiles.filter(f => f.status === 200).length}/${jsFiles.length}`);
  });
});