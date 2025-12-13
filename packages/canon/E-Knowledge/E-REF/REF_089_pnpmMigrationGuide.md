# REF_089: pnpm Migration Guide

> **🟡 [STAGING]** — Complete pnpm Migration Instructions  
> **Date:** 2025-01-27  
> **Status:** Ready for Migration

---

## 🎯 Migration Overview

**From:** npm workspaces  
**To:** pnpm workspaces  
**Reason:** Better dependency management, faster installs, disk space savings

---

## ✅ Pre-Migration Setup Complete

### Files Created:
- ✅ `pnpm-workspace.yaml` - Workspace configuration
- ✅ `.npmrc` - pnpm configuration (shamefully-hoist for Next.js compatibility)

### Files Updated:
- ✅ `package.json` - Removed `workspaces` field (pnpm uses `pnpm-workspace.yaml`)

---

## 📋 Migration Steps

### Step 1: Stop All Running Servers
```bash
# Stop Next.js dev server (Ctrl+C)
# Stop Kernel backend (Ctrl+C)
```

### Step 2: Backup Current State (Optional but Recommended)
```bash
cd C:\AI-BOS\AI-BOS-Finance
git add .
git commit -m "chore: pre-pnpm migration checkpoint"
```

### Step 3: Remove npm Artifacts
```bash
# Remove node_modules and lock files
Remove-Item -Recurse -Force node_modules, apps\*\node_modules, packages\*\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

### Step 4: Install with pnpm
```bash
# Install all dependencies
pnpm install
```

**Expected Output:**
```
Packages: +XXXX
++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXXX, reused XXXX, downloaded X, added XXXX
```

### Step 5: Verify Installation
```bash
# Check workspace packages
pnpm list --depth=0

# Check specific packages
pnpm list --depth=1 --filter @aibos/web
pnpm list --depth=1 --filter @aibos/kernel
```

### Step 6: Test Builds
```bash
# Test web app
pnpm --filter @aibos/web build

# Test kernel
pnpm --filter @aibos/kernel build
```

### Step 7: Start Dev Servers
```bash
# Terminal 1: Frontend
pnpm --filter @aibos/web dev

# Terminal 2: Backend
pnpm --filter @aibos/kernel dev

# Or use turbo (if configured)
pnpm dev
```

---

## 🔧 pnpm Configuration (.npmrc)

**Created:** `.npmrc` with optimal settings:

```ini
# Hoist all dependencies (Next.js compatibility)
shamefully-hoist=true

# Auto-install peer dependencies
auto-install-peers=true

# Don't fail on missing peer dependencies
strict-peer-dependencies=false
```

**Why `shamefully-hoist=true`?**
- Next.js expects flat node_modules structure
- Prevents "module not found" errors
- Trade-off: Larger node_modules, but compatible

---

## 📊 Workspace Structure

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Workspace Packages:**
- `@aibos/web` (apps/web)
- `@aibos/kernel` (apps/kernel)
- `@aibos/schemas` (packages/schemas)
- `@aibos/canon` (packages/canon)

---

## 🎯 pnpm Commands Reference

### Install Dependencies
```bash
pnpm install                    # Install all
pnpm add <package>              # Add to root
pnpm --filter @aibos/web add <package>  # Add to specific package
```

### Run Scripts
```bash
pnpm dev                       # Run dev in all packages (via turbo)
pnpm --filter @aibos/web dev   # Run dev in web only
pnpm --filter @aibos/kernel dev # Run dev in kernel only
```

### Build
```bash
pnpm build                     # Build all (via turbo)
pnpm --filter @aibos/web build
pnpm --filter @aibos/kernel build
```

### List Dependencies
```bash
pnpm list                      # List all
pnpm list --depth=1 --filter @aibos/web
```

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Cannot find module"
**Cause:** Dependencies not hoisted correctly  
**Fix:** Verify `.npmrc` has `shamefully-hoist=true`

### Issue 2: "Peer dependency missing"
**Cause:** Peer dependencies not auto-installed  
**Fix:** Verify `.npmrc` has `auto-install-peers=true`

### Issue 3: "Workspace not found"
**Cause:** `pnpm-workspace.yaml` not found  
**Fix:** Ensure file exists at root with correct paths

### Issue 4: "Port already in use"
**Cause:** Previous npm processes still running  
**Fix:** Kill processes or use different ports

---

## 🔍 Verification Checklist

After migration, verify:
- [ ] `pnpm install` completes without errors
- [ ] All workspace packages listed correctly
- [ ] `pnpm --filter @aibos/web dev` starts Next.js
- [ ] `pnpm --filter @aibos/kernel dev` starts Kernel
- [ ] Dashboard ping-pong test works (green box)
- [ ] No "module not found" errors
- [ ] Builds complete successfully

---

## 📚 References

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [pnpm Configuration](https://pnpm.io/npmrc)
- [Turborepo + pnpm](https://turbo.build/repo/docs/handbook/package-managers/pnpm)
- [REF_081: Dependency Analysis](./REF_081_DependencyAnalysis.md)

---

**Last Updated:** 2025-01-27  
**Status:** ✅ Ready to Execute Migration
