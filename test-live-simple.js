const { chromium } = require('playwright');

async function testLiveForms() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  console.log('🚀 Starting live website form tests...\n');

  try {
    // Test 1: Desktop volunteer signup
    console.log('📱 Testing desktop volunteer signup form...');
    const desktopPage = await context.newPage();
    await desktopPage.setViewportSize({ width: 1920, height: 1080 });

    await desktopPage.goto('http://3.128.143.122/signup?role=volunteer');
    await desktopPage.waitForLoadState('networkidle');

    // Take full page screenshot
    await desktopPage.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-desktop-full.png',
      fullPage: true
    });

    // Check for category grid
    const categoryGrid = desktopPage.locator('[class*="grid"]').first();
    if (await categoryGrid.isVisible()) {
      await categoryGrid.screenshot({
        path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-category-grid-desktop.png'
      });

      const gridClasses = await categoryGrid.getAttribute('class');
      console.log('  ✅ Category grid classes:', gridClasses);

      if (gridClasses && gridClasses.includes('lg:grid-cols-4')) {
        console.log('  ✅ Desktop grid shows 4 columns (lg:grid-cols-4)');
      } else {
        console.log('  ⚠️ Desktop grid may not have 4 columns');
      }
    }

    await desktopPage.close();

    // Test 2: Mobile volunteer signup
    console.log('\n📱 Testing mobile volunteer signup form...');
    const mobilePage = await context.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });

    await mobilePage.goto('http://3.128.143.122/signup?role=volunteer');
    await mobilePage.waitForLoadState('networkidle');

    await mobilePage.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-mobile.png',
      fullPage: true
    });

    // Check horizontal overflow
    const bodyWidth = await mobilePage.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await mobilePage.evaluate(() => window.innerWidth);

    console.log(`  📏 Mobile - Body width: ${bodyWidth}px, Viewport width: ${viewportWidth}px`);

    if (bodyWidth <= viewportWidth + 1) {
      console.log('  ✅ No horizontal overflow on mobile');
    } else {
      console.log('  ❌ Horizontal overflow detected on mobile');
    }

    await mobilePage.close();

    // Test 3: Tablet view
    console.log('\n📱 Testing tablet view...');
    const tabletPage = await context.newPage();
    await tabletPage.setViewportSize({ width: 768, height: 1024 });

    await tabletPage.goto('http://3.128.143.122/signup?role=volunteer');
    await tabletPage.waitForLoadState('networkidle');

    await tabletPage.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/volunteer-tablet.png',
      fullPage: true
    });

    console.log('  ✅ Tablet screenshot captured');

    await tabletPage.close();

    // Test 4: Try to access dashboard (might redirect to login)
    console.log('\n📱 Testing dashboard access...');
    const dashboardPage = await context.newPage();
    await dashboardPage.setViewportSize({ width: 1920, height: 1080 });

    await dashboardPage.goto('http://3.128.143.122/dashboard/volunteer');
    await dashboardPage.waitForLoadState('networkidle');

    const currentUrl = dashboardPage.url();
    console.log(`  🔗 Redirected to: ${currentUrl}`);

    await dashboardPage.screenshot({
      path: '/Users/jihunkong/1001project/1001-stories/test-results/dashboard-access.png',
      fullPage: true
    });

    await dashboardPage.close();

    // Test 5: Check different viewport sizes
    console.log('\n📱 Testing multiple viewport sizes...');
    const viewports = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1440, height: 900, name: 'desktop' },
      { width: 1920, height: 1080, name: 'desktop-large' }
    ];

    for (const viewport of viewports) {
      const page = await context.newPage();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('http://3.128.143.122/signup?role=volunteer');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `/Users/jihunkong/1001project/1001-stories/test-results/form-${viewport.name}.png`,
        fullPage: true
      });

      console.log(`  ✅ ${viewport.name} (${viewport.width}x${viewport.height}) screenshot captured`);

      await page.close();
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('📸 Screenshots saved to test-results/ directory');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLiveForms();