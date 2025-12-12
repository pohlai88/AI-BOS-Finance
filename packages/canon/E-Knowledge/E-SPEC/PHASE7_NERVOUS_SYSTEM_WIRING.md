# Phase 7: The Nervous System - Connecting Skin to Brain

> **Status:** 🟢 **IN PROGRESS**  
> **Date:** 2025-01-27  
> **Purpose:** Wire the Frontend (apps/web) to the Kernel (apps/kernel) API

---

## 🎯 Objective

Replace mock data in the frontend with real API calls to the Kernel, establishing the "nervous system" that connects the UI (Skin) to the backend (Brain).

---

## ✅ Completed

### 1. Kernel API Client (`apps/web/src/lib/kernel-client.ts`)
- ✅ Type-safe client using shared types from `@aibos/schemas`
- ✅ All metadata endpoints implemented
- ✅ Lineage endpoints implemented
- ✅ Health check endpoints implemented
- ✅ Proper error handling and URL resolution

### 2. Field Context Hook (`apps/web/src/hooks/useFieldContext.ts`)
- ✅ React hook for fetching field context
- ✅ Loading and error states
- ✅ Refetch capability
- ✅ Ready for "Silent Killer" sidebar integration

---

## 📋 Remaining Tasks

### Task 1: Update Metadata Sidebar Components
**Files to Update:**
- `apps/web/src/components/metadata/CanonDetailPanel.tsx` (if it displays field context)
- Any sidebar components that show field metadata

**Implementation:**
```typescript
import { useFieldContext } from '@/hooks/useFieldContext';

function FieldContextSidebar({ dictId }: { dictId: string | null }) {
  const { data, isLoading, error } = useFieldContext({ dictId });
  
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;
  
  // Display field context: field, lineage_summary, ai_suggestions, quality_signals
}
```

### Task 2: Replace Mock Payment Data
**Files to Update:**
- `apps/web/src/modules/payment/PAY_01_PaymentHub.tsx`
- `apps/web/src/modules/payment/data/index.ts`

**Current State:**
- Uses `MOCK_PAYMENTS` from `./data`
- Needs to fetch from Kernel API (when payment endpoints are ready)

**Note:** Payment endpoints may not be implemented in Kernel yet. This task depends on Kernel API expansion.

### Task 3: Fix Hydration Warning
**File:** `apps/web/src/views/LandingPage.tsx`

**Potential Issues:**
- Server/client component mismatch
- Date/time rendering differences
- Random values generated on server vs client

**Solution:**
- Ensure all client-side only logic is in components with `'use client'`
- Use `useEffect` for browser-only code
- Check for `typeof window !== 'undefined'` where needed

---

## 🔌 API Integration Points

### Metadata Domain
```typescript
// Search fields
const results = await kernelClient.searchMetadataFields({
  q: 'invoice',
  domain: 'PAYMENT',
  limit: 20,
});

// Get field context (Silent Killer)
const context = await kernelClient.getFieldContext('DS-INV-001');

// Get entity context
const entity = await kernelClient.getEntityContext('INVOICE');
```

### Lineage Domain
```typescript
// Get lineage graph
const graph = await kernelClient.getLineageGraph({
  node_id: 'DS-INV-001',
  depth: 3,
  direction: 'both',
});

// Get impact report
const impact = await kernelClient.getImpactReport('DS-INV-001');
```

---

## 🧪 Testing Checklist

- [ ] Kernel client connects successfully
- [ ] Field context loads in sidebar
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] No hydration warnings in console
- [ ] Type safety maintained (no `any` types)
- [ ] Network errors handled gracefully

---

## 📚 References

- `apps/kernel/src/routes/metadata.ts` - Kernel API endpoints
- `packages/schemas/src/kernel.ts` - API contract types
- `apps/web/src/lib/kernel-client.ts` - Client implementation
- `apps/web/src/hooks/useFieldContext.ts` - Field context hook

---

## 🚀 Next Steps

1. **Identify all components using mock data**
   ```bash
   grep -r "MOCK\|mock\|Mock" apps/web/src
   ```

2. **Update components one by one**
   - Start with metadata sidebar (Silent Killer)
   - Then payment modules (when Kernel endpoints ready)
   - Finally, any remaining mock data

3. **Add error boundaries**
   - Wrap API calls in error boundaries
   - Show user-friendly error messages

4. **Add loading states**
   - Skeleton loaders for better UX
   - Optimistic updates where appropriate

---

**Last Updated:** 2025-01-27
