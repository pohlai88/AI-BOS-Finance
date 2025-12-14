# REF_081: Vitest MCP Server Comparison & Setup Guide

**Date:** 2025-01-27  
**Status:** 🟢 **ACTIVE**  
**Related:** MCP Workflows, Testing Strategy  
**Purpose:** Comparison and setup guide for Vitest MCP servers

---

## 🎯 Available Vitest MCP Servers

Two production-ready Vitest MCP servers are available on npm:

### 1. **@madrus/vitest-mcp-server** (Recommended)

**Version:** 1.0.8 (Latest)  
**Published:** 6 months ago  
**Size:** 82.2 kB (optimized)  
**Dependencies:** `@modelcontextprotocol/sdk ^1.12.1`, `vitest >=3.0.0`

**Features:**
- ✅ **Health Check Tool** - Verifies server connectivity
- ✅ **Test Execution Tool** - Runs Vitest tests with comprehensive results
- ✅ **Coverage Analysis Tool** - Generates detailed coverage reports
- ✅ **Intelligent Resources** - Access to test results and coverage data
- ✅ **Smart Caching** - Automatically caches results
- ✅ **Auto-Discovery** - Automatically detects Vitest configuration
- ✅ **Robust Execution** - Fixed JSON parsing, reliable execution

**NPM Package:** https://www.npmjs.com/package/@madrus/vitest-mcp-server  
**GitHub:** https://github.com/madrus/vitest-mcp-server

---

### 2. **@djankies/vitest-mcp**

**Version:** 0.5.1 (Latest)  
**Published:** 4 months ago  
**Size:** 384.7 kB  
**Dependencies:** `@modelcontextprotocol/sdk ^1.17.1`

**Features:**
- ✅ **Structured Output** - Organized test results
- ✅ **Log Capturing** - Captures console outputs during tests
- ✅ **Coverage Analysis** - Integrates with `@vitest/coverage-v8`
- ✅ **Project Root Management** - `set_project_root` tool
- ✅ **Test Listing** - `list_tests` tool
- ✅ **Test Execution** - `run_tests` tool with structured output

**NPM Package:** https://www.npmjs.com/package/@djankies/vitest-mcp  
**GitHub:** https://github.com/djankies/vitest-mcp

---

## 📊 Comparison

| Feature | @madrus/vitest-mcp-server | @djankies/vitest-mcp |
|---------|---------------------------|----------------------|
| **Latest Version** | 1.0.8 | 0.5.1 |
| **Package Size** | 82.2 kB (smaller) | 384.7 kB |
| **Auto-Discovery** | ✅ Yes | ⚠️ Manual setup |
| **Health Check** | ✅ Yes | ❌ No |
| **Coverage Analysis** | ✅ Yes | ✅ Yes |
| **Smart Caching** | ✅ Yes | ❌ No |
| **Structured Output** | ✅ Yes | ✅ Yes |
| **Log Capturing** | ✅ Yes | ✅ Yes |
| **MCP SDK Version** | ^1.12.1 | ^1.17.1 (newer) |
| **Maintenance** | Active (6 months) | Active (4 months) |

**Recommendation:** Use **@madrus/vitest-mcp-server** for:
- Better optimization (smaller size)
- Auto-discovery features
- Health check capabilities
- Smart caching

---

## 🚀 Setup Instructions

### Option 1: @madrus/vitest-mcp-server (Recommended)

#### Installation

```bash
# No installation needed - use npx
# Or install globally:
npm install -g @madrus/vitest-mcp-server
```

#### Configuration for Cursor/VS Code

Add to your MCP configuration (`.cursor/mcp.json` or `.vscode/settings.json`):

```json
{
  "mcpServers": {
    "vitest": {
      "command": "npx",
      "args": ["-y", "@madrus/vitest-mcp-server"],
      "env": {
        "VITEST_PROJECT_DIR": "${workspaceFolder}"
      }
    }
  }
}
```

#### Environment Variables

- `VITEST_PROJECT_DIR` - **Highly recommended** - Specifies project directory (MCP servers run in isolated processes)
- `NODE_ENV` - Automatically set to `test` during execution

#### Available Tools

1. **Health Check** - `vitest_health_check`
2. **Run Tests** - `vitest_run_tests`
3. **Coverage Analysis** - `vitest_analyze_coverage`

---

### Option 2: @djankies/vitest-mcp

#### Installation

```bash
# No installation needed - use npx
# Or install globally:
npm install -g @djankies/vitest-mcp
```

#### Configuration for Cursor/VS Code

Add to your MCP configuration:

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

#### Available Tools

1. **Set Project Root** - `set_project_root`
2. **List Tests** - `list_tests`
3. **Run Tests** - `run_tests`
4. **Analyze Coverage** - `analyze_coverage`

---

## 🔧 Integration with Current Project

### Current Vitest Setup

Your project already has:
- ✅ Vitest 4.0.15 installed
- ✅ `vitest.config.ts` configured
- ✅ Test scripts in `package.json`
- ✅ Coverage support (`@vitest/coverage-v8`)

### Recommended Configuration

**For Cursor IDE:**

Create or update `.cursor/mcp.json`:

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

**Note:** Since you're using a monorepo structure, set `VITEST_PROJECT_DIR` to the specific app directory (`apps/web`) where your `vitest.config.ts` is located.

---

## 📝 Usage Examples

### With @madrus/vitest-mcp-server

```typescript
// AI can now:
// 1. Check Vitest server health
// 2. Run tests: "Run all tests in the payment domain"
// 3. Analyze coverage: "Show coverage for src/domain/payment/"
// 4. Get test results as resources
```

### With @djankies/vitest-mcp

```typescript
// AI can now:
// 1. Set project root
// 2. List all test files
// 3. Run specific tests: "Run tests for Payment entity"
// 4. Analyze coverage with gap insights
```

---

## ✅ Verification Steps

### 1. Test Server Availability

```bash
# Test @madrus/vitest-mcp-server
npx -y @madrus/vitest-mcp-server --help

# Test @djankies/vitest-mcp
npx -y @djankies/vitest-mcp --help
```

### 2. Verify in Cursor

After adding to MCP configuration:
1. Restart Cursor
2. Check MCP server status in Cursor settings
3. Try asking: "Run the Vitest tests for the payment domain"

---

## 🎯 Recommendation

**Use `@madrus/vitest-mcp-server`** because:
1. ✅ Smaller package size (82.2 kB vs 384.7 kB)
2. ✅ Auto-discovery of Vitest config
3. ✅ Health check tool
4. ✅ Smart caching
5. ✅ More mature (v1.0.8 vs v0.5.1)

---

## 📚 Additional Resources

- **MCP Testing Kit:** https://github.com/thoughtspot/mcp-testing-kit
- **expect-mcp:** Custom matchers for Vitest/Jest testing MCP tools
- **Vitest Docs:** https://vitest.dev/

---

**End of Guide**
