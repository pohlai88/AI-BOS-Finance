> **🟢 [ACTIVE]** — Architectural Decision  
> **Canon Code:** ADR_001  
> **Status:** Accepted  
> **Date:** 2025-12-11  
> **Context:** Framework Selection  
> **Supersedes:** N/A  
> **Related:** CONT_01 (Canon Identity Contract)

---

# ADR_001: Adoption of Next.js App Router

## Status

**Accepted** — 2025-12-11

---

## Context

We required a framework that supports:
1. React Server Components (RSC) for improved performance
2. File-system routing for clear route organization
3. Built-in API routes (Route Handlers) to eliminate separate BFF services
4. Server Actions for form submissions
5. ISR (Incremental Static Regeneration) for hybrid rendering

The Canon Identity Contract (CONT_01) requires a framework that supports the "Thin Wrapper" pattern, separating business logic from routing infrastructure.

---

## Decision

We will use **Next.js 14+ App Router** as our primary framework.

### Key Patterns Adopted

1. **Thin Wrapper Pattern:**
   - `app/**/page.tsx` files are thin wrappers
   - Business logic lives in `canon-pages/` directory
   - Enables framework portability

2. **Server/Client Component Boundary:**
   - Canonical pages are Server Components by default
   - Interactive components use `'use client'` directive
   - Tables/forms are Client Components

3. **Route Handlers as BFF:**
   - `app/api/**/route.ts` serves as BFF layer
   - No separate Express/Fastify service needed
   - Built-in request handling

4. **Server Actions:**
   - Separate `*.actions.ts` files with `'use server'`
   - Not mixed with page components
   - Enables form mutations with revalidation

---

## Consequences

### Positive

- ✅ **Governance Compatible:** Thin wrapper pattern allows Canon pages to be portable
- ✅ **Performance:** Server Components reduce client bundle size
- ✅ **Simplified Architecture:** Route Handlers eliminate BFF service
- ✅ **Type Safety:** Full TypeScript support with metadata types
- ✅ **SEO:** Built-in metadata API for SEO optimization

### Negative

- ⚠️ **Learning Curve:** Team must learn Server/Client component boundaries
- ⚠️ **Server Actions:** New paradigm for form handling
- ⚠️ **Vendor Lock-in:** Some Next.js-specific patterns (mitigated by thin wrappers)

### Neutral

- Route groups `(folder)` don't appear in URLs
- Metadata must be exported from `page.tsx` (can re-export from canonical pages)

---

## Implementation Notes

### File Structure

```text
apps/web/
├── app/                          # Next.js routes (wrappers only)
│   ├── canon/page.tsx            # Thin wrapper → META_02
│   ├── meta/flex/page.tsx        # Thin wrapper → META_09
│   └── api/meta/flex/route.ts    # Route Handler (BFF)
└── canon-pages/                  # Business logic
    ├── META/
    │   ├── META_02_CanonLandingPage.tsx
    │   └── META_09_FlexFieldsPage.tsx
    └── PAY/
        └── PAY_01_PaymentHubPage.tsx
```

### Route Wrapper Example

```tsx
// apps/web/app/canon/page.tsx
import CanonLandingPage, { metadata } from '@/canon-pages/META/META_02_CanonLandingPage';

export default CanonLandingPage;
export { metadata };
```

### Server Action Pattern

```tsx
// apps/web/canon-pages/META/META_09_FlexFields.actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function submitFlexField(canon: CanonContext, formData: FormData) {
  // Server-side validation
  // ...
  revalidatePath('/meta/flex');
}
```

---

## References

- **CONT_01:** Canon Identity & Cell Registration Standard v2.2.0
- **Next.js Docs:** https://nextjs.org/docs/app
- **React Server Components:** https://react.dev/reference/rsc/server-components

---

**End of ADR**

