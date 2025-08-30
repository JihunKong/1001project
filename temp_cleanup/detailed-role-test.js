const { chromium } = require('playwright');

async function detailedRoleTest() {
  console.log('🔍 Detailed Role System Analysis...\n');
  
  const browser = await chromium.launch({ headless: false }); // Visible browser for debugging
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to homepage
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    
    console.log('📋 Analyzing Homepage for Role-Related Elements\n');
    
    // Check for role-related navigation cards
    const roleElements = {
      learnerLinks: await page.$$('a[href*="learner"], a[href="/dashboard/learner"]'),
      teacherLinks: await page.$$('a[href*="teacher"], a[href="/dashboard/teacher"]'),
      volunteerLinks: await page.$$('a[href*="volunteer"], a[href="/dashboard/volunteer"]'),
      institutionLinks: await page.$$('a[href*="institution"], a[href="/dashboard/institution"]'),
    };
    
    console.log('🔍 Role-based navigation links found:');
    console.log(`   Learner links: ${roleElements.learnerLinks.length}`);
    console.log(`   Teacher links: ${roleElements.teacherLinks.length}`);
    console.log(`   Volunteer links: ${roleElements.volunteerLinks.length}`);
    console.log(`   Institution links: ${roleElements.institutionLinks.length}`);
    
    // Get the actual links
    if (roleElements.learnerLinks.length > 0) {
      for (let i = 0; i < roleElements.learnerLinks.length; i++) {
        const href = await roleElements.learnerLinks[i].getAttribute('href');
        console.log(`   ⚠️ Found learner link: ${href}`);
      }
    }
    
    if (roleElements.teacherLinks.length > 0) {
      for (let i = 0; i < roleElements.teacherLinks.length; i++) {
        const href = await roleElements.teacherLinks[i].getAttribute('href');
        console.log(`   ⚠️ Found teacher link: ${href}`);
      }
    }
    
    if (roleElements.volunteerLinks.length > 0) {
      for (let i = 0; i < roleElements.volunteerLinks.length; i++) {
        const href = await roleElements.volunteerLinks[i].getAttribute('href');
        console.log(`   ⚠️ Found volunteer link: ${href}`);
      }
    }
    
    if (roleElements.institutionLinks.length > 0) {
      for (let i = 0; i < roleElements.institutionLinks.length; i++) {
        const href = await roleElements.institutionLinks[i].getAttribute('href');
        console.log(`   ⚠️ Found institution link: ${href}`);
      }
    }
    
    // Check for role cards or sections
    console.log('\n🔍 Checking for role card sections...');
    const roleCardSelectors = [
      '[class*="role"]',
      '[data-testid*="role"]',
      'text=Learner',
      'text=Teacher', 
      'text=Volunteer',
      'text=Institution'
    ];
    
    for (const selector of roleCardSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} elements matching "${selector}"`);
        
        // Get text content of these elements
        for (let i = 0; i < Math.min(elements.length, 3); i++) {
          const text = await elements[i].textContent();
          const tagName = await elements[i].evaluate(el => el.tagName);
          console.log(`     - ${tagName}: "${text?.slice(0, 100)}..."`);
        }
      }
    }
    
    // Test signup flow in detail
    console.log('\n📋 Testing Signup Flow in Detail...');
    
    await page.goto('http://localhost:3002/signup');
    await page.waitForTimeout(2000);
    
    // Check all form elements
    const formElements = await page.$$('input, select, textarea');
    console.log(`\n📝 Found ${formElements.length} form elements:`);
    
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      const tagName = await element.evaluate(el => el.tagName);
      const type = await element.getAttribute('type') || 'N/A';
      const name = await element.getAttribute('name') || 'N/A';
      const placeholder = await element.getAttribute('placeholder') || 'N/A';
      const id = await element.getAttribute('id') || 'N/A';
      
      console.log(`   ${i+1}. ${tagName} - type: ${type}, name: ${name}, id: ${id}`);
      if (placeholder !== 'N/A' && placeholder.length < 50) {
        console.log(`      placeholder: "${placeholder}"`);
      }
      
      // Check if this could be a role-related field
      if (name.toLowerCase().includes('role') || id.toLowerCase().includes('role') || placeholder.toLowerCase().includes('role')) {
        console.log(`      ⚠️ POTENTIAL ROLE FIELD DETECTED!`);
      }
    }
    
    // Test what happens when we try to submit signup form
    console.log('\n📋 Testing Signup Form Submission...');
    
    // Fill in basic required fields
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
      await emailField.fill(`test-${Date.now()}@test.1001stories.org`);
      console.log('   ✅ Email field filled');
    }
    
    const firstNameField = await page.$('input[name*="firstName"], input[name*="first"]');
    if (firstNameField) {
      await firstNameField.fill('Test');
      console.log('   ✅ First name field filled');
    }
    
    const lastNameField = await page.$('input[name*="lastName"], input[name*="last"]');
    if (lastNameField) {
      await lastNameField.fill('User');
      console.log('   ✅ Last name field filled');
    }
    
    // Fill date of birth (required for COPPA compliance)
    const dobField = await page.$('input[name*="dateOfBirth"], input[name*="dob"], input[type="date"]');
    if (dobField) {
      await dobField.fill('1990-01-01');
      console.log('   ✅ Date of birth field filled');
    }
    
    // Check terms checkbox
    const termsCheckbox = await page.$('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="agree"]');
    if (termsCheckbox) {
      await termsCheckbox.check();
      console.log('   ✅ Terms checkbox checked');
    }
    
    console.log('\n🚀 Attempting form submission...');
    
    // Look for submit button and click it
    const submitButton = await page.$('button[type="submit"], button:has-text("Create"), button:has-text("Sign up"), button:has-text("Register")');
    if (submitButton) {
      const buttonText = await submitButton.textContent();
      console.log(`   Found submit button: "${buttonText}"`);
      
      // Note: We won't actually submit to avoid creating test accounts
      console.log('   (Skipping actual submission to avoid creating test accounts)');
    } else {
      console.log('   ⚠️ No submit button found');
    }
    
  } catch (error) {
    console.error('Error during detailed testing:', error);
  }
  
  await page.waitForTimeout(3000); // Give time to see the results
  await browser.close();
}

detailedRoleTest().catch(console.error);