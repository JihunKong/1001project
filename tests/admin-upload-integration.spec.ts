import { test, expect, APIRequestContext } from '@playwright/test';
import path from 'path';

test.describe('Admin Upload API Integration', () => {
  let apiContext: APIRequestContext;
  let authCookies: string;

  test.beforeAll(async ({ playwright }) => {
    // Create API context
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.beforeEach(async ({ page }) => {
    // Get authenticated session cookies
    // In a real scenario, you'd authenticate properly
    await page.goto('/login');
    
    // Mock authentication by setting session cookie
    await page.context().addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-admin-session',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    const cookies = await page.context().cookies();
    authCookies = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  });

  test.describe('Book Upload API', () => {
    test('should accept valid book upload with main PDF', async () => {
      const formData = new FormData();
      
      // Add book metadata
      formData.append('title', 'Test Book Upload');
      formData.append('authorName', 'Test Author');
      formData.append('authorEmail', 'author@test.com');
      formData.append('summary', 'This is a test book summary.');
      formData.append('language', 'en');
      formData.append('category', 'Fiction');
      formData.append('ageGroup', '6-8');
      formData.append('price', '9.99');
      formData.append('thumbnailPage', '1');
      formData.append('previewPageLimit', '5');

      // Add PDF file
      const pdfPath = path.join(__dirname, 'fixtures/uploads/sample-book.pdf');
      const pdfBuffer = require('fs').readFileSync(pdfPath);
      formData.append('mainPdf', new Blob([pdfBuffer], { type: 'application/pdf' }), 'sample-book.pdf');

      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Test Book Upload',
          authorName: 'Test Author',
          authorEmail: 'author@test.com',
          summary: 'This is a test book summary.',
          language: 'en',
          category: 'Fiction',
          ageGroup: '6-8',
          price: '9.99',
          thumbnailPage: '1',
          previewPageLimit: '5',
          mainPdf: {
            name: 'sample-book.pdf',
            mimeType: 'application/pdf',
            buffer: pdfBuffer
          }
        }
      });

      expect(response.status()).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty('bookId');
      expect(result).toHaveProperty('message', 'Book uploaded successfully');
    });

    test('should reject upload without main PDF', async () => {
      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Test Book Upload',
          authorName: 'Test Author',
          summary: 'This is a test book summary.'
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Main PDF file is required');
    });

    test('should reject upload with invalid file type', async () => {
      const txtPath = path.join(__dirname, 'fixtures/uploads/invalid-file.txt');
      const txtBuffer = require('fs').readFileSync(txtPath);

      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Test Book Upload',
          authorName: 'Test Author',
          summary: 'This is a test book summary.',
          mainPdf: {
            name: 'invalid-file.txt',
            mimeType: 'text/plain',
            buffer: txtBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid.*file.*type|only.*pdf.*allowed/i);
    });

    test('should validate required fields', async () => {
      const pdfPath = path.join(__dirname, 'fixtures/uploads/sample-book.pdf');
      const pdfBuffer = require('fs').readFileSync(pdfPath);

      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          // Missing required fields: title, authorName, summary
          language: 'en',
          mainPdf: {
            name: 'sample-book.pdf',
            mimeType: 'application/pdf',
            buffer: pdfBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/required.*field/i);
    });
  });

  test.describe('Product Upload API', () => {
    test('should accept valid product upload with images', async () => {
      const imagePath = path.join(__dirname, 'fixtures/uploads/sample-product.png');
      const imageBuffer = require('fs').readFileSync(imagePath);

      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Test Product',
          description: 'This is a test product description.',
          price: '29.99',
          category: JSON.stringify(['Handicrafts']),
          type: 'goods',
          stock: '5',
          featured: 'false',
          creatorName: 'Test Creator',
          creatorLocation: 'Test Location',
          creatorStory: 'Test creator story.',
          impactMetric: 'Days of education for one child',
          impactValue: '3',
          image_0: {
            name: 'sample-product.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(200);
      
      const result = await response.json();
      expect(result).toHaveProperty('productId');
      expect(result).toHaveProperty('message');
    });

    test('should reject product upload without images', async () => {
      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Test Product',
          description: 'Test description',
          price: '29.99',
          category: ['Handicrafts'],
          type: 'goods',
          creatorName: 'Test Creator',
          creatorLocation: 'Test Location'
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/image.*required|at least.*one.*image/i);
    });

    test('should validate price field', async () => {
      const imagePath = path.join(__dirname, 'fixtures/uploads/sample-product.png');
      const imageBuffer = require('fs').readFileSync(imagePath);

      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Test Product',
          description: 'Test description',
          price: '-5', // Invalid negative price
          category: JSON.stringify(['Handicrafts']),
          type: 'goods',
          creatorName: 'Test Creator',
          creatorLocation: 'Test Location',
          image_0: {
            name: 'sample-product.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/price.*invalid|price.*positive/i);
    });

    test('should validate category selection', async () => {
      const imagePath = path.join(__dirname, 'fixtures/uploads/sample-product.png');
      const imageBuffer = require('fs').readFileSync(imagePath);

      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Test Product',
          description: 'Test description',
          price: '29.99',
          category: JSON.stringify([]), // Empty categories
          type: 'goods',
          creatorName: 'Test Creator',
          creatorLocation: 'Test Location',
          image_0: {
            name: 'sample-product.png',
            mimeType: 'image/png',
            buffer: imageBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/category.*required|at least.*one.*category/i);
    });

    test('should limit number of images to 5', async () => {
      const imagePath = path.join(__dirname, 'fixtures/uploads/sample-product.png');
      const imageBuffer = require('fs').readFileSync(imagePath);

      const multipartData: any = {
        title: 'Test Product',
        description: 'Test description',
        price: '29.99',
        category: JSON.stringify(['Handicrafts']),
        type: 'goods',
        creatorName: 'Test Creator',
        creatorLocation: 'Test Location',
      };

      // Add 6 images (should exceed limit)
      for (let i = 0; i < 6; i++) {
        multipartData[`image_${i}`] = {
          name: `sample-product-${i}.png`,
          mimeType: 'image/png',
          buffer: imageBuffer
        };
      }

      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: multipartData
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/maximum.*5.*image|too many.*image/i);
    });
  });

  test.describe('Authentication & Authorization', () => {
    test('should reject unauthorized requests to book upload', async () => {
      const response = await apiContext.post('/api/admin/books/upload', {
        data: {
          title: 'Unauthorized Test'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should reject unauthorized requests to product upload', async () => {
      const response = await apiContext.post('/api/admin/shop/products', {
        data: {
          title: 'Unauthorized Test'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should require admin role for book upload', async ({ page }) => {
      // Mock non-admin user session
      await page.context().addCookies([
        {
          name: 'next-auth.session-token',
          value: 'mock-user-session',
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }
      ]);

      const userCookies = (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ');

      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': userCookies,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Non-admin Test'
        }
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF protection in API endpoints', async ({ page }) => {
      await page.goto('/admin/library/upload');
      
      // Check for CSRF token in page
      const csrfMeta = await page.locator('meta[name="csrf-token"]').getAttribute('content');
      const csrfInput = await page.locator('input[name="_token"]').getAttribute('value');
      
      expect(csrfMeta || csrfInput).toBeTruthy();
    });

    test('should reject requests without valid CSRF token', async () => {
      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'CSRF Test',
          // Missing CSRF token
        }
      });

      // Should either require CSRF token or reject the request
      expect([400, 403, 419]).toContain(response.status());
    });
  });

  test.describe('File Validation', () => {
    test('should validate PDF file signatures for book uploads', async () => {
      // Create a fake PDF file (without proper PDF headers)
      const fakeBuffer = Buffer.from('This is not a real PDF file');

      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Signature Test',
          authorName: 'Test Author',
          summary: 'Test summary',
          mainPdf: {
            name: 'fake.pdf',
            mimeType: 'application/pdf',
            buffer: fakeBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid.*pdf|file.*corrupt|signature.*invalid/i);
    });

    test('should validate image file signatures for product uploads', async () => {
      // Create a fake image file (without proper image headers)
      const fakeBuffer = Buffer.from('This is not a real image file');

      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Image Signature Test',
          description: 'Test description',
          price: '29.99',
          category: JSON.stringify(['Handicrafts']),
          type: 'goods',
          creatorName: 'Test Creator',
          creatorLocation: 'Test Location',
          image_0: {
            name: 'fake.png',
            mimeType: 'image/png',
            buffer: fakeBuffer
          }
        }
      });

      expect(response.status()).toBe(400);
      
      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/invalid.*image|file.*corrupt|signature.*invalid/i);
    });
  });

  test.describe('Performance & Limits', () => {
    test('should handle file size limits for PDFs', async () => {
      // Create a large buffer (simulating >50MB file)
      const largeBuffer = Buffer.alloc(55 * 1024 * 1024); // 55MB

      const response = await apiContext.post('/api/admin/books/upload', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Large File Test',
          authorName: 'Test Author',
          summary: 'Test summary',
          mainPdf: {
            name: 'large-book.pdf',
            mimeType: 'application/pdf',
            buffer: largeBuffer
          }
        }
      });

      expect(response.status()).toBe(413); // Payload Too Large
    });

    test('should handle file size limits for images', async () => {
      // Create a large image buffer (simulating >10MB file)
      const largeBuffer = Buffer.alloc(12 * 1024 * 1024); // 12MB

      const response = await apiContext.post('/api/admin/shop/products', {
        headers: {
          'Cookie': authCookies,
        },
        multipart: {
          title: 'Large Image Test',
          description: 'Test description',
          price: '29.99',
          category: JSON.stringify(['Handicrafts']),
          type: 'goods',
          creatorName: 'Test Creator',
          creatorLocation: 'Test Location',
          image_0: {
            name: 'large-image.png',
            mimeType: 'image/png',
            buffer: largeBuffer
          }
        }
      });

      expect(response.status()).toBe(413); // Payload Too Large
    });
  });
});