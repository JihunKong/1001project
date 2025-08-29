import { test, expect } from '@playwright/test';
import { AdminUploadHelper } from './utils/admin-upload-helpers';

test.describe('Admin Dashboard Upload Functionality', () => {
  let adminHelper: AdminUploadHelper;

  test.beforeEach(async ({ page }) => {
    adminHelper = new AdminUploadHelper(page);
  });

  test.describe('Authentication & Access Control', () => {
    test('should redirect to login when accessing book upload without authentication', async () => {
      await adminHelper.checkAuthenticationRedirect('/admin/library/upload');
    });

    test('should redirect to login when accessing product upload without authentication', async () => {
      await adminHelper.checkAuthenticationRedirect('/admin/shop/products/new');
    });

    test('should allow admin access to book upload page after authentication', async () => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToBookUpload();
      
      // Verify page elements are visible
      await expect(adminHelper.page.getByText('Upload New Book')).toBeVisible();
      await expect(adminHelper.page.getByText('PDF Files')).toBeVisible();
      await expect(adminHelper.page.getByText('Book Information')).toBeVisible();
    });

    test('should allow admin access to product upload page after authentication', async () => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToProductUpload();
      
      // Verify page elements are visible
      await expect(adminHelper.page.getByText('Create New Product')).toBeVisible();
      await expect(adminHelper.page.getByText('Product Images')).toBeVisible();
      await expect(adminHelper.page.getByText('Creator Information')).toBeVisible();
    });
  });

  test.describe('Book Upload Form', () => {
    test.beforeEach(async () => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToBookUpload();
    });

    test('should render all required form elements', async ({ page }) => {
      // Check main sections
      await expect(page.getByText('PDF Files')).toBeVisible();
      await expect(page.getByText('Book Information')).toBeVisible();
      
      // Check file upload areas
      await expect(page.getByText('Main Book')).toBeVisible();
      await expect(page.getByText('Front Cover')).toBeVisible();
      await expect(page.getByText('Back Cover')).toBeVisible();
      
      // Check required fields
      const titleInput = page.locator('input[placeholder*="title"]');
      const authorInput = page.locator('input[placeholder*="author"]');
      const summaryTextarea = page.locator('textarea[placeholder*="summary"]');
      
      await expect(titleInput).toBeVisible();
      await expect(authorInput).toBeVisible();
      await expect(summaryTextarea).toBeVisible();
      
      // Check dropdowns
      const languageSelect = page.locator('select').first();
      const categorySelect = page.locator('select').nth(1);
      const ageGroupSelect = page.locator('select').nth(2);
      
      await expect(languageSelect).toBeVisible();
      await expect(categorySelect).toBeVisible();
      await expect(ageGroupSelect).toBeVisible();
      
      // Check submit button
      const submitButton = page.getByRole('button', { name: /upload book/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled(); // Should be disabled without main PDF
    });

    test('should validate required fields', async () => {
      await adminHelper.checkRequiredFieldValidation();
      
      // Specific validation messages
      await adminHelper.checkValidationErrors([
        'Main PDF file is required',
        'Please fill in all required fields'
      ]);
    });

    test('should validate file types for PDF uploads', async () => {
      await adminHelper.testFileTypeValidation(
        'invalid-file.txt', 
        'Please select only PDF files'
      );
    });

    test('should validate file size limits', async () => {
      await adminHelper.testFileSizeValidation();
    });

    test('should show advanced options when main PDF is uploaded without covers', async ({ page }) => {
      // Upload main PDF
      await adminHelper.uploadFile('main-pdf', 'sample-book.pdf');
      
      // Advanced options should appear
      await expect(page.getByText('Additional Options')).toBeVisible();
      await expect(page.getByText('Thumbnail Page')).toBeVisible();
      await expect(page.getByText('Preview Page Limit')).toBeVisible();
      
      // Upload front cover - advanced options should disappear
      await adminHelper.uploadFile('front-cover', 'sample-book.pdf');
      
      // Advanced options should not be visible
      await expect(page.getByText('Additional Options')).not.toBeVisible();
    });

    test('should successfully fill and submit book upload form', async ({ page }) => {
      await adminHelper.fillBookUploadForm({
        title: 'Test Story Book',
        authorName: 'Test Author Name',
        summary: 'This is a comprehensive test of the book upload functionality.',
        language: 'en',
        category: 'Fiction',
        ageGroup: '6-8',
        mainPdf: 'sample-book.pdf'
      });

      // Submit the form
      await adminHelper.submitForm();
      
      // Wait for success message
      await adminHelper.checkSuccessMessage('Book uploaded successfully!');
    });

    test('should check form accessibility', async () => {
      await adminHelper.checkFormAccessibility();
    });

    test('should have CSRF protection', async () => {
      await adminHelper.checkCSRFProtection();
    });

    test('should take screenshots for visual verification', async () => {
      await adminHelper.takeFormScreenshot('book-upload-empty');
      
      // Fill form partially
      await adminHelper.fillBookUploadForm({
        title: 'Test Book',
        authorName: 'Test Author'
      });
      
      await adminHelper.takeFormScreenshot('book-upload-partial');
      
      // Upload files
      await adminHelper.uploadFile('main-pdf', 'sample-book.pdf');
      await adminHelper.takeFormScreenshot('book-upload-with-files');
    });
  });

  test.describe('Product Upload Form', () => {
    test.beforeEach(async () => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToProductUpload();
    });

    test('should render all required form elements', async ({ page }) => {
      // Check main sections
      await expect(page.getByText('Create New Product')).toBeVisible();
      await expect(page.getByText('Product Images')).toBeVisible();
      await expect(page.getByText('Creator Information')).toBeVisible();
      await expect(page.getByText('Impact Information')).toBeVisible();
      
      // Check basic product fields
      await expect(page.locator('input[placeholder*="title"]').first()).toBeVisible();
      await expect(page.locator('textarea[placeholder*="description"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="price"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="stock"]')).toBeVisible();
      
      // Check product type options
      await expect(page.getByText('Physical Book')).toBeVisible();
      await expect(page.getByText('Handmade Goods')).toBeVisible();
      await expect(page.getByText('Digital Book')).toBeVisible();
      
      // Check categories section
      await expect(page.getByText('Categories')).toBeVisible();
      await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
      
      // Check creator information fields
      await expect(page.locator('input[placeholder*="Creator"]')).toBeVisible();
      await expect(page.locator('input[placeholder*="Location"]')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="story"]')).toBeVisible();
      
      // Check image upload area
      await expect(page.getByText('Upload Product Images')).toBeVisible();
      await expect(page.getByText('Drag & drop images')).toBeVisible();
      
      // Check submit button
      const submitButton = page.getByRole('button', { name: /create product/i });
      await expect(submitButton).toBeVisible();
    });

    test('should validate required fields', async () => {
      await adminHelper.checkRequiredFieldValidation();
      
      // Check for specific validation errors
      const expectedErrors = [
        'Product title is required',
        'Product description is required',
        'Valid price is required',
        'At least one category is required',
        'Creator name is required',
        'Creator location is required',
        'At least one product image is required'
      ];
      
      await adminHelper.checkValidationErrors(expectedErrors);
    });

    test('should validate price field', async () => {
      await adminHelper.testFieldValidation('price', '-5', 'Valid price is required');
      await adminHelper.testFieldValidation('price', 'abc', 'Valid price is required');
    });

    test('should validate impact value field', async () => {
      await adminHelper.testFieldValidation('impactValue', '0', 'Impact value must be positive');
      await adminHelper.testFieldValidation('impactValue', '-1', 'Impact value must be positive');
    });

    test('should support drag and drop image uploads', async () => {
      await adminHelper.testDragAndDrop('sample-product.png');
    });

    test('should support multiple image uploads', async () => {
      await adminHelper.testMultipleImageUploads([
        'sample-product.png',
        'sample-product-2.png',
        'sample-product-3.png'
      ]);
    });

    test('should limit to maximum 5 images', async ({ page }) => {
      // Try to upload 6 images
      const imagePaths = [
        'sample-product.png',
        'sample-product-2.png',
        'sample-product-3.png',
        'sample-product.png',
        'sample-product-2.png',
        'sample-product-3.png'
      ];
      
      // Upload images one by one and check for limit error
      for (let i = 0; i < imagePaths.length; i++) {
        await adminHelper.uploadFile('product-images', imagePaths[i]);
        
        if (i >= 4) { // After 5 images (0-4)
          // Should show error about maximum images
          await expect(page.getByText('Maximum 5 images allowed')).toBeVisible();
          break;
        }
      }
    });

    test('should allow image removal', async () => {
      // Upload some images first
      await adminHelper.testMultipleImageUploads([
        'sample-product.png',
        'sample-product-2.png'
      ]);
      
      // Test removal functionality
      await adminHelper.testImageRemoval();
    });

    test('should validate image file types', async ({ page }) => {
      // Try to upload non-image file
      await adminHelper.uploadFile('product-images', 'invalid-file.txt');
      
      // Should reject non-image files
      // The dropzone should only accept image files
      const fileCount = await page.locator('img[alt*="Product"]').count();
      expect(fileCount).toBe(0);
    });

    test('should successfully fill and submit product upload form', async ({ page }) => {
      await adminHelper.fillProductUploadForm({
        title: 'Handmade Scarf',
        description: 'Beautiful handmade scarf created by local artisan.',
        price: '45.99',
        stock: '3',
        creatorName: 'Maria Rodriguez',
        creatorLocation: 'Guatemala City, Guatemala',
        creatorStory: 'Maria has been creating beautiful textiles for over 20 years.',
        categories: ['Textiles', 'Handicrafts'],
        type: 'goods',
        images: ['sample-product.png', 'sample-product-2.png']
      });

      // Submit the form
      await adminHelper.submitForm();
      
      // Wait for success message
      await adminHelper.checkSuccessMessage();
    });

    test('should check form accessibility', async () => {
      await adminHelper.checkFormAccessibility();
    });

    test('should have CSRF protection', async () => {
      await adminHelper.checkCSRFProtection();
    });

    test('should take screenshots for visual verification', async () => {
      await adminHelper.takeFormScreenshot('product-upload-empty');
      
      // Fill form partially
      await adminHelper.fillProductUploadForm({
        title: 'Test Product',
        description: 'Test description'
      });
      
      await adminHelper.takeFormScreenshot('product-upload-partial');
      
      // Upload images
      await adminHelper.testDragAndDrop('sample-product.png');
      await adminHelper.takeFormScreenshot('product-upload-with-images');
    });
  });

  test.describe('Form Interaction & UX', () => {
    test('should show loading states during form submission', async ({ page }) => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToBookUpload();
      
      // Fill form
      await adminHelper.fillBookUploadForm({
        mainPdf: 'sample-book.pdf'
      });

      // Mock slow API response
      await page.route('/api/admin/books/upload', async route => {
        await page.waitForTimeout(2000); // Simulate slow response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, bookId: 'test-id' })
        });
      });

      // Submit and check loading state
      await adminHelper.submitForm();
      
      const loadingButton = page.getByRole('button', { name: /uploading/i });
      await expect(loadingButton).toBeVisible();
      await expect(loadingButton).toBeDisabled();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToBookUpload();
      
      // Fill form
      await adminHelper.fillBookUploadForm({
        mainPdf: 'sample-book.pdf'
      });

      // Mock API error
      await page.route('/api/admin/books/upload', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error occurred' })
        });
      });

      // Submit and check error handling
      await adminHelper.submitForm();
      
      await expect(page.getByText('Server error occurred')).toBeVisible();
    });

    test('should clear error messages when user corrects input', async ({ page }) => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToBookUpload();
      
      // Submit empty form to trigger validation
      await adminHelper.submitForm();
      
      // Check error appears
      await expect(page.getByText('Main PDF file is required')).toBeVisible();
      
      // Upload file
      await adminHelper.uploadFile('main-pdf', 'sample-book.pdf');
      
      // Error should disappear
      await expect(page.getByText('Main PDF file is required')).not.toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
    });

    test('should display book upload form properly on mobile', async ({ page }) => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToBookUpload();
      
      // Check that form elements are visible and accessible on mobile
      await expect(page.getByText('Upload New Book')).toBeVisible();
      await expect(page.getByText('Main Book')).toBeVisible();
      
      // Check that upload areas stack vertically on mobile
      const uploadAreas = page.locator('[role="button"]').filter({ hasText: /pdf/i });
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/book-upload-mobile.png',
        fullPage: true 
      });
    });

    test('should display product upload form properly on mobile', async ({ page }) => {
      await adminHelper.loginAsAdmin();
      await adminHelper.navigateToProductUpload();
      
      // Check mobile layout
      await expect(page.getByText('Create New Product')).toBeVisible();
      await expect(page.getByText('Upload Product Images')).toBeVisible();
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/screenshots/product-upload-mobile.png',
        fullPage: true 
      });
    });
  });
});

test.describe('Cross-browser Compatibility', () => {
  // These tests will run on different browsers if configured in playwright.config.ts
  
  test('should work consistently across browsers', async ({ page, browserName }) => {
    const adminHelper = new AdminUploadHelper(page);
    await adminHelper.loginAsAdmin();
    await adminHelper.navigateToBookUpload();
    
    // Basic functionality should work the same
    await expect(page.getByText('Upload New Book')).toBeVisible();
    
    // File upload should work
    await adminHelper.uploadFile('main-pdf', 'sample-book.pdf');
    
    // Take browser-specific screenshot
    await page.screenshot({ 
      path: `test-results/screenshots/book-upload-${browserName}.png`,
      fullPage: true 
    });
  });
});