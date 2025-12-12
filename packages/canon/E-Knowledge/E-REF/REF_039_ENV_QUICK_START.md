# Quick Start: Next.js Environment File Management

## 🎯 The Best Practice Approach (For Your Setup)

### **Hybrid Approach** - Root `.env.local` + App-Level Overrides

```
AI-BOS-Finance/
├── .env.local              # ✅ All MCP tokens + shared secrets (gitignored)
├── .env.example            # ✅ Template (committed)
├── apps/
│   ├── web/
│   │   ├── .env.local      # Optional: Web-specific overrides
│   │   └── .env.example    # Optional: Web template
│   └── kernel/
│       ├── .env.local      # Optional: Kernel-specific overrides
│       └── .env.example    # Optional: Kernel template
```

---

## ✅ Why This Works Best

### 1. **MCP Servers Need Root-Level Access**
- Your `.codeium/windsurf/mcp_config.json` references `${env:GITHUB_TOKEN}`
- MCP servers read from root `.env.local` automatically
- ✅ **Solution:** Put all MCP tokens in root `.env.local`

### 2. **Next.js Automatically Merges Files**
- Next.js loads root `.env.local` first
- Then merges `apps/web/.env.local` (if exists)
- Later files override earlier ones
- ✅ **Solution:** Use root for shared, app-level for overrides

### 3. **Type-Safe Validation**
- Your `apps/web/src/lib/env.ts` validates all variables
- Catches missing or invalid variables at startup
- ✅ **Solution:** Enhanced validation schema (already updated)

---

## 📋 Recommended File Structure

### Root `.env.local` (Gitignored - Your Secrets)
```bash
# MCP Tokens (required by Cursor IDE)
GITHUB_TOKEN=...
FIGMA_TOKEN=...
SUPABASE_TOKEN=...

# Shared Database
DATABASE_URL=...

# Next.js MCP DevTools
NEXT_MCP_WATCH=true
NEXT_MCP_TRACK_CHANGES=true
NEXT_MCP_LOG_UPDATES=true
```

### Root `.env.example` (Committed - Template)
```bash
# Same structure as .env.local but with placeholder values
GITHUB_TOKEN=your_github_token_here
FIGMA_TOKEN=your_figma_token_here
# ... etc
```

### `apps/web/.env.local` (Optional - Web Overrides)
```bash
# Only if you need web-specific overrides
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### `apps/kernel/.env.local` (Optional - Kernel Overrides)
```bash
# Only if you need kernel-specific overrides
PORT=3001
LOG_LEVEL=debug
```

---

## 🔑 Key Principles

### ✅ DO

1. **One Root `.env.local`** - All MCP tokens and shared secrets
2. **App-Level for Overrides** - Only when needed
3. **Validate with Zod** - Type-safe environment variables
4. **Use `.env.example`** - Templates for team members
5. **Prefix Variables** - `NEXT_PUBLIC_*` for client, app prefixes for isolation

### ❌ DON'T

1. **Don't Duplicate** - Avoid same variable in multiple files
2. **Don't Commit Secrets** - `.env.local` always gitignored
3. **Don't Mix Concerns** - Separate MCP, database, and app variables
4. **Don't Use `NEXT_PUBLIC_*` for Secrets** - These are exposed to browser

---

## 🚀 Quick Setup Steps

1. **Keep your current root `.env.local`** ✅ (Already done)
2. **Create root `.env.example`** - Copy `.env.local` and replace secrets with placeholders
3. **Optional: Create `apps/web/.env.example`** - For web-specific variables
4. **Optional: Create `apps/kernel/.env.example`** - For kernel-specific variables
5. **Use enhanced `apps/web/src/lib/env.ts`** ✅ (Already updated)

---

## 📚 Full Documentation

See `REF_039_NextJsEnvFileBestPractices.md` for complete guide.

---

**Last Updated:** 2025-01-27
