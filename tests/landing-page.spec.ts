import { test, expect } from '@playwright/test';

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have consistent blue-indigo gradient theme', async ({ page }) => {
    // Check hero section gradient text
    const gradientText = page.locator('.gradient-text').first();
    await expect(gradientText).toBeVisible();
    
    // Check that the gradient-text class has the correct gradient
    const gradientStyle = await gradientText.evaluate((el) => {
      return window.getComputedStyle(el).background;
    });
    expect(gradientStyle).toContain('linear-gradient');
    
    // Check role cards have consistent gradient (now links to /demo when not authenticated)
    const roleCards = page.locator('[href*="/learner"], [href*="/teacher"], [href*="/institution"], [href*="/volunteer"]');
    const cardCount = await roleCards.count();
    expect(cardCount).toBe(4); // Should have 4 role cards
    
    // Verify each card has a gradient (different gradients for each role)
    for (let i = 0; i < cardCount; i++) {
      const card = roleCards.nth(i);
      const gradientDiv = card.locator('[class*="bg-gradient-to-br"]');
      await expect(gradientDiv).toHaveCount(1);
    }
    
    // Check that role cards have different icon colors
    const iconColors = ['text-blue-500', 'text-emerald-500', 'text-purple-500'];
    for (let i = 0; i < Math.min(iconColors.length, cardCount); i++) {
      const iconWithColor = roleCards.nth(i).locator(`.${iconColors[i]}`);
      await expect(iconWithColor).toBeVisible();
    }
  });

  test('should navigate to demo dashboards without authentication', async ({ page }) => {
    // Test demo learner dashboard access (now routes to /demo/learner when not authenticated)
    await page.click('a[href="/demo/learner"]');
    await page.waitForURL('/demo/learner');
    await expect(page).toHaveURL('/demo/learner');
    await expect(page.locator('h1')).toContainText('Learning Journey');
    
    // Check demo mode banner is visible
    await expect(page.locator('text=Demo Mode')).toBeVisible();
    await expect(page.locator('text=This is a preview with sample data')).toBeVisible();
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
    
    // Library button exists in navigation
    const libraryLink = page.locator('a[href="/library"]');
    await expect(libraryLink.first()).toBeVisible();
    
    // Check bottom CTA buttons
    const supportBtn = page.locator('a[href="/donate"]');
    await expect(supportBtn).toBeVisible();
    
    const volunteerBtn = page.locator('a[href="/volunteer"]');
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