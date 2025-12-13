# REF_078: Hexagonal Next.js Structure — Complete Reorganization Guide

**Date:** 2025-01-27  
**Status:** 🟢 **ACTIVE**  
**Related:** ADR_003 (Monorepo Structure), REF_072 (Biological Architecture), CONT_01 (Canon Identity)  
**Purpose:** Complete guide for reorganizing Next.js app following Hexagonal, Cell-based, and Lego-style principles

---

## 🎯 Architecture Principles

### 1. **Hexagonal Architecture (Ports & Adapters)**

```
┌─────────────────────────────────────┐
│         ADAPTERS (Outer)            │
│  ┌───────────────────────────────┐ │
│  │      PORTS (Interfaces)        │ │
│  │  ┌─────────────────────────┐  │ │
│  │  │   DOMAIN (Core Logic)   │  │ │
│  │  └─────────────────────────┘  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Layers:**
- **Domain (Core):** Pure business logic, no framework dependencies
- **Ports:** Interfaces defining contracts (what we need)
- **Adapters:** Implementations (how we get it)

### 2. **Cell-Based (Biological Metaphor)**

```
DNA (Schemas) 
  → RNA (Translators)
    → Proteins (Atoms)
      → Cells (Components)
        → Tissues (Features)
          → Organs (Modules)
            → Skin (App)
```

### 3. **Lego-Style (Modularity)**

- **Self-contained:** Each piece works independently
- **Composable:** Pieces fit together seamlessly
- **Reusable:** Same piece works in multiple contexts
- **Clear interfaces:** Well-defined connection points

---

## 📁 Complete Directory Structure

```
AI-BOS-Finance/
│
├── app/                              # 🎯 NEXT.JS APP ROUTER (Skin Layer)
│   ├── (canon)/                      # Route Group: Canon Pages
│   │   ├── layout.tsx                # Canon-specific layout
│   │   └── canon/
│   │       ├── page.tsx              # Thin wrapper
│   │       └── [...slug]/
│   │           └── page.tsx          # Dynamic canon pages
│   │
│   ├── (payment)/                    # Route Group: Payment Domain
│   │   ├── layout.tsx                # Payment-specific layout
│   │   └── payments/
│   │       ├── page.tsx              # Thin wrapper → PAY_01
│   │       └── api/
│   │           └── route.ts          # Route Handler (BFF)
│   │
│   ├── (system)/                     # Route Group: System Domain
│   │   ├── layout.tsx                # System-specific layout
│   │   └── system/
│   │       ├── page.tsx              # Thin wrapper → SYS_01
│   │       └── api/
│   │           └── route.ts
│   │
│   ├── (metadata)/                   # Route Group: Metadata Domain
│   │   ├── layout.tsx
│   │   └── meta/
│   │       └── [slug]/
│   │           └── page.tsx
│   │
│   ├── api/                          # Global API Routes
│   │   └── health/
│   │       └── route.ts
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── providers.tsx                 # Client providers
│   └── globals.css
│
├── src/                              # 🧬 SOURCE CODE (Domain Layer)
│   │
│   ├── domain/                        # 🎯 DOMAIN (Hexagonal Core)
│   │   ├── payment/                  # Payment Domain
│   │   │   ├── core/                  # Pure business logic
│   │   │   │   ├── entities/          # Domain entities
│   │   │   │   │   ├── Payment.ts
│   │   │   │   │   ├── PaymentBatch.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── services/          # Domain services
│   │   │   │   │   ├── PaymentService.ts
│   │   │   │   │   ├── ApprovalService.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── value-objects/      # Value objects
│   │   │   │   │   ├── Money.ts
│   │   │   │   │   └── PaymentStatus.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── ports/                 # 🚪 PORTS (Interfaces)
│   │   │   │   ├── repositories/      # Data access interfaces
│   │   │   │   │   ├── IPaymentRepository.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── services/          # External service interfaces
│   │   │   │   │   ├── IApprovalService.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── adapters/              # 🔌 ADAPTERS (Implementations)
│   │   │       ├── repositories/      # Data access implementations
│   │   │       │   ├── PaymentRepository.ts
│   │   │       │   └── index.ts
│   │   │       ├── services/          # External service implementations
│   │   │       │   ├── ApprovalServiceAdapter.ts
│   │   │       │   └── index.ts
│   │   │       └── index.ts
│   │   │
│   │   ├── system/                    # System Domain
│   │   │   ├── core/
│   │   │   ├── ports/
│   │   │   └── adapters/
│   │   │
│   │   ├── metadata/                  # Metadata Domain
│   │   │   ├── core/
│   │   │   ├── ports/
│   │   │   └── adapters/
│   │   │
│   │   └── shared/                    # Shared Domain Logic
│   │       ├── entities/
│   │       └── value-objects/
│   │
│   ├── features/                      # 🧩 FEATURES (Cell Compositions)
│   │   ├── payment/                   # PAY_* Features
│   │   │   ├── payment-hub/           # PAY_01 Feature
│   │   │   │   ├── components/        # Feature-specific components
│   │   │   │   │   ├── PaymentHub.tsx
│   │   │   │   │   ├── FunctionalView.tsx
│   │   │   │   │   ├── EntityView.tsx
│   │   │   │   │   ├── AuditSidebar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── hooks/             # Feature hooks
│   │   │   │   │   ├── usePaymentApproval.ts
│   │   │   │   │   ├── useBatchApproval.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── schemas/           # Feature schemas (DNA)
│   │   │   │   │   ├── paymentSchema.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── actions/           # Server Actions
│   │   │   │   │   ├── approvePayment.action.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts           # Feature barrel export
│   │   │   │
│   │   │   └── shared/                # Shared payment components
│   │   │       └── components/
│   │   │
│   │   ├── system/                    # SYS_* Features
│   │   │   ├── bootloader/            # SYS_01 Feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── SysBootloader.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── hooks/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── organization/           # SYS_02 Feature
│   │   │       └── components/
│   │   │
│   │   └── metadata/                  # META_* Features
│   │       ├── god-view/              # META_02 Feature
│   │       ├── prism/                 # META_03 Feature
│   │       └── risk-radar/            # META_04 Feature
│   │
│   ├── infrastructure/                # 🔧 INFRASTRUCTURE (Adapters)
│   │   ├── api/                       # API clients
│   │   │   ├── payment/
│   │   │   │   └── paymentApi.ts
│   │   │   └── index.ts
│   │   ├── database/                  # Database adapters
│   │   │   └── repositories/
│   │   ├── cache/                     # Caching adapters
│   │   └── logging/                   # Logging adapters
│   │
│   └── lib/                           # 🛠️ SHARED UTILITIES
│       ├── utils.ts
│       ├── constants.ts
│       └── types.ts
│
├── packages/                          # 📦 SHARED PACKAGES (Proteins & Cells)
│   ├── ui/                            # 🧬 PROTEINS (Atoms)
│   │   └── src/
│   │       ├── atoms/                 # ATOM_* components
│   │       ├── primitives/            # PRIMITIVE_* components
│   │       ├── molecules/             # MOLECULE_* components
│   │       └── lib/
│   │
│   └── bioskin/                       # 🧬 CELLS (Generative Engine)
│       └── src/
│           ├── COMPONENT_*.tsx
│           └── MOLECULE_*.tsx
│
├── canon-pages/                       # 📄 CANON PAGES (MDX Content)
│   ├── META/
│   ├── PAYMENT/
│   └── SYSTEM/
│
└── canon/                             # 📜 GOVERNANCE (Immutable)
    └── [Canon Planes A-F]
```

---

## 🔍 Detailed Structure Explanation

### 1. **Domain Layer** (`src/domain/`) - Hexagonal Core

**Purpose:** Pure business logic with zero framework dependencies.

**Structure:**
```
domain/
└── payment/
    ├── core/              # Business logic (no React, no Next.js)
    │   ├── entities/      # Domain entities
    │   ├── services/      # Domain services
    │   └── value-objects/ # Value objects
    ├── ports/             # Interfaces (what we need)
    │   ├── repositories/  # Data access contracts
    │   └── services/     # External service contracts
    └── adapters/          # Implementations (how we get it)
        ├── repositories/  # Data access implementations
        └── services/     # External service implementations
```

**Code Example:**

```typescript
// src/domain/payment/core/entities/Payment.ts
/**
 * Domain Entity - Pure business logic
 * No framework dependencies (no React, no Next.js)
 */
export class Payment {
  constructor(
    public readonly id: string,
    public readonly amount: Money,
    public readonly status: PaymentStatus,
    public readonly createdAt: Date
  ) {}

  /**
   * Domain method - business rule
   */
  canBeApproved(): boolean {
    return this.status === PaymentStatus.PENDING && 
           this.amount.isPositive()
  }

  /**
   * Domain method - state transition
   */
  approve(): Payment {
    if (!this.canBeApproved()) {
      throw new Error('Payment cannot be approved')
    }
    return new Payment(
      this.id,
      this.amount,
      PaymentStatus.APPROVED,
      this.createdAt
    )
  }
}

// src/domain/payment/core/value-objects/Money.ts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }
  }

  isPositive(): boolean {
    return this.amount > 0
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies')
    }
    return new Money(this.amount + other.amount, this.currency)
  }
}
```

**Why This Structure:**
- ✅ **Testable:** Pure functions, easy to unit test
- ✅ **Framework-agnostic:** Can switch from Next.js to any framework
- ✅ **Reusable:** Same business logic works in API, CLI, or UI
- ✅ **Clear boundaries:** Domain logic isolated from infrastructure

---

### 2. **Ports Layer** (`src/domain/*/ports/`) - Interfaces

**Purpose:** Define contracts (what we need) without implementation details.

**Code Example:**

```typescript
// src/domain/payment/ports/repositories/IPaymentRepository.ts
/**
 * Port - Interface defining what we need
 * No implementation details
 */
export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>
  findAll(): Promise<Payment[]>
  save(payment: Payment): Promise<void>
  findByStatus(status: PaymentStatus): Promise<Payment[]>
}

// src/domain/payment/ports/services/IApprovalService.ts
export interface IApprovalService {
  requestApproval(payment: Payment): Promise<ApprovalResult>
  checkApprovalStatus(paymentId: string): Promise<ApprovalStatus>
}
```

**Why Ports:**
- ✅ **Dependency Inversion:** Domain depends on abstractions, not implementations
- ✅ **Testable:** Easy to mock in tests
- ✅ **Flexible:** Can swap implementations (SQL → MongoDB → API)

---

### 3. **Adapters Layer** (`src/domain/*/adapters/`) - Implementations

**Purpose:** Implement ports using specific technologies (Next.js, Database, APIs).

**Code Example:**

```typescript
// src/domain/payment/adapters/repositories/PaymentRepository.ts
/**
 * Adapter - Implementation of port
 * Uses Next.js Server Actions or API routes
 */
import { IPaymentRepository } from '../../ports/repositories/IPaymentRepository'
import { Payment } from '../../core/entities/Payment'

export class PaymentRepository implements IPaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    // Implementation using Next.js API route or Server Action
    const response = await fetch(`/api/payments/${id}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return Payment.fromJSON(data)
  }

  async save(payment: Payment): Promise<void> {
    await fetch('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payment.toJSON())
    })
  }
}

// src/infrastructure/api/payment/paymentApi.ts
/**
 * Infrastructure adapter - API client
 * Handles HTTP communication
 */
export class PaymentApi {
  async getPayment(id: string) {
    const response = await fetch(`/api/payments/${id}`)
    return response.json()
  }
}
```

**Why Adapters:**
- ✅ **Separation:** Infrastructure details isolated from domain
- ✅ **Swappable:** Can change from REST API to GraphQL without touching domain
- ✅ **Testable:** Can mock adapters in domain tests

---

### 4. **Features Layer** (`src/features/`) - Cell Compositions

**Purpose:** React components and UI logic that compose domain + infrastructure.

**Structure:**
```
features/
└── payment/
    └── payment-hub/          # PAY_01 Feature
        ├── components/        # UI components
        ├── hooks/            # React hooks
        ├── schemas/          # Zod schemas (DNA)
        ├── actions/          # Server Actions
        └── index.ts          # Barrel export
```

**Code Example:**

```typescript
// src/features/payment/payment-hub/components/PaymentHub.tsx
'use client'

/**
 * Feature Component - Composes domain + UI
 * Uses domain entities and adapters
 */
import { Payment } from '@/domain/payment/core/entities/Payment'
import { PaymentRepository } from '@/domain/payment/adapters/repositories/PaymentRepository'
import { usePaymentApproval } from '../hooks/usePaymentApproval'
import { Surface, Txt, Btn } from '@aibos/ui'

export function PaymentHub() {
  const repository = new PaymentRepository()
  const { approvePayment } = usePaymentApproval(repository)

  const handleApprove = async (payment: Payment) => {
    if (payment.canBeApproved()) {
      await approvePayment(payment)
    }
  }

  return (
    <Surface>
      <Txt variant="h1">Payment Hub</Txt>
      {/* UI implementation */}
    </Surface>
  )
}

// src/features/payment/payment-hub/hooks/usePaymentApproval.ts
/**
 * Feature Hook - React integration with domain
 */
import { useState } from 'react'
import { Payment } from '@/domain/payment/core/entities/Payment'
import { IPaymentRepository } from '@/domain/payment/ports/repositories/IPaymentRepository'

export function usePaymentApproval(repository: IPaymentRepository) {
  const [loading, setLoading] = useState(false)

  const approvePayment = async (payment: Payment) => {
    setLoading(true)
    try {
      const approved = payment.approve() // Domain method
      await repository.save(approved)     // Adapter method
    } finally {
      setLoading(false)
    }
  }

  return { approvePayment, loading }
}
```

**Why Features:**
- ✅ **Colocation:** Related code stays together
- ✅ **Composable:** Features can be combined
- ✅ **Testable:** Can test features independently

---

### 5. **App Router** (`app/`) - Skin Layer

**Purpose:** Thin wrappers that connect routes to features.

**Code Example:**

```typescript
// app/(payment)/payments/page.tsx
/**
 * Next.js Route - Thin wrapper
 * Maximum 20 lines
 */
import { PaymentHub } from '@/features/payment/payment-hub'

export const PAGE_META = {
  code: 'PAY_01',
  version: '1.0.0',
  name: 'Payment Hub',
  route: '/payments',
  domain: 'PAYMENT',
  status: 'active',
} as const

export default function PaymentsPage() {
  return <PaymentHub />
}

// app/(payment)/payments/api/route.ts
/**
 * Route Handler (BFF) - Uses domain + adapters
 */
import { NextRequest, NextResponse } from 'next/server'
import { PaymentRepository } from '@/domain/payment/adapters/repositories/PaymentRepository'
import { Payment } from '@/domain/payment/core/entities/Payment'

export async function GET(request: NextRequest) {
  const repository = new PaymentRepository()
  const payments = await repository.findAll()
  
  return NextResponse.json(payments.map(p => p.toJSON()))
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const payment = Payment.fromJSON(data)
  
  const repository = new PaymentRepository()
  await repository.save(payment)
  
  return NextResponse.json({ success: true })
}
```

**Why Thin Wrappers:**
- ✅ **Framework-agnostic:** Business logic in features, not routes
- ✅ **Testable:** Can test features without Next.js
- ✅ **Portable:** Can move features to other frameworks

---

## 🔄 Dependency Flow (Hexagonal)

```
┌─────────────────────────────────────────┐
│  app/ (Routes)                          │  ← Skin (Outermost)
│    ↓ imports                            │
│  src/features/ (Components)            │  ← Tissues
│    ↓ imports                            │
│  src/domain/*/adapters/ (Implementations)│  ← Adapters
│    ↓ implements                         │
│  src/domain/*/ports/ (Interfaces)      │  ← Ports
│    ↓ used by                            │
│  src/domain/*/core/ (Business Logic)    │  ← Domain (Innermost)
└─────────────────────────────────────────┘
```

**Rules:**
1. ✅ **Domain** has NO dependencies (pure TypeScript)
2. ✅ **Ports** depend only on Domain
3. ✅ **Adapters** implement Ports, use Infrastructure
4. ✅ **Features** use Domain + Adapters
5. ✅ **App** imports Features only

---

## 🧬 Cell-Based Flow (Biological)

```
DNA (Zod Schemas)
  ↓
RNA (Schema Introspector)
  ↓
Proteins (@aibos/ui atoms)
  ↓
Cells (BioSkin components)
  ↓
Tissues (Feature components)
  ↓
Organs (Domain modules)
  ↓
Skin (App routes)
```

**Code Example:**

```typescript
// 1. DNA - Schema Definition
// src/features/payment/payment-hub/schemas/paymentSchema.ts
import { z } from 'zod'

export const PaymentSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: z.enum(['pending', 'approved', 'rejected']),
})

// 2. RNA - Schema Introspector (translates DNA → Kernel)
// packages/bioskin/src/ZodSchemaIntrospector.ts
export function introspectSchema(schema: z.ZodObject) {
  // Translates Zod schema to BioSkin kernel format
  return generateKernelFromZod(schema)
}

// 3. Proteins - Atomic UI Components
// packages/ui/src/atoms/ATOM_003_Btn.tsx
export function Btn({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>
}

// 4. Cells - BioSkin Components (compose Proteins)
// packages/bioskin/src/COMPONENT_001_BioObject.tsx
import { Btn, Surface, Txt } from '@aibos/ui'

export function BioObject({ schema, data }) {
  const kernel = introspectSchema(schema)
  return (
    <Surface>
      {kernel.fields.map(field => (
        <Txt key={field.name}>{data[field.name]}</Txt>
      ))}
      <Btn>Submit</Btn>
    </Surface>
  )
}

// 5. Tissues - Feature Components (compose Cells)
// src/features/payment/payment-hub/components/PaymentForm.tsx
import { BioObject } from '@aibos/bioskin'
import { PaymentSchema } from '../schemas/paymentSchema'

export function PaymentForm() {
  return <BioObject schema={PaymentSchema} data={paymentData} />
}

// 6. Organs - Domain Logic (pure business rules)
// src/domain/payment/core/entities/Payment.ts
export class Payment {
  // Pure business logic
}

// 7. Skin - App Routes (thin wrappers)
// app/(payment)/payments/page.tsx
import { PaymentForm } from '@/features/payment/payment-hub'

export default function PaymentsPage() {
  return <PaymentForm />
}
```

---

## 🧩 Lego-Style Principles

### 1. **Self-Contained Pieces**

Each module/feature is independent:

```typescript
// src/features/payment/payment-hub/index.ts
/**
 * Barrel export - Single entry point
 * Everything needed is exported here
 */
export { PaymentHub } from './components/PaymentHub'
export { usePaymentApproval } from './hooks/usePaymentApproval'
export { PaymentSchema } from './schemas/paymentSchema'
export type { PaymentFormData } from './schemas/paymentSchema'
```

### 2. **Composable Pieces**

Features can be combined:

```typescript
// src/features/payment/payment-hub/components/PaymentDashboard.tsx
import { PaymentHub } from './PaymentHub'
import { AuditSidebar } from './AuditSidebar'
import { TreasuryHeader } from './TreasuryHeader'

export function PaymentDashboard() {
  return (
    <>
      <TreasuryHeader />
      <PaymentHub />
      <AuditSidebar />
    </>
  )
}
```

### 3. **Clear Interfaces**

Well-defined connection points:

```typescript
// src/domain/payment/ports/repositories/IPaymentRepository.ts
export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>
  // Clear contract - any implementation must follow this
}
```

---

## 📋 Migration Checklist

### Phase 1: Create Domain Structure
- [ ] Create `src/domain/` directory
- [ ] Create domain entities (Payment, System, Metadata)
- [ ] Create value objects (Money, PaymentStatus)
- [ ] Create domain services

### Phase 2: Create Ports & Adapters
- [ ] Create port interfaces (`IPaymentRepository`, etc.)
- [ ] Create adapter implementations
- [ ] Wire adapters to Next.js API routes

### Phase 3: Reorganize Features
- [ ] Move `modules/` → `src/features/`
- [ ] Organize by feature (payment-hub, bootloader, etc.)
- [ ] Create feature barrel exports

### Phase 4: Update App Routes
- [ ] Create route groups `(payment)`, `(system)`, `(metadata)`
- [ ] Convert pages to thin wrappers
- [ ] Move API routes to `app/*/api/route.ts`

### Phase 5: Update Imports
- [ ] Update all imports to new structure
- [ ] Verify dependency flow
- [ ] Run tests

---

## 🎯 Key Benefits

1. **Hexagonal Architecture:**
   - ✅ Domain logic isolated from framework
   - ✅ Easy to test business logic
   - ✅ Can swap implementations

2. **Cell-Based:**
   - ✅ Clear biological metaphor
   - ✅ DNA → RNA → Proteins → Cells flow
   - ✅ Self-organizing structure

3. **Lego-Style:**
   - ✅ Composable pieces
   - ✅ Reusable components
   - ✅ Clear interfaces

4. **Next.js Best Practices:**
   - ✅ Route groups for organization
   - ✅ Thin wrappers in routes
   - ✅ Server Actions for mutations
   - ✅ Colocation of related code

---

**End of Guide**
