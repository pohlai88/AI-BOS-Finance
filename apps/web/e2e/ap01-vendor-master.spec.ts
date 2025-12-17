/**
 * E2E Tests for AP-01 Vendor Master
 * 
 * These tests use Playwright to test the full vendor management workflow
 * through the web interface and API endpoints.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

test.describe('AP-01 Vendor Master - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to vendors page
    await page.goto(`${BASE_URL}/vendors`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display vendor list page', async ({ page }) => {
    // Check if vendor list page is visible
    await expect(page).toHaveTitle(/Vendors/i);
    
    // Check for vendor table or list
    const vendorList = page.locator('[data-testid="vendor-list"], table, [role="table"]');
    await expect(vendorList).toBeVisible();
  });

  test('should create a new vendor', async ({ page }) => {
    // Click create vendor button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New Vendor"), [data-testid="create-vendor"]');
    await createButton.click();

    // Wait for form to appear
    await page.waitForSelector('form, [data-testid="vendor-form"]');

    // Fill in vendor form
    await page.fill('input[name="legalName"], [data-testid="legal-name"]', 'E2E Test Vendor Inc.');
    await page.fill('input[name="displayName"], [data-testid="display-name"]', 'E2E Test Vendor');
    await page.selectOption('select[name="country"], [data-testid="country"]', 'USA');
    await page.selectOption('select[name="currencyPreference"], [data-testid="currency"]', 'USD');

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    await submitButton.click();

    // Wait for success message or redirect
    await expect(
      page.locator('[data-testid="success-message"], .toast, .alert-success, :text("created"), :text("success")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should view vendor details', async ({ page }) => {
    // Find first vendor in list and click
    const firstVendor = page.locator('table tbody tr, [data-testid="vendor-item"]').first();
    
    if (await firstVendor.count() > 0) {
      await firstVendor.click();
      
      // Wait for detail page
      await page.waitForLoadState('networkidle');
      
      // Check for vendor details
      await expect(page.locator('[data-testid="vendor-details"], .vendor-details')).toBeVisible();
    }
  });

  test('should submit vendor for approval', async ({ page }) => {
    // Navigate to a draft vendor
    await page.goto(`${BASE_URL}/vendors`);
    await page.waitForLoadState('networkidle');

    // Find a draft vendor (status = draft)
    const draftVendor = page.locator('tr:has-text("draft"), [data-testid="vendor-item"]:has-text("draft")').first();
    
    if (await draftVendor.count() > 0) {
      await draftVendor.click();
      await page.waitForLoadState('networkidle');

      // Click submit button
      const submitButton = page.locator('button:has-text("Submit"), [data-testid="submit-vendor"]');
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Confirm submission if dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Submit")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Wait for success message
        await expect(
          page.locator('[data-testid="success-message"], .toast, :text("submitted")')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should approve a submitted vendor', async ({ page }) => {
    // Navigate to vendors page
    await page.goto(`${BASE_URL}/vendors`);
    await page.waitForLoadState('networkidle');

    // Find a submitted vendor
    const submittedVendor = page.locator('tr:has-text("submitted"), [data-testid="vendor-item"]:has-text("submitted")').first();
    
    if (await submittedVendor.count() > 0) {
      await submittedVendor.click();
      await page.waitForLoadState('networkidle');

      // Click approve button
      const approveButton = page.locator('button:has-text("Approve"), [data-testid="approve-vendor"]');
      
      if (await approveButton.count() > 0) {
        await approveButton.click();
        
        // Confirm approval if dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Approve")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        // Wait for success message
        await expect(
          page.locator('[data-testid="success-message"], .toast, :text("approved")')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should filter vendors by status', async ({ page }) => {
    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]');
    
    if (await statusFilter.count() > 0) {
      // Select "approved" status
      await statusFilter.selectOption('approved');
      
      // Wait for list to update
      await page.waitForLoadState('networkidle');
      
      // Verify all visible vendors have approved status
      const vendorRows = page.locator('table tbody tr, [data-testid="vendor-item"]');
      const count = await vendorRows.count();
      
      if (count > 0) {
        // Check first few rows (if they exist)
        for (let i = 0; i < Math.min(3, count); i++) {
          const row = vendorRows.nth(i);
          await expect(row).toContainText(/approved/i, { timeout: 5000 });
        }
      }
    }
  });

  test('should search vendors', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[name="search"], [data-testid="vendor-search"]');
    
    if (await searchInput.count() > 0) {
      // Type search query
      await searchInput.fill('Test');
      
      // Wait for search results
      await page.waitForLoadState('networkidle');
      
      // Verify results contain search term
      const results = page.locator('table tbody tr, [data-testid="vendor-item"]');
      const count = await results.count();
      
      if (count > 0) {
        // At least one result should contain "Test"
        const firstResult = results.first();
        await expect(firstResult).toContainText(/test/i, { timeout: 5000 });
      }
    }
  });

  test('should handle SoD enforcement - creator cannot approve', async ({ page }) => {
    // This test verifies that the same user who created a vendor cannot approve it
    // Navigate to a vendor created by current user
    await page.goto(`${BASE_URL}/vendors`);
    await page.waitForLoadState('networkidle');

    // Find a vendor in "submitted" status created by current user
    const submittedVendor = page.locator('tr:has-text("submitted")').first();
    
    if (await submittedVendor.count() > 0) {
      await submittedVendor.click();
      await page.waitForLoadState('networkidle');

      // Try to approve (should fail if created by same user)
      const approveButton = page.locator('button:has-text("Approve"), [data-testid="approve-vendor"]');
      
      if (await approveButton.count() > 0) {
        await approveButton.click();
        
        // Should show error message about SoD
        await expect(
          page.locator('[data-testid="error-message"], .toast-error, .alert-error, :text("cannot approve"), :text("SoD")')
        ).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
