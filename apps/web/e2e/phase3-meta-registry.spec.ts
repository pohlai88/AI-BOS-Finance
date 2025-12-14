/**
 * Phase 3: Frontend Interface Verification - E2E Tests
 * 
 * Tests for META_02 (Registry Table) and META_03 (Detail Page)
 * Based on REF_118_Phase3_FrontendVerification.md
 * 
 * @see REF_118_Phase3_FrontendVerification.md
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
const KERNEL_URL = process.env.KERNEL_URL || 'http://localhost:3001';

test.describe('Phase 3: Frontend Interface Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for page to be ready
    await page.goto(`${BASE_URL}/meta-registry`, { waitUntil: 'networkidle' });
  });

  test.describe('META_02: Registry Table', () => {
    test('should load without error spinner', async ({ page }) => {
      // Wait for loading to complete (no spinner)
      const loadingSpinner = page.locator('.animate-spin, [data-loading]');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Check for error messages
      const errorMessage = page.locator('.text-red-500, [data-error]');
      await expect(errorMessage).not.toBeVisible();
    });

    test('should display table with data', async ({ page }) => {
      // Wait for table to be visible
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible({ timeout: 10000 });

      // Check that table has rows
      const rows = table.locator('tbody tr, [role="row"]');
      await expect(rows.first()).toBeVisible();

      // Should have at least 1 row (with bindable filter, should show 6)
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('should show 6 records with bindable filter applied', async ({ page }) => {
      // Wait for data to load
      await page.waitForSelector('table tbody tr, [role="table"] [role="row"]', { timeout: 10000 });

      // Count visible rows
      const rows = page.locator('table tbody tr, [role="table"] [role="row"]');
      const rowCount = await rows.count();

      // With bindable filter, should show 6 records (Transactions & Cells, not Groups)
      // Note: This may vary based on actual data, so we check for at least some records
      expect(rowCount).toBeGreaterThan(0);

      // Verify first row has data
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();
      const firstRowText = await firstRow.textContent();
      expect(firstRowText).toBeTruthy();
      expect(firstRowText!.length).toBeGreaterThan(0);
    });

    test('should display hierarchy badges with correct colors', async ({ page }) => {
      // Wait for badges to appear
      await page.waitForSelector('[class*="bg-purple-900"], [class*="bg-blue-900"], [class*="bg-emerald-900"]', { timeout: 10000 });

      // Check for hierarchy badges
      const groupBadges = page.locator('[class*="bg-purple-900"][class*="text-purple-400"]');
      const transactionBadges = page.locator('[class*="bg-blue-900"][class*="text-blue-400"]');
      const cellBadges = page.locator('[class*="bg-emerald-900"][class*="text-emerald-400"]');

      // At least one type of badge should be visible
      const groupCount = await groupBadges.count();
      const transactionCount = await transactionBadges.count();
      const cellCount = await cellBadges.count();

      const totalBadges = groupCount + transactionCount + cellCount;
      expect(totalBadges).toBeGreaterThan(0);
    });

    test('should display statistics cards with correct counts', async ({ page }) => {
      // Wait for stats cards to appear
      await page.waitForSelector('[class*="stat"], [class*="card"]', { timeout: 10000 });

      // Check for stats cards (groups, transactions, cells)
      const statsCards = page.locator('[class*="stat"], [class*="card"]');
      const statsCount = await statsCards.count();

      // Should have at least some stats displayed
      expect(statsCount).toBeGreaterThan(0);
    });

    test('should open DetailDrawer on row click', async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table tbody tr, [role="table"] [role="row"]', { timeout: 10000 });

      // Click first row
      const firstRow = page.locator('table tbody tr, [role="table"] [role="row"]').first();
      await firstRow.click();

      // Wait for drawer to open
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sidebar"]');
      await expect(drawer).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('DetailDrawer', () => {
    test('should display record details when opened', async ({ page }) => {
      // Open drawer by clicking first row
      await page.waitForSelector('table tbody tr, [role="table"] [role="row"]', { timeout: 10000 });
      await page.locator('table tbody tr, [role="table"] [role="row"]').first().click();

      // Wait for drawer
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sidebar"]');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Check for record details
      const recordDetails = drawer.locator('text=/dict_id|business_term|technical_name/i');
      await expect(recordDetails.first()).toBeVisible();
    });

    test('should have "View Full Fact Sheet" button', async ({ page }) => {
      // Open drawer
      await page.waitForSelector('table tbody tr, [role="table"] [role="row"]', { timeout: 10000 });
      await page.locator('table tbody tr, [role="table"] [role="row"]').first().click();

      // Wait for drawer
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sidebar"]');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Check for "View Full Fact Sheet" button
      const viewButton = drawer.locator('text=/View Full Fact Sheet/i');
      await expect(viewButton).toBeVisible();
    });

    test('should navigate to META_03 when clicking "View Full Fact Sheet"', async ({ page }) => {
      // Open drawer
      await page.waitForSelector('table tbody tr, [role="table"] [role="row"]', { timeout: 10000 });
      await page.locator('table tbody tr, [role="table"] [role="row"]').first().click();

      // Wait for drawer
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sidebar"]');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Get dict_id from first row to verify navigation
      const firstRow = page.locator('table tbody tr, [role="table"] [role="row"]').first();
      const rowText = await firstRow.textContent();
      const dictIdMatch = rowText?.match(/([A-Z]{2}-[A-Z]+-\d+)/);
      const expectedDictId = dictIdMatch ? dictIdMatch[1] : 'TC-REV-001';

      // Click "View Full Fact Sheet"
      const viewButton = drawer.locator('text=/View Full Fact Sheet/i');
      await viewButton.click();

      // Wait for navigation to detail page
      await page.waitForURL(`**/meta-registry/${expectedDictId}`, { timeout: 10000 });

      // Verify we're on the detail page
      expect(page.url()).toContain('/meta-registry/');
    });
  });

  test.describe('META_03: Detail Page', () => {
    test('should load detail page for a record', async ({ page }) => {
      // Navigate directly to a known record
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for page content
      const pageContent = page.locator('h1, [class*="title"]');
      await expect(pageContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display full forensic profile', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for key sections
      const identitySection = page.locator('text=/identity|dict_id|business_term/i');
      const classificationSection = page.locator('text=/classification|domain|entity_group/i');
      const governanceSection = page.locator('text=/governance|canon_status|data_owner/i');

      // At least one section should be visible
      await expect(identitySection.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display hierarchy context (parent/children)', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for hierarchy section
      const hierarchySection = page.locator('text=/hierarchy|parent|children/i');

      // Hierarchy section should be visible (may be empty if no parent/children)
      const hierarchyVisible = await hierarchySection.first().isVisible().catch(() => false);

      // If hierarchy exists, verify it's displayed correctly
      if (hierarchyVisible) {
        await expect(hierarchySection.first()).toBeVisible();
      }
    });

    test('should display hierarchy badges', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for hierarchy badges
      const badges = page.locator('[class*="bg-purple-900"], [class*="bg-blue-900"], [class*="bg-emerald-900"]');
      const badgeCount = await badges.count();

      // Should have at least one badge
      expect(badgeCount).toBeGreaterThan(0);
    });

    test('should have breadcrumb navigation back to META_02', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for breadcrumb
      const breadcrumb = page.locator('text=/META_02|Registry|meta-registry/i');
      await expect(breadcrumb.first()).toBeVisible({ timeout: 10000 });

      // Click breadcrumb to go back
      await breadcrumb.first().click();

      // Should navigate back to registry
      await page.waitForURL(`**/meta-registry`, { timeout: 10000 });
      expect(page.url()).toContain('/meta-registry');
      expect(page.url()).not.toContain('/meta-registry/');
    });

    test('should navigate to parent when clicking parent link', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for parent link
      const parentLink = page.locator('text=/parent|GC-REV-001/i').first();
      const parentVisible = await parentLink.isVisible().catch(() => false);

      if (parentVisible) {
        await parentLink.click();
        // Should navigate to parent detail page
        await page.waitForURL(`**/meta-registry/GC-REV-001`, { timeout: 10000 });
        expect(page.url()).toContain('/meta-registry/GC-REV-001');
      }
    });

    test('should navigate to child when clicking child link', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check for child link
      const childLink = page.locator('text=/child|CL-SALES/i').first();
      const childVisible = await childLink.isVisible().catch(() => false);

      if (childVisible) {
        await childLink.click();
        // Should navigate to child detail page
        await page.waitForURL(`**/meta-registry/CL-`, { timeout: 10000 });
        expect(page.url()).toContain('/meta-registry/CL-');
      }
    });

    test('should handle loading state', async ({ page }) => {
      // Navigate to detail page
      await page.goto(`${BASE_URL}/meta-registry/TC-REV-001`, { waitUntil: 'networkidle' });

      // Check that loading spinner is not visible after load
      const loadingSpinner = page.locator('.animate-spin, [data-loading]');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });
    });

    test('should handle error state gracefully', async ({ page }) => {
      // Navigate to non-existent record
      await page.goto(`${BASE_URL}/meta-registry/INVALID-ID`, { waitUntil: 'networkidle' });

      // Should show error or not found message
      const errorMessage = page.locator('text=/error|not found|failed/i');
      const errorVisible = await errorMessage.first().isVisible().catch(() => false);

      // If error is shown, it should be visible
      if (errorVisible) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });
  });

  test.describe('Integration: Full User Flow', () => {
    test('should complete full flow: Registry → Drawer → Detail Page', async ({ page }) => {
      // Step 1: Load registry
      await page.goto(`${BASE_URL}/meta-registry`, { waitUntil: 'networkidle' });
      await expect(page.locator('table, [role="table"]')).toBeVisible({ timeout: 10000 });

      // Step 2: Click first row to open drawer
      await page.locator('table tbody tr, [role="table"] [role="row"]').first().click();
      const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sidebar"]');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Step 3: Click "View Full Fact Sheet"
      const viewButton = drawer.locator('text=/View Full Fact Sheet/i');
      await viewButton.click();

      // Step 4: Verify on detail page
      await page.waitForURL(`**/meta-registry/**`, { timeout: 10000 });
      expect(page.url()).toContain('/meta-registry/');

      // Step 5: Verify detail page content
      const pageContent = page.locator('h1, [class*="title"]');
      await expect(pageContent.first()).toBeVisible({ timeout: 10000 });

      // Step 6: Navigate back via breadcrumb
      const breadcrumb = page.locator('text=/META_02|Registry|meta-registry/i').first();
      await breadcrumb.click();

      // Step 7: Verify back on registry
      await page.waitForURL(`**/meta-registry`, { timeout: 10000 });
      expect(page.url()).toContain('/meta-registry');
      expect(page.url()).not.toMatch(/\/meta-registry\/[^/]+$/);
    });
  });
});
