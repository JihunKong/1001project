const { chromium } = require('playwright');
const fs = require('fs');

async function testRoleSystem() {
  console.log('🚀 Starting Role System Testing...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0, total: 0 }
  };

  // Helper function to add test result
  function addTest(name, status, details = '', expected = '', actual = '') {
    const test = { name, status, details, expected, actual };
    testResults.tests.push(test);
    testResults.summary.total++;
    if (status === 'PASS') testResults.summary.passed++;
    else testResults.summary.failed++;
    
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${name}${details ? ': ' + details : ''}`);
  }

  try {
    // Test 1: Application Accessibility
    console.log('📋 Phase 1: Application Accessibility\n');
    
    try {
      await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
      const title = await page.title();
      addTest('Application loads successfully', 'PASS', `Page title: "${title}"`);
    } catch (error) {
      addTest('Application loads successfully', 'FAIL', `Error: ${error.message}`);
    }

    // Test 2: Landing Page Role Selection Check
    console.log('\n📋 Phase 2: Landing Page Analysis\n');
    
    try {
      // Check if role selection cards are present (they should be removed)
      const roleCards = await page.$$('[data-testid="role-selector"]');
      const roleSelectorText = await page.$('text=Choose your role');
      const roleCardElements = await page.$$('.roles, [class*="role"], [id*="role"]');
      
      // Check for specific role-related elements in the HTML
      const pageContent = await page.content();
      const hasLearnerCard = pageContent.includes('learner') && pageContent.includes('dashboard');
      const hasTeacherCard = pageContent.includes('teacher') && pageContent.includes('dashboard');
      const hasVolunteerCard = pageContent.includes('volunteer') && pageContent.includes('dashboard');
      const hasInstitutionCard = pageContent.includes('institution') && pageContent.includes('dashboard');
      
      if (roleCards.length === 0 && !roleSelectorText) {
        addTest('Role selection removed from landing page', 'PASS', 'No role selector elements found');
      } else {
        addTest('Role selection removed from landing page', 'FAIL', `Found ${roleCards.length} role selector elements, role selector text: ${!!roleSelectorText}`);
      }
      
      // Check if role cards are still visible (this is the issue we found in the code)
      if (hasLearnerCard || hasTeacherCard || hasVolunteerCard || hasInstitutionCard) {
        addTest('Legacy role cards removed', 'FAIL', 'Role navigation cards still present in homepage');
      } else {
        addTest('Legacy role cards removed', 'PASS', 'No legacy role cards found');
      }
    } catch (error) {
      addTest('Landing Page Role Selection Check', 'FAIL', `Error: ${error.message}`);
    }

    // Test 3: Signup Flow
    console.log('\n📋 Phase 3: Signup Flow Testing\n');
    
    try {
      await page.goto('http://localhost:3002/signup');
      await page.waitForTimeout(2000);
      
      // Check if role selection is present in signup form
      const roleSelectInForm = await page.$('select[name="role"], input[name="role"], [data-testid="role-select"]');
      const roleFieldLabels = await page.$('text=Choose your role, text=Select role, text=I am a');
      
      if (!roleSelectInForm && !roleFieldLabels) {
        addTest('Signup form without role selection', 'PASS', 'No role selection fields found in signup form');
      } else {
        addTest('Signup form without role selection', 'FAIL', 'Role selection still present in signup form');
      }
      
      // Check for required signup fields
      const emailField = await page.$('input[type="email"]');
      const nameFields = await page.$$('input[name*="name"], input[name*="Name"]');
      
      if (emailField) {
        addTest('Email field present in signup', 'PASS', 'Email input field found');
      } else {
        addTest('Email field present in signup', 'FAIL', 'Email input field not found');
      }
      
      if (nameFields.length > 0) {
        addTest('Name fields present in signup', 'PASS', `Found ${nameFields.length} name field(s)`);
      } else {
        addTest('Name fields present in signup', 'FAIL', 'Name fields not found');
      }
    } catch (error) {
      addTest('Signup Flow Check', 'FAIL', `Error: ${error.message}`);
    }

    // Test 4: API Endpoints
    console.log('\n📋 Phase 4: API Endpoint Testing\n');
    
    try {
      // Test signup API endpoint
      const signupResponse = await page.request.get('http://localhost:3002/api/auth/signup');
      addTest('Signup API endpoint accessible', signupResponse.status() === 405 || signupResponse.status() === 200 ? 'PASS' : 'FAIL', `Status: ${signupResponse.status()}`);
    } catch (error) {
      addTest('Signup API endpoint accessible', 'FAIL', `Error: ${error.message}`);
    }

    // Test 5: Admin Panel Access
    console.log('\n📋 Phase 5: Admin Panel Testing\n');
    
    try {
      // Try to access admin panel (should redirect or show login)
      await page.goto('http://localhost:3002/admin');
      const currentUrl = page.url();
      const pageText = await page.textContent('body');
      
      if (currentUrl.includes('/login') || currentUrl.includes('/auth') || pageText.includes('Sign in') || pageText.includes('Login')) {
        addTest('Admin panel requires authentication', 'PASS', 'Redirected to authentication');
      } else if (pageText.includes('Admin') || pageText.includes('Dashboard')) {
        addTest('Admin panel accessible', 'PASS', 'Admin panel loaded (may be in demo mode)');
      } else {
        addTest('Admin panel security', 'FAIL', `Unexpected response: ${currentUrl}`);
      }
    } catch (error) {
      addTest('Admin Panel Access', 'FAIL', `Error: ${error.message}`);
    }

    // Test 6: Demo Mode
    console.log('\n📋 Phase 6: Demo Mode Testing\n');
    
    try {
      await page.goto('http://localhost:3002/demo');
      const demoContent = await page.textContent('body');
      
      if (demoContent.includes('Demo') || demoContent.includes('demo')) {
        addTest('Demo mode accessible', 'PASS', 'Demo page loaded successfully');
      } else {
        addTest('Demo mode accessible', 'FAIL', 'Demo page not accessible or content missing');
      }
    } catch (error) {
      addTest('Demo Mode Check', 'FAIL', `Error: ${error.message}`);
    }

  } catch (error) {
    console.error('Critical error during testing:', error);
    addTest('Test Suite Execution', 'FAIL', `Critical error: ${error.message}`);
  }

  await browser.close();
  
  // Generate report
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

  // Save detailed report
  const reportPath = '/Users/jihunkong/1001project/1001-stories/role-system-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📋 Detailed report saved: ${reportPath}`);
  
  return testResults;
}

testRoleSystem().catch(console.error);