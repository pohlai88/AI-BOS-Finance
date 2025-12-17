# 🏗️ FRONTEND ARCHITECTURE GUIDE
## Next.js App Router + Multi-Tenant Business Separation

**Canon Code:** SPEC_FRONTEND_01  
**Purpose:** Clarify frontend architecture for clean business domain separation  
**Target Audience:** Frontend Developers, Architects  
**Status:** Active — Production Ready  
**Version:** 1.0.0

---

## 📋 Executive Summary

You have **clean business separation at the backend** (each cluster in its own directory, kernel separate). Now let's align the **frontend architecture** to match this philosophy using Next.js App Router + BioSkin 3.0.

---

## 🤔 The Confusion: Understanding Next.js Structure

### Current Structure (What You See)

```
apps/
├── kernel/          ← Holding company (totally separate) ✅
├── canon/           ← Business domain configs (totally separate) ✅
│   └── finance/
│       └── accounts-payable/
├── db/              ← Database (totally separate) ✅
└── web/             ← 🤔 THIS IS CONFUSING
    ├── app/         ← 🤔 What is this?
    ├── src/         ← 🤔 What is this?
    └── canon-pages/ ← 🤔 What is this?
```

### The Question

> **"If kernel, canon, db are all separate, why does `apps/web` have so much mixed content?"**

---

## 🎯 ANSWER: Next.js App Router Architecture

### The Three Directories Explained

```
apps/web/
├── app/           ← 🟦 ROUTES (URL structure, pages)
├── src/           ← 🟩 REUSABLE CODE (components, hooks, utils)
└── canon-pages/   ← 🟪 CANON PAGE CONTENT (business domain pages)
```

Let me break this down:

---

## 1️⃣ `apps/web/app/` - The ROUTING Layer

### Purpose: **URL-to-Page Mapping**

This is **Next.js App Router** convention. The directory structure = URL structure.

```
apps/web/app/
├── page.tsx                    → https://yourdomain.com/
├── dashboard/
│   └── page.tsx                → https://yourdomain.com/dashboard
├── payments/
│   ├── page.tsx                → https://yourdomain.com/payments
│   └── bio-demo/
│       └── page.tsx            → https://yourdomain.com/payments/bio-demo
├── canon/
│   └── [...slug]/
│       └── page.tsx            → https://yourdomain.com/canon/*
└── api/
    └── payments/
        └── route.ts            → https://yourdomain.com/api/payments (API endpoint)
```

### What Lives Here

| File Type | Purpose | Example |
|-----------|---------|---------|
| `page.tsx` | Page component (renders at URL) | `/dashboard/page.tsx` |
| `layout.tsx` | Wrapper for nested routes | `/layout.tsx` (wraps entire app) |
| `route.ts` | API endpoint | `/api/payments/route.ts` |
| `loading.tsx` | Loading state | `/dashboard/loading.tsx` |
| `error.tsx` | Error boundary | `/dashboard/error.tsx` |

### ✅ CORRECT Pattern: Thin Routing Layer

```tsx
// ✅ apps/web/app/payments/page.tsx
// This file should be THIN - just route to the real component

import { PaymentHubPage } from '@/views/PAY_01_PaymentHubPage';

export default function PaymentsRoute() {
  return <PaymentHubPage />;
}
```

### ❌ ANTI-PATTERN: Business Logic in Routes

```tsx
// ❌ DON'T DO THIS - app/payments/page.tsx
export default function PaymentsRoute() {
  const [data, setData] = useState();
  const handleCreate = () => { /* business logic */ };
  
  return (
    <div>
      {/* 500 lines of component code */}
    </div>
  );
}
```

**Why wrong?** Mixing routing with business logic = hard to test, hard to reuse.

---

## 2️⃣ `apps/web/src/` - The IMPLEMENTATION Layer

### Purpose: **Reusable Code (Components, Hooks, Features)**

This is where **actual implementation** lives.

```
apps/web/src/
├── components/      ← Shared UI components
│   ├── ui/          ← Generic UI (buttons, cards)
│   └── business/    ← Business-specific components
├── features/        ← Feature modules (payment, AP, GL)
│   ├── payments/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── accounts-payable/
├── hooks/           ← Shared React hooks
├── lib/             ← Utilities, helpers
├── types/           ← TypeScript types
└── views/           ← PAGE COMPONENTS (the real pages)
    ├── PAY_01_PaymentHubPage.tsx
    ├── META_02_MetadataGodView.tsx
    └── SYS_01_SysBootloaderPage.tsx
```

### What Lives Here

| Directory | Purpose | Example |
|-----------|---------|---------|
| `views/` | **Page components** (Canon-identified) | `PAY_01_PaymentHubPage.tsx` |
| `features/` | **Feature modules** (business domain logic) | `features/payments/` |
| `components/` | **Shared UI** (reusable across features) | `components/ui/Button.tsx` |
| `hooks/` | **Custom React hooks** | `usePaymentActions.ts` |
| `lib/` | **Utilities** | `formatCurrency.ts` |

### ✅ CORRECT Pattern: Feature-Based Organization

```
src/features/payments/
├── components/
│   ├── PaymentForm.tsx
│   ├── PaymentTable.tsx
│   └── ApprovalButton.tsx
├── hooks/
│   ├── usePaymentActions.ts
│   └── usePaymentFilters.ts
├── types/
│   └── payment.types.ts
└── utils/
    └── payment-helpers.ts
```

**Benefits:**
- ✅ All payment-related code in one place
- ✅ Easy to test in isolation
- ✅ Can be moved to a separate package later

---

## 3️⃣ `apps/web/canon-pages/` - The CANON CONTENT Layer

### Purpose: **Business Domain Page Definitions (MDX)**

This is **Canon governance** - structured page metadata for each business domain.

```
apps/web/canon-pages/
├── PAYMENT/
│   └── pay-01-payment-hub.mdx    ← PAY_01 page definition
├── META/
│   ├── meta-02-god-view.mdx      ← META_02 page definition
│   └── meta-03-prism.mdx         ← META_03 page definition
├── SYSTEM/
│   ├── sys-01-bootloader.mdx     ← SYS_01 page definition
│   └── sys-02-organization.mdx   ← SYS_02 page definition
└── registry.ts                    ← Central registry
```

### What Lives Here

| File Type | Purpose | Example |
|-----------|---------|---------|
| `*.mdx` | Page definition (metadata, content) | `pay-01-payment-hub.mdx` |
| `registry.ts` | Central page registry | Maps Canon codes to content |

### MDX Structure

```mdx
---
code: PAY_01
title: Payment Hub
route: /payments
domain: PAYMENT
status: active
version: 1.0.0
---

# Payment Hub

Business-focused payment processing interface...

## Features
- Bulk payment import
- Multi-level approval workflow
- Exception handling
```

### ✅ CORRECT Pattern: Declarative Page Metadata

```typescript
// apps/web/canon-pages/registry.ts
export const canonRegistry = {
  'PAY_01': {
    code: 'PAY_01',
    title: 'Payment Hub',
    route: '/payments',
    component: lazy(() => import('@/views/PAY_01_PaymentHubPage')),
    domain: 'PAYMENT',
  },
  'META_02': {
    code: 'META_02',
    title: 'Metadata God View',
    route: '/meta-registry',
    component: lazy(() => import('@/views/META_02_MetadataGodView')),
    domain: 'META',
  },
};
```

---

## 🎯 RECOMMENDED ARCHITECTURE: Business Domain Separation

### Current Problem: Mixed Content

```
❌ CURRENT (Mixed):
apps/web/
├── app/
│   ├── payments/        ← Payment routes
│   ├── dashboard/       ← Dashboard routes
│   ├── inventory/       ← Inventory routes
│   └── api/
│       ├── payments/    ← Payment APIs
│       └── meta/        ← Meta APIs
└── src/
    ├── features/
    │   ├── payments/    ← Payment logic
    │   ├── inventory/   ← Inventory logic
    │   └── metadata/    ← Metadata logic
    └── views/
        ├── PAY_01_PaymentHubPage.tsx
        ├── META_02_MetadataGodView.tsx
        └── SYS_01_SysBootloaderPage.tsx
```

**Problem:** Payments code scattered across 3 directories.

---

## ✅ SOLUTION: Modular Monolith Pattern

### Option 1: Feature-First Structure (Recommended)

```
apps/web/
├── app/                           ← THIN routing layer only
│   ├── (payments)/                ← Route group (no URL segment)
│   │   └── payments/
│   │       └── page.tsx           → import from @features/payments
│   ├── (metadata)/                ← Route group
│   │   └── meta-registry/
│   │       └── page.tsx           → import from @features/metadata
│   ├── api/
│   │   └── [...domain]/           ← Catch-all API routes
│   │       └── route.ts           → delegate to domain handler
│   └── layout.tsx
│
├── src/
│   └── features/                  ← FEATURE MODULES (self-contained)
│       ├── payments/              ← 🟦 PAYMENT DOMAIN
│       │   ├── routes/            ← Payment routes (if complex)
│       │   ├── components/        ← Payment UI
│       │   ├── hooks/             ← Payment hooks
│       │   ├── api/               ← Payment API handlers
│       │   ├── types/             ← Payment types
│       │   └── views/
│       │       └── PAY_01_PaymentHubPage.tsx
│       ├── metadata/              ← 🟩 METADATA DOMAIN
│       │   ├── routes/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── api/
│       │   └── views/
│       │       └── META_02_MetadataGodView.tsx
│       └── system/                ← 🟪 SYSTEM DOMAIN
│           ├── routes/
│           ├── components/
│           └── views/
│               └── SYS_01_SysBootloaderPage.tsx
│
└── canon-pages/                   ← GOVERNANCE LAYER
    ├── PAYMENT/
    │   └── pay-01-payment-hub.mdx
    ├── META/
    │   └── meta-02-god-view.mdx
    └── registry.ts
```

### Benefits

| Benefit | Description |
|---------|-------------|
| ✅ **Clean Separation** | Each domain is self-contained |
| ✅ **Easy to Test** | Test entire domain in isolation |
| ✅ **Easy to Extract** | Can move to separate package later |
| ✅ **Clear Ownership** | One team owns one `features/` directory |
| ✅ **Scalable** | Add new domains without touching existing ones |

---

## 📐 Domain Module Structure (Template)

### Example: `src/features/payments/`

```
src/features/payments/
├── index.ts                       ← Public API (exports)
│
├── views/                         ← PAGE COMPONENTS
│   └── PAY_01_PaymentHubPage.tsx  ← Main page (Canon-identified)
│
├── components/                    ← UI COMPONENTS
│   ├── PaymentForm/
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentForm.test.tsx
│   │   └── index.ts
│   ├── PaymentTable/
│   │   ├── PaymentTable.tsx
│   │   └── index.ts
│   └── ApprovalButton/
│       ├── ApprovalButton.tsx
│       └── index.ts
│
├── hooks/                         ← CUSTOM HOOKS
│   ├── usePaymentActions.ts
│   ├── usePaymentFilters.ts
│   └── index.ts
│
├── api/                           ← API HANDLERS (server-side)
│   ├── payment-handlers.ts        ← API route handlers
│   └── payment-services.ts        ← Business logic
│
├── types/                         ← TYPESCRIPT TYPES
│   ├── payment.types.ts
│   └── index.ts
│
├── utils/                         ← UTILITIES
│   ├── payment-helpers.ts
│   └── payment-formatters.ts
│
├── adapters/                      ← BIOSKIN 3.0 ADAPTERS (optional)
│   └── payment-adapter.ts         ← BioRegistry adapter for payments
│
└── README.md                      ← Domain documentation
```

### Public API Pattern

```typescript
// src/features/payments/index.ts
// ONLY export what other features need

// Views
export { PAY_01_PaymentHubPage } from './views/PAY_01_PaymentHubPage';

// Components (if shared)
export { PaymentForm } from './components/PaymentForm';
export { PaymentTable } from './components/PaymentTable';

// Hooks (if shared)
export { usePaymentActions } from './hooks/usePaymentActions';

// Types (if shared)
export type { Payment, PaymentStatus } from './types/payment.types';

// ❌ DON'T export internal implementation details
// export { PaymentFormInternal } from './components/PaymentForm/internals';
```

---

## 🔗 How Routing Connects to Features

### Thin Route Pattern

```tsx
// apps/web/app/(payments)/payments/page.tsx
// ✅ THIN ROUTE - just delegates to feature

import { PAY_01_PaymentHubPage } from '@/features/payments';

export default function PaymentsRoute() {
  return <PAY_01_PaymentHubPage />;
}
```

### API Route Pattern

```typescript
// apps/web/app/api/payments/route.ts
// ✅ THIN API ROUTE - delegates to feature handler

import { handlePaymentList } from '@/features/payments/api/payment-handlers';

export async function GET(request: Request) {
  return handlePaymentList(request);
}
```

---

## 🎯 Mapping to Your Business Clusters

### Your Business Structure

```
Backend (Clean Separation):
├── kernel/              ← Holding company
├── apps/canon/finance/  ← Finance domain
├── apps/db/            ← Database
└── (other clusters)
```

### Frontend Alignment

```
Frontend (Same Clean Separation):
apps/web/
├── app/                           ← ROUTING (thin)
│   ├── (finance)/                 ← 🏦 Finance routes
│   │   ├── ap/page.tsx
│   │   ├── ar/page.tsx
│   │   └── gl/page.tsx
│   ├── (supply-chain)/            ← 🚚 Supply Chain routes
│   │   ├── warehouse/page.tsx
│   │   └── cold-chain/page.tsx
│   └── (kernel)/                  ← 🏢 Kernel routes
│       └── system/page.tsx
│
└── src/features/                  ← FEATURES (self-contained)
    ├── finance/                   ← 🏦 FINANCE DOMAIN
    │   ├── ap/                    ← Accounts Payable
    │   ├── ar/                    ← Accounts Receivable
    │   └── gl/                    ← General Ledger
    ├── supply-chain/              ← 🚚 SUPPLY CHAIN DOMAIN
    │   ├── warehouse/
    │   └── cold-chain/
    ├── kernel/                    ← 🏢 KERNEL DOMAIN
    │   └── system/
    └── shared/                    ← Shared across domains
        ├── ui/                    ← Generic UI (BioSkin components)
        └── utils/
```

### BioSkin 3.0 Integration

```
src/features/
├── finance/
│   └── adapters/
│       └── corporate-adapter.ts   ← BioRegistry adapter for Finance
├── supply-chain/
│   └── adapters/
│       └── supplychain-adapter.ts ← BioRegistry adapter for Supply Chain
└── shared/
    └── bioskin/                   ← BioSkin 3.0 provider setup
        ├── registry-provider.tsx
        └── token-provider.tsx
```

---

## 🚀 Migration Plan: From Current to Recommended

### Current State

```
❌ Mixed structure:
app/payments/ + src/features/payments/ + canon-pages/PAYMENT/
```

### Step 1: Consolidate Feature Code

```bash
# Move all payment-related code into one feature
src/features/payments/
├── views/           ← from src/views/PAY_*.tsx
├── components/      ← from app/payments/_components/
├── hooks/           ← from app/payments/_hooks/
├── api/             ← from app/api/payments/
└── types/           ← from src/types/ (payment-related)
```

### Step 2: Thin Out Routes

```tsx
// Before: app/payments/page.tsx (200 lines)
export default function PaymentsPage() {
  // lots of logic
}

// After: app/payments/page.tsx (5 lines)
import { PAY_01_PaymentHubPage } from '@/features/payments';
export default function PaymentsPage() {
  return <PAY_01_PaymentHubPage />;
}
```

### Step 3: Create Feature Public API

```typescript
// src/features/payments/index.ts
export { PAY_01_PaymentHubPage } from './views/PAY_01_PaymentHubPage';
export type { Payment } from './types/payment.types';
```

### Step 4: Update Imports

```typescript
// Before
import { PaymentForm } from '@/components/payments/PaymentForm';

// After
import { PaymentForm } from '@/features/payments';
```

---

## 📋 Domain Checklist

Use this checklist when creating a new domain:

### New Domain Checklist

- [ ] **Feature Directory Created:** `src/features/{domain}/`
- [ ] **Views Directory:** `src/features/{domain}/views/`
- [ ] **Components Directory:** `src/features/{domain}/components/`
- [ ] **Hooks Directory:** `src/features/{domain}/hooks/`
- [ ] **API Directory:** `src/features/{domain}/api/`
- [ ] **Types Directory:** `src/features/{domain}/types/`
- [ ] **Public API:** `src/features/{domain}/index.ts`
- [ ] **Route Created:** `app/({domain})/{route}/page.tsx` (thin)
- [ ] **Canon Page:** `canon-pages/{DOMAIN}/{code}.mdx`
- [ ] **BioRegistry Adapter:** `src/features/{domain}/adapters/` (if needed)
- [ ] **Tests:** `src/features/{domain}/**/*.test.tsx`
- [ ] **README:** `src/features/{domain}/README.md`

---

## 🎯 Summary: The Three Layers

| Layer | Directory | Purpose | Example |
|-------|-----------|---------|---------|
| **ROUTING** | `app/` | URL-to-page mapping | `app/payments/page.tsx` → `/payments` |
| **IMPLEMENTATION** | `src/features/` | Business logic, UI components | `src/features/payments/` |
| **GOVERNANCE** | `canon-pages/` | Page definitions, metadata | `canon-pages/PAYMENT/pay-01.mdx` |

### Visual Flow

```
User visits URL
      ↓
app/payments/page.tsx          ← 🟦 ROUTING (thin layer)
      ↓
src/features/payments/         ← 🟩 IMPLEMENTATION (feature code)
views/PAY_01_PaymentHubPage
      ↓
Uses: BioRegistry              ← 🟪 BIOSKIN 3.0 (adapters)
      ↓
Reads: canon-pages/PAYMENT/    ← 🟧 GOVERNANCE (metadata)
```

---

## 🚫 Anti-Patterns to Avoid

| Anti-Pattern | Why Wrong | Right Approach |
|--------------|-----------|----------------|
| Business logic in `app/` routes | Hard to test, can't reuse | Move to `src/features/` |
| Scattered feature code | Hard to maintain | Consolidate in one `features/` dir |
| No public API (`index.ts`) | Exposes internals | Export only what's needed |
| Importing across features | Tight coupling | Use shared utilities or events |
| Mixing domains in one file | No clear ownership | One file = one domain |

---

## 📚 Next Steps

1. **Audit current structure** — Which code is in the wrong place?
2. **Create `src/features/` directories** — One per business domain
3. **Move feature code** — Consolidate scattered code
4. **Thin out routes** — Routes should be <10 lines
5. **Create BioRegistry adapters** — Per domain, if needed
6. **Update imports** — Use feature public APIs

---

**Document Status:** ✅ Active  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS Frontend Architecture Team  
**Related:** BIOSKIN_3_CUSTOMIZATION_GUIDE.md, PRD_BIOSKIN_02
