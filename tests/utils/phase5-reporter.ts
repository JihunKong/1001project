import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface Phase5TestMetrics {
  testCases: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
  byProject: Record<string, {
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }>;
  failuresByCategory: Record<string, number>;
  performanceMetrics: {
    avgPageLoadTime: number;
    avgNavigationTime: number;
    slowestTest: {
      title: string;
      duration: number;
    };
    fastestTest: {
      title: string;
      duration: number;
    };
  };
}

class Phase5Reporter implements Reporter {
  private metrics: Phase5TestMetrics = {
    testCases: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
    byProject: {},
    failuresByCategory: {},
    performanceMetrics: {
      avgPageLoadTime: 0,
      avgNavigationTime: 0,
      slowestTest: { title: '', duration: 0 },
      fastestTest: { title: '', duration: Number.MAX_SAFE_INTEGER },
    },
  };

  onBegin(config: FullConfig, suite: Suite) {
    console.log('\n🚀 Phase 5 Text Publishing Workflow Testing Started');
    console.log(`📊 Running ${suite.allTests().length} tests across ${config.projects.length} projects`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.metrics.testCases++;
    this.metrics.duration += result.duration;

    // Track by project
    const projectName = test.parent.project()?.name || 'unknown';
    if (!this.metrics.byProject[projectName]) {
      this.metrics.byProject[projectName] = {
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      };
    }

    this.metrics.byProject[projectName].duration += result.duration;

    // Update performance metrics
    if (result.duration > this.metrics.performanceMetrics.slowestTest.duration) {
      this.metrics.performanceMetrics.slowestTest = {
        title: test.title,
        duration: result.duration,
      };
    }

    if (result.duration < this.metrics.performanceMetrics.fastestTest.duration) {
      this.metrics.performanceMetrics.fastestTest = {
        title: test.title,
        duration: result.duration,
      };
    }

    // Track status
    switch (result.status) {
      case 'passed':
        this.metrics.passed++;
        this.metrics.byProject[projectName].passed++;
        break;
      case 'failed':
        this.metrics.failed++;
        this.metrics.byProject[projectName].failed++;

        // Categorize failures
        if (test.title.includes('submission')) {
          this.metrics.failuresByCategory['Text Submission'] =
            (this.metrics.failuresByCategory['Text Submission'] || 0) + 1;
        } else if (test.title.includes('review')) {
          this.metrics.failuresByCategory['Story Review'] =
            (this.metrics.failuresByCategory['Story Review'] || 0) + 1;
        } else if (test.title.includes('library')) {
          this.metrics.failuresByCategory['Library Integration'] =
            (this.metrics.failuresByCategory['Library Integration'] || 0) + 1;
        } else if (test.title.includes('esl') || test.title.includes('reader')) {
          this.metrics.failuresByCategory['ESL Reader'] =
            (this.metrics.failuresByCategory['ESL Reader'] || 0) + 1;
        } else if (test.title.includes('permission') || test.title.includes('role')) {
          this.metrics.failuresByCategory['Role Permissions'] =
            (this.metrics.failuresByCategory['Role Permissions'] || 0) + 1;
        } else if (test.title.includes('mobile') || test.title.includes('responsive')) {
          this.metrics.failuresByCategory['Mobile Responsive'] =
            (this.metrics.failuresByCategory['Mobile Responsive'] || 0) + 1;
        } else {
          this.metrics.failuresByCategory['Other'] =
            (this.metrics.failuresByCategory['Other'] || 0) + 1;
        }
        break;
      case 'skipped':
        this.metrics.skipped++;
        this.metrics.byProject[projectName].skipped++;
        break;
      case 'timedOut':
        this.metrics.failed++;
        this.metrics.byProject[projectName].failed++;
        this.metrics.failuresByCategory['Timeout'] =
          (this.metrics.failuresByCategory['Timeout'] || 0) + 1;
        break;
    }

    // Track flaky tests
    if (result.retry > 0 && result.status === 'passed') {
      this.metrics.flaky++;
    }
  }

  onEnd(result: FullResult) {
    console.log('\n📊 Phase 5 Test Execution Summary');
    console.log('='.repeat(50));

    const successRate = ((this.metrics.passed / this.metrics.testCases) * 100).toFixed(1);
    const avgTestDuration = (this.metrics.duration / this.metrics.testCases).toFixed(0);

    console.log(`✅ Passed: ${this.metrics.passed}`);
    console.log(`❌ Failed: ${this.metrics.failed}`);
    console.log(`⏭️  Skipped: ${this.metrics.skipped}`);
    console.log(`🔄 Flaky: ${this.metrics.flaky}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️  Total Duration: ${(this.metrics.duration / 1000).toFixed(1)}s`);
    console.log(`⏱️  Avg Test Duration: ${avgTestDuration}ms`);

    // Project breakdown
    console.log('\n📋 Results by Test Category:');
    Object.entries(this.metrics.byProject).forEach(([project, stats]) => {
      const projectSuccess = stats.passed + stats.failed + stats.skipped > 0
        ? ((stats.passed / (stats.passed + stats.failed + stats.skipped)) * 100).toFixed(1)
        : '0';
      console.log(`  ${project}: ${stats.passed}✅ ${stats.failed}❌ ${stats.skipped}⏭️ (${projectSuccess}% success)`);
    });

    // Failure analysis
    if (this.metrics.failed > 0) {
      console.log('\n🔍 Failure Breakdown by Category:');
      Object.entries(this.metrics.failuresByCategory)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`  ${category}: ${count} failures`);
        });
    }

    // Performance insights
    console.log('\n⚡ Performance Insights:');
    console.log(`  Fastest Test: ${this.metrics.performanceMetrics.fastestTest.title} (${this.metrics.performanceMetrics.fastestTest.duration}ms)`);
    console.log(`  Slowest Test: ${this.metrics.performanceMetrics.slowestTest.title} (${this.metrics.performanceMetrics.slowestTest.duration}ms)`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.metrics.failed > 0) {
      console.log('  • Review failed test screenshots and traces for debugging');
      console.log('  • Check server logs for any backend issues');
      if (this.metrics.failuresByCategory['Timeout'] > 0) {
        console.log('  • Consider increasing timeout values for slow operations');
      }
    }
    if (this.metrics.flaky > 0) {
      console.log(`  • ${this.metrics.flaky} flaky tests detected - investigate for stability improvements`);
    }
    if (this.metrics.performanceMetrics.slowestTest.duration > 60000) {
      console.log('  • Some tests are taking >60s - consider optimizing test data or splitting complex scenarios');
    }

    // Save detailed metrics to file
    const outputPath = path.join(process.cwd(), 'test-results', 'phase5-metrics.json');
    try {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, JSON.stringify({
        ...this.metrics,
        timestamp: new Date().toISOString(),
        environment: process.env.TEST_BASE_URL || 'https://3.128.143.122',
        overallResult: result.status,
      }, null, 2));
      console.log(`\n📁 Detailed metrics saved to: ${outputPath}`);
    } catch (error) {
      console.warn('⚠️  Could not save metrics file:', error);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Phase 5 Testing Complete!');

    if (result.status === 'passed') {
      console.log('🎯 All critical workflows are functioning correctly!');
    } else {
      console.log('⚠️  Some issues were detected - please review the report above');
    }
  }
}

export default Phase5Reporter;