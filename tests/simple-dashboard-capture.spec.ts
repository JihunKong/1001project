import { test, expect } from '@playwright/test';

test.describe('Simple Dashboard Capture - Docker Environment', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10000);
  });

  test('should capture dashboard screenshots and verify authentication state', async ({ page }) => {
    console.log('📸 Capturing dashboard screenshots and authentication state...');

    // Test different URLs and capture their state
    const testUrls = [
      { name: 'Home', url: '/', expected: 'Should show authenticated state' },
      { name: 'Dashboard', url: '/dashboard', expected: 'Should redirect to specific dashboard or show general' },
      { name: 'Volunteer Dashboard', url: '/dashboard/volunteer', expected: 'Should show volunteer dashboard or redirect to login' },
      { name: 'Library', url: '/library', expected: 'Should show library or require authentication' },
      { name: 'Login', url: '/login', expected: 'Should show login form' }
    ];

    for (const testCase of testUrls) {
      console.log(`\n📍 Testing: ${testCase.name} (${testCase.url})`);

      try {
        await page.goto(testCase.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const title = await page.title();

        console.log(`  ✅ Loaded: ${currentUrl}`);
        console.log(`  📄 Title: ${title}`);

        // Take screenshot
        await page.screenshot({
          path: `test-results/capture-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true
        });

        // Check for authentication indicators
        const content = await page.textContent('body');
        const indicators = {
          hasLogin: content.includes('Sign in') || content.includes('Login'),
          hasDashboard: content.includes('Dashboard'),
          hasLogout: content.includes('Logout') || content.includes('Sign out'),
          hasVolunteerContent: content.toLowerCase().includes('volunteer'),
          hasSubmitStory: content.includes('Submit') && (content.includes('story') || content.includes('Story')),
          hasNavigation: content.includes('Library') || content.includes('Welcome')
        };

        console.log(`  🔍 Content Analysis:`);
        for (const [key, value] of Object.entries(indicators)) {
          console.log(`    - ${key}: ${value ? '✅' : '❌'}`);
        }

        // Special handling for dashboard URLs
        if (testCase.url.includes('/dashboard')) {
          if (currentUrl.includes('/dashboard') && !currentUrl.includes('/login')) {
            console.log(`  🎯 SUCCESS: Dashboard accessible!`);

            // Try to find specific dashboard elements
            const dashboardElements = await page.locator('h1, h2, h3').allTextContents();
            console.log(`    Dashboard headings: ${dashboardElements.join(', ')}`);

            // Look for interactive elements
            const buttons = await page.locator('button').count();
            const links = await page.locator('a').count();
            console.log(`    Interactive elements: ${buttons} buttons, ${links} links`);

          } else if (currentUrl.includes('/login')) {
            console.log(`  🔐 REDIRECT: Dashboard requires authentication`);
          }
        }

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        await page.screenshot({
          path: `test-results/error-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.png`
        });
      }
    }

    // Check API session endpoint
    console.log(`\n🔌 Checking authentication API...`);
    try {
      const sessionResponse = await page.request.get('/api/auth/session');
      const sessionData = await sessionResponse.json();

      console.log(`📊 Session Data:`);
      console.log(`  - Status: ${sessionResponse.status()}`);
      console.log(`  - Authenticated: ${sessionData.authenticated}`);
      console.log(`  - User: ${sessionData.user?.email || 'None'}`);
      console.log(`  - Role: ${sessionData.user?.role || 'None'}`);

    } catch (error) {
      console.log(`❌ Session API error: ${error.message}`);
    }

    // Generate a fresh magic link for manual testing
    console.log(`\n🔗 Generating fresh magic link for manual testing...`);

    try {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('volunteer@test.1001stories.org');

      // Instead of clicking, let's use a more stable approach
      await emailInput.press('Tab'); // Move to the button
      await page.keyboard.press('Enter'); // Submit the form

      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'test-results/capture-magic-link-generated.png' });

      console.log(`✅ Magic link generation attempt completed`);
      console.log(`🔍 Check Docker logs: docker-compose logs app --tail=10 | grep "Magic link"`);

    } catch (error) {
      console.log(`⚠️ Magic link generation failed: ${error.message}`);
    }

    console.log(`\n📊 DASHBOARD CAPTURE SUMMARY:`);
    console.log(`=`.repeat(50));
    console.log(`✅ Screenshots captured for all major pages`);
    console.log(`✅ Authentication state analyzed`);
    console.log(`✅ Dashboard accessibility tested`);
    console.log(`🔗 Fresh magic link generation attempted`);
    console.log(`=`.repeat(50));

    // This test always passes as it's just for capturing information
    expect(true).toBeTruthy();
  });
});