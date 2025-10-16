import { test } from '@playwright/test';

test('Volunteer Submit Text - Quick Diagnostics', async ({ page }) => {
  console.log('🔍 Starting diagnostic test for volunteer submit-text page...\n');

  // Track console messages
  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`  ${text}`);
    }
  });

  // Navigate to the page
  console.log('📍 Navigating to: https://1001stories.seedsofempowerment.org/dashboard/writer/submit-text');

  try {
    const response = await page.goto('https://1001stories.seedsofempowerment.org/dashboard/writer/submit-text', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ Page loaded with status: ${response?.status()}`);
    console.log(`📍 Final URL: ${page.url()}\n`);

    // Check if redirected
    if (page.url().includes('/login')) {
      console.log('⚠️  REDIRECTED TO LOGIN - Authentication required\n');
      return;
    }

    // Wait a bit for React hydration
    await page.waitForTimeout(2000);

    // Test clicking on various navigation elements
    console.log('🔗 Testing Navigation Links:\n');

    const selectors = [
      { selector: 'a:has-text("Home")', name: 'Home link' },
      { selector: 'a:has-text("Library")', name: 'Library link' },
      { selector: 'a:has-text("Submit Story")', name: 'Submit Story link' },
      { selector: 'button', name: 'First button' },
      { selector: 'nav a', name: 'First nav link' }
    ];

    for (const item of selectors) {
      try {
        const element = await page.locator(item.selector).first();
        const count = await element.count();

        if (count > 0) {
          const isVisible = await element.isVisible();
          console.log(`  ${item.name}: ${isVisible ? '✅ Found' : '❌ Hidden'}`);

          if (isVisible) {
            try {
              await element.click({ timeout: 2000 });
              console.log(`    → Click successful`);

              // Check if navigation happened
              const newUrl = page.url();
              if (!newUrl.includes('submit-text')) {
                console.log(`    → Navigated to: ${newUrl}`);
                await page.goBack();
              }
            } catch (e: any) {
              console.log(`    → Click failed: ${e.message}`);
            }
          }
        } else {
          console.log(`  ${item.name}: Not found`);
        }
      } catch (e: any) {
        console.log(`  ${item.name}: Error - ${e.message}`);
      }
    }

    // Check JavaScript execution
    console.log('\n🔧 JavaScript Status:');
    const jsCheck = await page.evaluate(() => {
      return {
        react: typeof (window as any).React !== 'undefined',
        nextRoot: !!document.getElementById('__next'),
        hasInteractiveElements: document.querySelectorAll('a, button').length
      };
    });
    console.log(`  React loaded: ${jsCheck.react ? '✅' : '❌'}`);
    console.log(`  Next.js root: ${jsCheck.nextRoot ? '✅' : '❌'}`);
    console.log(`  Interactive elements: ${jsCheck.hasInteractiveElements}`);

    // Check for errors
    console.log('\n📋 Console Errors/Warnings:');
    const errors = consoleLogs.filter(log => log.includes('[ERROR]') || log.includes('[WARNING]'));
    if (errors.length === 0) {
      console.log('  ✅ No errors or warnings detected');
    } else {
      errors.forEach(err => console.log(`  ${err}`));
    }

  } catch (error: any) {
    console.log(`\n❌ Test failed: ${error.message}`);
  }
});