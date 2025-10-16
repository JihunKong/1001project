import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  // Check if we're running in Docker
  const isDocker = process.env.CI === 'true' || process.env.DOCKER_ENV === 'true';

  if (!isDocker) {
    console.log('📦 Running outside Docker - checking local environment...');

    try {
      // Check if database is reachable
      const dbUrl = process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/stories_test_db';
      console.log('🔍 Checking database connection...');

      // Run migrations if needed
      console.log('🔄 Running database migrations...');
      await execAsync('npx prisma migrate deploy');

      // Seed test data
      console.log('🌱 Seeding test data...');
      await execAsync('npx tsx prisma/seed-test.ts');
    } catch (error) {
      console.warn('⚠️  Local setup had issues:', error);
      console.log('💡 Continuing anyway - tests may use existing data');
    }
  } else {
    console.log('🐳 Running in Docker container - environment should be pre-configured');
  }

  // Verify the application is accessible
  const baseURL = config.projects[0].use.baseURL;
  console.log(`🔗 Testing connection to ${baseURL}...`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  let retries = 30; // 30 retries with 2 second delays = 60 seconds max
  let connected = false;

  while (retries > 0 && !connected) {
    try {
      const response = await page.goto(`${baseURL}/api/health`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });

      if (response && response.ok()) {
        connected = true;
        console.log('✅ Application is ready!');
      }
    } catch (error) {
      retries--;
      if (retries > 0) {
        console.log(`⏳ Waiting for application to start... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  await browser.close();

  if (!connected) {
    throw new Error('❌ Failed to connect to application after 60 seconds');
  }

  console.log('✨ Global setup completed successfully!\n');
}

export default globalSetup;