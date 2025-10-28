import { test, expect } from '@playwright/test';

test.describe('AI Text Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Test Writer
    await page.goto('https://1001stories.seedsofempowerment.org/login');
    await page.fill('input[name="email"]', 'writer@test.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/writer');
  });

  test('should display AI annotations with colored underlines', async ({ page }) => {
    // Navigate to writer dashboard
    await page.goto('https://1001stories.seedsofempowerment.org/dashboard/writer');

    // Find and click on a story with DRAFT or NEEDS_REVISION status
    const storyCard = page.locator('[data-testid="story-card"]').first();
    await expect(storyCard).toBeVisible({ timeout: 10000 });
    await storyCard.click();

    // Wait for the AnnotatedStoryViewer to load
    await page.waitForSelector('.ProseMirror', { timeout: 10000 });

    // Check for AI suggestion highlights
    const grammarHighlights = page.locator('.ai-suggestion-grammar');
    const structureHighlights = page.locator('.ai-suggestion-structure');
    const writingHelpHighlights = page.locator('.ai-suggestion-writing_help');

    // At least one type of suggestion should be present
    const allHighlights = page.locator('[data-suggestion-id]');
    const highlightCount = await allHighlights.count();

    console.log(`[AI Annotation Test] Found ${highlightCount} highlighted suggestions`);
    expect(highlightCount).toBeGreaterThan(0);

    // Test clicking on a highlight to show popover
    if (highlightCount > 0) {
      await allHighlights.first().click();

      // Verify suggestion popover appears
      const popover = page.locator('[data-testid="suggestion-popover"]');
      await expect(popover).toBeVisible({ timeout: 5000 });

      console.log('[AI Annotation Test] Suggestion popover displayed successfully');
    }
  });

  test('should log annotation application in console', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', msg => {
      if (msg.text().includes('[AnnotatedStoryViewer]') || msg.text().includes('[AI Review]')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('https://1001stories.seedsofempowerment.org/dashboard/writer');

    // Find and click on a story
    const storyCard = page.locator('[data-testid="story-card"]').first();
    await expect(storyCard).toBeVisible({ timeout: 10000 });
    await storyCard.click();

    // Wait for annotations to be applied
    await page.waitForTimeout(3000);

    // Check console logs for annotation success messages
    const annotationLogs = consoleLogs.filter(log =>
      log.includes('Applying') || log.includes('Applied') || log.includes('annotations')
    );

    console.log('[AI Annotation Test] Console logs:', annotationLogs);
    expect(annotationLogs.length).toBeGreaterThan(0);
  });
});
