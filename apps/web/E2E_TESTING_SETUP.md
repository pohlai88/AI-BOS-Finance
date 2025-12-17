# E2E Testing Setup - Simplified Approach

> **Status:** ✅ Using Local Dev Server + Docker Database  
> **Date:** 2025-12-16

---

## 🎯 Recommended Approach

Instead of running the web app in Docker (which can be complex and slow), we use:

1. **Docker Database** - Already running (`aibos_db`)
2. **Local Dev Server** - Run `pnpm dev` locally
3. **Playwright Tests** - Run against local dev server

This is faster, easier to debug, and works reliably.

---

## 🚀 Quick Start

### Step 1: Ensure Database is Running

```bash
# Check if database is running
docker ps --filter "name=aibos_db"

# If not running, start it
cd apps/db
docker-compose up -d db
```

### Step 2: Start Dev Server

```bash
# Terminal 1: Start dev server
cd apps/web
pnpm dev
```

Wait for: `✓ Ready in X.Xs` message

### Step 3: Run E2E Tests

```bash
# Terminal 2: Run E2E tests
cd apps/web
npx playwright test e2e/ap01-vendor-master.spec.ts
```

---

## 📋 Alternative: Auto-Start Dev Server

Playwright can auto-start the dev server for you:

```bash
# This will start dev server automatically
npx playwright test e2e/ap01-vendor-master.spec.ts
```

The `webServer` config in `playwright.config.ts` handles this automatically.

---

## 🐳 Docker Approach (Optional)

If you want to use Docker for the web app (not recommended for development):

```bash
# Build and start web container
docker-compose -f docker-compose.e2e.yml up -d --build web

# Wait for it to be ready
docker logs -f aibos_web_e2e

# Run tests
npx playwright test e2e/ap01-vendor-master.spec.ts
```

**Note:** Docker build can be slow and may hang. The local dev server approach is recommended.

---

## ✅ Current Setup

- **Database:** ✅ Running in Docker (`aibos_db` on port 5433)
- **Dev Server:** ⚠️ Start manually with `pnpm dev`
- **Tests:** ✅ Ready to run with Playwright

---

## 🔧 Troubleshooting

### Dev Server Won't Start
```bash
# Check if port 3002 is in use
netstat -ano | findstr :3002

# Kill process if needed
taskkill /PID <PID> /F
```

### Database Connection Issues
```bash
# Verify database is accessible
docker exec aibos_db psql -U aibos -d aibos_local -c "SELECT 1"

# Check DATABASE_URL environment variable
echo $env:DATABASE_URL
```

### Tests Timeout
- Increase timeout in `playwright.config.ts`
- Check dev server logs for errors
- Verify database migrations are applied

---

## 📝 Environment Variables

Set these if needed:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://aibos:aibos_password@localhost:5433/aibos_local"
$env:NEXT_PUBLIC_APP_URL="http://localhost:3002"
```

---

**Recommended:** Use local dev server + Docker database for fastest E2E testing.
