# REF_093: Quick Start Without PostgreSQL

> **🟡 [STAGING]** — Starting Dual System Without Local PostgreSQL  
> **Date:** 2025-01-27  
> **Status:** Quick Start Guide

---

## 🎯 Goal: Get "Green Box" / Ping-Pong Working

**Current Situation:**
- ✅ pnpm migration complete
- ✅ All dependencies installed
- ❌ PostgreSQL not installed locally
- ✅ Kernel code ready (just needs DB connection)

---

## 🚀 Option 1: Quick Start with Placeholder (Recommended for Testing)

**For now, let's get the servers running and see if the health endpoint works without DB:**

### Step 1: Create `.env.local` (Placeholder)

Create `.env.local` in project root with:

```env
# --- DATABASE (Placeholder - will fail on DB ops but server might start) ---
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aibos_finance"

# --- API CONNECTION (The Bridge) ---
NEXT_PUBLIC_KERNEL_URL="http://localhost:3001"

# --- SYSTEM SETTINGS ---
NODE_ENV="development"
NEXT_PUBLIC_ENABLE_DEBUG="true"
```

**Note:** The Kernel will fail when trying to connect to DB, but the HTTP server might start enough for health checks.

### Step 2: Start Servers

**Terminal 1:**
```powershell
pnpm --filter @aibos/web dev
```

**Terminal 2:**
```powershell
pnpm --filter @aibos/kernel dev
```

**Expected:** Kernel might show DB connection error but HTTP server should start.

---

## 🐘 Option 2: Use Cloud PostgreSQL (Best for Real Development)

### Supabase (Free Tier - Recommended)

1. **Sign up:** https://supabase.com (free tier available)
2. **Create project:** Get connection string from Settings → Database
3. **Update `.env.local`:**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT].supabase.co:5432/postgres"
   ```

### Other Options:
- **Neon** (free tier): https://neon.tech
- **Railway** (free tier): https://railway.app
- **Docker Postgres** (local): `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

---

## 🔧 Option 3: Modify Kernel for SQLite (Future Enhancement)

**For now, Kernel uses PostgreSQL. To switch to SQLite:**

1. Install SQLite adapter: `pnpm add drizzle-orm better-sqlite3`
2. Modify `apps/kernel/src/db/index.ts` to use SQLite
3. Update connection string: `DATABASE_URL="file:./kernel.db"`

**Note:** This requires code changes. Not recommended for quick start.

---

## ✅ Verification Steps

### 1. Check Frontend
- **URL:** http://localhost:3000
- **Expected:** Next.js homepage loads

### 2. Check Backend Health
- **URL:** http://localhost:3001/health
- **Expected:** JSON response (even if DB fails, HTTP server should respond)

### 3. Test Ping-Pong
- **URL:** http://localhost:3000/dashboard
- **Expected:** 
  - ✅ **Green Box** = Success! Dual System connected
  - ⚠️ **Yellow/Red** = Connection issue (check Kernel logs)

---

## 🐛 Troubleshooting

### Kernel Fails to Start (DB Connection Error)

**If Kernel won't start at all due to DB:**

**Quick Fix:** Modify `apps/kernel/src/db/index.ts` temporarily:

```typescript
// Temporarily make DB optional for health checks
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️ DATABASE_URL not set - DB operations will fail');
  // Export a mock db for now
  export const db = null;
  export async function checkDatabaseHealth() {
    return { status: 'unhealthy', error: 'Database not configured' };
  }
} else {
  // ... existing code
}
```

**Better Fix:** Use cloud PostgreSQL (Option 2 above).

---

## 📊 Current Status

- ✅ **Frontend Ready:** Next.js configured, dependencies installed
- ✅ **Backend Ready:** Kernel code ready, just needs DB
- ⚠️ **Database:** Need to configure (PostgreSQL or cloud)

---

## 🎯 Recommended Path Forward

1. **For Quick Test:** Use Option 1 (placeholder), see if HTTP server starts
2. **For Real Development:** Use Option 2 (Supabase free tier) - 5 minutes setup
3. **For Production:** Use managed PostgreSQL (Supabase, Neon, etc.)

---

**Last Updated:** 2025-01-27  
**Status:** Ready to test with placeholder or cloud DB
