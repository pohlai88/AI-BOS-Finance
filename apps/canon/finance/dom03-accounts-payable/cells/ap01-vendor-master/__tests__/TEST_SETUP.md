# AP-01 Vendor Master - Test Setup Guide

> **Status:** ✅ Configured  
> **Test Framework:** Vitest (Browser + Node) + Playwright (E2E)  
> **Date:** 2025-12-16

---

## 📋 Test Structure

```
ap01-vendor-master/
├── vitest.config.ts                    # Vitest configuration (browser + node)
├── __tests__/
│   ├── setup.ts                        # Test setup and utilities
│   ├── VendorService.browser.test.ts   # Browser tests (Vitest + Playwright)
│   └── integration/
│       └── vendor-cell.integration.test.ts  # Integration tests (real DB)
└── e2e/ (in apps/web/)
    └── ap01-vendor-master.spec.ts      # E2E tests (Playwright)
```

---

## 🚀 Running Tests

### Unit Tests (Node Environment)

```bash
# Run all unit tests
pnpm test ap01-vendor-master

# Run with coverage
pnpm test:coverage ap01-vendor-master

# Run in watch mode
pnpm test:watch ap01-vendor-master
```

### Browser Tests (Vitest Browser Mode)

```bash
# Run browser tests
pnpm test:browser ap01-vendor-master

# Run with UI
pnpm test:ui ap01-vendor-master
```

### Integration Tests

```bash
# Ensure database is running
pnpm --filter @aibos/db db:up

# Run integration tests
pnpm test:integration ap01-vendor-master
```

### E2E Tests (Playwright)

```bash
# Ensure dev server is running
pnpm dev

# Run E2E tests
pnpm test:e2e ap01-vendor-master

# Run in headed mode
pnpm test:e2e:headed ap01-vendor-master

# Run specific test file
pnpm test:e2e apps/web/e2e/ap01-vendor-master.spec.ts
```

---

## 🔧 Configuration

### Vitest Configuration

**File:** `vitest.config.ts`

- **Browser Mode:** Enabled with Playwright provider
- **Environment:** Node for unit tests, Browser for DOM tests
- **Coverage:** V8 provider with text, JSON, and HTML reporters
- **Setup:** `__tests__/setup.ts` for global test configuration

### Playwright Configuration

**File:** `apps/web/playwright.config.ts`

- **Base URL:** `http://localhost:3002`
- **Browsers:** Chromium, Firefox, WebKit
- **Auto-start:** Dev server starts automatically
- **Retries:** 2 on CI, 0 locally

---

## 📦 Dependencies

### Required Packages

```json
{
  "vitest": "^4.0.15",
  "@vitest/browser-playwright": "^4.0.15",
  "@vitest/coverage-v8": "^4.0.15",
  "playwright": "^1.57.0",
  "pg": "^8.x"
}
```

---

## 🗄️ Database Setup

### Test Database

- **URL:** `postgresql://aibos:aibos_password@localhost:5433/aibos_local`
- **Port:** 5433 (Docker Compose)
- **Migrations:** Auto-run on test setup

### Required Tables

- `ap.vendors`
- `ap.vendor_bank_accounts`
- `kernel.audit_events`

---

## ✅ Test Coverage

### Unit Tests

- ✅ VendorService (CRUD operations)
- ✅ ApprovalService (SoD enforcement)
- ✅ BankAccountService (bank account management)
- ✅ VendorStateMachine (state transitions)
- ✅ Error handling

### Browser Tests

- ✅ DOM interactions
- ✅ Form validation
- ✅ State management in browser context

### Integration Tests

- ✅ Full vendor lifecycle (create → submit → approve)
- ✅ SoD enforcement (database constraints)
- ✅ Audit event creation
- ✅ Bank account management
- ✅ Database transactions

### E2E Tests

- ✅ Vendor list page
- ✅ Create vendor workflow
- ✅ View vendor details
- ✅ Submit vendor for approval
- ✅ Approve vendor
- ✅ Filter and search vendors
- ✅ SoD enforcement in UI

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Start database
pnpm --filter @aibos/db db:up

# Check connection
psql postgresql://aibos:aibos_password@localhost:5433/aibos_local -c "SELECT 1"
```

### Playwright Browser Issues

```bash
# Install browsers
pnpm exec playwright install

# Install specific browser
pnpm exec playwright install chromium
```

### Test Failures

1. **Check database is running:** `pnpm --filter @aibos/db db:up`
2. **Check migrations:** `pnpm --filter @aibos/db migrate`
3. **Clear test data:** Tests auto-cleanup, but manual cleanup:
   ```sql
   TRUNCATE ap.vendors, ap.vendor_bank_accounts, kernel.audit_events CASCADE;
   ```

---

## 📝 Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { VendorService } from '../VendorService';

describe('VendorService', () => {
  it('should create a vendor', async () => {
    // Test implementation
  });
});
```

### Browser Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('VendorService - Browser', () => {
  it('should validate form in browser', async () => {
    // Browser-specific test
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should create vendor via UI', async ({ page }) => {
  await page.goto('/vendors');
  // E2E test implementation
});
```

---

## 🔗 Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [AP-01 PRD](./PRD-ap01-vendor-master.md)
- [Architecture Review](./ARCHITECTURE-REVIEW.md)

---

**Last Updated:** 2025-12-16  
**Maintainer:** Finance Cell Team
