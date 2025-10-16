import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Starting global teardown...');

  const isDocker = process.env.CI === 'true' || process.env.DOCKER_ENV === 'true';

  if (!isDocker) {
    console.log('📊 Cleaning up test data...');

    try {
      // Optional: Clean up test data from database
      // Uncomment if you want to clean test data after tests
      // await execAsync('npx tsx prisma/cleanup-test.ts');

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.warn('⚠️  Cleanup had issues:', error);
    }
  }

  // Collect test artifacts information
  try {
    const artifactsDir = path.join(process.cwd(), 'test-results');
    const reportDir = path.join(process.cwd(), 'playwright-report');

    const artifacts = await fs.readdir(artifactsDir).catch(() => []);
    const reports = await fs.readdir(reportDir).catch(() => []);

    if (artifacts.length > 0) {
      console.log(`📁 Test artifacts saved in: ${artifactsDir}`);
      console.log(`   Found ${artifacts.length} files`);
    }

    if (reports.length > 0) {
      console.log(`📊 HTML report saved in: ${reportDir}`);
      console.log(`   Open ${reportDir}/index.html to view results`);
    }
  } catch (error) {
    // Ignore errors in artifact collection
  }

  console.log('🎬 Global teardown completed!\n');
}

export default globalTeardown;