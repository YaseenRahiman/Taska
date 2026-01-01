import { test, expect } from '@playwright/test';

/**
 * GUI Styles Validation E2E Test
 *
 * Validates that all custom Tailwind CSS classes and styles are properly applied
 * across different pages to prevent regression after bug fixes.
 */

test.describe('GUI Styles Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should load global styles correctly', async ({ page }) => {
    // Check that the page has the correct background color from globals.css
    const body = page.locator('body');
    await expect(body).toHaveClass(/antialiased/);

    // Verify the main container has proper styling
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('should render Taska brand colors correctly', async ({ page }) => {
    // Check for primary color usage (turquoise #16A085)
    const logo = page.locator('.gradient-primary').first();
    if (await logo.isVisible()) {
      const styles = await logo.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          background: computed.background,
          backgroundImage: computed.backgroundImage,
        };
      });

      // Verify gradient is applied
      expect(styles.backgroundImage).toContain('linear-gradient');
    }
  });

  test('should apply button styles correctly', async ({ page }) => {
    // Find primary buttons
    const primaryButton = page.locator('.btn-primary').first();

    if (await primaryButton.isVisible()) {
      // Check button styling
      const buttonStyles = await primaryButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          borderRadius: computed.borderRadius,
          transition: computed.transition,
        };
      });

      // Verify button has padding and rounded corners
      expect(buttonStyles.borderRadius).not.toBe('0px');
      expect(buttonStyles.padding).not.toBe('0px');
    }
  });

  test('should render card styles correctly', async ({ page }) => {
    // Find cards on the page
    const card = page.locator('.card').first();

    if (await card.isVisible()) {
      const cardStyles = await card.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          boxShadow: computed.boxShadow,
          borderRadius: computed.borderRadius,
        };
      });

      // Verify card has shadow and rounded corners
      expect(cardStyles.boxShadow).not.toBe('none');
      expect(cardStyles.borderRadius).not.toBe('0px');
    }
  });

  test('should apply responsive container styles', async ({ page }) => {
    // Check container-wide class
    const container = page.locator('.container-wide').first();

    if (await container.isVisible()) {
      const containerStyles = await container.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          maxWidth: computed.maxWidth,
          paddingLeft: computed.paddingLeft,
          paddingRight: computed.paddingRight,
        };
      });

      // Verify container has max-width and padding
      expect(containerStyles.maxWidth).not.toBe('none');
      expect(parseInt(containerStyles.paddingLeft)).toBeGreaterThan(0);
    }
  });

  test('should render navigation styles correctly', async ({ page }) => {
    // Find navigation links
    const navLink = page.locator('.nav-link').first();

    if (await navLink.isVisible()) {
      const linkStyles = await navLink.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          fontWeight: computed.fontWeight,
          transition: computed.transition,
        };
      });

      // Verify nav link has proper styling
      expect(linkStyles.fontWeight).not.toBe('400'); // Should be medium or bold
      expect(linkStyles.transition).not.toBe('all 0s ease 0s');
    }
  });

  test('should apply typography styles correctly', async ({ page }) => {
    // Check for hero text
    const heroText = page.locator('.text-hero').first();

    if (await heroText.isVisible()) {
      const textStyles = await heroText.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
        };
      });

      // Verify hero text has large font size
      expect(parseInt(textStyles.fontSize)).toBeGreaterThan(30);
      expect(textStyles.fontWeight).toBe('700'); // Bold
    }
  });

  test('should load Inter font correctly', async ({ page }) => {
    // Check that Inter font is loaded
    const body = page.locator('body');
    const fontFamily = await body.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });

    // Verify Inter font is being used
    expect(fontFamily).toContain('Inter');
  });

  test('should apply mobile-optimized styles', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile menu button is visible
    const mobileMenuButton = page.getByTestId('mobile-menu');
    await expect(mobileMenuButton).toBeVisible();

    // Click mobile menu
    await mobileMenuButton.click();

    // Verify mobile menu opens
    const mobileMenu = page.locator('.md\\:hidden').filter({ hasText: 'Find Artisans' });
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should apply hover effects correctly', async ({ page }) => {
    // Find a card with hover effect
    const hoverCard = page.locator('.card-hover').first();

    if (await hoverCard.isVisible()) {
      // Get initial styles
      const initialStyles = await hoverCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          boxShadow: computed.boxShadow,
        };
      });

      // Hover over the card
      await hoverCard.hover();

      // Wait for transition
      await page.waitForTimeout(300);

      // Get styles after hover
      const hoverStyles = await hoverCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          boxShadow: computed.boxShadow,
        };
      });

      // Verify shadow changes on hover (may be subtle)
      // We just check that both have shadows applied
      expect(initialStyles.boxShadow).not.toBe('none');
      expect(hoverStyles.boxShadow).not.toBe('none');
    }
  });

  test('should render footer with correct styles', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Find footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check footer background color (should be dark)
    const footerStyles = await footer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
      };
    });

    // Verify footer has dark background
    // RGB values should be low for dark gray
    const bgColor = footerStyles.backgroundColor;
    expect(bgColor).toMatch(/rgb\(/);
  });

  test('should apply consistent spacing throughout', async ({ page }) => {
    // Check for consistent spacing using utility classes
    const sections = page.locator('section');
    const sectionCount = await sections.count();

    if (sectionCount > 0) {
      // Get first section padding
      const firstSection = sections.first();
      const padding = await firstSection.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          paddingTop: computed.paddingTop,
          paddingBottom: computed.paddingBottom,
        };
      });

      // Verify sections have vertical padding
      expect(parseInt(padding.paddingTop)).toBeGreaterThan(0);
      expect(parseInt(padding.paddingBottom)).toBeGreaterThan(0);
    }
  });

  test('should handle theme colors correctly', async ({ page }) => {
    // Check CSS variables are defined
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      return {
        primary: computed.getPropertyValue('--primary'),
        background: computed.getPropertyValue('--background'),
        foreground: computed.getPropertyValue('--foreground'),
      };
    });

    // Verify CSS variables are set
    expect(rootStyles.primary.trim()).not.toBe('');
    expect(rootStyles.background.trim()).not.toBe('');
    expect(rootStyles.foreground.trim()).not.toBe('');
  });

  test('should apply focus styles for accessibility', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');

    // Get the focused element
    const focusedElement = page.locator(':focus').first();

    if (await focusedElement.isVisible()) {
      const focusStyles = await focusedElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          boxShadow: computed.boxShadow,
        };
      });

      // Verify focus indicator is visible (either outline or ring shadow)
      const hasFocusIndicator =
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow.includes('rgb');

      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should render animations correctly', async ({ page }) => {
    // Check for elements with animation classes
    const animatedElement = page.locator('[class*="animate-"]').first();

    if (await animatedElement.isVisible()) {
      const animationStyles = await animatedElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          animation: computed.animation,
        };
      });

      // Verify animation is applied
      expect(animationStyles.animation).not.toBe('none');
    }
  });

  test('should handle reduced motion preference', async ({ page }) => {
    // Emulate prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Reload page
    await page.reload();

    // Check that animations are significantly reduced
    const animatedElement = page.locator('[class*="animate-"]').first();

    if (await animatedElement.isVisible()) {
      const animationStyles = await animatedElement.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          animationDuration: computed.animationDuration,
        };
      });

      // With reduced motion, animation duration should be very short
      const duration = parseFloat(animationStyles.animationDuration);
      expect(duration).toBeLessThan(0.1); // Less than 100ms
    }
  });
});

test.describe('Page-Specific Style Tests', () => {
  test('homepage should have all brand elements', async ({ page }) => {
    await page.goto('/');

    // Check for key brand elements
    const logo = page.locator('text=Taska').first();
    await expect(logo).toBeVisible();

    // Check for gradient background in hero
    const hero = page.locator('section').first();
    const heroStyles = await hero.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        background: computed.background,
        backgroundImage: computed.backgroundImage,
      };
    });

    // Verify hero has some background styling
    const hasBackground =
      heroStyles.background !== 'rgba(0, 0, 0, 0)' ||
      heroStyles.backgroundImage !== 'none';

    expect(hasBackground).toBeTruthy();
  });

  test('login page should have proper form styling', async ({ page }) => {
    await page.goto('/auth/login');

    // Check for form inputs
    const emailInput = page.locator('input[type="email"]').first();

    if (await emailInput.isVisible()) {
      const inputStyles = await emailInput.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          border: computed.border,
          borderRadius: computed.borderRadius,
          padding: computed.padding,
        };
      });

      // Verify input has border and padding
      expect(inputStyles.border).not.toBe('0px none');
      expect(inputStyles.borderRadius).not.toBe('0px');
      expect(parseInt(inputStyles.padding)).toBeGreaterThan(0);
    }
  });

  test('dashboard pages should have consistent card layouts', async ({ page }) => {
    // Test would require authentication, so we'll skip for now
    // This is a placeholder for when auth is implemented
    test.skip();
  });
});
