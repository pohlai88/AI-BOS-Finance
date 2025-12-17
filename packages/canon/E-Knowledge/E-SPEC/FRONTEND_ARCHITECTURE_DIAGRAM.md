# 🎨 FRONTEND ARCHITECTURE VISUAL GUIDE
## Understanding Next.js App Router Structure

**Canon Code:** SPEC_FRONTEND_02  
**Purpose:** Visual diagrams explaining frontend architecture  
**Version:** 1.0.0

---

## 🏗️ The Big Picture: Backend ↔ Frontend Alignment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Your Current Clean Setup)                  │
└─────────────────────────────────────────────────────────────────────────────┘

apps/
├── kernel/                    ← 🏢 Holding Company (separate)
│   └── [kernel business logic]
│
├── canon/                     ← 📚 Business Config (separate)
│   └── finance/
│       └── accounts-payable/
│
└── db/                        ← 🗄️ Database (separate)
    └── [migrations, schemas]

          ✅ CLEAN SEPARATION — Each domain is isolated



┌─────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Needs Same Clean Separation)                   │
└─────────────────────────────────────────────────────────────────────────────┘

apps/web/
├── app/                       ← 🗺️ ROUTING LAYER (URL structure)
│   ├── payments/page.tsx      → /payments (just a route)
│   └── dashboard/page.tsx     → /dashboard (just a route)
│
├── src/features/              ← 🎯 IMPLEMENTATION LAYER (business logic)
│   ├── payments/              ← Payment domain (self-contained)
│   │   ├── views/
│   │   ├── components/
│   │   └── hooks/
│   └── finance/               ← Finance domain (self-contained)
│       ├── ap/
│       ├── ar/
│       └── gl/
│
└── canon-pages/               ← 📋 GOVERNANCE LAYER (metadata)
    ├── PAYMENT/
    │   └── pay-01.mdx
    └── FINANCE/
        └── ap-01.mdx

          ✅ SAME CLEAN SEPARATION — Each domain is isolated
```

---

## 🔍 Zoom In: What Each Directory Does

### Current Confusion

```
❓ Question: "Why does apps/web/ have app/, src/, and canon-pages/?"
❓ Question: "Aren't they all part of the web app?"
```

### Answer: Different Responsibilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              apps/web/                                       │
│                                                                              │
│  ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐  │
│  │   app/             │   │   src/features/    │   │   canon-pages/     │  │
│  │   (ROUTING)        │   │   (LOGIC)          │   │   (GOVERNANCE)     │  │
│  │                    │   │                    │   │                    │  │
│  │  Maps URLs to      │   │  Contains actual   │   │  Defines page      │  │
│  │  components        │   │  implementation    │   │  metadata          │  │
│  │                    │   │                    │   │                    │  │
│  │  Thin layer        │   │  Thick layer       │   │  MDX content       │  │
│  │  (5-10 lines)      │   │  (100s of lines)   │   │  (governance)      │  │
│  └────────────────────┘   └────────────────────┘   └────────────────────┘  │
│          ↓                          ↓                         ↓             │
│     URL Structure           Business Logic              Canon Contracts     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Layer 1: `app/` - The ROUTING Layer

### What It Is

```
app/                       ← Next.js App Router convention
├── page.tsx               → Homepage (/)
├── dashboard/
│   └── page.tsx           → /dashboard
├── payments/
│   ├── page.tsx           → /payments
│   └── [id]/
│       └── page.tsx       → /payments/123
└── api/
    └── payments/
        └── route.ts       → /api/payments (API endpoint)
```

### How It Works

```
User visits: https://yourdomain.com/payments
      ↓
Next.js finds: app/payments/page.tsx
      ↓
Renders:       <PaymentHubPage />  ← from src/features/payments
```

### Code Example

```tsx
// app/payments/page.tsx
// ✅ THIN - Just 5 lines

import { PAY_01_PaymentHubPage } from '@/features/payments';

export default function PaymentsRoute() {
  return <PAY_01_PaymentHubPage />;
}
```

### Visual: Route-to-Feature Mapping

```
┌──────────────────────────────────────────────────────────────┐
│                    ROUTING LAYER (app/)                       │
│                                                               │
│  app/payments/page.tsx    ────────┐                          │
│  app/dashboard/page.tsx   ────────┤                          │
│  app/inventory/page.tsx   ────────┤                          │
│                                    │                          │
│                                    ↓                          │
│                        (imports components from)             │
│                                    ↓                          │
└────────────────────────────────────┼──────────────────────────┘
                                     │
┌────────────────────────────────────┼──────────────────────────┐
│                    FEATURE LAYER (src/features/)              │
│                                    │                          │
│                                    ↓                          │
│  src/features/payments/    ────── ✓                          │
│  src/features/dashboard/   ────── ✓                          │
│  src/features/inventory/   ────── ✓                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📐 Layer 2: `src/features/` - The IMPLEMENTATION Layer

### What It Is

```
src/features/              ← Self-contained business domains
├── payments/              ← 🏦 PAYMENT DOMAIN
│   ├── views/             ← Page components (PAY_01, PAY_02, etc.)
│   ├── components/        ← UI components (PaymentForm, PaymentTable)
│   ├── hooks/             ← React hooks (usePaymentActions)
│   ├── api/               ← API handlers (payment-handlers.ts)
│   ├── types/             ← TypeScript types (payment.types.ts)
│   └── index.ts           ← Public API (exports)
│
├── finance/               ← 🧾 FINANCE DOMAIN
│   ├── ap/                ← Accounts Payable
│   ├── ar/                ← Accounts Receivable
│   └── gl/                ← General Ledger
│
└── metadata/              ← 🗂️ METADATA DOMAIN
    ├── views/
    ├── components/
    └── hooks/
```

### How It Works

```
Feature Module = Self-Contained Business Domain

payments/
├── views/                 ← Pages (what users see)
├── components/            ← UI pieces
├── hooks/                 ← React logic
├── api/                   ← Server-side handlers
├── types/                 ← TypeScript definitions
└── index.ts               ← Public exports

      ↓ Everything related to PAYMENTS is in ONE place ↓

✅ Easy to test
✅ Easy to maintain
✅ Easy to extract to separate package
```

### Visual: Feature Module Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     src/features/payments/                                   │
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐│
│  │ views/       │   │ components/  │   │ hooks/       │   │ api/         ││
│  │              │   │              │   │              │   │              ││
│  │ PAY_01       │   │ PaymentForm  │   │ usePayment   │   │ payment-     ││
│  │ PaymentHub   │   │ PaymentTable │   │ Actions      │   │ handlers.ts  ││
│  │ Page.tsx     │   │ Approval     │   │ usePayment   │   │              ││
│  │              │   │ Button       │   │ Filters      │   │              ││
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘│
│         ↓                   ↓                   ↓                   ↓        │
│    User Sees           Reusable UI        React Logic       Server Logic    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        index.ts (Public API)                          │  │
│  │                                                                        │  │
│  │  export { PAY_01_PaymentHubPage } from './views/...';                │  │
│  │  export { PaymentForm } from './components/...';                     │  │
│  │  export { usePaymentActions } from './hooks/...';                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                         │
│                    Only exports what other features need                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Layer 3: `canon-pages/` - The GOVERNANCE Layer

### What It Is

```
canon-pages/               ← Canon governance (MDX files)
├── PAYMENT/
│   └── pay-01-payment-hub.mdx    ← PAY_01 page definition
├── META/
│   └── meta-02-god-view.mdx      ← META_02 page definition
└── registry.ts                    ← Central registry
```

### How It Works

```
MDX File = Structured Page Metadata

---
code: PAY_01
title: Payment Hub
route: /payments
domain: PAYMENT
status: active
---

# Payment Hub
Business-focused payment processing...

      ↓ Maps Canon Code to Implementation ↓

registry.ts:
'PAY_01' → PAY_01_PaymentHubPage (from src/features/payments)
```

### Visual: Governance Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CANON GOVERNANCE                                     │
│                                                                              │
│  canon-pages/PAYMENT/pay-01-payment-hub.mdx                                 │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ---                                                                    │  │
│  │ code: PAY_01                                                           │  │
│  │ title: Payment Hub                                                     │  │
│  │ route: /payments                                                       │  │
│  │ domain: PAYMENT                                                        │  │
│  │ status: active                                                         │  │
│  │ ---                                                                    │  │
│  │                                                                        │  │
│  │ # Payment Hub                                                          │  │
│  │ Business requirements...                                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                         │
│                         registry.ts (Maps to code)                          │
│                                    ↓                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ export const canonRegistry = {                                         │  │
│  │   'PAY_01': {                                                          │  │
│  │     code: 'PAY_01',                                                    │  │
│  │     route: '/payments',                                                │  │
│  │     component: () => import('@/features/payments'),  ←─────────┐      │  │
│  │   },                                                            │      │  │
│  │ };                                                              │      │  │
│  └───────────────────────────────────────────────────────────────│──────┘  │
│                                                                   │          │
└───────────────────────────────────────────────────────────────────┼─────────┘
                                                                    │
                                                                    ↓
                                            src/features/payments/views/
                                                PAY_01_PaymentHubPage.tsx
```

---

## 🔗 How All Three Layers Connect

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FULL REQUEST FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. User visits URL
   https://yourdomain.com/payments
         ↓

2. ROUTING LAYER (app/)
   ┌────────────────────────────────────────┐
   │ app/payments/page.tsx                  │
   │                                        │
   │ import { PAY_01 } from '@/features/...'│
   │ export default () => <PAY_01 />        │
   └────────────────────────────────────────┘
         ↓

3. FEATURE LAYER (src/features/)
   ┌────────────────────────────────────────┐
   │ src/features/payments/                 │
   │ views/PAY_01_PaymentHubPage.tsx        │
   │                                        │
   │ - Uses: BioRegistry adapters           │
   │ - Uses: BioCapabilities                │
   │ - Uses: BioTokens                      │
   │ - Calls: API handlers                  │
   └────────────────────────────────────────┘
         ↓

4. GOVERNANCE LAYER (canon-pages/)
   ┌────────────────────────────────────────┐
   │ canon-pages/PAYMENT/pay-01.mdx         │
   │                                        │
   │ Provides:                              │
   │ - Page metadata                        │
   │ - Business requirements                │
   │ - Canon code mapping                   │
   └────────────────────────────────────────┘
         ↓

5. USER SEES
   ┌────────────────────────────────────────┐
   │        Payment Hub Page                │
   │                                        │
   │  ┌──────────────────────────────────┐  │
   │  │ [Create Payment] [Import]        │  │
   │  │                                  │  │
   │  │ Payment Table                    │  │
   │  │ - Row 1: Invoice #123            │  │
   │  │ - Row 2: Invoice #124            │  │
   │  └──────────────────────────────────┘  │
   └────────────────────────────────────────┘
```

---

## 🎯 Business Domain Separation (Your Goal)

### Backend Alignment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          YOUR BACKEND (Already Clean)                        │
└─────────────────────────────────────────────────────────────────────────────┘

apps/
├── kernel/                ← Holding company (100% separate)
├── canon/finance/         ← Finance domain (100% separate)
├── canon/supplychain/     ← Supply chain domain (100% separate)
└── db/                    ← Database (100% separate)

         ✅ Each domain is isolated
         ✅ No mixing
         ✅ Easy to maintain
```

### Frontend Alignment (Recommended)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YOUR FRONTEND (Match Backend)                         │
└─────────────────────────────────────────────────────────────────────────────┘

apps/web/
├── app/                           ← THIN routing
│   ├── (kernel)/                  ← 🏢 Kernel routes
│   ├── (finance)/                 ← 🏦 Finance routes
│   └── (supply-chain)/            ← 🚚 Supply chain routes
│
└── src/features/                  ← THICK features
    ├── kernel/                    ← 🏢 Kernel domain (100% separate)
    │   ├── views/
    │   ├── components/
    │   └── hooks/
    ├── finance/                   ← 🏦 Finance domain (100% separate)
    │   ├── ap/
    │   ├── ar/
    │   └── gl/
    └── supply-chain/              ← 🚚 Supply chain domain (100% separate)
        ├── warehouse/
        └── cold-chain/

         ✅ Each domain is isolated (same as backend)
         ✅ No mixing (same as backend)
         ✅ Easy to maintain (same as backend)
```

---

## 🚀 Migration Example: Consolidate Payments

### Before (Scattered)

```
❌ SCATTERED CODE:

app/
├── payments/
│   ├── page.tsx                   ← Route
│   ├── _components/               ← Components
│   │   ├── PaymentForm.tsx
│   │   └── PaymentTable.tsx
│   └── _hooks/                    ← Hooks
│       └── usePaymentActions.ts

src/
├── components/
│   └── payments/                  ← More components
│       └── ApprovalButton.tsx
└── views/
    └── PAY_01_PaymentHubPage.tsx  ← View

app/api/
└── payments/
    └── route.ts                   ← API handler

Problem: Payment code in 5 different directories!
```

### After (Consolidated)

```
✅ CONSOLIDATED:

src/features/payments/             ← ONE directory for ALL payment code
├── views/
│   └── PAY_01_PaymentHubPage.tsx  ← Main page
├── components/
│   ├── PaymentForm.tsx
│   ├── PaymentTable.tsx
│   └── ApprovalButton.tsx
├── hooks/
│   └── usePaymentActions.ts
├── api/
│   └── payment-handlers.ts        ← API logic
└── index.ts                       ← Public API

app/payments/page.tsx              ← Thin route (5 lines)
  import { PAY_01 } from '@/features/payments';
  export default () => <PAY_01 />;

Benefit: ALL payment code in ONE place!
```

---

## 📊 Comparison: Current vs Recommended

| Aspect | Current (Mixed) | Recommended (Modular) |
|--------|----------------|----------------------|
| **Payment code location** | 5 directories | 1 directory (`features/payments/`) |
| **Route complexity** | 200 lines | 5 lines (thin) |
| **Testing** | Hard (scattered) | Easy (self-contained) |
| **Ownership** | Unclear | Clear (one team = one feature) |
| **Scalability** | Low (grows messy) | High (add new features cleanly) |
| **Alignment with backend** | ❌ Different | ✅ Same (isolated domains) |

---

## 🎯 Summary: Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              THE THREE LAYERS                                │
│                                                                              │
│  1. ROUTING (app/)              ← URLs → Pages (thin layer)                 │
│                                                                              │
│  2. IMPLEMENTATION (src/)       ← Business logic (thick layer)              │
│     └── features/               ← Self-contained domains                    │
│         ├── payments/           ← 100% payment code                         │
│         ├── finance/            ← 100% finance code                         │
│         └── kernel/             ← 100% kernel code                          │
│                                                                              │
│  3. GOVERNANCE (canon-pages/)   ← Metadata & Canon contracts               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

            ✅ Clean separation (like your backend)
            ✅ Easy to maintain
            ✅ Scalable
```

---

**Document Status:** ✅ Active  
**Created:** 2025-01-XX  
**Maintainer:** AI-BOS Frontend Architecture Team  
**Related:** FRONTEND_ARCHITECTURE_GUIDE.md, BIOSKIN_3_CUSTOMIZATION_GUIDE.md
