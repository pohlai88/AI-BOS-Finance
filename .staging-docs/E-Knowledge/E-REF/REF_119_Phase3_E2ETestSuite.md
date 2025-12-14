# REF_119: Phase 3 E2E Test Suite

> **🟢 [STAGING]** — Phase 3 E2E Test Suite  
> **Date:** 2025-01-27  
> **Status:** ✅ **TEST SUITE CREATED**

---

## ✅ **E2E TEST SUITE CREATED**

### **Files Created:**
1. `apps/web/e2e/phase3-meta-registry.spec.ts` - Complete test suite (20+ test cases)
2. `apps/web/playwright.config.ts` - Playwright configuration
3. Updated `apps/web/package.json` - Added test scripts and `@playwright/test` dependency

---

## 📋 **TEST COVERAGE**

### **META_02: Registry Table Tests (6 tests)**
- ✅ Loads without error spinner
- ✅ Displays table with data
- ✅ Shows 6 records with bindable filter applied
- ✅ Displays hierarchy badges with correct colors
- ✅ Displays statistics cards with correct counts
- ✅ Opens DetailDrawer on row click

### **DetailDrawer Tests (3 tests)**
- ✅ Displays record details when opened
- ✅ Has "View Full Fact Sheet" button
- ✅ Navigates to META_03 when clicking button

### **META_03: Detail Page Tests (9 tests)**
- ✅ Loads detail page for a record
- ✅ Displays full forensic profile
- ✅ Displays hierarchy context (parent/children)
- ✅ Displays hierarchy badges
- ✅ Has breadcrumb navigation back to META_02
- ✅ Navigates to parent when clicking parent link
- ✅ Navigates to child when clicking child link
- ✅ Handles loading state
- ✅ Handles error state gracefully

### **Integration: Full User Flow (1 test)**
- ✅ Completes full flow: Registry → Drawer → Detail Page

**Total: 19 test cases covering all Phase 3 requirements**

---

## 🚀 **SETUP & RUNNING**

### **Step 1: Install Dependencies**

```bash
cd apps/web
pnpm install
```

### **Step 2: Install Playwright Browsers**

```bash
pnpm exec playwright install
```

### **Step 3: Prerequisites**
1. Kernel server running on `http://localhost:3001`
2. Next.js dev server running on `http://localhost:3002`
3. Database seeded with test data (10 records)

### **Step 4: Run Tests**

```bash
# Run all e2e tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e phase3-meta-registry

# Run specific test by name
pnpm test:e2e -g "should load without error spinner"
```

---

## 📊 **TEST STRUCTURE**

```
apps/web/
├── e2e/
│   └── phase3-meta-registry.spec.ts  # Phase 3 test suite (19 tests)
├── playwright.config.ts               # Playwright configuration
└── package.json                       # Test scripts + @playwright/test
```

---

## 🎯 **TEST SCENARIOS**

### **Scenario 1: Registry Table Verification**
1. Navigate to `/meta-registry`
2. Verify table loads without spinner
3. Verify table displays data
4. Verify hierarchy badges are visible
5. Verify stats cards are visible

### **Scenario 2: DetailDrawer Interaction**
1. Click row in registry table
2. Verify drawer opens
3. Verify record details displayed
4. Verify "View Full Fact Sheet" button exists

### **Scenario 3: Detail Page Navigation**
1. Click "View Full Fact Sheet" in drawer
2. Verify navigation to detail page
3. Verify detail page content loads
4. Verify hierarchy context displayed
5. Verify breadcrumb navigation works

### **Scenario 4: Full User Flow**
1. Load registry
2. Click row → open drawer
3. Click "View Full Fact Sheet" → navigate to detail
4. Click breadcrumb → navigate back to registry

---

## 🔧 **CONFIGURATION**

### **Environment Variables:**
- `NEXT_PUBLIC_APP_URL` - Frontend URL (default: `http://localhost:3002`)
- `KERNEL_URL` - Kernel API URL (default: `http://localhost:3001`)

### **Playwright Config:**
- **Test Directory:** `./e2e`
- **Base URL:** `http://localhost:3002`
- **Browsers:** Chromium, Firefox, WebKit
- **Retries:** 2 on CI, 0 locally
- **Screenshots:** On failure
- **Videos:** Retain on failure
- **Traces:** On first retry
- **Web Server:** Auto-starts Next.js dev server

---

## 📋 **TEST EXECUTION CHECKLIST**

- [ ] Install dependencies: `pnpm install`
- [ ] Install browsers: `pnpm exec playwright install`
- [ ] Kernel server running (`http://localhost:3001`)
- [ ] Next.js dev server running (`http://localhost:3002`) - or let Playwright start it
- [ ] Database seeded with test data
- [ ] Run `pnpm test:e2e` to execute tests
- [ ] Review test results
- [ ] Fix any failing tests
- [ ] Re-run tests to verify fixes

---

## ✅ **STATUS**

**Test Suite:** ✅ **CREATED** (19 test cases)  
**Configuration:** ✅ **COMPLETE**  
**Dependencies:** ✅ **ADDED TO PACKAGE.JSON**  
**Ready to Install & Run:** 🟡 **REQUIRES `pnpm install` AND `pnpm exec playwright install`**

---

**Last Updated:** 2025-01-27  
**Status:** ✅ **E2E Test Suite Created - Ready to Install & Execute**
