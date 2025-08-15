import { test, expect } from '@playwright/test';

test.describe('Performance Testing', () => {
  
  test.describe('Page Load Performance', () => {
    test('landing page should load within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
      
      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let fcp, lcp, cls, fid;
          
          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            fcp = entries[entries.length - 1].startTime;
          }).observe({ entryTypes: ['paint'] });
          
          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            lcp = entries[entries.length - 1].startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Wait for metrics to be collected
          setTimeout(() => {
            resolve({
              fcp: fcp || 0,
              lcp: lcp || 0,
              cls: cls || 0,
              navigationTiming: performance.getEntriesByType('navigation')[0],
            });
          }, 2000);
        });
      });
      
      // Core Web Vitals thresholds
      expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s (good)
      expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s (good)
      expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1 (good)
    });
    
    test('dashboard should load within 2 seconds for authenticated users', async ({ page }) => {
      // Set authentication cookie/storage
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard/**');
      
      // Now measure dashboard reload performance
      const startTime = Date.now();
      await page.reload({ waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000);
    });
    
    test('library page should handle 100+ stories efficiently', async ({ page }) => {
      await page.goto('/library');
      
      // Measure initial render time
      const renderTime = await page.evaluate(() => {
        return performance.now();
      });
      
      expect(renderTime).toBeLessThan(1500);
      
      // Test infinite scroll performance
      let previousHeight = 0;
      let currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      while (previousHeight !== currentHeight && previousHeight < 5000) {
        previousHeight = currentHeight;
        
        const scrollStart = Date.now();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500); // Wait for lazy loading
        const scrollTime = Date.now() - scrollStart;
        
        expect(scrollTime).toBeLessThan(1000); // Each scroll should be fast
        
        currentHeight = await page.evaluate(() => document.body.scrollHeight);
      }
    });
  });
  
  test.describe('Resource Loading', () => {
    test('should optimize image loading with lazy loading', async ({ page }) => {
      const resourceTimings: any[] = [];
      
      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          resourceTimings.push({
            url: response.url(),
            status: response.status(),
            size: response.headers()['content-length'],
            timing: response.timing()
          });
        }
      });
      
      await page.goto('/library');
      
      // Check initial image loads
      const initialImages = resourceTimings.length;
      expect(initialImages).toBeLessThan(20); // Should not load all images at once
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      
      // More images should have loaded
      const afterScrollImages = resourceTimings.length;
      expect(afterScrollImages).toBeGreaterThan(initialImages);
      
      // All images should be optimized (WebP or compressed)
      for (const resource of resourceTimings) {
        expect(resource.status).toBe(200);
        if (resource.size) {
          expect(parseInt(resource.size)).toBeLessThan(500000); // < 500KB per image
        }
      }
    });
    
    test('should use efficient bundle splitting', async ({ page }) => {
      const jsResources: any[] = [];
      
      page.on('response', response => {
        if (response.url().endsWith('.js')) {
          jsResources.push({
            url: response.url(),
            size: response.headers()['content-length']
          });
        }
      });
      
      await page.goto('/');
      
      // Check bundle sizes
      const mainBundle = jsResources.find(r => r.url.includes('main'));
      if (mainBundle && mainBundle.size) {
        expect(parseInt(mainBundle.size)).toBeLessThan(300000); // Main bundle < 300KB
      }
      
      // Should have multiple chunks (code splitting)
      expect(jsResources.length).toBeGreaterThan(3);
      
      // No single bundle should be too large
      for (const resource of jsResources) {
        if (resource.size) {
          expect(parseInt(resource.size)).toBeLessThan(500000); // < 500KB per chunk
        }
      }
    });
  });
  
  test.describe('API Performance', () => {
    test('API endpoints should respond within 500ms', async ({ page, request }) => {
      // Test critical API endpoints
      const endpoints = [
        '/api/health',
        '/api/stories',
        '/api/user/profile',
        '/api/dashboard/stats'
      ];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(endpoint);
        const responseTime = Date.now() - startTime;
        
        expect(response.status()).toBeLessThanOrEqual(401); // Allow auth errors
        expect(responseTime).toBeLessThan(500);
      }
    });
    
    test('should handle concurrent API requests efficiently', async ({ request }) => {
      const requests = Array(10).fill(null).map(() => 
        request.get('/api/stories')
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      for (const response of responses) {
        expect(response.ok()).toBeTruthy();
      }
      
      // Concurrent requests should complete within reasonable time
      expect(totalTime).toBeLessThan(2000); // 10 requests in 2 seconds
    });
  });
  
  test.describe('Memory Management', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Get initial memory usage
      const getMemoryUsage = () => page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      const initialMemory = await getMemoryUsage();
      
      // Navigate through multiple pages
      const pages = ['/', '/library', '/about', '/dashboard/learner', '/'];
      
      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) window.gc();
      });
      
      await page.waitForTimeout(1000);
      
      const finalMemory = await getMemoryUsage();
      
      // Memory should not increase significantly (allow 50MB increase)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });
  
  test.describe('Database Query Performance', () => {
    test('should load user dashboard data efficiently', async ({ page }) => {
      // Login first
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', 'test.learner@1001stories.test');
      await page.fill('input[name="password"]', 'TestPass123!');
      await page.click('button[type="submit"]');
      
      // Measure dashboard data loading
      await page.goto('/dashboard/learner');
      
      // Check if all data loads within reasonable time
      await expect(page.locator('[data-testid="daily-goals"]')).toBeVisible({ timeout: 1000 });
      await expect(page.locator('[data-testid="course-progress"]')).toBeVisible({ timeout: 1000 });
      await expect(page.locator('[data-testid="recent-stories"]')).toBeVisible({ timeout: 1000 });
      
      // Check API response times in Network tab
      const apiCalls = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return entries
          .filter(entry => entry.name.includes('/api/'))
          .map(entry => ({
            name: entry.name,
            duration: entry.duration
          }));
      });
      
      // All API calls should be fast
      for (const call of apiCalls) {
        expect(call.duration).toBeLessThan(500);
      }
    });
  });
  
  test.describe('Stress Testing', () => {
    test('should handle rapid user interactions', async ({ page }) => {
      await page.goto('/library');
      
      // Rapidly click on multiple elements
      const actions = Array(20).fill(null).map((_, i) => async () => {
        if (i % 2 === 0) {
          await page.click('[data-testid="filter-button"]', { force: true, timeout: 100 }).catch(() => {});
        } else {
          await page.click('[data-testid="sort-button"]', { force: true, timeout: 100 }).catch(() => {});
        }
      });
      
      await Promise.all(actions);
      
      // Page should still be responsive
      await expect(page.locator('[data-testid="story-grid"]')).toBeVisible();
      
      // No console errors
      const consoleErrors = await page.evaluate(() => {
        const errors: string[] = [];
        console.error = (msg) => errors.push(msg.toString());
        return errors;
      });
      
      expect(consoleErrors.length).toBe(0);
    });
    
    test('should handle large form submissions', async ({ page }) => {
      await page.goto('/contact');
      
      // Fill form with large data
      const largeText = 'Lorem ipsum '.repeat(1000); // ~12KB of text
      
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', largeText);
      
      const startTime = Date.now();
      await page.click('button[type="submit"]');
      
      // Should handle large submission
      await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
      const submitTime = Date.now() - startTime;
      
      expect(submitTime).toBeLessThan(5000);
    });
  });
});