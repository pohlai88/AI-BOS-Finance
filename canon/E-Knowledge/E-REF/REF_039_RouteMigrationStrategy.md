# REF_039: Route Migration Strategy (Phase 2)

**Date:** 2025-12-12  
**Status:** Active  
**Purpose:** Strangler Fig pattern for React Router → Next.js App Router migration  
**Related:** REF_037_ViteToNextJsMigrationPlan.md, Phase 2

---

## Overview

This document defines the **incremental route migration strategy** from React Router to Next.js App Router using the "Strangler Fig" pattern.

**Principle:** Replace routes one by one without breaking the application.

---

## Current State (React Router)

**Source:** `src/App.tsx`

| Route | Component | Source | Complexity | Priority |
|-------|-----------|--------|------------|----------|
| `/` | `LandingPage` | `@/views/LandingPage` | 🟡 Medium | 5 (last) |
| `/dashboard` | `MetadataGodView` | `@/views/META_02_MetadataGodView` | 🟢 Low | 3 |
| `/meta-registry` | `MetadataGodView` | `@/views/META_02_MetadataGodView` | 🟢 Low | 4 (alias) |
| `/inventory` | `INV01Dashboard` | `@/modules/inventory` | 🟢 Low | **1 (first)** |
| `/system` | `SYS01Bootloader` | `@/modules/system` | 🟢 Low | 2 |
| `/settings` | `SYS01Bootloader` | `@/modules/system` | 🟢 Low | 2 (alias) |
| `/payments` | `PAY01PaymentHubPage` | `@/views/PAY_01_PaymentHubPage` | 🟢 Low | 2 |
| `/payment-hub` | `PAY01PaymentHubPage` | `@/views/PAY_01_PaymentHubPage` | 🟢 Low | 2 (alias) |
| `*` (fallback) | `LandingPage` | `@/views/LandingPage` | 🟡 Medium | 6 (very last) |

---

## Next.js App Router Best Practices

### 1. File-Based Routing Structure
```
app/
├── layout.tsx           # Root layout (already exists)
├── page.tsx             # Home route (/)
├── inventory/
│   └── page.tsx         # /inventory
├── dashboard/
│   └── page.tsx         # /dashboard
├── payments/
│   └── page.tsx         # /payments
├── system/
│   └── page.tsx         # /system
└── [[...slug]]/         # Catch-all fallback (SPA mode)
    ├── page.tsx
    └── client.tsx
```

### 2. Client vs Server Components
```tsx
// Server Component (default) - No 'use client'
// Good for: Static content, SEO, data fetching
export default function Page() {
  return <div>Server rendered</div>
}

// Client Component - With 'use client'
// Good for: Interactivity, hooks, browser APIs
'use client'
export default function Page() {
  const [state, setState] = useState()
  return <div>Client rendered</div>
}
```

### 3. Navigation Hooks (Next.js 16)
```tsx
// OLD (React Router)
import { useNavigate, useLocation } from 'react-router-dom'

// NEW (Next.js App Router)
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
```

### 4. Page Pattern for Migrated Routes
```tsx
// app/inventory/page.tsx
'use client'

import { INV01Dashboard } from '@/modules/inventory'

export default function InventoryPage() {
  return <INV01Dashboard />
}
```

---

## Migration Order

### Wave 1: Low-Risk Leaves (No Dependencies)
1. ✅ `/inventory` → `app/inventory/page.tsx`
2. ✅ `/payments` → `app/payments/page.tsx`
3. ✅ `/system` → `app/system/page.tsx`

### Wave 2: Aliases (After Primary Routes)
4. ⏳ `/payment-hub` → redirect to `/payments`
5. ⏳ `/settings` → redirect to `/system`
6. ⏳ `/meta-registry` → redirect to `/dashboard`

### Wave 3: Core Routes (Require Refactoring)
7. ✅ `/dashboard` → `app/dashboard/page.tsx`
   - Created `useRouterAdapter` hook for hybrid routing
   - Updated: `MetaAppShell`, `SetupCompanion`, `MetaSideNav`
8. ⏳ `/` (home) → `app/page.tsx` - Has navigation callbacks

### Wave 4: Cleanup
9. ⏳ Remove catch-all `[[...slug]]` SPA fallback
10. ⏳ Remove React Router from `src/App.tsx`
11. ⏳ Uninstall `react-router-dom`

---

## Global Concerns to Migrate

| Concern | Current Location | Next.js Target |
|---------|------------------|----------------|
| `SysConfigProvider` | `src/App.tsx` | `app/layout.tsx` |
| Vignette overlay | `src/App.tsx` | `app/layout.tsx` |
| `Toaster` | `src/App.tsx` | `app/layout.tsx` |
| Global CSS | `app/layout.tsx` | ✅ Already migrated |

---

## Verification Checklist

For each migrated route:
- [ ] Page loads at correct URL
- [ ] No console errors
- [ ] Navigation works (forward/back)
- [ ] Context providers still work
- [ ] Styling unchanged
- [ ] Remove route from React Router

---

## Related Documentation

- **REF_037:** Vite to Next.js Migration Plan
- **Next.js Docs:** [App Router Migration](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
- **Pattern:** Strangler Fig (incremental replacement)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-12 | Initial route mapping and migration strategy |
