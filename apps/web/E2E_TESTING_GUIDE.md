# AP-01 E2E Testing Guide

> **Status:** ✅ Setup Complete | ⚠️ Manual Dev Server Required  
> **Date:** 2025-12-16

---

## ✅ What's Working

1. **Database:** ✅ Running in Docker (`aibos_db` on port 5433)
2. **Playwright Config:** ✅ Configured and ready
3. **E2E Tests:** ✅ 8 test scenarios defined
4. **Vitest Tests:** ✅ 12/12 passing (unit, browser, integration)

---

## ⚠️ Current Issue

Playwright's `webServer` auto-start is hanging. **Solution:** Start dev server manually.

---

## 🚀 How to Run E2E Tests

### Option 1: Manual Dev Server (Recommended)

**Terminal 1: Start Dev Server**
```bash
cd apps/web
pnpm dev
```

Wait for: `✓ Ready in X.Xs` message

**Terminal 2: Run Tests**
```bash
cd apps/web
npx playwright test e2e/ap01-vendor-master.spec.ts
```

### Option 2: Use Existing Dev Server

If you already have `pnpm dev` running:
```bash
cd apps/web
npx playwright test e2e/ap01-vendor-master.spec.ts
```

---

## 📊 Test Status Summary

### ✅ Vitest Tests (12/12 Passing)

- **Unit Tests:** 4/4 ✅
- **Browser Tests:** 3/3 ✅  
- **Integration Tests:** 5/5 ✅ (with Docker database)

### ⚠️ E2E Tests (8/8 Pending)

- **Status:** Tests configured, need dev server
- **Scenarios:** 8 E2E test cases ready

---

## 🐳 Docker Status

- **Database:** ✅ `aibos_db` running and healthy
- **Web App:** ⚠️ Docker build hanging (use local dev server instead)

---

## 🔧 Quick Commands

```bash
# Check database
docker ps --filter "name=aibos_db"

# Start dev server
cd apps/web && pnpm dev

# Run E2E tests (in another terminal)
cd apps/web && npx playwright test e2e/ap01-vendor-master.spec.ts

# Run with UI mode
npx playwright test e2e/ap01-vendor-master.spec.ts --ui

# View test report
npx playwright show-report
```

---

## 📝 Next Steps

1. **Start dev server manually** (recommended)
2. **Run E2E tests** once dev server is ready
3. **Review results** in Playwright HTML report

---

**Recommendation:** Use manual dev server approach for reliable E2E testing.
