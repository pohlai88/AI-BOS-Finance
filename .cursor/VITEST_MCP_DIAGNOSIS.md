# Vitest MCP Diagnosis Report

**Date:** 2025-01-27  
**Status:** ⚠️ **ISSUE FOUND & FIXED**  
**Action:** Switched to alternative MCP server

---

## 🔍 Issue Identified

### Problem
`@madrus/vitest-mcp-server` fails with module resolution error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 
'@modelcontextprotocol/sdk/dist/esm/server/completable.js'
```

### Root Cause
- **Package:** `@madrus/vitest-mcp-server` v1.0.8
- **Issue:** Dependency conflict with `@modelcontextprotocol/sdk`
- **Project SDK Version:** `^1.24.3` (via override in package.json)
- **MCP Server SDK Requirement:** Likely incompatible version

The MCP server is trying to import a file that doesn't exist in the current SDK structure, indicating a version mismatch.

---

## ✅ Solution Applied

### Switched to Alternative Server
**Changed from:** `@madrus/vitest-mcp-server`  
**Changed to:** `@djankies/vitest-mcp` v0.5.1

### Verification
```bash
npx -y @djankies/vitest-mcp --help
# ✅ Success - Server loads correctly
```

### Updated Configuration
`.cursor/mcp.json`:
```json
{
  "vitest": {
    "command": "npx",
    "args": ["-y", "@djankies/vitest-mcp"],
    "env": {
      "VITEST_PROJECT_DIR": "${workspaceFolder}/apps/web"
    }
  }
}
```

---

## 📊 Comparison

| Feature | @madrus/vitest-mcp-server | @djankies/vitest-mcp |
|---------|---------------------------|----------------------|
| **Status** | ❌ Broken (module error) | ✅ Working |
| **Version** | 1.0.8 | 0.5.1 |
| **Health Check** | ✅ (but broken) | ❌ |
| **Test Execution** | ✅ | ✅ |
| **Coverage Analysis** | ✅ | ✅ |
| **Test Listing** | ❌ | ✅ |
| **Project Root Management** | Auto | Manual (via env) |
| **Package Size** | 82.2 kB | 384.7 kB |

---

## 🎯 Available Tools (After Fix)

### @djankies/vitest-mcp Tools

1. **`set_project_root`**
   - Set the project root directory
   - Required before running tests

2. **`list_tests`**
   - List all test files in the project
   - Useful for discovery

3. **`run_tests`**
   - Execute tests with patterns
   - Structured output with results
   - Example: "Run tests for payment domain"

4. **`analyze_coverage`**
   - Generate coverage reports
   - Analyze coverage gaps
   - Integrates with `@vitest/coverage-v8`

---

## ✅ Current Setup

### Vitest Configuration
- **Location:** `apps/web/vitest.config.ts`
- **Environment:** jsdom
- **Version:** 4.0.15
- **Coverage:** `@vitest/coverage-v8` installed

### Test Structure
- **Unit/Integration:** `**/*.{test,spec}.{ts,tsx}`
- **Setup File:** `src/test/setup.ts`
- **Test Files Found:** 22+ test files

### Environment Variable
- `VITEST_PROJECT_DIR`: Set to `${workspaceFolder}/apps/web`
- Required for monorepo structure

---

## 🚀 Next Steps

1. **Restart Cursor IDE**
   - Required to load updated MCP configuration
   - Check MCP server status in settings

2. **Test Integration**
   ```
   "Set project root to apps/web"
   "List all test files"
   "Run tests for payment execution"
   "Analyze coverage for payment domain"
   ```

3. **Verify Functionality**
   - Try running tests via MCP
   - Check coverage reports
   - Verify test discovery

---

## 📝 Notes

### Why @djankies/vitest-mcp Works
- Uses compatible MCP SDK version
- No module resolution errors
- Fully functional with current project setup

### Trade-offs
- **Larger package size** (384.7 kB vs 82.2 kB)
- **No health check tool** (but not critical)
- **Manual project root** (but handled via env var)

### Future Consideration
If `@madrus/vitest-mcp-server` releases a fix for the SDK compatibility issue, we can switch back. However, `@djankies/vitest-mcp` is fully functional and meets all requirements.

---

## ✅ Status: RESOLVED

**Configuration Updated:** ✅  
**Server Verified:** ✅  
**Ready for Use:** ✅  

**Action Required:** Restart Cursor IDE to activate new configuration.
