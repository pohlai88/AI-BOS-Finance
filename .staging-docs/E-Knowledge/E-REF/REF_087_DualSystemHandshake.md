# REF_087: Dual System Handshake - Making It Move

> **🟡 [STAGING]** — First Integration Test: Frontend ↔ Backend  
> **Date:** 2025-01-27  
> **Strategy:** Make the dual system "move" before scaling/refining UI  
> **Status:** ✅ Handshake Component Created

---

## 🎯 Strategy: "Make It Move" Before "Make It Pretty"

**Decision:** Focus on **Dual System Integration** before UI/UX refinement.

**Why:**
- Integration reveals data structure mismatches early
- Seeing real data flow is motivating
- UI polish is wasted if data structure changes
- "Moving" system proves architecture works

---

## ✅ Implementation: The Handshake Component

### Component Created: `BackendStatus.tsx`

**Location:** `apps/web/src/components/kernel/BackendStatus.tsx`

**Purpose:** Simple component that proves Site A (Frontend) can talk to Site B (Backend).

**Features:**
- ✅ Fetches from Kernel health endpoint (`/health`)
- ✅ Shows connection status (checking/connected/disconnected)
- ✅ Auto-refreshes every 5 seconds
- ✅ Visual indicators (spinner, checkmark, error icon)

**Code:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { checkKernelHealth } from '@/lib/kernel-client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export function BackendStatus() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    status: 'checking',
    message: 'Checking backend connection...',
  })

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await checkKernelHealth()
        setBackendStatus({
          status: 'connected',
          message: `Backend Online (${health.service})`,
          uptime: health.uptime,
        })
      } catch (error) {
        setBackendStatus({
          status: 'disconnected',
          message: error instanceof Error ? error.message : 'Backend unavailable',
        })
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface-card rounded-lg border border-border-default">
      {/* Status indicators */}
    </div>
  )
}
```

---

## 🔌 Integration Points

### 1. **Backend (Site B) - Kernel**
- **Port:** 3001
- **Health Endpoint:** `GET /health`
- **Status:** Starting (background process)

### 2. **Frontend (Site A) - Next.js**
- **Port:** 3000
- **Dashboard Route:** `/dashboard`
- **Component:** `BackendStatus` added to `MetadataGodView`

### 3. **Connection**
- **Client:** `kernel-client.ts` (already configured)
- **Environment:** `NEXT_PUBLIC_KERNEL_URL=http://localhost:3001`
- **Caching:** 60s default (Next.js fetch caching)

---

## 📊 Test Plan

### Step 1: Start Backend ✅
```bash
cd apps/kernel
npm run dev
# Should see: "✅ Kernel running on http://localhost:3001"
```

### Step 2: Verify Frontend ✅
```bash
cd apps/web
npm run dev
# Should see: "Ready on http://localhost:3000"
```

### Step 3: Test Handshake
1. Navigate to `http://localhost:3000/dashboard`
2. Look for `BackendStatus` component (top of page)
3. Should see:
   - ⏳ "Checking backend connection..." (initial)
   - ✅ "Backend Online (aibos-kernel)" (if connected)
   - ❌ "Backend unavailable" (if disconnected)

### Step 4: Verify Data Flow
- Open browser DevTools → Network tab
- Filter: `localhost:3001`
- Should see: `GET /health` request every 5 seconds
- Response: `{ "status": "healthy", "service": "aibos-kernel", "uptime": X }`

---

## 🎯 Next Steps (After Handshake Works)

### Phase 1: Simple Data Fetch
Replace one mock data source with real Kernel API:
- [ ] Fetch metadata fields from Kernel
- [ ] Display in dashboard table
- [ ] Verify data structure matches UI expectations

### Phase 2: Error Handling
- [ ] Handle Kernel disconnection gracefully
- [ ] Show retry button
- [ ] Cache last successful response

### Phase 3: Real Features
- [ ] Replace all mock data with Kernel API
- [ ] Add search functionality
- [ ] Add filtering from Kernel

---

## 🔍 Troubleshooting

### Backend Not Connecting
1. **Check Kernel is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check environment variable:**
   ```bash
   # In apps/web/.env.local or root .env.local
   NEXT_PUBLIC_KERNEL_URL=http://localhost:3001
   ```

3. **Check CORS:**
   - Kernel should allow `http://localhost:3000`
   - See `apps/kernel/src/index.ts` line 41-44

### Frontend Not Showing Status
1. **Check component imported:**
   - `apps/web/src/views/META_02_MetadataGodView.tsx`
   - Should import `BackendStatus`

2. **Check browser console:**
   - Look for fetch errors
   - Check Network tab for `/health` requests

---

## 📚 Related Documents

- [REF_086: Integration Test Report](./REF_086_IntegrationTestReport.md)
- [REF_082: Next.js Environment Audit](./REF_082_NextJsEnvironmentAudit.md)
- [DEVELOPER_HANDOFF.md](../../../DEVELOPER_HANDOFF.md)

---

## ✅ Success Criteria

**The handshake is successful when:**
- [x] BackendStatus component created
- [x] Component added to dashboard
- [ ] Backend starts successfully
- [ ] Frontend shows "Backend Online" status
- [ ] Network tab shows successful `/health` requests
- [ ] Status updates every 5 seconds

---

**Last Updated:** 2025-01-27  
**Status:** ✅ Component Created - Testing Connection
