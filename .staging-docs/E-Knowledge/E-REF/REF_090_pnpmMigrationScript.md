# REF_090: pnpm Migration Script & Diagnostics

> **🟡 [STAGING]** — Automated pnpm Migration  
> **Date:** 2025-01-27  
> **Status:** Ready to Execute

---

## 🎯 Next.js MCP Diagnostics

### Current State:
- ✅ **Next.js Server:** Running on port 3000
- ✅ **Routes Detected:** 7 routes (all App Router)
- ⚠️ **Hydration Error:** ThreatRadar component (non-blocking, can fix later)
- ✅ **MCP Tools:** 6 tools available

### Issues Found:
1. **Hydration Mismatch** - ThreatRadar component (motion animations)
   - **Impact:** Low (doesn't break functionality)
   - **Fix:** Can address after pnpm migration

---

## 🚀 Quick Migration Script

### PowerShell Script (Windows)

```powershell
# pnpm-migrate.ps1
# Run from project root: C:\AI-BOS\AI-BOS-Finance

Write-Host "🔄 Starting pnpm Migration..." -ForegroundColor Cyan

# Step 1: Stop all processes
Write-Host "`n1. Stopping servers..." -ForegroundColor Yellow
# (Manual: Stop npm run dev processes)

# Step 2: Backup (optional)
Write-Host "`n2. Creating backup..." -ForegroundColor Yellow
git add .
git commit -m "chore: pre-pnpm migration checkpoint" -ErrorAction SilentlyContinue

# Step 3: Remove npm artifacts
Write-Host "`n3. Removing npm artifacts..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\*\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\*\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Step 4: Install with pnpm
Write-Host "`n4. Installing with pnpm..." -ForegroundColor Yellow
pnpm install

# Step 5: Verify
Write-Host "`n5. Verifying installation..." -ForegroundColor Yellow
pnpm list --depth=0

Write-Host "`n✅ Migration Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  - Start frontend: pnpm --filter @aibos/web dev"
Write-Host "  - Start backend: pnpm --filter @aibos/kernel dev"
```

---

## 📋 Manual Migration Steps

### Step 1: Stop Servers
```bash
# Stop all running npm processes (Ctrl+C in terminals)
```

### Step 2: Clean npm Artifacts
```powershell
cd C:\AI-BOS\AI-BOS-Finance

# Remove node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\kernel\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\schemas\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\canon\node_modules -ErrorAction SilentlyContinue

# Remove lock file
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

### Step 3: Install with pnpm
```powershell
pnpm install
```

**Expected:** ~2-3 minutes, installs all workspace dependencies

### Step 4: Verify
```powershell
# Check workspace packages
pnpm list --depth=0

# Should see:
# @aibos/web
# @aibos/kernel
# @aibos/schemas
# @aibos/canon
```

### Step 5: Test
```powershell
# Test web build
pnpm --filter @aibos/web build

# Test kernel build
pnpm --filter @aibos/kernel build
```

---

## 🔍 Next.js MCP Diagnostics Summary

### Server Status
- ✅ **Running:** Port 3000
- ✅ **MCP Enabled:** Yes (6 tools)
- ✅ **Routes:** 7 routes detected

### Errors Found
- ⚠️ **Hydration Error:** ThreatRadar component
  - **Location:** Landing page (motion animations)
  - **Severity:** Low (non-blocking)
  - **Fix:** Add `suppressHydrationWarning` or use `useEffect` for client-only rendering

### Recommendations
1. ✅ **Complete pnpm migration first**
2. ⏳ **Fix hydration error after migration** (low priority)
3. ✅ **Test ping-pong connection** (after Kernel starts)

---

## 🎯 Post-Migration Checklist

After `pnpm install` completes:

- [ ] `pnpm list --depth=0` shows all workspaces
- [ ] `pnpm --filter @aibos/web dev` starts Next.js
- [ ] `pnpm --filter @aibos/kernel dev` starts Kernel
- [ ] Dashboard ping-pong test shows green box
- [ ] No "module not found" errors
- [ ] Builds complete successfully

---

## 📚 Related Documents

- [REF_081: Dependency Analysis](./REF_081_DependencyAnalysis.md)
- [REF_089: pnpm Migration Guide](./REF_089_pnpmMigrationGuide.md)
- [REF_087: Dual System Handshake](./REF_087_DualSystemHandshake.md)

---

**Last Updated:** 2025-01-27  
**Status:** ✅ Ready to Execute - Run `pnpm install` when ready
