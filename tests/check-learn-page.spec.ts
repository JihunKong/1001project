import { test, expect } from '@playwright/test';

test('Check learn/read page content display', async ({ page }) => {
  // First login as a learner
  await page.goto('http://localhost:3001/login');
  
  // Login with test learner account
  await page.fill('input[name="email"]', 'student.clean@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  
  // Navigate to the book learning page
  await page.goto('http://localhost:3001/learn/read/the-three-boys-span');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take a screenshot to see what's displayed
  await page.screenshot({ path: 'learn-page-content.png', fullPage: true });
  
  // Check what content is visible
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  
  // Check for PDF viewer
  const pdfViewer = await page.locator('iframe').count();
  console.log('PDF viewer iframes found:', pdfViewer);
  
  // Check for SafePDFViewer component
  const pdfViewerComponent = await page.locator('[data-testid="pdf-viewer"]').count();
  console.log('SafePDFViewer components found:', pdfViewerComponent);
  
  // Check for text content
  const textContent = await page.locator('.prose').first().textContent().catch(() => null);
  console.log('Text content found:', textContent?.substring(0, 200));
  
  // Check for error messages
  const errorMessages = await page.locator('[class*="error"]').count();
  console.log('Error messages found:', errorMessages);
  
  // Log any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Wait a bit to capture any dynamic content
  await page.waitForTimeout(3000);
  
  // Take final screenshot
  await page.screenshot({ path: 'learn-page-final.png', fullPage: true });
});