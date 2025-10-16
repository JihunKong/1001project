import { test, expect } from '@playwright/test';

test.describe('Final Magic Link Dashboard Test - Docker Environment', () => {
  const MAGIC_LINK = 'http://localhost:8001/api/auth/callback/email?callbackUrl=http%3A%2F%2Flocalhost%3A8001%2Fdashboard&token=a6150c296df7093b490a13288bee5cdc0066466adb7c43565872a32750334360&email=volunteer%40test.1001stories.org';

  test('should use magic link to authenticate and access volunteer dashboard', async ({ page }) => {
    console.log('🚀 Final Magic Link Authentication and Dashboard Test');
    console.log('🔗 Using existing magic link from Docker logs');

    // Clear any existing session
    await page.context().clearCookies();

    // Step 1: Use the magic link
    console.log('\n📍 Step 1: Authenticating with magic link...');
    try {
      await page.goto(MAGIC_LINK, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`✅ Magic link processed. Current URL: ${currentUrl}`);

      await page.screenshot({ path: 'test-results/final-after-magic-link.png', fullPage: true });

    } catch (error) {
      console.log(`⚠️ Magic link navigation issue: ${error.message}`);
      // Continue with current page state
    }

    // Step 2: Navigate to home to check authentication state
    console.log('\n📍 Step 2: Checking authentication state...');
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const homeContent = await page.textContent('body');
    const isAuthenticated = homeContent.includes('Dashboard') && homeContent.includes('Logout');

    console.log(`🔐 Authentication Status: ${isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);

    await page.screenshot({ path: 'test-results/final-home-authenticated.png', fullPage: true });

    // Step 3: Access volunteer dashboard
    if (isAuthenticated) {
      console.log('\n📍 Step 3: Accessing volunteer dashboard...');

      // Try clicking the Dashboard button
      try {
        const dashboardLink = page.locator('text=Dashboard').first();
        await dashboardLink.click();
        await page.waitForTimeout(3000);

        let dashboardUrl = page.url();
        console.log(`📊 Dashboard URL: ${dashboardUrl}`);

        // If we're on general dashboard, try to navigate to volunteer specific
        if (dashboardUrl.includes('/dashboard') && !dashboardUrl.includes('/volunteer')) {
          console.log('🔄 Attempting to access volunteer-specific dashboard...');
          await page.goto('/dashboard/volunteer', { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(3000);
          dashboardUrl = page.url();
          console.log(`📊 Volunteer Dashboard URL: ${dashboardUrl}`);
        }

        await page.screenshot({ path: 'test-results/final-volunteer-dashboard.png', fullPage: true });

        // Step 4: Analyze dashboard content
        console.log('\n📍 Step 4: Analyzing volunteer dashboard content...');

        const dashboardContent = await page.textContent('body');
        const dashboardTitle = await page.locator('h1, h2, h3').first().textContent();

        console.log(`📄 Dashboard Title: ${dashboardTitle}`);

        // Check for volunteer-specific elements
        const volunteerFeatures = {
          hasSubmitStory: dashboardContent.includes('Submit') && (dashboardContent.includes('story') || dashboardContent.includes('Story')),
          hasUpload: dashboardContent.includes('Upload'),
          hasContributions: dashboardContent.includes('contribution') || dashboardContent.includes('Contribution'),
          hasVolunteerText: dashboardContent.toLowerCase().includes('volunteer'),
          hasForm: dashboardContent.includes('form') || dashboardContent.includes('Form'),
          hasImpact: dashboardContent.includes('impact') || dashboardContent.includes('Impact')
        };

        console.log('🎯 Volunteer Dashboard Features:');
        for (const [feature, present] of Object.entries(volunteerFeatures)) {
          console.log(`  - ${feature}: ${present ? '✅' : '❌'}`);
        }

        // Step 5: Test interactive elements
        console.log('\n📍 Step 5: Testing interactive elements...');

        const buttons = await page.locator('button').count();
        const links = await page.locator('a').count();
        const forms = await page.locator('form').count();

        console.log(`🔧 Interactive Elements: ${buttons} buttons, ${links} links, ${forms} forms`);

        // Try to find and click a submit story button
        try {
          const submitButton = page.locator('button:has-text("Submit"), a:has-text("Submit")').first();
          if (await submitButton.isVisible()) {
            console.log('🎯 Found Submit button - testing click...');
            await submitButton.click();
            await page.waitForTimeout(2000);

            const newUrl = page.url();
            console.log(`📍 After Submit click: ${newUrl}`);

            await page.screenshot({ path: 'test-results/final-submit-story-form.png', fullPage: true });

            // Navigate back
            await page.goBack();
            await page.waitForTimeout(1000);
          }
        } catch (error) {
          console.log(`⚠️ Submit button test failed: ${error.message}`);
        }

      } catch (error) {
        console.log(`⚠️ Dashboard navigation failed: ${error.message}`);
      }

    } else {
      console.log('❌ Authentication failed - cannot access dashboard');
    }

    // Step 6: Check session API
    console.log('\n📍 Step 6: Verifying session via API...');
    try {
      const sessionResponse = await page.request.get('/api/auth/session');
      const sessionData = await sessionResponse.json();

      console.log('📊 Final Session Data:');
      console.log(`  - Authenticated: ${sessionData.authenticated}`);
      console.log(`  - Email: ${sessionData.user?.email || 'None'}`);
      console.log(`  - Role: ${sessionData.user?.role || 'None'}`);
      console.log(`  - ID: ${sessionData.user?.id || 'None'}`);

    } catch (error) {
      console.log(`❌ Session API check failed: ${error.message}`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL MAGIC LINK AUTHENTICATION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`🔗 Magic Link Used: EXISTING TOKEN`);
    console.log(`🔐 Authentication: ${isAuthenticated ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📊 Dashboard Access: ${page.url().includes('/dashboard') ? 'SUCCESS' : 'FAILED'}`);
    console.log(`👥 Volunteer Context: ${page.url().includes('/volunteer') ? 'SPECIFIC' : 'GENERAL'}`);
    console.log(`📍 Final URL: ${page.url()}`);
    console.log('='.repeat(60));

    // Test assertion
    expect(isAuthenticated).toBeTruthy();
  });
});