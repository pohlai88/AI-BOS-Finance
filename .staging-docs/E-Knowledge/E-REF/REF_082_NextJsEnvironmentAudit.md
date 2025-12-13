# REF_082: Next.js Environment Audit & Optimization Report

> **🟡 [STAGING]** — Comprehensive Next.js Environment Audit  
> **Date:** 2025-01-27  
> **Auditor:** Next.js MCP DevTools  
> **Status:** Ready for Review → Promote to Canon

---

## 🎯 Executive Summary

**Audit Scope:** Complete Next.js 16 App Router environment  
**Issues Found:** 12 critical, 8 optimization opportunities  
**Status:** ✅ No linter errors, ⚠️ Missing error boundaries, ⚠️ Performance optimizations needed

---

## 📊 Current State Analysis

### Environment Configuration

| Component | Status | Version | Notes |
|-----------|--------|---------|-------|
| **Next.js** | ✅ Installed | 16.0.8 | Latest stable |
| **React** | ✅ Installed | 18.3.1 | Compatible |
| **TypeScript** | ✅ Configured | ~5.6.2 | Strict mode enabled |
| **Tailwind CSS** | ✅ Configured | 3.4.17 | Proper content paths |
| **ESLint** | ✅ Configured | 9.39.1 | No errors found |
| **Turborepo** | ✅ Installed | 2.6.3 | Partially configured |

### App Structure

```
apps/web/
├── app/                    ← App Router (✅ Correct)
│   ├── layout.tsx         ← Root layout (✅ Has metadata)
│   ├── page.tsx           ← Home page (⚠️ Client component)
│   ├── providers.tsx      ← Client providers (✅ Correct)
│   ├── canon/             ← Canon pages (✅ Has generateStaticParams)
│   ├── dashboard/         ← Dashboard (⚠️ No loading/error)
│   ├── payments/           ← Payments (⚠️ No loading/error)
│   ├── system/             ← System (⚠️ No loading/error)
│   └── inventory/          ← Inventory (⚠️ No loading/error)
├── src/
│   ├── components/         ← 175 components (✅ Organized)
│   ├── views/              ← Page views (✅ Separated)
│   ├── lib/                ← Utilities (✅ kernel-client.ts)
│   └── hooks/              ← Custom hooks (✅ Router adapter)
└── canon-pages/            ← MDX pages (✅ Configured)
```

---

## 🔴 Critical Issues

### 1. **Missing Error Boundaries** (HIGH PRIORITY)

**Issue:** No `error.tsx` files found in route segments  
**Impact:** Unhandled errors crash entire pages instead of graceful degradation  
**Affected Routes:**
- `/dashboard`
- `/payments`
- `/system`
- `/inventory`
- `/canon/*`

**Fix Required:**
```typescript
// apps/web/app/dashboard/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**Recommendation:** Add `error.tsx` to all route segments

---

### 2. **Missing Loading States** (HIGH PRIORITY)

**Issue:** No `loading.tsx` files found  
**Impact:** Poor UX during data fetching, no loading indicators  
**Affected Routes:** All dynamic routes

**Fix Required:**
```typescript
// apps/web/app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>
}
```

**Recommendation:** Add `loading.tsx` to all routes that fetch data

---

### 3. **Missing Not Found Pages** (MEDIUM PRIORITY)

**Issue:** No `not-found.tsx` at root level  
**Impact:** Generic 404 page instead of branded experience

**Fix Required:**
```typescript
// apps/web/app/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
    </div>
  )
}
```

---

### 4. **Client Component on Root Page** (MEDIUM PRIORITY)

**Issue:** `app/page.tsx` uses `'use client'`  
**Impact:** Prevents static optimization, increases bundle size

**Current:**
```typescript
// apps/web/app/page.tsx
'use client'  // ← Should be Server Component
```

**Fix:** Extract client logic to separate component:
```typescript
// apps/web/app/page.tsx (Server Component)
import { LandingPageClient } from '@/components/landing/LandingPageClient'

export default function HomePage() {
  return <LandingPageClient />
}

// apps/web/src/components/landing/LandingPageClient.tsx
'use client'
import { LandingPage } from '@/views/LandingPage'
// ... client logic
```

---

### 5. **No Caching Strategy for Kernel API** (HIGH PRIORITY)

**Issue:** `kernel-client.ts` doesn't use Next.js caching  
**Impact:** Unnecessary API calls, slower performance

**Current:**
```typescript
// No caching headers or revalidate options
async function kernelFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options })
  // ...
}
```

**Fix:** Add Next.js fetch caching:
```typescript
async function kernelFetch<T>(
  endpoint: string,
  options?: RequestInit & { 
    next?: { revalidate?: number | false } 
  }
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: {
      revalidate: options?.next?.revalidate ?? 60, // Cache for 60s
    },
  })
  // ...
}
```

---

### 6. **Missing Image Optimization** (MEDIUM PRIORITY)

**Issue:** No `next/image` usage found  
**Impact:** Unoptimized images, larger bundles

**Recommendation:** Replace `<img>` with `<Image>` from `next/image`

---

### 7. **No Route Handlers for API** (LOW PRIORITY)

**Issue:** All API calls go directly to Kernel  
**Impact:** No Next.js middleware, no request validation

**Recommendation:** Create route handlers for proxying:
```typescript
// apps/web/app/api/metadata/fields/[id]/route.ts
import { kernelClient } from '@/lib/kernel-client'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const field = await kernelClient.getMetadataField(params.id)
  return Response.json(field)
}
```

---

### 8. **Font Optimization** (✅ GOOD)

**Status:** ✅ Properly optimized  
**Implementation:**
```typescript
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // ✅ Good
})
```

---

### 9. **Metadata Configuration** (✅ GOOD)

**Status:** ✅ Root layout has metadata  
**Implementation:**
```typescript
export const metadata: Metadata = {
  title: 'NexusCanon | Forensic Architecture',
  description: 'Forensic metadata architecture and governance system',
}
```

**Recommendation:** Add Open Graph and Twitter metadata:
```typescript
export const metadata: Metadata = {
  title: 'NexusCanon | Forensic Architecture',
  description: 'Forensic metadata architecture and governance system',
  openGraph: {
    title: 'NexusCanon',
    description: 'Forensic metadata architecture',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

---

### 10. **TypeScript Configuration** (⚠️ NEEDS ATTENTION)

**Issue:** `noUnusedLocals` and `noUnusedParameters` disabled  
**Impact:** Dead code not caught

**Current:**
```json
"noUnusedLocals": false,  // Temporarily disabled for migration validation
"noUnusedParameters": false,  // Temporarily disabled for migration validation
```

**Recommendation:** Re-enable after cleanup:
```json
"noUnusedLocals": true,
"noUnusedParameters": true,
```

---

### 11. **Missing Middleware** (LOW PRIORITY)

**Issue:** No `middleware.ts` found  
**Impact:** No request interception, no auth checks, no redirects

**Recommendation:** Add middleware for:
- Authentication checks
- Request logging
- Header manipulation
- Redirects

---

### 12. **Bundle Analyzer Not Configured** (LOW PRIORITY)

**Issue:** Bundle analyzer exists but not used in CI  
**Impact:** No visibility into bundle size

**Recommendation:** Add to CI/CD pipeline:
```bash
ANALYZE=true npm run build
```

---

## ⚡ Performance Optimizations

### 1. **Add React Suspense Boundaries**

**Current:** No Suspense boundaries  
**Fix:**
```typescript
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
```

### 2. **Enable Static Generation Where Possible**

**Current:** Dynamic routes without `generateStaticParams`  
**Fix:** Add `generateStaticParams` to all dynamic routes

### 3. **Optimize Font Loading**

**Current:** ✅ Good (already using `display: 'swap'`)  
**Enhancement:** Add `preload` for critical fonts

### 4. **Add Route Segment Config**

**Recommendation:** Add to all pages:
```typescript
export const dynamic = 'force-static' // or 'force-dynamic'
export const revalidate = 60
```

### 5. **Optimize Tailwind CSS**

**Current:** ✅ Proper content paths  
**Enhancement:** Add JIT mode verification

---

## 🔒 Security Considerations

### 1. **Environment Variables** (✅ GOOD)

**Status:** ✅ Using `NEXT_PUBLIC_*` correctly  
**Implementation:**
```typescript
process.env.NEXT_PUBLIC_KERNEL_URL || 'http://localhost:3001'
```

### 2. **API Client Security**

**Issue:** No request validation  
**Recommendation:** Add Zod validation:
```typescript
import { z } from 'zod'

const MetadataSearchRequestSchema = z.object({
  q: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
})

export async function searchMetadataFields(request: unknown) {
  const validated = MetadataSearchRequestSchema.parse(request)
  // ...
}
```

### 3. **CORS Configuration**

**Issue:** No CORS headers in Kernel client  
**Recommendation:** Add CORS handling in route handlers

---

## 📋 Optimization Checklist

### Immediate (Critical)
- [ ] Add `error.tsx` to all route segments
- [ ] Add `loading.tsx` to all routes
- [ ] Add `not-found.tsx` at root
- [ ] Convert root `page.tsx` to Server Component
- [ ] Add caching to `kernel-client.ts`

### Short-term (High Priority)
- [ ] Re-enable TypeScript unused checks
- [ ] Add Suspense boundaries
- [ ] Add metadata to all pages
- [ ] Replace `<img>` with `<Image>`
- [ ] Add route handlers for API proxying

### Long-term (Nice to Have)
- [ ] Add middleware for auth/logging
- [ ] Configure bundle analyzer in CI
- [ ] Add Open Graph metadata
- [ ] Optimize font preloading
- [ ] Add request validation with Zod

---

## 🎯 Recommended Next.js Config Enhancements

```typescript
// apps/web/next.config.mjs
const nextConfig = {
  // ... existing config
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: [], // Add if using external images
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features (Next.js 16)
  experimental: {
    // Enable if needed
    // optimizePackageImports: ['@radix-ui/react-accordion'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ]
  },
}
```

---

## 📚 References

- [Next.js Error Handling](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Next.js Loading States](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)

---

## 🔄 Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. Add error boundaries (`error.tsx`)
2. Add loading states (`loading.tsx`)
3. Add caching to kernel client
4. Convert root page to Server Component

### Phase 2: Performance (Week 2)
1. Add Suspense boundaries
2. Optimize images
3. Add route segment config
4. Re-enable TypeScript checks

### Phase 3: Polish (Week 3)
1. Add middleware
2. Enhance metadata
3. Add route handlers
4. Configure CI/CD

---

**Last Updated:** 2025-01-27  
**Status:** Ready for Review → Promote to Canon after fixes applied
