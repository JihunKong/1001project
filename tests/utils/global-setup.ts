import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for role system tests...');

  // Wait for staging environment to be ready
  if (!process.env.CI) {
    console.log('⏳ Waiting for staging environment...');
    await waitForStagingEnvironment();
  }

  // Setup test database with role migration data
  console.log('🗄️ Setting up test database...');
  await setupTestDatabase();

  // Create authentication states
  console.log('🔐 Setting up authentication states...');
  await setupAuthenticationStates();

  // Verify staging environment is ready
  console.log('✅ Verifying staging environment...');
  await verifyStagingEnvironment();

  console.log('✅ Global setup completed successfully');
}

async function waitForStagingEnvironment() {
  const maxAttempts = 30;
  const delay = 5000; // 5 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('https://localhost:8080/api/health', {
        headers: { 'Accept': 'application/json' },
        // @ts-ignore
        rejectUnauthorized: false
      });
      
      if (response.ok) {
        console.log('✅ Staging environment is ready');
        return;
      }
    } catch (error) {
      console.log(`⏳ Attempt ${i + 1}/${maxAttempts}: Staging environment not ready, retrying...`);
    }
    
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('❌ Staging environment failed to become ready within timeout');
}

async function setupTestDatabase() {
  try {
    // Run database migrations
    await execAsync('docker-compose -f docker-compose.test.yml exec -T test-postgres psql -U test_user -d test_db -f /docker-entrypoint-initdb.d/init-test-db.sql || true');
    
    // Apply Prisma migrations
    await execAsync('docker-compose -f docker-compose.test.yml exec -T test-app npx prisma migrate deploy');
    
    // Seed test data
    await execAsync('docker-compose -f docker-compose.test.yml exec -T test-app npx prisma db seed');
    
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

async function setupAuthenticationStates() {
  const browser = await chromium.launch({ headless: true });
  const baseURL = process.env.STAGING_URL || 'https://localhost:8080';

  try {
    // Setup admin authentication state
    await setupAdminAuth(browser, baseURL);
    
    // Setup customer authentication state
    await setupCustomerAuth(browser, baseURL);
    
    // Setup legacy learner authentication state (for migration testing)
    await setupLearnerAuth(browser, baseURL);
    
    console.log('✅ Authentication states setup completed');
  } finally {
    await browser.close();
  }
}

async function setupAdminAuth(browser: any, baseURL: string) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // Navigate to login
    await page.goto(`${baseURL}/login`);
    
    // Enter admin email
    await page.fill('input[type="email"]', 'admin@test.1001stories.org');
    await page.click('button[type="submit"]');
    
    // In real tests, we would handle magic link email
    // For setup, we'll use a direct authentication endpoint or mock
    await page.goto(`${baseURL}/api/auth/demo-login?email=admin@test.1001stories.org&role=ADMIN`);
    
    // Verify admin access
    await page.goto(`${baseURL}/admin`);
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 });
    
    // Save authentication state
    await context.storageState({ path: 'test-results/auth/admin-auth.json' });
    console.log('✅ Admin authentication state saved');
  } catch (error) {
    console.error('❌ Admin authentication setup failed:', error);
    await page.screenshot({ path: 'test-results/setup-admin-auth-error.png' });
    throw error;
  } finally {
    await context.close();
  }
}

async function setupCustomerAuth(browser: any, baseURL: string) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // Navigate to login
    await page.goto(`${baseURL}/login`);
    
    // Enter customer email
    await page.fill('input[type="email"]', 'customer@test.1001stories.org');
    await page.click('button[type="submit"]');
    
    // Use demo login for testing
    await page.goto(`${baseURL}/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER`);
    
    // Verify customer access
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
    
    // Save authentication state
    await context.storageState({ path: 'test-results/auth/customer-auth.json' });
    console.log('✅ Customer authentication state saved');
  } catch (error) {
    console.error('❌ Customer authentication setup failed:', error);
    await page.screenshot({ path: 'test-results/setup-customer-auth-error.png' });
    throw error;
  } finally {
    await context.close();
  }
}

async function setupLearnerAuth(browser: any, baseURL: string) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // Create legacy learner user for migration testing
    await page.goto(`${baseURL}/api/auth/demo-login?email=learner@test.1001stories.org&role=LEARNER`);
    
    // Verify access (should redirect to dashboard with CUSTOMER role after migration)
    await page.goto(`${baseURL}/dashboard`);
    
    // Save authentication state
    await context.storageState({ path: 'test-results/auth/learner-auth.json' });
    console.log('✅ Learner authentication state saved');
  } catch (error) {
    console.error('❌ Learner authentication setup failed:', error);
    await page.screenshot({ path: 'test-results/setup-learner-auth-error.png' });
    throw error;
  } finally {
    await context.close();
  }
}

async function verifyStagingEnvironment() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const baseURL = process.env.STAGING_URL || 'https://localhost:8080';

  try {
    // Test basic page loads
    await page.goto(baseURL);
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Test API health endpoint
    const response = await page.request.get(`${baseURL}/api/health`);
    if (!response.ok()) {
      throw new Error(`Health check failed: ${response.status()}`);
    }
    
    console.log('✅ Staging environment verification completed');
  } finally {
    await browser.close();
  }
}

export default globalSetup;