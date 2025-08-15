import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing (WCAG 2.1 AA Compliance)', () => {
  
  test.describe('Landing Page Accessibility', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
    
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // There should be exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Headings should be in proper order
      const headings = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(elements).map(el => ({
          level: parseInt(el.tagName.substring(1)),
          text: el.textContent
        }));
      });
      
      // Check heading hierarchy
      let previousLevel = 0;
      for (const heading of headings) {
        expect(heading.level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = heading.level;
      }
    });
    
    test('should have proper landmarks', async ({ page }) => {
      await page.goto('/');
      
      // Check for main landmarks
      await expect(page.locator('header, [role="banner"]')).toHaveCount(1);
      await expect(page.locator('main, [role="main"]')).toHaveCount(1);
      await expect(page.locator('footer, [role="contentinfo"]')).toHaveCount(1);
      
      // Navigation should exist
      await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
    });
    
    test('should have skip navigation link', async ({ page }) => {
      await page.goto('/');
      
      // Focus on the skip link (usually hidden until focused)
      await page.keyboard.press('Tab');
      
      const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toContainText(/skip/i);
    });
  });
  
  test.describe('Keyboard Navigation', () => {
    test('should be fully navigable with keyboard', async ({ page }) => {
      await page.goto('/');
      
      // Tab through interactive elements
      const interactiveElements = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return elements.length;
      });
      
      expect(interactiveElements).toBeGreaterThan(0);
      
      // Test tab navigation
      for (let i = 0; i < Math.min(interactiveElements, 10); i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tagName: el?.tagName,
            visible: el ? window.getComputedStyle(el).visibility !== 'hidden' : false
          };
        });
        
        expect(focusedElement.visible).toBeTruthy();
      }
    });
    
    test('modal should trap focus', async ({ page }) => {
      await page.goto('/');
      
      // Open a modal (e.g., login modal)
      await page.click('button:has-text("Sign In")');
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]');
      
      // Check focus is trapped within modal
      const modalElements = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        const focusable = modal?.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return focusable ? focusable.length : 0;
      });
      
      // Tab through modal elements
      for (let i = 0; i < modalElements + 1; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should wrap back to first element in modal
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.closest('[role="dialog"]') !== null;
      });
      
      expect(focusedElement).toBeTruthy();
      
      // ESC should close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
    
    test('dropdown menus should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Find and focus dropdown trigger
      const dropdown = page.locator('[aria-haspopup="true"]').first();
      await dropdown.focus();
      
      // Open with Enter or Space
      await page.keyboard.press('Enter');
      
      // Menu should be visible
      const menu = page.locator('[role="menu"]').first();
      await expect(menu).toBeVisible();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      
      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(menu).not.toBeVisible();
    });
  });
  
  test.describe('Screen Reader Support', () => {
    test('images should have alt text', async ({ page }) => {
      await page.goto('/');
      
      const images = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs).map(img => ({
          src: img.src,
          alt: img.alt,
          decorative: img.alt === '' && img.getAttribute('role') === 'presentation'
        }));
      });
      
      for (const img of images) {
        // Image should either have alt text or be marked as decorative
        expect(img.alt || img.decorative).toBeTruthy();
      }
    });
    
    test('form inputs should have labels', async ({ page }) => {
      await page.goto('/auth/signin');
      
      const inputs = await page.evaluate(() => {
        const elements = document.querySelectorAll('input, select, textarea');
        return Array.from(elements).map(el => {
          const id = el.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledby = el.getAttribute('aria-labelledby');
          
          return {
            type: el.getAttribute('type'),
            hasLabel: !!label,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledby: !!ariaLabelledby
          };
        });
      });
      
      for (const input of inputs) {
        // Skip hidden inputs
        if (input.type === 'hidden') continue;
        
        // Input should have some form of label
        expect(
          input.hasLabel || input.hasAriaLabel || input.hasAriaLabelledby
        ).toBeTruthy();
      }
    });
    
    test('buttons should have accessible names', async ({ page }) => {
      await page.goto('/');
      
      const buttons = await page.evaluate(() => {
        const elements = document.querySelectorAll('button');
        return Array.from(elements).map(btn => ({
          text: btn.textContent?.trim(),
          ariaLabel: btn.getAttribute('aria-label'),
          ariaLabelledby: btn.getAttribute('aria-labelledby'),
          title: btn.getAttribute('title')
        }));
      });
      
      for (const button of buttons) {
        // Button should have accessible name
        expect(
          button.text || button.ariaLabel || button.ariaLabelledby || button.title
        ).toBeTruthy();
      }
    });
    
    test('live regions should be properly marked', async ({ page }) => {
      await page.goto('/');
      
      // Submit a form to trigger notifications
      await page.click('button:has-text("Subscribe")');
      
      // Check for live region
      const liveRegions = await page.evaluate(() => {
        const regions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]');
        return Array.from(regions).map(region => ({
          role: region.getAttribute('role'),
          ariaLive: region.getAttribute('aria-live'),
          text: region.textContent
        }));
      });
      
      expect(liveRegions.length).toBeGreaterThan(0);
      
      for (const region of liveRegions) {
        // Live regions should have appropriate attributes
        expect(region.role || region.ariaLive).toBeTruthy();
      }
    });
  });
  
  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('[data-testid="main-content"]')
        .analyze();
      
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );
      
      expect(contrastViolations).toEqual([]);
    });
    
    test('focus indicators should be visible', async ({ page }) => {
      await page.goto('/');
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusStyles = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        
        const styles = window.getComputedStyle(el);
        const pseudoStyles = window.getComputedStyle(el, ':focus');
        
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      });
      
      // Should have visible focus indicator
      expect(
        focusStyles?.outline !== 'none' ||
        focusStyles?.boxShadow !== 'none' ||
        parseInt(focusStyles?.outlineWidth || '0') > 0
      ).toBeTruthy();
    });
  });
  
  test.describe('Responsive Design Accessibility', () => {
    test('mobile menu should be accessible', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Find hamburger menu
      const menuButton = page.locator('[aria-label*="menu" i]').first();
      await expect(menuButton).toBeVisible();
      
      // Check ARIA attributes
      const ariaExpanded = await menuButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('false');
      
      // Open menu
      await menuButton.click();
      
      // Check updated ARIA
      const ariaExpandedAfter = await menuButton.getAttribute('aria-expanded');
      expect(ariaExpandedAfter).toBe('true');
      
      // Mobile menu should be visible
      const mobileNav = page.locator('nav[aria-label*="mobile" i]').first();
      await expect(mobileNav).toBeVisible();
    });
    
    test('touch targets should be large enough', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const touchTargets = await page.evaluate(() => {
        const elements = document.querySelectorAll('a, button, input, select, textarea');
        return Array.from(elements).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            tag: el.tagName
          };
        });
      });
      
      for (const target of touchTargets) {
        // WCAG 2.1 requires 44x44 pixels minimum
        if (target.width > 0 && target.height > 0) {
          expect(target.width >= 44 || target.height >= 44).toBeTruthy();
        }
      }
    });
  });
  
  test.describe('Language and Localization', () => {
    test('should have proper language attributes', async ({ page }) => {
      await page.goto('/');
      
      // Check html lang attribute
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
      
      // Check for language switcher
      const langSwitcher = page.locator('[data-testid="language-selector"]');
      await expect(langSwitcher).toBeVisible();
      
      // Switch language
      await langSwitcher.click();
      await page.click('text=한국어');
      
      // Check lang attribute updated
      const newHtmlLang = await page.getAttribute('html', 'lang');
      expect(newHtmlLang).toContain('ko');
    });
    
    test('should handle text directionality', async ({ page }) => {
      await page.goto('/');
      
      // Check default dir attribute
      const htmlDir = await page.getAttribute('html', 'dir');
      expect(htmlDir === 'ltr' || htmlDir === null).toBeTruthy();
      
      // If RTL language is supported, test it
      // This would require Arabic or Hebrew support
    });
  });
  
  test.describe('Error Handling Accessibility', () => {
    test('form errors should be accessible', async ({ page }) => {
      await page.goto('/auth/signin');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Wait for errors
      await page.waitForSelector('[role="alert"], [aria-invalid="true"]');
      
      // Check error messages are associated with inputs
      const errors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error-message');
        return Array.from(errorElements).map(error => {
          const input = error.closest('.form-field')?.querySelector('input');
          return {
            message: error.textContent,
            inputId: input?.id,
            ariaDescribedby: input?.getAttribute('aria-describedby'),
            ariaInvalid: input?.getAttribute('aria-invalid')
          };
        });
      });
      
      for (const error of errors) {
        expect(error.message).toBeTruthy();
        expect(error.ariaInvalid).toBe('true');
      }
    });
    
    test('404 page should be accessible', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Check for proper heading
      await expect(page.locator('h1')).toContainText(/404|not found/i);
      
      // Should have navigation options
      await expect(page.locator('a:has-text("Home")')).toBeVisible();
      
      // Run accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });
});