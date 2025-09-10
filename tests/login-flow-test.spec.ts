import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('1001 Stories Login Flow Test', () => {
  let page: Page;
  let context: BrowserContext;
  
  test.beforeEach(async ({ page: testPage, context: testContext }) => {
    page = testPage;
    context = testContext;
    
    // Enable request/response interception
    page.on('request', request => {
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        console.log(`← ${response.status()} ${response.url()}`);
      }
    });

    // Enable console logging to capture frontend errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Browser Error: ${msg.text()}`);
      }
    });
  });

  test('Test 1: Navigate to homepage and verify load', async () => {
    console.log('\n=== TEST 1: Navigate to Homepage ===');
    
    await test.step('Navigate to homepage', async () => {
      const response = await page.goto('http://localhost', { 
        waitUntil: 'networkidle',
        timeout: 30000
      });
      expect(response?.status()).toBe(200);
    });

    await test.step('Take homepage screenshot', async () => {
      await page.screenshot({ 
        path: 'tests/screenshots/01-homepage.png',
        fullPage: true
      });
    });

    await test.step('Verify homepage elements', async () => {
      // Check if page loaded successfully
      await expect(page.locator('body')).toBeVisible();
      
      // Look for common navigation or login elements
      const hasSignIn = await page.locator('text=/sign.?in/i, [href*="login"], [href*="signin"]').count() > 0;
      const hasGetStarted = await page.locator('text=/get.?started/i, text=/login/i').count() > 0;
      
      console.log(`Found sign-in elements: ${hasSignIn}`);
      console.log(`Found get-started elements: ${hasGetStarted}`);
    });
  });

  test('Test 2: Navigate to login page', async () => {
    console.log('\n=== TEST 2: Navigate to Login Page ===');
    
    await page.goto('http://localhost', { waitUntil: 'networkidle' });

    await test.step('Find and click login/signin link', async () => {
      // Try multiple selectors for login/signin
      const loginSelectors = [
        'text=/sign.?in/i',
        '[href*="login"]',
        '[href*="signin"]',
        'text=/login/i',
        'text=/get.?started/i',
        'a[href="/login"]',
        'a[href="/auth/signin"]'
      ];

      let loginFound = false;
      
      for (const selector of loginSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`Clicking login element: ${selector}`);
          await element.click();
          loginFound = true;
          break;
        }
      }

      if (!loginFound) {
        // Try direct navigation
        console.log('No login link found, trying direct navigation to /login');
        await page.goto('http://localhost/login', { waitUntil: 'networkidle' });
      }

      // Wait for navigation
      await page.waitForLoadState('networkidle');
    });

    await test.step('Take login page screenshot', async () => {
      await page.screenshot({ 
        path: 'tests/screenshots/02-login-page.png',
        fullPage: true
      });
    });

    await test.step('Verify login page elements', async () => {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check for common login form elements
      const hasEmailInput = await page.locator('input[type="email"], input[name="email"]').count() > 0;
      const hasPasswordInput = await page.locator('input[type="password"], input[name="password"]').count() > 0;
      const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').count() > 0;
      
      console.log(`Has email input: ${hasEmailInput}`);
      console.log(`Has password input: ${hasPasswordInput}`);
      console.log(`Has submit button: ${hasSubmitButton}`);
    });
  });

  test('Test 3: Test admin login credentials', async () => {
    console.log('\n=== TEST 3: Test Admin Login ===');
    
    await page.goto('http://localhost', { waitUntil: 'networkidle' });

    await test.step('Navigate to login form', async () => {
      // Try to find and navigate to login
      const loginSelectors = [
        'text=/sign.?in/i',
        '[href*="login"]',
        'text=/login/i'
      ];

      let navigated = false;
      for (const selector of loginSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          await element.click();
          navigated = true;
          break;
        }
      }

      if (!navigated) {
        await page.goto('http://localhost/login', { waitUntil: 'networkidle' });
      }

      await page.waitForLoadState('networkidle');
    });

    await test.step('Fill login form with admin credentials', async () => {
      const adminEmail = 'admin.test@seedsofempowerment.org';
      const adminPassword = 'Admin2024!';

      // Try to fill email field
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="email" i]',
        'input[id*="email"]'
      ];

      let emailFilled = false;
      for (const selector of emailSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`Filling email with selector: ${selector}`);
          await element.fill(adminEmail);
          emailFilled = true;
          break;
        }
      }

      if (!emailFilled) {
        console.log('No email field found!');
        await page.screenshot({ path: 'tests/screenshots/03-no-email-field.png' });
      }

      // Try to fill password field
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password" i]'
      ];

      let passwordFilled = false;
      for (const selector of passwordSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`Filling password with selector: ${selector}`);
          await element.fill(adminPassword);
          passwordFilled = true;
          break;
        }
      }

      if (!passwordFilled) {
        console.log('No password field found - might be magic link authentication');
        // If no password field, this could be magic link auth
        // In that case, we might need to send magic link or use test endpoint
      }

      await page.screenshot({ 
        path: 'tests/screenshots/03-login-form-filled.png',
        fullPage: true
      });
    });

    await test.step('Submit login form', async () => {
      // Try to submit the form
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'button:has-text("Send")'
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log(`Clicking submit button: ${selector}`);
          
          // Capture network requests during form submission
          const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/auth') || response.status() >= 300, 
            { timeout: 10000 }
          ).catch(() => null);
          
          await element.click();
          
          const response = await responsePromise;
          if (response) {
            console.log(`Auth response: ${response.status()} ${response.url()}`);
            if (response.status() === 401) {
              console.log('401 Unauthorized - Invalid credentials detected');
            }
          }
          
          submitted = true;
          break;
        }
      }

      if (!submitted) {
        console.log('No submit button found!');
      }

      // Wait for any navigation or response
      await page.waitForLoadState('networkidle');
    });

    await test.step('Check login result and take screenshots', async () => {
      const currentUrl = page.url();
      console.log(`Post-login URL: ${currentUrl}`);

      // Take screenshot of the result
      await page.screenshot({ 
        path: 'tests/screenshots/03-login-result.png',
        fullPage: true
      });

      // Check for success indicators
      const hasDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/admin');
      const hasUserMenu = await page.locator('[data-testid="user-menu"], .user-menu').count() > 0;
      
      // Check for error messages
      const errorSelectors = [
        '[role="alert"]',
        '.error',
        '.alert-error',
        'text=/error/i',
        'text=/invalid/i',
        'text=/unauthorized/i'
      ];

      let hasError = false;
      let errorMessage = '';
      for (const selector of errorSelectors) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          errorMessage = await element.textContent() || '';
          hasError = true;
          console.log(`Error found: ${errorMessage}`);
          break;
        }
      }

      console.log(`Login successful: ${hasDashboard || hasUserMenu}`);
      console.log(`Has error: ${hasError}`);
      console.log(`Error message: ${errorMessage}`);
    });
  });

  test('Test 4: Try alternative authentication methods', async () => {
    console.log('\n=== TEST 4: Alternative Authentication ===');

    await test.step('Test direct API call to test-login endpoint', async () => {
      const adminEmail = 'admin.test@seedsofempowerment.org';
      
      // Make direct API call to the test-login endpoint
      const response = await page.request.post('http://localhost:3000/api/auth/test-login', {
        data: { email: adminEmail }
      });

      const responseData = await response.json().catch(() => ({}));
      
      console.log(`API Response status: ${response.status()}`);
      console.log(`API Response data:`, responseData);

      if (response.status() === 401) {
        console.log('401 Error - User not found or authentication failed');
      } else if (response.ok() && responseData.success) {
        console.log('API login successful!');
        console.log(`User: ${responseData.user?.name} (${responseData.user?.role})`);
      }
    });

    await test.step('Check if magic link authentication is required', async () => {
      await page.goto('http://localhost/login', { waitUntil: 'networkidle' });
      
      // Look for magic link indicators
      const hasMagicLinkButton = await page.locator('text=/magic.?link/i, text=/send.?link/i').count() > 0;
      const hasEmailOnlyForm = await page.locator('input[type="email"]').count() > 0 && 
                              await page.locator('input[type="password"]').count() === 0;

      console.log(`Has magic link button: ${hasMagicLinkButton}`);
      console.log(`Has email-only form: ${hasEmailOnlyForm}`);

      if (hasMagicLinkButton || hasEmailOnlyForm) {
        console.log('This appears to be a magic link authentication system');
        
        // Try sending magic link
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.count() > 0) {
          await emailInput.fill('admin.test@seedsofempowerment.org');
          
          const sendButton = page.locator('button:has-text("Send"), button:has-text("Magic Link")').first();
          if (await sendButton.count() > 0) {
            await sendButton.click();
            await page.waitForLoadState('networkidle');
            
            await page.screenshot({ 
              path: 'tests/screenshots/04-magic-link-sent.png',
              fullPage: true
            });
          }
        }
      }
    });
  });

  test('Test 5: Network analysis and debugging', async () => {
    console.log('\n=== TEST 5: Network Analysis ===');

    const networkRequests: any[] = [];
    const networkResponses: any[] = [];

    // Capture all network traffic
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: Object.fromEntries(Object.entries(request.headers())),
        postData: request.postData()
      });
    });

    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: Object.fromEntries(Object.entries(response.headers()))
      });
    });

    await test.step('Navigate and attempt login with network monitoring', async () => {
      await page.goto('http://localhost', { waitUntil: 'networkidle' });
      
      // Try to navigate to login and submit
      const loginLink = page.locator('text=/sign.?in/i, [href*="login"]').first();
      if (await loginLink.count() > 0) {
        await loginLink.click();
        await page.waitForLoadState('networkidle');
      } else {
        await page.goto('http://localhost/login', { waitUntil: 'networkidle' });
      }

      // Try to fill and submit form
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")').first();

      if (await emailInput.count() > 0 && await submitButton.count() > 0) {
        await emailInput.fill('admin.test@seedsofempowerment.org');
        
        const passwordInput = page.locator('input[type="password"]').first();
        if (await passwordInput.count() > 0) {
          await passwordInput.fill('Admin2024!');
        }

        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    });

    await test.step('Analyze network requests and responses', async () => {
      console.log(`\n--- NETWORK REQUESTS (${networkRequests.length} total) ---`);
      networkRequests
        .filter(req => req.url.includes('/api/auth') || req.url.includes('login'))
        .forEach((req, i) => {
          console.log(`${i + 1}. ${req.method} ${req.url}`);
          if (req.postData) {
            console.log(`   Body: ${req.postData.substring(0, 200)}`);
          }
        });

      console.log(`\n--- NETWORK RESPONSES ---`);
      networkResponses
        .filter(res => res.url.includes('/api/auth') || res.status >= 400)
        .forEach((res, i) => {
          console.log(`${i + 1}. ${res.status} ${res.statusText} - ${res.url}`);
          if (res.status === 401) {
            console.log(`   ❌ 401 Unauthorized - Authentication failed`);
          }
        });

      // Save network data to file for debugging
      const fs = require('fs');
      const networkData = {
        requests: networkRequests.filter(req => req.url.includes('/api')),
        responses: networkResponses.filter(res => res.status >= 400 || res.url.includes('/api'))
      };
      
      fs.writeFileSync('tests/screenshots/network-debug.json', JSON.stringify(networkData, null, 2));
      console.log('\nNetwork debug data saved to tests/screenshots/network-debug.json');
    });

    await test.step('Final status screenshot', async () => {
      await page.screenshot({ 
        path: 'tests/screenshots/05-final-status.png',
        fullPage: true
      });
      
      console.log(`\nFinal URL: ${page.url()}`);
      console.log('All screenshots saved to tests/screenshots/');
    });
  });
});