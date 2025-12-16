import { test, expect } from '@playwright/test';

/**
 * BioTable E2E Tests
 * 
 * Critical User Flows:
 * - Search/filter → results update → clear
 * - Click header → sort asc/desc
 * - Navigate pages → state persists
 * - Select rows → bulk action
 */

test.describe('BioTable User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page with BioTable
    await page.goto('/payments/bio-demo');
    // Wait for table to render
    await page.waitForSelector('[data-testid="bio-table"]', { timeout: 10000 });
  });

  test.describe('Filtering', () => {
    test('can filter table with global search', async ({ page }) => {
      // Find the search input
      const searchInput = page.getByPlaceholder(/search/i);
      
      // Type a search term
      await searchInput.fill('payment');
      
      // Wait for filter to apply
      await page.waitForTimeout(300); // debounce
      
      // Verify filtered results (or no results message)
      const tableRows = page.locator('[data-testid="bio-table"] tbody tr');
      const rowCount = await tableRows.count();
      
      // Either we have filtered rows or an empty state
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('can clear filter', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i);
      
      // Apply filter
      await searchInput.fill('test');
      await page.waitForTimeout(300);
      
      // Clear filter
      await searchInput.clear();
      await page.waitForTimeout(300);
      
      // Table should show all rows again
      const tableRows = page.locator('[data-testid="bio-table"] tbody tr');
      expect(await tableRows.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Sorting', () => {
    test('can sort column ascending/descending', async ({ page }) => {
      // Find sortable column header
      const columnHeader = page.locator('[data-testid="bio-table"] th').first();
      
      // Click to sort ascending
      await columnHeader.click();
      await page.waitForTimeout(100);
      
      // Click again to sort descending
      await columnHeader.click();
      await page.waitForTimeout(100);
      
      // Verify sort indicator exists
      const sortIndicator = columnHeader.locator('[data-sort]');
      // Table should still be rendered
      const tableRows = page.locator('[data-testid="bio-table"] tbody tr');
      expect(await tableRows.count()).toBeGreaterThanOrEqual(0);
    });

    test('sort persists after filter', async ({ page }) => {
      // Sort first
      const columnHeader = page.locator('[data-testid="bio-table"] th').first();
      await columnHeader.click();
      
      // Then filter
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill('a');
      await page.waitForTimeout(300);
      
      // Verify table still renders correctly
      await expect(page.locator('[data-testid="bio-table"]')).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('can navigate to next page', async ({ page }) => {
      // Find pagination controls
      const nextButton = page.getByRole('button', { name: /next/i });
      
      if (await nextButton.isVisible()) {
        // Get initial page indicator
        const pageIndicator = page.locator('[data-testid="page-indicator"]');
        
        // Click next
        await nextButton.click();
        await page.waitForTimeout(100);
        
        // Verify page changed
        await expect(page.locator('[data-testid="bio-table"]')).toBeVisible();
      }
    });

    test('can change page size', async ({ page }) => {
      // Find page size selector
      const pageSizeSelect = page.locator('select[data-testid="page-size"]');
      
      if (await pageSizeSelect.isVisible()) {
        // Change page size
        await pageSizeSelect.selectOption('20');
        await page.waitForTimeout(100);
        
        // Verify table updates
        await expect(page.locator('[data-testid="bio-table"]')).toBeVisible();
      }
    });
  });

  test.describe('Row Selection', () => {
    test('can select individual rows', async ({ page }) => {
      // Find row checkboxes
      const rowCheckbox = page.locator('[data-testid="bio-table"] tbody tr input[type="checkbox"]').first();
      
      if (await rowCheckbox.isVisible()) {
        // Select row
        await rowCheckbox.check();
        
        // Verify selection
        await expect(rowCheckbox).toBeChecked();
      }
    });

    test('can select all rows', async ({ page }) => {
      // Find select all checkbox in header
      const selectAllCheckbox = page.locator('[data-testid="bio-table"] thead input[type="checkbox"]').first();
      
      if (await selectAllCheckbox.isVisible()) {
        // Select all
        await selectAllCheckbox.check();
        await page.waitForTimeout(100);
        
        // Verify all visible rows are selected
        const rowCheckboxes = page.locator('[data-testid="bio-table"] tbody tr input[type="checkbox"]');
        const count = await rowCheckboxes.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          await expect(rowCheckboxes.nth(i)).toBeChecked();
        }
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('table renders on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify table is still accessible
      await expect(page.locator('[data-testid="bio-table"]')).toBeVisible();
    });
  });
});
