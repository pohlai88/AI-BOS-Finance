# REF_079: Migration Guide — Reorganizing to Hexagonal Structure

**Date:** 2025-01-27  
**Status:** 🟢 **ACTIVE**  
**Related:** REF_078 (Hexagonal Structure), ADR_003 (Monorepo Structure)  
**Purpose:** Step-by-step guide for migrating existing code to hexagonal structure

---

## 🎯 Migration Overview

This guide shows how to migrate existing code from `modules/` to the new hexagonal structure:

```
OLD: modules/payment/PAY_01_PaymentHub.tsx
NEW: src/features/payment/payment-hub/components/PaymentHub.tsx
     src/domain/payment/core/entities/Payment.ts
```

---

## 📋 Step-by-Step Migration

### Step 1: Extract Domain Logic

**Current Code:**
```typescript
// modules/payment/PAY_01_PaymentHub.tsx
export function PaymentHub() {
  const [payments, setPayments] = useState([])
  
  const approvePayment = async (id: string) => {
    // Business logic mixed with UI
    if (payment.status !== 'pending') return
    await fetch(`/api/payments/${id}/approve`, { method: 'POST' })
  }
}
```

**New Structure:**

1. **Create Domain Entity:**
```typescript
// src/domain/payment/core/entities/Payment.ts
export class Payment {
  canBeApproved(): boolean {
    return this.status === PaymentStatus.PENDING
  }
  
  approve(approvedBy: string): Payment {
    if (!this.canBeApproved()) {
      throw new Error('Payment cannot be approved')
    }
    return new Payment(/* ... */)
  }
}
```

2. **Create Port Interface:**
```typescript
// src/domain/payment/ports/repositories/IPaymentRepository.ts
export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>
  save(payment: Payment): Promise<void>
}
```

3. **Create Adapter:**
```typescript
// src/domain/payment/adapters/repositories/PaymentRepository.ts
export class PaymentRepository implements IPaymentRepository {
  async save(payment: Payment) {
    await fetch(`/api/payments/${payment.id}`, {
      method: 'POST',
      body: JSON.stringify(payment.toJSON())
    })
  }
}
```

---

### Step 2: Create Feature Component

**New Feature Component:**
```typescript
// src/features/payment/payment-hub/components/PaymentHub.tsx
'use client'

import { Payment } from '@/domain/payment/core/entities/Payment'
import { PaymentRepository } from '@/domain/payment/adapters/repositories/PaymentRepository'
import { usePaymentApproval } from '../hooks/usePaymentApproval'

export function PaymentHub() {
  const repository = new PaymentRepository()
  const { approvePayment } = usePaymentApproval(repository)
  
  const handleApprove = async (payment: Payment) => {
    await approvePayment(payment, 'user_id')
  }
  
  return <div>...</div>
}
```

---

### Step 3: Create Feature Hook

**New Hook:**
```typescript
// src/features/payment/payment-hub/hooks/usePaymentApproval.ts
import { Payment } from '@/domain/payment/core/entities/Payment'
import type { IPaymentRepository } from '@/domain/payment/ports/repositories/IPaymentRepository'

export function usePaymentApproval(repository: IPaymentRepository) {
  const approvePayment = async (payment: Payment, approvedBy: string) => {
    // Domain logic
    if (!payment.canBeApproved()) {
      throw new Error('Payment cannot be approved')
    }
    
    const approved = payment.approve(approvedBy)
    await repository.save(approved)
    
    return approved
  }
  
  return { approvePayment }
}
```

---

### Step 4: Update App Route

**Current Route:**
```typescript
// app/payments/page.tsx
import { PaymentHubPage } from '@/modules/payment'

export default function PaymentsPage() {
  return <PaymentHubPage />
}
```

**New Route:**
```typescript
// app/(payment)/payments/page.tsx
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
```

---

## 🔄 Migration Checklist

### Payment Domain
- [ ] Extract `Payment` entity to `src/domain/payment/core/entities/Payment.ts`
- [ ] Extract `Money` value object to `src/domain/payment/core/value-objects/Money.ts`
- [ ] Create `IPaymentRepository` port
- [ ] Create `PaymentRepository` adapter
- [ ] Move `PAY_01_PaymentHub.tsx` → `src/features/payment/payment-hub/components/PaymentHub.tsx`
- [ ] Extract hooks to `src/features/payment/payment-hub/hooks/`
- [ ] Update imports in `app/(payment)/payments/page.tsx`

### System Domain
- [ ] Extract `System` entity to `src/domain/system/core/entities/`
- [ ] Move `SYS_01_SysBootloaderPage.tsx` → `src/features/system/bootloader/components/`
- [ ] Update imports in `app/(system)/system/page.tsx`

### Metadata Domain
- [ ] Extract `Metadata` entity to `src/domain/metadata/core/entities/`
- [ ] Move `META_*` components to `src/features/metadata/*/components/`
- [ ] Update imports in `app/(metadata)/meta/*/page.tsx`

---

## 📝 Code Examples

### Example 1: Domain Entity Migration

**Before:**
```typescript
// modules/payment/data/paymentSchema.ts
export interface Payment {
  id: string
  amount: number
  status: string
}

export function canApprove(payment: Payment): boolean {
  return payment.status === 'pending'
}
```

**After:**
```typescript
// src/domain/payment/core/entities/Payment.ts
export class Payment {
  constructor(
    public readonly id: string,
    public readonly amount: Money,
    public readonly status: PaymentStatus
  ) {}
  
  canBeApproved(): boolean {
    return this.status === PaymentStatus.PENDING
  }
}
```

---

### Example 2: Feature Component Migration

**Before:**
```typescript
// modules/payment/PAY_01_PaymentHub.tsx
export function PaymentHub() {
  const [payments, setPayments] = useState([])
  
  useEffect(() => {
    fetch('/api/payments')
      .then(res => res.json())
      .then(setPayments)
  }, [])
  
  const approve = async (id: string) => {
    await fetch(`/api/payments/${id}/approve`, { method: 'POST' })
    // Refresh
  }
}
```

**After:**
```typescript
// src/features/payment/payment-hub/components/PaymentHub.tsx
import { PaymentRepository } from '@/domain/payment/adapters/repositories/PaymentRepository'
import { usePaymentApproval } from '../hooks/usePaymentApproval'

export function PaymentHub() {
  const repository = new PaymentRepository()
  const { approvePayment } = usePaymentApproval(repository)
  
  useEffect(() => {
    repository.findAll().then(setPayments)
  }, [])
  
  const handleApprove = async (payment: Payment) => {
    await approvePayment(payment, 'user_id')
    await loadPayments()
  }
}
```

---

## ✅ Benefits After Migration

1. **Testable:** Domain logic can be tested without React/Next.js
2. **Reusable:** Same domain logic works in API, CLI, or UI
3. **Maintainable:** Clear separation of concerns
4. **Scalable:** Easy to add new features following the same pattern

---

**End of Guide**
