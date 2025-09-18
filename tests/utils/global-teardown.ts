import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function globalTeardown() {
  console.log('🧹 Starting global teardown...');

  try {
    // Generate test summary report
    await generateTestSummary();

    // Archive test artifacts
    await archiveTestArtifacts();

    // Cleanup test database
    await cleanupTestDatabase();

    // Send test notifications if configured
    await sendTestNotifications();

    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

async function generateTestSummary() {
  try {
    const resultsPath = 'test-results/results.json';
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      const summary = {
        timestamp: new Date().toISOString(),
        environment: 'staging',
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        projects: results.suites?.map((suite: any) => ({
          name: suite.title,
          tests: suite.specs?.length || 0,
          failures: suite.specs?.filter((spec: any) => spec.tests?.some((test: any) => test.status === 'failed')).length || 0
        })) || []
      };

      fs.writeFileSync('test-results/summary.json', JSON.stringify(summary, null, 2));
      console.log('✅ Test summary generated');
    }
  } catch (error) {
    console.error('❌ Failed to generate test summary:', error);
  }
}

async function archiveTestArtifacts() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = `test-archives/${timestamp}`;
    
    // Create archive directory
    await execAsync(`mkdir -p ${archiveDir}`);
    
    // Copy test results
    if (fs.existsSync('test-results')) {
      await execAsync(`cp -r test-results ${archiveDir}/`);
    }
    
    // Copy playwright report
    if (fs.existsSync('playwright-report')) {
      await execAsync(`cp -r playwright-report ${archiveDir}/`);
    }
    
    // Copy screenshots from failed tests
    if (fs.existsSync('test-results/screenshots')) {
      await execAsync(`cp -r test-results/screenshots ${archiveDir}/`);
    }
    
    console.log(`✅ Test artifacts archived to ${archiveDir}`);
  } catch (error) {
    console.error('❌ Failed to archive test artifacts:', error);
  }
}

async function cleanupTestDatabase() {
  try {
    // Reset test database to clean state
    await execAsync('docker-compose -f docker-compose.test.yml exec -T test-postgres psql -U test_user -d test_db -c "TRUNCATE TABLE \\"Session\\", \\"User\\", \\"Story\\", \\"Order\\", \\"Donation\\" CASCADE;"');
    
    console.log('✅ Test database cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error);
  }
}

async function sendTestNotifications() {
  try {
    if (process.env.CI && process.env.SLACK_WEBHOOK_URL) {
      const summaryPath = 'test-results/summary.json';
      
      if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const success = summary.failed === 0;
        
        const message = {
          text: `🎭 1001 Stories Role System E2E Tests ${success ? '✅ PASSED' : '❌ FAILED'}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Environment:* Staging\n*Total Tests:* ${summary.totalTests}\n*Passed:* ${summary.passed}\n*Failed:* ${summary.failed}\n*Duration:* ${Math.round(summary.duration / 1000)}s`
              }
            }
          ]
        };
        
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        console.log('✅ Test notifications sent');
      }
    }
  } catch (error) {
    console.error('❌ Failed to send test notifications:', error);
  }
}

export default globalTeardown;