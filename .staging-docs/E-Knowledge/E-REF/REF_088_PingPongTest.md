# REF_088: Ping-Pong Connection Test

> **🟡 [STAGING]** — Simple Dual System Test  
> **Date:** 2025-01-27  
> **Purpose:** Verify Frontend ↔ Backend connection  
> **Status:** ✅ Test Page Ready

---

## 🎯 The Ping-Pong Test

**Simple test to make the dual system "move"** - proves Site A can talk to Site B.

---

## ✅ Implementation Complete

### Dashboard Page Updated
**File:** `apps/web/app/dashboard/page.tsx`

**Features:**
- ✅ Fetches from Kernel `/health` endpoint
- ✅ Shows connection status (Green/Red/Neutral)
- ✅ Displays backend response JSON
- ✅ Retry button for manual testing
- ✅ Uses existing Kernel URL configuration

**Backend Target:**
- **URL:** `http://localhost:3001` (Kernel backend)
- **Endpoint:** `/health`
- **Expected Response:** `{ "status": "healthy", "service": "aibos-kernel", "uptime": X }`

---

## 🧪 How to Test

### Step 1: Start Backend (Site B)
```bash
cd apps/kernel
npm run dev
```

**Expected Output:**
```
🚀 AIBOS Kernel starting on http://localhost:3001
✅ Kernel running on http://localhost:3001
```

### Step 2: Start Frontend (Site A)
```bash
cd apps/web
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.0.8
- Local:        http://localhost:3000
✓ Ready in X.Xs
```

### Step 3: Open Dashboard
Navigate to: **http://localhost:3000/dashboard**

### Step 4: Check Result

**✅ Green Box = SUCCESS**
```
✅ Success! Backend says: {
  "status": "healthy",
  "service": "aibos-kernel",
  "uptime": 123.45
}
```

**❌ Red Box = FAILURE**
```
❌ Connection Failed. Is the Kernel backend running on port 3001?
Error: Failed to fetch
```

---

## 🔍 Troubleshooting

### Red Box Appears

**1. Check Kernel is Running:**
```bash
# Test directly
curl http://localhost:3001/health

# Or in PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

**2. Check Environment Variable:**
```bash
# Should be in root .env.local or apps/web/.env.local
NEXT_PUBLIC_KERNEL_URL=http://localhost:3001
```

**3. Check CORS:**
- Kernel already configured for `http://localhost:3000`
- See `apps/kernel/src/index.ts` lines 41-44

**4. Check Ports:**
- Frontend: Port 3000 ✅
- Backend: Port 3001 ✅
- No conflicts

---

## 📊 What This Proves

✅ **Frontend can make HTTP requests**  
✅ **Backend is responding**  
✅ **CORS is configured correctly**  
✅ **Environment variables work**  
✅ **Dual system is "moving"**

---

## 🎯 Next Steps (After Green Box)

Once you see the **Green Box**, you've proven:
1. ✅ Frontend ↔ Backend connection works
2. ✅ Data can flow between systems
3. ✅ Architecture is sound

**Then:**
1. Replace mock data with real Kernel API calls
2. Build actual features (search, CRUD, etc.)
3. Add error handling and retry logic

---

## 🔄 Restore Full Dashboard

After testing, you can restore the full `MetadataGodView`:

```typescript
// apps/web/app/dashboard/page.tsx
import { MetadataGodView } from '@/views/META_02_MetadataGodView'

export default function DashboardPage() {
  return <MetadataGodView />
}
```

Or keep the ping-pong test and add `BackendStatus` component to the full view (already done).

---

**Last Updated:** 2025-01-27  
**Status:** ✅ Test Page Ready - Awaiting Backend Connection
