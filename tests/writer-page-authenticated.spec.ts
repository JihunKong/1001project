import { test, expect } from '@playwright/test';

test.describe('Volunteer Submit Page - Authenticated Testing', () => {
  test('Simulate authenticated session and test navigation', async ({ page, context }) => {
    console.log('🔐 Testing Volunteer Submit Page with Session Simulation\n');
    console.log('=' .repeat(60));

    // First, let's try to set authentication cookies if we know them
    // This would normally come from a successful login
    // For now, we'll test what happens with various session approaches

    console.log('\n📍 Attempting to access protected route directly...');

    // Set some common auth cookies (these may not work without valid values)
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'dummy-session-token',
        domain: '1001stories.seedsofempowerment.org',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      },
      {
        name: '__Secure-next-auth.session-token',
        value: 'dummy-session-token',
        domain: '1001stories.seedsofempowerment.org',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      }
    ]);

    // Navigate to the volunteer submit page
    const response = await page.goto('https://1001stories.seedsofempowerment.org/dashboard/writer/submit-text', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`  Response Status: ${response?.status()}`);
    console.log(`  Final URL: ${page.url()}`);

    const isRedirected = page.url().includes('/login');

    if (isRedirected) {
      console.log('  ⚠️ Still redirected to login (dummy session not accepted)\n');
      console.log('  This is expected behavior - authentication is properly enforced.\n');

      // Let's check what the login page tells us
      console.log('📋 Login Page Analysis:');

      // Check for any error messages
      const errorMessages = await page.locator('.error, .alert, [role="alert"], .text-red-500').all();
      if (errorMessages.length > 0) {
        console.log('  Error messages found:');
        for (const msg of errorMessages) {
          const text = await msg.textContent();
          console.log(`    - ${text?.trim()}`);
        }
      } else {
        console.log('  No error messages displayed');
      }

      // Check callback URL parameter
      const url = new URL(page.url());
      const callbackUrl = url.searchParams.get('callbackUrl');
      if (callbackUrl) {
        console.log(`  Callback URL preserved: ${callbackUrl}`);
        console.log('  ✅ Proper redirect handling after login');
      }

    } else {
      console.log('  ✅ Page loaded successfully!\n');

      // If we somehow got in, test the navigation
      console.log('🔗 Testing Navigation Elements on Volunteer Page:\n');

      // Wait for page to fully load
      await page.waitForTimeout(3000);

      // Check for navigation sidebar
      const sidebar = await page.locator('aside, nav, [role="navigation"]').first();
      const hasSidebar = await sidebar.count() > 0;
      console.log(`  Sidebar/Navigation: ${hasSidebar ? '✅ Present' : '❌ Missing'}`);

      if (hasSidebar) {
        // Test sidebar links
        const sidebarLinks = await sidebar.locator('a').all();
        console.log(`  Sidebar links found: ${sidebarLinks.length}`);

        const linkTests = [
          'Home',
          'Submit Story',
          'My Stories',
          'Profile',
          'Logout'
        ];

        for (const linkText of linkTests) {
          const link = await sidebar.locator(`a:has-text("${linkText}")`).first();
          if (await link.count() > 0) {
            console.log(`\n  Testing "${linkText}" link:`);

            // Get link properties
            const props = await link.evaluate((el) => {
              const styles = window.getComputedStyle(el);
              return {
                href: (el as HTMLAnchorElement).href,
                pointerEvents: styles.pointerEvents,
                cursor: styles.cursor,
                opacity: styles.opacity,
                display: styles.display
              };
            });

            console.log(`    href: ${props.href}`);
            console.log(`    pointer-events: ${props.pointerEvents}`);
            console.log(`    cursor: ${props.cursor}`);

            // Try to click
            try {
              await link.click({ timeout: 2000, trial: true }); // Trial mode - doesn't actually click
              console.log(`    ✅ Clickable (trial success)`);
            } catch (e: any) {
              console.log(`    ❌ Not clickable: ${e.message}`);
            }
          } else {
            console.log(`  "${linkText}" link: Not found`);
          }
        }
      }

      // Check form elements
      console.log('\n📝 Form Elements on Submit Page:');

      const titleInput = await page.locator('input[name="title"], input#title, input[placeholder*="title" i]').first();
      const contentTextarea = await page.locator('textarea, [contenteditable="true"], .editor').first();
      const submitButton = await page.locator('button[type="submit"], button:has-text("Submit")').first();

      console.log(`  Title input: ${await titleInput.count() > 0 ? '✅ Present' : '❌ Missing'}`);
      console.log(`  Content editor: ${await contentTextarea.count() > 0 ? '✅ Present' : '❌ Missing'}`);
      console.log(`  Submit button: ${await submitButton.count() > 0 ? '✅ Present' : '❌ Missing'}`);

      // Test form interaction
      if (await titleInput.count() > 0) {
        try {
          await titleInput.fill('Test Story Title');
          console.log('  ✅ Can type in title field');
        } catch (e: any) {
          console.log(`  ❌ Cannot type in title: ${e.message}`);
        }
      }
    }

    // Check for JavaScript errors
    console.log('\n🔧 JavaScript Console Analysis:');

    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Trigger some interactions to see if errors occur
    await page.mouse.move(100, 100);
    await page.mouse.click(100, 100);
    await page.keyboard.press('Tab');

    await page.waitForTimeout(1000);

    if (jsErrors.length > 0) {
      console.log('  ❌ JavaScript errors detected:');
      jsErrors.forEach(err => console.log(`    - ${err.substring(0, 100)}...`));
    } else {
      console.log('  ✅ No JavaScript errors detected');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n📊 FINAL DIAGNOSIS:\n');

    if (isRedirected) {
      console.log('  ✅ Authentication is working correctly - page requires login');
      console.log('  ✅ Redirect mechanism is functioning properly');
      console.log('  ℹ️  To test the actual page navigation, you need:');
      console.log('     1. Valid authentication credentials');
      console.log('     2. Or temporarily disable auth in development');
      console.log('     3. Or use a test account with known session token');
    } else {
      console.log('  🎉 Page is accessible!');
      console.log('  Check the navigation test results above for click functionality.');
    }

    console.log('\n  💡 Next Steps:');
    console.log('     1. Check server logs for any backend errors');
    console.log('     2. Verify NextAuth.js configuration');
    console.log('     3. Test with actual login credentials');
    console.log('     4. Check if middleware is properly configured');

    console.log('\n' + '=' .repeat(60));
  });
});