# REF_092: pnpm Server Startup & Environment Setup

> **🟡 [STAGING]** — Server Startup Instructions After pnpm Migration  
> **Date:** 2025-01-27  
> **Status:** ⚠️ Requires Environment Configuration

---

## ✅ pnpm Migration Complete

- ✅ All dependencies installed (1,240 packages)
- ✅ Workspace packages linked correctly
- ✅ `pnpm-lock.yaml` created
- ✅ Port conflicts resolved

---

## ⚠️ Required: Environment Configuration

### Step 1: Create `.env.local` File

Create `.env.local` in the **project root** (`C:\AI-BOS\AI-BOS-Finance\.env.local`):

```env
# Database Configuration (Required for Kernel)
DATABASE_URL=postgresql://localhost:5432/aibos_finance?user=postgres&password=postgres

# Kernel API URL (for frontend)
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001

# Node Environment
NODE_ENV=development

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

**Important:** Update `DATABASE_URL` with your actual Postgres connection string.

**Options for DATABASE_URL:**
1. **Local Postgres:** `postgresql://user:password@localhost:5432/dbname`
2. **Supabase:** `postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres`
3. **Docker:** `postgresql://postgres:postgres@localhost:5432/aibos_finance`

---

## 🚀 Starting Servers

### Option 1: Start Both Servers (Recommended)

**Terminal 1 - Frontend:**
```powershell
cd C:\AI-BOS\AI-BOS-Finance
pnpm --filter @aibos/web dev
```

**Terminal 2 - Backend:**
```powershell
cd C:\AI-BOS\AI-BOS-Finance
pnpm --filter @aibos/kernel dev
```

### Option 2: Use Turbo (if configured)

```powershell
cd C:\AI-BOS\AI-BOS-Finance
pnpm dev
```

---

## 🔍 Verification

### 1. Check Frontend (Next.js)
- **URL:** http://localhost:3000
- **Expected:** Next.js dev server running
- **MCP Tools:** Available on port 3000 (Next.js 16+)

### 2. Check Backend (Kernel)
- **Health Endpoint:** http://localhost:3001/health
- **Expected Response:**
  ```json
  {
    "status": "ok",
    "service": "aibos-kernel",
    "version": "0.0.0"
  }
  ```

### 3. Test Ping-Pong Connection
- **URL:** http://localhost:3000/dashboard
- **Expected:** Green status box showing "Connected to Kernel"

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Solution:**
```powershell
# Kill processes on ports
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force

# Remove Next.js lock file
Remove-Item apps\web\.next\dev\lock -ErrorAction SilentlyContinue
```

### Issue: DATABASE_URL Missing

**Error:**
```
Error: DATABASE_URL environment variable is required
```

**Solution:**
1. Create `.env.local` in project root
2. Add `DATABASE_URL=your_connection_string`
3. Restart Kernel server

### Issue: Module Not Found

**Solution:**
```powershell
# Reinstall dependencies
pnpm install
```

### Issue: Workspace Package Not Found

**Solution:**
```powershell
# Verify workspace configuration
pnpm list --depth=0

# Should show:
# - @aibos/web
# - @aibos/kernel
# - @aibos/schemas
# - @aibos/canon
```

---

## 📊 Server Status Check

### Quick Health Check Script

```powershell
# Check Next.js
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3
    Write-Host "✅ Next.js: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Next.js: Not running" -ForegroundColor Red
}

# Check Kernel
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 3
    Write-Host "✅ Kernel: Running - $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "❌ Kernel: Not running" -ForegroundColor Red
}
```

---

## 📚 Related Documents

- [REF_081: Dependency Analysis](./REF_081_DependencyAnalysis.md)
- [REF_089: pnpm Migration Guide](./REF_089_pnpmMigrationGuide.md)
- [REF_091: pnpm Migration Complete](./REF_091_pnpmMigrationComplete.md)

---

## ✅ Next Steps

1. **Create `.env.local`** with your `DATABASE_URL`
2. **Start Frontend:** `pnpm --filter @aibos/web dev`
3. **Start Backend:** `pnpm --filter @aibos/kernel dev`
4. **Test Connection:** Open http://localhost:3000/dashboard
5. **Verify Ping-Pong:** Should show green "Connected" status

---

**Last Updated:** 2025-01-27  
**Status:** ⚠️ Waiting for `.env.local` configuration
