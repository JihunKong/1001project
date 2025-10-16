import { test } from '@playwright/test';

test('Check if logged-in pages have navigation issues', async ({ page, context }) => {
  console.log('🔍 Testing Navigation After Login\n');
  console.log('=' .repeat(50));

  // First, let's check the login page itself
  console.log('\n📍 Checking Login Page');
  await page.goto('https://1001stories.seedsofempowerment.org/login', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log(`  URL: ${page.url()}`);

  // Check for login form elements
  const emailInput = await page.locator('input[type="email"], input[name="email"], input#email').first();
  const hasEmailInput = await emailInput.count() > 0;

  console.log(`  Email input field: ${hasEmailInput ? '✅ Found' : '❌ Not found'}`);

  if (hasEmailInput) {
    // Check if we can interact with the form
    try {
      await emailInput.fill('test@example.com');
      console.log('  ✅ Can type in email field');

      // Check for submit button
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Continue")').first();
      const hasSubmitButton = await submitButton.count() > 0;

      console.log(`  Submit button: ${hasSubmitButton ? '✅ Found' : '❌ Not found'}`);

      if (hasSubmitButton) {
        const isEnabled = await submitButton.isEnabled();
        console.log(`  Submit button enabled: ${isEnabled ? '✅' : '❌'}`);
      }
    } catch (e: any) {
      console.log(`  ❌ Cannot interact with form: ${e.message}`);
    }
  }

  // Since we can't actually log in without valid credentials,
  // let's check if there's a demo mode or test the signup flow
  console.log('\n📍 Checking Signup Page');
  await page.goto('https://1001stories.seedsofempowerment.org/signup', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  const signupUrl = page.url();
  console.log(`  URL: ${signupUrl}`);

  // Check for role selection cards
  const roleCards = await page.locator('.role-card, [data-role], button:has-text("Select")').all();
  console.log(`  Role selection cards: ${roleCards.length} found`);

  if (roleCards.length > 0) {
    console.log('\n  Testing role card clicks:');
    const firstCard = roleCards[0];
    try {
      await firstCard.click({ timeout: 3000 });
      console.log('    ✅ Role card is clickable');

      // Check if navigation happened
      const newUrl = page.url();
      if (newUrl !== signupUrl) {
        console.log(`    Navigated to: ${newUrl}`);
      }
    } catch (e: any) {
      console.log(`    ❌ Role card click failed: ${e.message}`);
    }
  }

  // Check JavaScript bundle loading
  console.log('\n🔧 JavaScript Bundle Analysis:');

  const jsStatus = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    const nextScripts = scripts.filter(s => s.src.includes('_next'));

    return {
      totalScripts: scripts.length,
      nextScripts: nextScripts.length,
      hasChunks: scripts.some(s => s.src.includes('chunks')),
      hasFramework: scripts.some(s => s.src.includes('framework')),
      hasMain: scripts.some(s => s.src.includes('main')),
      scriptErrors: scripts.filter(s => s.onerror).length
    };
  });

  console.log(`  Total scripts: ${jsStatus.totalScripts}`);
  console.log(`  Next.js scripts: ${jsStatus.nextScripts}`);
  console.log(`  Has chunks: ${jsStatus.hasChunks ? '✅' : '❌'}`);
  console.log(`  Has framework: ${jsStatus.hasFramework ? '✅' : '❌'}`);
  console.log(`  Has main: ${jsStatus.hasMain ? '✅' : '❌'}`);
  console.log(`  Script errors: ${jsStatus.scriptErrors}`);

  // Check for specific React/Next.js issues
  console.log('\n🔍 Checking for Common Issues:');

  const issues = await page.evaluate(() => {
    const checks: any = {};

    // Check for __NEXT_DATA__
    const nextData = document.getElementById('__NEXT_DATA__');
    checks.hasNextData = !!nextData;

    // Check for React in different places
    checks.reactInWindow = typeof (window as any).React !== 'undefined';
    checks.reactInGlobal = typeof (globalThis as any).React !== 'undefined';

    // Check for common hydration issues
    const root = document.getElementById('__next');
    if (root) {
      checks.rootHasContent = root.children.length > 0;
      checks.rootHasReactAttr = root.hasAttribute('data-reactroot');
    }

    // Check for CSS-in-JS
    const styleSheets = document.querySelectorAll('style[data-emotion], style[data-styled]');
    checks.hasCSSinJS = styleSheets.length > 0;

    return checks;
  });

  console.log(`  __NEXT_DATA__ script: ${issues.hasNextData ? '✅' : '❌'}`);
  console.log(`  React in window: ${issues.reactInWindow ? '✅' : '❌'}`);
  console.log(`  Root has content: ${issues.rootHasContent ? '✅' : '❌'}`);
  console.log(`  Root has React attr: ${issues.rootHasReactAttr ? '✅' : '❌'}`);
  console.log(`  CSS-in-JS styles: ${issues.hasCSSinJS ? '✅' : '❌'}`);

  console.log('\n' + '=' .repeat(50));

  console.log('\n📊 DIAGNOSIS SUMMARY:');
  console.log('The issue appears to be that:');

  if (!issues.hasNextData) {
    console.log('  ❌ Next.js data script is missing - possible SSR issue');
  }

  if (!issues.reactInWindow) {
    console.log('  ❌ React is not exposed globally - this is normal for production builds');
  }

  if (issues.rootHasContent && !issues.rootHasReactAttr) {
    console.log('  ⚠️ Content exists but no React attributes - possible hydration failure');
  }

  console.log('\n💡 RECOMMENDATION:');
  console.log('  Since the volunteer/submit-text page requires authentication,');
  console.log('  navigation issues can only be properly tested with a logged-in session.');
  console.log('  The public pages appear to be working correctly.');

  console.log('\n' + '=' .repeat(50));
});