import { Page, expect, Locator } from '@playwright/test';
import path from 'path';

export class AdminUploadHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to admin login and authenticate as admin user
   */
  async loginAsAdmin(email = 'admin@example.com'): Promise<void> {
    await this.page.goto('/login');
    
    // Check if we're redirected to login
    await expect(this.page).toHaveURL(/.*\/login.*/);
    
    // Fill in admin email for magic link
    const emailInput = this.page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(email);
    
    // Submit the form to send magic link
    const submitButton = this.page.getByRole('button', { name: /send|login|sign in/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // For testing purposes, we'll mock the magic link authentication
    // In real scenario, you'd intercept the email and click the magic link
    await this.mockMagicLinkAuth(email);
  }

  /**
   * Mock magic link authentication for testing
   */
  private async mockMagicLinkAuth(email: string): Promise<void> {
    // Mock the session creation by directly navigating to admin dashboard
    // In real tests, you'd implement actual email interception
    const mockToken = 'mock-admin-session-token';
    
    // Navigate to a mock verification URL that would set session
    await this.page.goto(`/api/auth/callback/email?token=${mockToken}&email=${email}`);
    
    // Wait for redirect to admin dashboard
    await this.page.waitForURL(/.*\/admin.*/);
  }

  /**
   * Navigate to book upload page
   */
  async navigateToBookUpload(): Promise<void> {
    await this.page.goto('/admin/library/upload');
    await expect(this.page).toHaveURL('/admin/library/upload');
    
    // Verify the upload form is visible
    await expect(this.page.getByText('Upload New Book')).toBeVisible();
  }

  /**
   * Navigate to product upload page
   */
  async navigateToProductUpload(): Promise<void> {
    await this.page.goto('/admin/shop/products/new');
    await expect(this.page).toHaveURL('/admin/shop/products/new');
    
    // Verify the upload form is visible
    await expect(this.page.getByText('Create New Product')).toBeVisible();
  }

  /**
   * Check if user gets redirected to login when not authenticated
   */
  async checkAuthenticationRedirect(targetUrl: string): Promise<void> {
    await this.page.goto(targetUrl);
    
    // Should be redirected to login
    await expect(this.page).toHaveURL(/.*\/login.*/);
    
    // Should see login form
    await expect(this.page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
  }

  /**
   * Fill out book upload form with sample data
   */
  async fillBookUploadForm(data: {
    title?: string;
    authorName?: string;
    summary?: string;
    language?: string;
    category?: string;
    ageGroup?: string;
    mainPdf?: string;
    frontCover?: string;
    backCover?: string;
  } = {}): Promise<void> {
    const defaults = {
      title: 'Test Book Title',
      authorName: 'Test Author',
      summary: 'This is a test book summary for testing purposes.',
      language: 'en',
      category: 'Fiction',
      ageGroup: '6-8',
      ...data
    };

    // Fill basic information
    if (defaults.title) {
      await this.page.locator('input[placeholder*="title"]').fill(defaults.title);
    }

    if (defaults.authorName) {
      await this.page.locator('input[placeholder*="author"]').fill(defaults.authorName);
    }

    if (defaults.summary) {
      await this.page.locator('textarea[placeholder*="summary"]').fill(defaults.summary);
    }

    // Select language
    if (defaults.language) {
      await this.page.locator('select').first().selectOption(defaults.language);
    }

    // Select category
    if (defaults.category) {
      const categorySelect = this.page.locator('select').nth(1);
      await categorySelect.selectOption(defaults.category);
    }

    // Select age group
    if (defaults.ageGroup) {
      const ageGroupSelect = this.page.locator('select').nth(2);
      await ageGroupSelect.selectOption(defaults.ageGroup);
    }

    // Upload files if provided
    if (defaults.mainPdf) {
      await this.uploadFile('main-pdf', defaults.mainPdf);
    }

    if (defaults.frontCover) {
      await this.uploadFile('front-cover', defaults.frontCover);
    }

    if (defaults.backCover) {
      await this.uploadFile('back-cover', defaults.backCover);
    }
  }

  /**
   * Fill out product upload form with sample data
   */
  async fillProductUploadForm(data: {
    title?: string;
    description?: string;
    price?: string;
    stock?: string;
    creatorName?: string;
    creatorLocation?: string;
    creatorStory?: string;
    categories?: string[];
    images?: string[];
    type?: 'book' | 'goods' | 'digital_book';
  } = {}): Promise<void> {
    const defaults = {
      title: 'Test Product',
      description: 'This is a test product description.',
      price: '29.99',
      stock: '5',
      creatorName: 'Test Creator',
      creatorLocation: 'Test City, Test Country',
      creatorStory: 'This is a test creator story.',
      categories: ['Books'],
      type: 'goods' as const,
      ...data
    };

    // Fill basic product info
    await this.page.locator('input[placeholder*="title"]').first().fill(defaults.title);
    await this.page.locator('textarea[placeholder*="description"]').fill(defaults.description);
    await this.page.locator('input[placeholder*="price"]').fill(defaults.price);
    await this.page.locator('input[placeholder*="stock"]').fill(defaults.stock);

    // Select product type
    const typeRadio = this.page.locator(`input[value="${defaults.type}"]`);
    await typeRadio.check();

    // Select categories
    for (const category of defaults.categories) {
      const categoryCheckbox = this.page.locator(`text=${category}`).locator('input[type="checkbox"]');
      await categoryCheckbox.check();
    }

    // Fill creator information
    await this.page.locator('input[placeholder*="Creator"]').fill(defaults.creatorName);
    await this.page.locator('input[placeholder*="Location"]').fill(defaults.creatorLocation);
    await this.page.locator('textarea[placeholder*="story"]').fill(defaults.creatorStory);

    // Upload images if provided
    if (data.images) {
      for (const imagePath of data.images) {
        await this.uploadFile('product-images', imagePath);
      }
    }
  }

  /**
   * Upload a file to a specific dropzone or input
   */
  async uploadFile(targetType: string, filePath: string): Promise<void> {
    const fullPath = path.join(__dirname, '../fixtures/uploads', filePath);
    
    // Look for file input based on target type
    let fileInput: Locator;
    
    switch (targetType) {
      case 'main-pdf':
        fileInput = this.page.locator('input[type="file"]').first();
        break;
      case 'front-cover':
        fileInput = this.page.locator('input[type="file"]').nth(1);
        break;
      case 'back-cover':
        fileInput = this.page.locator('input[type="file"]').nth(2);
        break;
      case 'product-images':
        fileInput = this.page.locator('input[type="file"]').last();
        break;
      default:
        fileInput = this.page.locator('input[type="file"]').first();
    }

    await fileInput.setInputFiles(fullPath);
    
    // Wait for file to be processed
    await this.page.waitForTimeout(1000);
  }

  /**
   * Submit the upload form
   */
  async submitForm(): Promise<void> {
    const submitButton = this.page.getByRole('button', { name: /upload|create|submit/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).not.toBeDisabled();
    await submitButton.click();
  }

  /**
   * Check for validation errors
   */
  async checkValidationErrors(expectedErrors: string[] = []): Promise<void> {
    for (const error of expectedErrors) {
      const errorElement = this.page.locator(`text=${error}`);
      await expect(errorElement).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Check for success message
   */
  async checkSuccessMessage(message?: string): Promise<void> {
    const successLocator = message 
      ? this.page.locator(`text=${message}`)
      : this.page.locator('[role="status"], [role="alert"]').filter({ hasText: /success|uploaded|created/i });
    
    await expect(successLocator).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check CSRF protection
   */
  async checkCSRFProtection(): Promise<void> {
    // Check if CSRF token is present in the form
    const csrfInput = this.page.locator('input[name*="csrf"], input[name*="token"]');
    const hasCSRF = await csrfInput.count() > 0;
    
    if (!hasCSRF) {
      // Check if CSRF is in headers via meta tag
      const csrfMeta = this.page.locator('meta[name*="csrf"]');
      await expect(csrfMeta).toHaveCount(1);
    }
  }

  /**
   * Test file type validation
   */
  async testFileTypeValidation(invalidFile: string, expectedErrorMessage: string): Promise<void> {
    await this.uploadFile('main-pdf', invalidFile);
    
    // Look for file type error
    const errorMessage = this.page.locator(`text=${expectedErrorMessage}`);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Test file size validation
   */
  async testFileSizeValidation(): Promise<void> {
    // Create a mock large file by intercepting the file input
    await this.page.evaluate(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        // Mock a large file
        const mockFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large-file.pdf', { 
          type: 'application/pdf' 
        });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(mockFile);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });

    // Check for size error message
    const sizeError = this.page.locator('text=/file.*(too large|size|exceeded)/i');
    await expect(sizeError).toBeVisible({ timeout: 5000 });
  }

  /**
   * Check form accessibility
   */
  async checkFormAccessibility(): Promise<void> {
    // Check for proper labels
    const inputs = this.page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      const inputName = await input.getAttribute('name');
      
      if (inputId) {
        // Check for associated label
        const label = this.page.locator(`label[for="${inputId}"]`);
        await expect(label).toHaveCount(1);
      } else if (inputName) {
        // Check for aria-label or placeholder
        const hasAriaLabel = await input.getAttribute('aria-label');
        const hasPlaceholder = await input.getAttribute('placeholder');
        expect(hasAriaLabel || hasPlaceholder).toBeTruthy();
      }
    }

    // Check for required field indicators
    const requiredFields = this.page.locator('input[required], textarea[required], select[required]');
    const requiredCount = await requiredFields.count();
    
    if (requiredCount > 0) {
      // Should have visual indicators (* or "required" text)
      const requiredIndicators = this.page.locator('text=*').or(this.page.locator('text=/required/i'));
      expect(await requiredIndicators.count()).toBeGreaterThan(0);
    }
  }

  /**
   * Test drag and drop functionality for image uploads
   */
  async testDragAndDrop(imagePath: string): Promise<void> {
    const fullPath = path.join(__dirname, '../fixtures/uploads', imagePath);
    
    // Find the dropzone
    const dropzone = this.page.locator('[role="button"]').filter({ hasText: /drag|drop/i });
    await expect(dropzone).toBeVisible();

    // Simulate drag and drop
    await dropzone.hover();
    
    // Use setInputFiles on the hidden input within the dropzone
    const hiddenInput = dropzone.locator('input[type="file"]');
    await hiddenInput.setInputFiles(fullPath);
    
    // Wait for the file to be processed
    await this.page.waitForTimeout(2000);
    
    // Check if file appears in the UI
    const fileName = path.basename(imagePath);
    const fileDisplay = this.page.locator(`text=${fileName}`);
    await expect(fileDisplay).toBeVisible();
  }

  /**
   * Test multiple image uploads
   */
  async testMultipleImageUploads(imagePaths: string[]): Promise<void> {
    const fullPaths = imagePaths.map(p => path.join(__dirname, '../fixtures/uploads', p));
    
    const imageInput = this.page.locator('input[type="file"][multiple]');
    await imageInput.setInputFiles(fullPaths);
    
    // Wait for processing
    await this.page.waitForTimeout(3000);
    
    // Verify all images are shown
    for (const imagePath of imagePaths) {
      const fileName = path.basename(imagePath);
      const fileDisplay = this.page.locator(`text=${fileName}`).or(
        this.page.locator(`img[alt*="${fileName}"]`)
      );
      await expect(fileDisplay).toBeVisible();
    }
  }

  /**
   * Test image removal functionality
   */
  async testImageRemoval(): Promise<void> {
    // Find remove/delete buttons
    const removeButtons = this.page.locator('button').filter({ hasText: /remove|delete|x/i });
    const initialCount = await removeButtons.count();
    
    if (initialCount > 0) {
      // Click the first remove button
      await removeButtons.first().click();
      
      // Verify one less remove button exists
      await expect(removeButtons).toHaveCount(initialCount - 1);
    }
  }

  /**
   * Check form validation for required fields
   */
  async checkRequiredFieldValidation(): Promise<void> {
    // Try to submit empty form
    await this.submitForm();
    
    // Should see validation errors
    const validationErrors = this.page.locator('[role="alert"], .error-message, .text-red-500, .text-red-600, .text-red-700');
    await expect(validationErrors.first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * Test field-specific validation
   */
  async testFieldValidation(field: string, invalidValue: string, expectedError: string): Promise<void> {
    const fieldInput = this.page.locator(`input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`);
    
    if (await fieldInput.count() > 0) {
      await fieldInput.fill(invalidValue);
      await fieldInput.blur(); // Trigger validation
      
      const errorMessage = this.page.locator(`text=${expectedError}`);
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    }
  }

  /**
   * Take screenshot of upload form
   */
  async takeFormScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/admin-upload-${name}.png`,
      fullPage: true 
    });
  }
}