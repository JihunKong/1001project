import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Phase 5 Global Teardown...');

  // Clean up temporary auth files
  const authDir = path.join(__dirname, 'fixtures');
  if (fs.existsSync(authDir)) {
    const authFiles = fs.readdirSync(authDir).filter(file => file.endsWith('-auth.json'));

    for (const file of authFiles) {
      const filePath = path.join(authDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Cleaned up auth file: ${file}`);
      }
    }
  }

  // Generate test summary
  const resultsDir = path.join(__dirname, '../../test-results/phase5');
  if (fs.existsSync(resultsDir)) {
    const now = new Date().toISOString();
    const summaryFile = path.join(resultsDir, `test-summary-${now.slice(0, 19).replace(/:/g, '-')}.json`);

    const summary = {
      timestamp: now,
      testType: 'Phase 5 Text Publishing Workflow',
      environment: process.env.TEST_BASE_URL || 'https://3.128.143.122',
      message: 'Phase 5 E2E testing completed'
    };

    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Test summary saved to: ${summaryFile}`);
  }

  console.log('✨ Phase 5 Global Teardown Complete');
}

export default globalTeardown;