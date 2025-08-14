import { test, expect } from '@playwright/test';

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have consistent gradient theme with unique role colors', async ({ page }) => {
    // Check hero section gradient text
    const gradientText = page.locator('.gradient-text').first();
    await expect(gradientText).toBeVisible();
    
    // Check that the gradient-text class has the correct gradient
    const gradientStyle = await gradientText.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(gradientStyle).toContain('linear-gradient');
    
    // Check role cards always link to actual dashboards (middleware handles authentication)
    const roleCards = page.locator('[href="/dashboard/learner"], [href="/dashboard/teacher"], [href="/dashboard/institution"], [href="/dashboard/volunteer"]');
    const cardCount = await roleCards.count();
    expect(cardCount).toBe(4); // Should have 4 role cards
    
    // Verify each card has a unique gradient color
    const gradientColors = ['from-blue-400', 'from-emerald-400', 'from-purple-400', 'from-rose-400'];
    for (let i = 0; i < cardCount; i++) {
      const card = roleCards.nth(i);
      const cardHtml = await card.innerHTML();
      expect(cardHtml).toContain(gradientColors[i]);
    }
    
    // Check that role cards have different icon colors
    const iconColors = ['text-blue-500', 'text-emerald-500', 'text-purple-500', 'text-rose-500'];
    for (let i = 0; i < iconColors.length; i++) {
      const iconWithColor = roleCards.nth(i).locator(`.${iconColors[i]}`);
      await expect(iconWithColor).toBeVisible();
    }
  });

  test('should navigate to demo hub and demo dashboards', async ({ page }) => {
    // Click Try Demo button on homepage
    const tryDemoBtn = page.locator('a[href="/demo"]').filter({ hasText: 'Try Demo' });
    await expect(tryDemoBtn).toBeVisible();
    await tryDemoBtn.click();
    await page.waitForURL('/demo');
    
    // Verify demo hub page
    await expect(page.locator('h1')).toContainText('Explore the Platform');
    await expect(page.locator('text=Demo Mode - Explore with sample data')).toBeVisible();
    
    // Click on demo learner card
    await page.click('a[href="/demo/learner"]');
    await page.waitForURL('/demo/learner');
    await expect(page).toHaveURL('/demo/learner');
    
    // Check demo mode banner is visible
    await expect(page.locator('text=Demo Mode')).toBeVisible();
    await expect(page.locator('text=This is a preview with sample data')).toBeVisible();
    
    // Verify demo learner dashboard content
    await expect(page.locator('h1')).toContainText('My Learning Journey (Demo)');
  });

  test('should redirect to login when clicking role cards without authentication', async ({ page }) => {
    // Click on a role card (e.g., learner)
    await page.click('a[href="/dashboard/learner"]');
    
    // Should be redirected to login page with callback URL
    await page.waitForURL(/\/login/);
    const url = page.url();
    expect(url).toContain('/login');
    expect(url).toContain('callbackUrl');
    expect(url).toContain('dashboard%2Flearner');
    
    // Verify login page is displayed (check for actual login page content)
    await expect(page.locator('text=Welcome back!')).toBeVisible();
  });

  test('should display all main sections', async ({ page }) => {
    // Check hero section
    await expect(page.locator('text=Empower Young Voices')).toBeVisible();
    await expect(page.locator('text=Inspire the World')).toBeVisible();
    
    // Check features section
    await expect(page.locator('text=Global Stories')).toBeVisible();
    await expect(page.locator('text=Interactive Learning')).toBeVisible();
    await expect(page.locator('text=Community Impact')).toBeVisible();
    
    // Check stats section
    await expect(page.locator('text=Stories Published')).toBeVisible();
    await expect(page.locator('text=Children Reached')).toBeVisible();
    
    // Check role selection section
    await expect(page.locator('text=Choose Your Role')).toBeVisible();
    
    // Check impact/CTA section
    await expect(page.locator('text=Plant Seeds of Hope')).toBeVisible();
    await expect(page.locator('text=Seeds of Empowerment')).toBeVisible();
  });

  test('should have proper visual hierarchy with badges', async ({ page }) => {
    // Check for badge elements (may have different selectors)
    const badges = page.locator('.rounded-full').filter({ hasText: /Global Education|Choose|Seeds/ });
    await expect(badges).toHaveCount(3); // Three badge sections
    
    // Verify badges exist (they use different classes)
    const badgeElements = page.locator('.rounded-full').filter({ hasText: /Global|Seeds|Choose/ });
    await expect(badgeElements.first()).toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    // Check main CTA buttons exist
    const getStartedBtn = page.locator('a[href="#roles"]').first();
    await expect(getStartedBtn).toBeVisible();
    
    // Try Demo button
    const tryDemoBtn = page.locator('a[href="/demo"]').filter({ hasText: 'Try Demo' });
    await expect(tryDemoBtn).toBeVisible();
    
    // Library button exists
    const libraryLink = page.locator('a[href="/library"]');
    await expect(libraryLink.first()).toBeVisible();
    
    // Check bottom CTA buttons
    const supportBtn = page.locator('a[href="/donate"]');
    await expect(supportBtn).toBeVisible();
    
    const volunteerBtn = page.locator('a[href="/volunteer"]').filter({ hasText: 'Become a Volunteer' });
    await expect(volunteerBtn).toBeVisible();
  });

  test('should scroll to roles section when clicking Get Started', async ({ page }) => {
    const getStartedBtn = page.locator('a[href="#roles"]').first();
    await getStartedBtn.click();
    
    // Wait for smooth scroll
    await page.waitForTimeout(1000);
    
    // Check that roles section is in viewport
    const rolesSection = page.locator('#roles');
    await expect(rolesSection).toBeInViewport();
  });
});