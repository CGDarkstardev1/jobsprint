/**
 * Example E2E Test with Playwright
 * Demonstrates end-to-end testing patterns
 */

import { test, expect } from '@playwright/test';

test.describe('Jobsprint Application', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application before each test
        await page.goto('/');
    });

    test('should load the home page', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/Jobsprint/);

        // Check for main heading
        const heading = page.locator('.hero h2');
        await expect(heading).toContainText('AI-Powered Automation Platform');
    });

    test('should display navigation menu', async ({ page }) => {
        // Check for navigation links
        const navLinks = page.locator('.nav-menu a');
        await expect(navLinks).toHaveCount(4);

        // Verify navigation items
        await expect(navLinks.nth(0)).toContainText('Home');
        await expect(navLinks.nth(1)).toContainText('Workflows');
        await expect(navLinks.nth(2)).toContainText('Integrations');
        await expect(navLinks.nth(3)).toContainText('Docs');
    });

    test('should navigate to workflows page', async ({ page }) => {
        // Click on Workflows link
        await page.click('.nav-menu a[href="#workflows"]');

        // Check URL changed
        await expect(page).toHaveURL(/#workflows/);

        // Check for workflows content
        await expect(page.locator('h2')).toContainText('Your Workflows');
    });

    test('should respond to health check', async ({ request }) => {
        // Test health endpoint directly
        const response = await request.get('/health');
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toHaveProperty('status', 'healthy');
    });
});
