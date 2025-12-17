# Test MCP Setup - Preparation Summary

**Date:** 2025-01-27  
**Status:** ✅ **CONFIGURED**  
**Purpose:** Summary of Vitest and Playwright MCP server configuration

---

## ✅ Current Status

### MCP Servers Configured

1. **React Aria MCP** ✅ (Already configured)
   - Package: `@react-aria/mcp@latest`
   - Purpose: Accessibility documentation

2. **Vitest MCP** ✅ (Newly added)
   - Package: `@madrus/vitest-mcp-server` (v1.0.8)
   - Project Directory: `apps/web`
   - Features:
     - Health check tool
     - Test execution with structured output
     - Coverage analysis
     - Smart caching
     - Auto-discovery of Vitest config

3. **Playwright MCP** ✅ (Newly added)
   - Package: `@executeautomation/playwright-mcp-server`
   - Purpose: Browser automation for E2E testing
   - Features:
     - Browser context management
     - Multi-page support
     - DOM interaction
     - Screenshot and snapshot capabilities
     - Network monitoring

---

## 📋 Test Infrastructure

### Vitest Configuration

**Location:** `apps/web/vitest.config.ts`

```typescript
- Environment: jsdom (browser simulation)
- Globals: Enabled
- Setup: ./src/test/setup.ts
- Includes: **/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}
```

**Additional Config:** `apps/kernel/vitest.config.ts`
- Environment: node
- Test directory: `tests/**/*.{test,spec}.{ts,tsx}`

### Playwright Configuration

**Location:** `apps/web/playwright.config.ts`

```typescript
- Test Directory: ./e2e
- Base URL: http://localhost:3002
- Browsers: Chromium, Firefox, WebKit
- Retries: 2 (CI), 0 (local)
- Reporter: HTML
- Auto-start dev server: Yes
```

---

## 📦 Installed Packages

### Testing Dependencies

```json
{
  "vitest": "^4.0.15",
  "@vitest/browser-playwright": "^4.0.15",
  "@vitest/coverage-v8": "^4.0.15",
  "playwright": "^1.57.0",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "jsdom": "^27.3.0"
}
```

---

## 🎯 Available MCP Tools

### Vitest MCP Tools

1. **`vitest_health_check`**
   - Verify server connectivity
   - Check Vitest configuration

2. **`vitest_run_tests`**
   - Execute tests with patterns
   - Get structured test results
   - Example: "Run all tests in payment domain"

3. **`vitest_analyze_coverage`**
   - Generate coverage reports
   - Analyze coverage gaps
   - Example: "Show coverage for src/domain/payment/"

### Playwright MCP Tools

1. **Browser Management**
   - Navigate to URLs
   - Manage browser contexts
   - Handle multiple tabs/windows

2. **DOM Interaction**
   - Click elements
   - Type text
   - Fill forms
   - Select options
   - Hover and scroll

3. **Element Discovery**
   - Query by CSS, XPath, role, text
   - Playwright locators

4. **Snapshotting**
   - HTML content capture
   - Accessibility snapshots
   - Screenshots
   - PDF generation

5. **Advanced Features**
   - JavaScript evaluation
   - Network monitoring
   - Cookie/storage management
   - Custom headers

---

## 📁 Test Structure

### Unit/Integration Tests (Vitest)

```
apps/web/src/**/*.{test,spec}.{ts,tsx}
apps/kernel/tests/**/*.{test,spec}.{ts,tsx}
apps/canon/finance/**/__tests__/**/*.test.ts
```

**Found Test Files:**
- Payment execution tests (Audit, Concurrency, Immutability, Money, StateMachine, PeriodLock, SoD)
- Integration tests
- Marketing component tests
- Database tests (tenant isolation, tenant-db)

### E2E Tests (Playwright)

```
apps/web/e2e/**/*.spec.ts
```

**Found Test Files:**
- `phase3-meta-registry.spec.ts`

---

## 🚀 Next Steps

### 1. Restart Cursor IDE
   - Required to load new MCP servers
   - Check MCP server status in Cursor settings

### 2. Verify MCP Integration

**Test Vitest MCP:**
```bash
# In Cursor, try:
"Run Vitest health check"
"Run all tests in the payment domain"
"Show coverage for payment execution"
```

**Test Playwright MCP:**
```bash
# In Cursor, try:
"Navigate to http://localhost:3002"
"Take a screenshot of the homepage"
"Check accessibility of the payment page"
```

### 3. Run Tests Manually (Optional)

```bash
# Vitest
pnpm test:vitest          # Run tests in watch mode
pnpm test:ui              # Run with UI
pnpm test:coverage        # Run with coverage

# Playwright
npx playwright test       # Run E2E tests
npx playwright test --ui  # Run with UI
```

---

## 📚 Documentation References

- **Vitest MCP Guide:** `.staging-docs/E-Knowledge/E-REF/REF_081_VitestMCPComparison.md`
- **Vitest Verification:** `.staging-docs/E-Knowledge/E-REF/REF_082_VitestMCPVerification.md`
- **MCP Workflows:** `.cursor/rules/mcp-workflows.mdc`

---

## ✅ Configuration Complete

**MCP Configuration File:** `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "react-aria": { ... },
    "vitest": {
      "command": "npx",
      "args": ["-y", "@madrus/vitest-mcp-server"],
      "env": {
        "VITEST_PROJECT_DIR": "${workspaceFolder}/apps/web"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

---

## 🎉 Ready for Testing!

All MCP servers are configured and ready to use. After restarting Cursor, you can:

1. ✅ Run Vitest tests via MCP
2. ✅ Analyze test coverage via MCP
3. ✅ Perform browser automation via Playwright MCP
4. ✅ Access React Aria documentation via MCP

**Status:** Ready for test+ workflow! 🚀
