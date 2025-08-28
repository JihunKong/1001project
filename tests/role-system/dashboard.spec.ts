import { test, expect } from '@playwright/test';

/**
 * Unified Dashboard Tests for Role System V2
 * 
 * Tests the new unified dashboard experience:
 * - Single dashboard for all customer users
 * - Progressive feature discovery
 * - Role-based feature visibility
 * - Removal of role-specific dashboards
 * - Admin dashboard separation
 */

test.describe('Unified Dashboard - Role System V2', () => {

  test.describe('Dashboard Access and Layout', () => {
    test('should redirect all users to unified dashboard', async ({ page }) => {
      // Test CUSTOMER user access
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      await page.waitForURL('/dashboard');
      
      // Should show unified dashboard
      await expect(page.locator('h1')).toContainText('Dashboard');
      await expect(page.locator('[data-testid="unified-dashboard"]')).toBeVisible();
      
      // Should NOT show role-specific navigation
      await expect(page.locator('[data-testid="learner-nav"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="teacher-nav"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="institution-nav"]')).not.toBeVisible();
    });

    test('should block access to legacy role-specific dashboards', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      
      // Try to access old learner dashboard
      const learnerResponse = await page.request.get('/dashboard/learner');
      expect(learnerResponse.status()).toBe(404);
      
      // Try to access old teacher dashboard
      const teacherResponse = await page.request.get('/dashboard/teacher');
      expect(teacherResponse.status()).toBe(404);
      
      // Try to access old institution dashboard
      const institutionResponse = await page.request.get('/dashboard/institution');
      expect(institutionResponse.status()).toBe(404);
      
      // Try to access old volunteer dashboard
      const volunteerResponse = await page.request.get('/dashboard/volunteer');
      expect(volunteerResponse.status()).toBe(404);
    });

    test('should show appropriate welcome message for migrated users', async ({ page }) => {
      // Create migrated user (originally LEARNER)
      await page.request.post('/api/test/create-migrated-user', {
        data: {
          email: 'migrated@test.1001stories.org',
          originalRole: 'LEARNER',
          currentRole: 'CUSTOMER',
          migrationDate: new Date().toISOString()
        }
      });

      await page.goto('/api/auth/demo-login?email=migrated@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show migration welcome message
      await expect(page.locator('[data-testid="migration-welcome"]')).toBeVisible();
      await expect(page.locator('text=Welcome to your new dashboard')).toBeVisible();
      await expect(page.locator('text=We\'ve upgraded your experience')).toBeVisible();
    });

    test('should display unified navigation menu', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show unified navigation
      await expect(page.locator('[data-testid="unified-nav"]')).toBeVisible();
      
      // Core navigation items should be present
      await expect(page.locator('nav a[href="/dashboard"]')).toBeVisible();
      await expect(page.locator('nav a[href="/library"]')).toBeVisible();
      await expect(page.locator('nav a[href="/shop"]')).toBeVisible();
      await expect(page.locator('nav a[href="/settings"]')).toBeVisible();
      
      // Should show user menu
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });

  test.describe('Progressive Feature Discovery', () => {
    test('should show basic features for new users', async ({ page }) => {
      // Create new user with minimal activity
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'newuser@test.1001stories.org',
          role: 'CUSTOMER',
          createdAt: new Date().toISOString(),
          librarySize: 0,
          ordersCount: 0,
          engagementLevel: 'new'
        }
      });

      await page.goto('/api/auth/demo-login?email=newuser@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show onboarding elements
      await expect(page.locator('[data-testid="onboarding-tour"]')).toBeVisible();
      await expect(page.locator('text=Getting Started')).toBeVisible();
      
      // Should show basic feature set
      await expect(page.locator('[data-testid="feature-library"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-shop"]')).toBeVisible();
      
      // Advanced features should be locked/hidden
      await expect(page.locator('[data-testid="feature-bookmarks"]')).toHaveAttribute('data-locked', 'true');
      await expect(page.locator('[data-testid="feature-reviews"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="feature-collections"]')).not.toBeVisible();
    });

    test('should unlock features based on user engagement', async ({ page }) => {
      // Create user with medium engagement
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'engaged@test.1001stories.org',
          role: 'CUSTOMER',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          librarySize: 5,
          ordersCount: 2,
          readingTime: 10800, // 3 hours
          engagementLevel: 'active'
        }
      });

      await page.goto('/api/auth/demo-login?email=engaged@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Intermediate features should be unlocked
      await expect(page.locator('[data-testid="feature-bookmarks"]')).toHaveAttribute('data-locked', 'false');
      await expect(page.locator('[data-testid="feature-reviews"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-tracking"]')).toBeVisible();
      
      // Should show feature unlock notifications
      await expect(page.locator('[data-testid="feature-unlock-notification"]')).toBeVisible();
      await expect(page.locator('text=You\'ve unlocked new features!')).toBeVisible();
    });

    test('should show all features for highly engaged users', async ({ page }) => {
      // Create power user
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'poweruser@test.1001stories.org',
          role: 'CUSTOMER',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
          librarySize: 25,
          ordersCount: 10,
          donationsCount: 3,
          readingTime: 54000, // 15 hours
          reviewsCount: 8,
          engagementLevel: 'power'
        }
      });

      await page.goto('/api/auth/demo-login?email=poweruser@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // All features should be available
      await expect(page.locator('[data-testid="feature-collections"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-advanced-search"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-reading-goals"]')).toBeVisible();
      await expect(page.locator('[data-testid="feature-community"]')).toBeVisible();
      
      // Should show power user badge
      await expect(page.locator('[data-testid="power-user-badge"]')).toBeVisible();
      await expect(page.locator('text=Power Reader')).toBeVisible();
    });

    test('should provide feature discovery hints', async ({ page }) => {
      // Create user just below feature unlock threshold
      await page.request.post('/api/test/create-user', {
        data: {
          email: 'almostunlocked@test.1001stories.org',
          role: 'CUSTOMER',
          librarySize: 2, // Need 3 for next unlock
          ordersCount: 1,
          engagementLevel: 'growing'
        }
      });

      await page.goto('/api/auth/demo-login?email=almostunlocked@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show progress toward feature unlock
      await expect(page.locator('[data-testid="unlock-progress"]')).toBeVisible();
      await expect(page.locator('text=Read 1 more story to unlock bookmarks')).toBeVisible();
      
      // Should show locked feature with hint
      const lockedFeature = page.locator('[data-testid="feature-bookmarks"]');
      await expect(lockedFeature).toHaveAttribute('data-locked', 'true');
      
      await lockedFeature.hover();
      await expect(page.locator('[data-testid="unlock-tooltip"]')).toBeVisible();
      await expect(page.locator('text=Add more stories to your library')).toBeVisible();
    });

    test('should allow manual feature exploration', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should have "Explore Features" section
      await expect(page.locator('[data-testid="explore-features"]')).toBeVisible();
      
      // Click to see all available features
      await page.click('[data-testid="show-all-features"]');
      
      // Should show feature gallery modal
      await expect(page.locator('[data-testid="feature-gallery-modal"]')).toBeVisible();
      await expect(page.locator('text=Discover What You Can Do')).toBeVisible();
      
      // Should show locked and unlocked features differently
      await expect(page.locator('[data-testid="unlocked-features"]')).toBeVisible();
      await expect(page.locator('[data-testid="locked-features"]')).toBeVisible();
    });
  });

  test.describe('Dashboard Content and Widgets', () => {
    test('should display personalized content based on user activity', async ({ page }) => {
      // Create user with specific reading history
      await page.request.post('/api/test/create-user-with-history', {
        data: {
          email: 'reader@test.1001stories.org',
          role: 'CUSTOMER',
          recentBooks: ['book1', 'book2', 'book3'],
          favoriteGenres: ['adventure', 'mystery'],
          readingStreak: 7
        }
      });

      await page.goto('/api/auth/demo-login?email=reader@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show personalized recommendations
      await expect(page.locator('[data-testid="personalized-recommendations"]')).toBeVisible();
      await expect(page.locator('text=Based on your reading history')).toBeVisible();
      
      // Should show reading streak
      await expect(page.locator('[data-testid="reading-streak"]')).toBeVisible();
      await expect(page.locator('text=7-day reading streak')).toBeVisible();
      
      // Should show continue reading section
      await expect(page.locator('[data-testid="continue-reading"]')).toBeVisible();
      await expect(page.locator('text=Pick up where you left off')).toBeVisible();
    });

    test('should show library statistics and progress', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show library stats widget
      await expect(page.locator('[data-testid="library-stats"]')).toBeVisible();
      await expect(page.locator('text=Your Library')).toBeVisible();
      
      // Should show specific metrics
      await expect(page.locator('[data-testid="books-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="reading-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
      
      // Should link to full library
      await page.click('[data-testid="view-full-library"]');
      await page.waitForURL('/library');
    });

    test('should display recent activity feed', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show activity feed
      await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
      await expect(page.locator('text=Recent Activity')).toBeVisible();
      
      // Should show different types of activities
      await expect(page.locator('[data-testid="activity-item"][data-type="book-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-item"][data-type="review-written"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-item"][data-type="goal-achieved"]')).toBeVisible();
    });

    test('should show impact and contribution metrics', async ({ page }) => {
      // Create user with donations and engagement
      await page.request.post('/api/test/create-contributor', {
        data: {
          email: 'contributor@test.1001stories.org',
          role: 'CUSTOMER',
          totalDonations: 150.00,
          donationsCount: 5,
          impactScore: 82
        }
      });

      await page.goto('/api/auth/demo-login?email=contributor@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show impact widget
      await expect(page.locator('[data-testid="impact-widget"]')).toBeVisible();
      await expect(page.locator('text=Your Impact')).toBeVisible();
      
      // Should show contribution metrics
      await expect(page.locator('text=$150.00')).toBeVisible(); // Total donated
      await expect(page.locator('text=5 donations')).toBeVisible();
      await expect(page.locator('[data-testid="impact-score"]')).toContainText('82');
      
      // Should show call-to-action for more donations
      await expect(page.locator('[data-testid="donate-cta"]')).toBeVisible();
      await expect(page.locator('text=Support more stories')).toBeVisible();
    });
  });

  test.describe('Dashboard Customization', () => {
    test('should allow widget rearrangement', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Enter customization mode
      await page.click('[data-testid="customize-dashboard"]');
      await expect(page.locator('[data-testid="customization-mode"]')).toBeVisible();
      
      // Should show drag handles on widgets
      await expect(page.locator('[data-testid="widget-drag-handle"]')).toHaveCount(5); // Assuming 5 widgets
      
      // Should be able to drag and drop widgets
      const firstWidget = page.locator('[data-testid="widget"]:nth-child(1)');
      const secondWidget = page.locator('[data-testid="widget"]:nth-child(2)');
      
      await firstWidget.dragTo(secondWidget);
      
      // Save customization
      await page.click('[data-testid="save-layout"]');
      
      // Verify layout is saved
      await page.reload();
      // Widget order should be preserved after reload
    });

    test('should allow hiding/showing widgets', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Enter customization mode
      await page.click('[data-testid="customize-dashboard"]');
      
      // Should show widget visibility toggles
      await expect(page.locator('[data-testid="widget-visibility-panel"]')).toBeVisible();
      
      // Hide a widget
      await page.click('[data-testid="toggle-activity-feed"]');
      await expect(page.locator('[data-testid="activity-feed"]')).not.toBeVisible();
      
      // Show it again
      await page.click('[data-testid="toggle-activity-feed"]');
      await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
      
      await page.click('[data-testid="save-layout"]');
    });

    test('should provide widget size options', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      await page.click('[data-testid="customize-dashboard"]');
      
      // Click on a widget to show size options
      const libraryWidget = page.locator('[data-testid="library-stats"]');
      await libraryWidget.click();
      
      // Should show size options
      await expect(page.locator('[data-testid="widget-size-options"]')).toBeVisible();
      await expect(page.locator('[data-testid="size-small"]')).toBeVisible();
      await expect(page.locator('[data-testid="size-medium"]')).toBeVisible();
      await expect(page.locator('[data-testid="size-large"]')).toBeVisible();
      
      // Change size
      await page.click('[data-testid="size-large"]');
      await expect(libraryWidget).toHaveAttribute('data-size', 'large');
      
      await page.click('[data-testid="save-layout"]');
    });
  });

  test.describe('Admin Dashboard Separation', () => {
    test('should show admin dashboard only for admin users', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=admin@test.1001stories.org&role=ADMIN');
      
      await page.goto('/admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      
      // Should have different layout and content from customer dashboard
      await expect(page.locator('[data-testid="admin-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    });

    test('should allow admin access to both admin and customer dashboards', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=admin@test.1001stories.org&role=ADMIN');
      
      // Admin can access customer dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="unified-dashboard"]')).toBeVisible();
      
      // Should show admin indicator
      await expect(page.locator('[data-testid="admin-indicator"]')).toBeVisible();
      
      // Should have quick link to admin dashboard
      await expect(page.locator('[data-testid="admin-dashboard-link"]')).toBeVisible();
      
      // Click to go to admin dashboard
      await page.click('[data-testid="admin-dashboard-link"]');
      await page.waitForURL('/admin');
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });

    test('should not show admin features to customer users', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should not show admin-specific elements
      await expect(page.locator('[data-testid="admin-indicator"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="admin-dashboard-link"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
      
      // Customer navigation should not include admin links
      const navLinks = page.locator('nav a');
      await expect(navLinks).not.toContainText('Admin');
      await expect(navLinks).not.toContainText('User Management');
    });
  });

  test.describe('Mobile Dashboard Experience', () => {
    test('should provide responsive mobile dashboard', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
      
      // Widgets should stack vertically
      await expect(page.locator('[data-testid="widget-container"]')).toHaveCSS('flex-direction', 'column');
      
      // Should show mobile navigation
      await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();
    });

    test('should support swipe gestures on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should support horizontal swipe for widget navigation
      await expect(page.locator('[data-testid="swipeable-widgets"]')).toBeVisible();
      
      // Simulate swipe (this might need a more sophisticated implementation)
      const widgetContainer = page.locator('[data-testid="swipeable-widgets"]');
      await widgetContainer.hover();
      await page.mouse.down();
      await page.mouse.move(-200, 0);
      await page.mouse.up();
      
      // Should navigate to next widget set
      await expect(page.locator('[data-testid="widget-page-indicator"]')).toContainText('2 of');
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load dashboard within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');
      
      // Wait for all widgets to load
      await page.waitForSelector('[data-testid="unified-dashboard"][data-loaded="true"]');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should show loading states for async content', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');

      // Should show skeleton loaders initially
      await expect(page.locator('[data-testid="widget-skeleton"]')).toBeVisible();
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="widget-skeleton"]', { state: 'hidden' });
      
      // Should show actual content
      await expect(page.locator('[data-testid="library-stats"]')).toBeVisible();
    });

    test('should handle offline scenarios gracefully', async ({ page }) => {
      await page.goto('/api/auth/demo-login?email=customer@test.1001stories.org&role=CUSTOMER');
      await page.goto('/dashboard');
      
      // Wait for initial load
      await page.waitForSelector('[data-testid="unified-dashboard"]');
      
      // Go offline
      await page.context().setOffline(true);
      
      // Try to refresh dashboard
      await page.reload();
      
      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('text=You\'re currently offline')).toBeVisible();
      
      // Should show cached content if available
      await expect(page.locator('[data-testid="cached-content"]')).toBeVisible();
    });
  });
});