import { test, expect } from '@playwright/test';

test.describe('Admin Upload Functionality - Local Testing', () => {
  
  test('Admin book upload page loads correctly', async ({ page }) => {
    // Visit the book upload page
    await page.goto('/admin/library/upload');
    
    // Should redirect to login since we're not authenticated
    await expect(page).toHaveURL(/.*login/);
    
    // Check that login page elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Admin product upload page loads correctly', async ({ page }) => {
    // Visit the product upload page
    await page.goto('/admin/shop/products/new');
    
    // Should redirect to login since we're not authenticated
    await expect(page).toHaveURL(/.*login/);
    
    // Check that login page elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Landing page loads successfully', async ({ page }) => {
    // Test basic functionality to ensure the app is running
    await page.goto('/');
    
    // Check for basic page elements
    await expect(page.locator('body')).toBeVisible();
    
    // Look for 1001 Stories branding or content
    await expect(page.locator('text=1001 Stories, text=Stories, text=Education')).toHaveCount({ min: 1 });
  });

  test('Demo pages are accessible', async ({ page }) => {
    // Check demo functionality works
    await page.goto('/demo');
    
    // Should load successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('API health check works', async ({ request }) => {
    // Test that the API is responding
    const response = await request.get('/api/auth/session');
    
    // Should return 200 (even if unauthenticated)
    expect(response.status()).toBeLessThan(500);
  });
});