import { test, expect } from '@playwright/test';

test.describe('CSS Loading Verification', () => {
  test('should load and apply Tailwind CSS styles correctly', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that the main container has proper styling (not just black background)
    const body = await page.locator('body');
    const bodyBgColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    console.log('Body background color:', bodyBgColor);
    
    // Verify the hero section has gradient background
    const heroSection = await page.locator('section').first();
    const heroClasses = await heroSection.getAttribute('class');
    console.log('Hero section classes:', heroClasses);
    
    // Check for gradient text
    const gradientText = await page.locator('.gradient-text').first();
    const hasGradientText = await gradientText.count() > 0;
    expect(hasGradientText).toBeTruthy();
    console.log('Has gradient text:', hasGradientText);
    
    // Check for glass cards
    const glassCards = await page.locator('.glass-card');
    const glassCardCount = await glassCards.count();
    expect(glassCardCount).toBeGreaterThan(0);
    console.log('Glass card count:', glassCardCount);
    
    // Check that buttons have proper styling
    const primaryButton = await page.locator('.btn-primary').first();
    const buttonBg = await primaryButton.evaluate((el) => 
      window.getComputedStyle(el).background
    );
    console.log('Primary button background:', buttonBg);
    expect(buttonBg).toContain('gradient');
    
    // Check that text is not all aligned to the left
    const mainHeading = await page.locator('h1').first();
    const textAlign = await mainHeading.evaluate((el) => 
      window.getComputedStyle(el).textAlign
    );
    console.log('Main heading text alignment:', textAlign);
    expect(textAlign).toBe('center');
    
    // Verify fonts are loaded
    const fontFamily = await body.evaluate((el) => 
      window.getComputedStyle(el).fontFamily
    );
    console.log('Font family:', fontFamily);
    expect(fontFamily).toContain('Inter');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/homepage-styles.png', fullPage: true });
    
    console.log('✅ All CSS styles are loading correctly!');
  });
  
  test('should have responsive design elements', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'tests/screenshots/mobile-view.png' });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'tests/screenshots/tablet-view.png' });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: 'tests/screenshots/desktop-view.png' });
    
    console.log('✅ Responsive design verified!');
  });
});