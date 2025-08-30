const { chromium } = require('playwright');

async function simpleRoleTest() {
  console.log('🔍 Simple Role System Test...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Homepage Analysis
    console.log('📋 Testing Homepage...');
    await page.goto('http://localhost:3002', { timeout: 10000 });
    
    // Wait for page to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Get page content and check for role-related elements
    const pageContent = await page.content();
    const pageText = await page.textContent('body');
    
    // Check for dashboard links (these should NOT exist in new system)
    const dashboardLinks = [
      '/dashboard/learner',
      '/dashboard/teacher', 
      '/dashboard/volunteer',
      '/dashboard/institution'
    ];
    
    console.log('🔍 Checking for deprecated role-based dashboard links...');
    let foundIssues = [];
    
    for (const link of dashboardLinks) {
      if (pageContent.includes(link)) {
        foundIssues.push(`Found deprecated link: ${link}`);
        console.log(`   ❌ ISSUE: Found deprecated link ${link}`);
      } else {
        console.log(`   ✅ Good: No ${link} found`);
      }
    }
    
    // Check for role selection elements
    const roleSelectionKeywords = [
      'Choose your role',
      'Select role',
      'I am a learner',
      'I am a teacher',
      'role selector',
      'role-selector'
    ];
    
    console.log('\n🔍 Checking for role selection UI elements...');
    for (const keyword of roleSelectionKeywords) {
      if (pageText.toLowerCase().includes(keyword.toLowerCase())) {
        foundIssues.push(`Found role selection UI: "${keyword}"`);
        console.log(`   ❌ ISSUE: Found "${keyword}" in page content`);
      } else {
        console.log(`   ✅ Good: No "${keyword}" found`);
      }
    }
    
    // Test 2: Signup Page
    console.log('\n📋 Testing Signup Page...');
    await page.goto('http://localhost:3002/signup', { timeout: 10000 });
    await page.waitForSelector('form, input', { timeout: 5000 });
    
    const signupContent = await page.content();
    const signupText = await page.textContent('body');
    
    // Check for role selection in signup
    const hasRoleSelect = await page.$('select[name="role"], input[name="role"]') !== null;
    const hasRoleText = signupText.toLowerCase().includes('role');
    
    if (hasRoleSelect) {
      foundIssues.push('Role selection field found in signup form');
      console.log('   ❌ ISSUE: Role selection field in signup');
    } else {
      console.log('   ✅ Good: No role selection field in signup');
    }
    
    // Check for required fields
    const emailField = await page.$('input[type="email"]') !== null;
    const nameFields = await page.$$('input[name*="Name"], input[name*="name"]');
    
    console.log(`   📝 Email field present: ${emailField ? '✅' : '❌'}`);
    console.log(`   📝 Name fields found: ${nameFields.length}`);
    
    // Test 3: Admin Panel Access
    console.log('\n📋 Testing Admin Panel Access...');
    
    try {
      await page.goto('http://localhost:3002/admin', { timeout: 10000 });
      const adminUrl = page.url();
      const adminContent = await page.textContent('body');
      
      if (adminUrl.includes('/login') || adminUrl.includes('/signin') || adminContent.includes('Sign in')) {
        console.log('   ✅ Admin panel properly protected (redirects to login)');
      } else if (adminContent.includes('Admin') || adminContent.includes('Dashboard')) {
        console.log('   ⚠️ Admin panel accessible (may be demo/development mode)');
      } else {
        console.log('   ❓ Unexpected admin panel response');
      }
    } catch (error) {
      console.log(`   ⚠️ Admin panel test error: ${error.message}`);
    }
    
    // Test 4: Check demo mode
    console.log('\n📋 Testing Demo Mode...');
    
    try {
      await page.goto('http://localhost:3002/demo', { timeout: 10000 });
      const demoContent = await page.textContent('body');
      
      if (demoContent.toLowerCase().includes('demo')) {
        console.log('   ✅ Demo mode accessible');
      } else {
        console.log('   ❌ Demo mode not working');
      }
    } catch (error) {
      console.log(`   ⚠️ Demo mode test error: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 ROLE SYSTEM TEST RESULTS');
    console.log('================================');
    
    if (foundIssues.length === 0) {
      console.log('✅ ALL TESTS PASSED - Role system properly implemented');
      console.log('   - No deprecated role-based dashboard links');
      console.log('   - No role selection UI elements');
      console.log('   - Signup form does not include role selection');
    } else {
      console.log('❌ ISSUES FOUND:');
      foundIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await browser.close();
  }
}

simpleRoleTest().catch(console.error);