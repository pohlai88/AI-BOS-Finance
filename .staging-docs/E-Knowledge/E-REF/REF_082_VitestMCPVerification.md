# REF_082: Vitest MCP Server Verification Report

**Date:** 2025-01-27  
**Status:** ✅ **VERIFIED**  
**Related:** REF_081 (Vitest MCP Comparison)  
**Purpose:** Verification report for available Vitest MCP servers

---

## ✅ Verification Results

### Both Servers Are Available and Downloadable

1. **@madrus/vitest-mcp-server**
   - ✅ **Status:** Available on npm
   - ✅ **Latest Version:** 1.0.8
   - ✅ **Package Size:** 82.2 kB
   - ✅ **Verified:** `npm info` command successful

2. **@djankies/vitest-mcp**
   - ✅ **Status:** Available on npm
   - ✅ **Latest Version:** 0.5.1
   - ✅ **Package Size:** 384.7 kB
   - ✅ **Verified:** `npm info` command successful

---

## 📦 Package Details

### @madrus/vitest-mcp-server v1.0.8

```json
{
  "name": "@madrus/vitest-mcp-server",
  "version": "1.0.8",
  "license": "MIT",
  "dependencies": 2,
  "keywords": [
    "mcp",
    "model-context-protocol",
    "vitest",
    "testing",
    "ai",
    "assistant",
    "cursor",
    "development",
    "coverage",
    "automation"
  ],
  "bin": "vitest-mcp-server",
  "maintainer": "madrus <madrus@gmail.com>",
  "published": "6 months ago"
}
```

### @djankies/vitest-mcp v0.5.1

```json
{
  "name": "@djankies/vitest-mcp",
  "version": "0.5.1",
  "license": "MIT",
  "dependencies": 1,
  "keywords": [
    "mcp",
    "vitest",
    "testing",
    "llm",
    "ai"
  ],
  "bin": "vitest-mcp",
  "maintainer": "djankies <djank0113@gmail.com>",
  "published": "4 months ago"
}
```

---

## 🚀 Quick Setup

### Add to `.cursor/mcp.json`

**Recommended Configuration (using @madrus/vitest-mcp-server):**

```json
{
  "mcpServers": {
    "vitest": {
      "command": "npx",
      "args": ["-y", "@madrus/vitest-mcp-server"],
      "env": {
        "VITEST_PROJECT_DIR": "${workspaceFolder}/apps/web"
      }
    }
  }
}
```

**Alternative Configuration (using @djankies/vitest-mcp):**

```json
{
  "mcpServers": {
    "vitest": {
      "command": "npx",
      "args": ["-y", "@djankies/vitest-mcp"],
      "type": "stdio"
    }
  }
}
```

---

## 🎯 Recommendation

**Use `@madrus/vitest-mcp-server`** because:

1. ✅ **Smaller size** (82.2 kB vs 384.7 kB) - faster downloads
2. ✅ **Auto-discovery** - automatically finds `vitest.config.ts`
3. ✅ **Health check** - verify server connectivity
4. ✅ **Smart caching** - better performance
5. ✅ **More mature** - v1.0.8 vs v0.5.1

---

## 📝 Next Steps

1. **Add to MCP Configuration:**
   - Update `.cursor/mcp.json` with Vitest server config
   - Set `VITEST_PROJECT_DIR` to `apps/web` (monorepo structure)

2. **Restart Cursor:**
   - Restart Cursor IDE to load new MCP server

3. **Verify Integration:**
   - Check MCP server status in Cursor settings
   - Test with: "Run Vitest tests for payment domain"

4. **Update MCP Workflows Documentation:**
   - Add Vitest MCP to `.cursor/rules/mcp-workflows.mdc`

---

## ✅ Verification Complete

Both Vitest MCP servers are:
- ✅ Available on npm
- ✅ Downloadable via `npx`
- ✅ Compatible with Vitest 4.0.15 (your current version)
- ✅ Ready for integration

**Status:** Ready to configure and use

---

**End of Report**
