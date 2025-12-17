# AR-01 Customer Master — Next.js Implementation Guide

> **🟢 [ACTIVE]** — Best Practices for IMMORTAL-Grade Implementation  
> **Cell Code:** AR-01  
> **Version:** 1.1.0  
> **Target:** Next.js 14+ App Router  
> **Principles:** DRY, Efficient, Secure, Testable

---

## 🏗️ Architecture Overview

```
apps/web/
├── app/api/ar/customers/           # API Routes (BFF Layer)
│   ├── route.ts                    # GET list, POST create
│   ├── [id]/
│   │   ├── route.ts                # GET, PUT single
│   │   ├── submit/route.ts         # POST submit
│   │   ├── approve/route.ts        # POST approve
│   │   ├── reject/route.ts         # POST reject
│   │   ├── suspend/route.ts        # POST suspend
│   │   ├── reactivate/route.ts     # POST reactivate
│   │   ├── archive/route.ts        # POST archive
│   │   └── credit-limit/
│   │       ├── change-request/route.ts
│   │       └── approve-change/route.ts
│   └── dashboard/route.ts          # GET dashboard data
│
├── features/customer/              # Feature Module
│   ├── schemas/                    # Zod schemas (SSOT)
│   │   ├── index.ts               # Barrel export
│   │   ├── customer.schema.ts     # Customer schemas
│   │   └── credit-limit.schema.ts # Credit limit schemas
│   ├── services/                   # Service wiring
│   │   └── customer-services.server.ts
│   ├── hooks/                      # React Query hooks
│   │   ├── useCustomers.ts
│   │   ├── useCustomer.ts
│   │   └── useCustomerMutations.ts
│   └── components/                 # UI Components
│       ├── CustomerForm.tsx
│       ├── CustomerTable.tsx
│       └── CustomerApprovalQueue.tsx
│
└── lib/
    ├── api/                        # Shared API infrastructure (already exists)
    ├── customer-services.server.ts # Service factory
    └── customer-error-handler.ts   # Domain-specific errors
```

---

## 1. Schema-First Design (DRY SSOT)

Define schemas **once**, reuse everywhere:

```typescript
// features/customer/schemas/customer.schema.ts
import { z } from 'zod';

// =============================================================================
// BASE SCHEMA (Database shape - SSOT)
// =============================================================================

export const CustomerBaseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerCode: z.string(),
  legalName: z.string().min(2),
  displayName: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  country: z.string().length(3),
  currencyPreference: z.string().length(3).default('USD'),
  customerCategory: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  creditLimit: z.coerce.number().nonnegative(),
  currentBalance: z.coerce.number().default(0),
  availableCredit: z.coerce.number(),
  defaultPaymentTerms: z.number().int().positive().default(30),
  status: z.enum(['draft', 'submitted', 'approved', 'suspended', 'archived']),
  createdBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
  version: z.number().int(),
});

export type Customer = z.infer<typeof CustomerBaseSchema>;

// =============================================================================
// INPUT SCHEMAS (API payloads - derived from base)
// =============================================================================

// Create - only mutable fields
export const CreateCustomerInputSchema = CustomerBaseSchema.pick({
  legalName: true,
  displayName: true,
  taxId: true,
  registrationNumber: true,
  country: true,
  currencyPreference: true,
  customerCategory: true,
  riskLevel: true,
  creditLimit: true,
  defaultPaymentTerms: true,
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;

// Update - partial of mutable fields + version (optimistic locking)
export const UpdateCustomerInputSchema = CreateCustomerInputSchema
  .partial()
  .extend({
    version: z.number().int(), // Required for optimistic locking
  });

export type UpdateCustomerInput = z.infer<typeof UpdateCustomerInputSchema>;

// =============================================================================
// QUERY SCHEMAS (URL params)
// =============================================================================

export const ListCustomersQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'suspended', 'archived']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type ListCustomersQuery = z.infer<typeof ListCustomersQuerySchema>;

// =============================================================================
// ACTION SCHEMAS (State transitions)
// =============================================================================

export const SubmitCustomerInputSchema = z.object({
  version: z.number().int(),
});

export const ApproveCustomerInputSchema = z.object({
  version: z.number().int(),
  comments: z.string().optional(),
});

export const RejectCustomerInputSchema = z.object({
  version: z.number().int(),
  reason: z.string().min(1, 'Rejection reason is required'),
});

export const SuspendCustomerInputSchema = z.object({
  version: z.number().int(),
  reason: z.string().min(1, 'Suspension reason is required'),
});
```

---

## 2. API Route Pattern (DRY + Secure)

### 2.1 Use the `apiRoute` Composer

```typescript
// app/api/ar/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  apiRoute, 
  RateLimitPresets,
  ValidationError,
  assertExists,
} from '@/lib/api';
import { 
  CreateCustomerInputSchema, 
  ListCustomersQuerySchema,
} from '@/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';

// =============================================================================
// GET /api/ar/customers - List Customers
// =============================================================================

export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request, actor) => {
    const { searchParams } = new URL(request.url);
    
    // Parse & validate query
    const query = ListCustomersQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      riskLevel: searchParams.get('riskLevel') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });
    
    if (!query.success) {
      throw ValidationError.fromZod(query.error);
    }
    
    const service = await getCustomerService();
    const result = await service.list(query.data, actor);
    
    return NextResponse.json(result);
  }
);

// =============================================================================
// POST /api/ar/customers - Create Customer
// =============================================================================

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  async (request, actor) => {
    const body = await request.json();
    
    const input = CreateCustomerInputSchema.safeParse(body);
    if (!input.success) {
      throw ValidationError.fromZod(input.error);
    }
    
    const service = await getCustomerService();
    const customer = await service.create(input.data, actor);
    
    return NextResponse.json(customer, { status: 201 });
  }
);
```

### 2.2 Single Resource + Actions Pattern

```typescript
// app/api/ar/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiRoute, RateLimitPresets, NotFoundError } from '@/lib/api';
import { UpdateCustomerInputSchema } from '@/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';

type Params = { params: Promise<{ id: string }> };

// GET /api/ar/customers/:id
export const GET = apiRoute(
  RateLimitPresets.READ,
  async (request, actor, { params }: Params) => {
    const { id } = await params;
    
    const service = await getCustomerService();
    const customer = await service.getById(id, actor);
    
    if (!customer) {
      throw new NotFoundError('Customer', id);
    }
    
    return NextResponse.json(customer);
  }
);

// PUT /api/ar/customers/:id
export const PUT = apiRoute(
  RateLimitPresets.MUTATION,
  async (request, actor, { params }: Params) => {
    const { id } = await params;
    const body = await request.json();
    
    const input = UpdateCustomerInputSchema.safeParse(body);
    if (!input.success) {
      throw ValidationError.fromZod(input.error);
    }
    
    const service = await getCustomerService();
    const customer = await service.update(id, input.data, actor);
    
    return NextResponse.json(customer);
  }
);
```

### 2.3 State Transition Actions (DRY Pattern)

```typescript
// app/api/ar/customers/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiRoute, RateLimitPresets, requirePermission } from '@/lib/api';
import { ApproveCustomerInputSchema } from '@/features/customer/schemas';
import { getCustomerService } from '@/lib/customer-services.server';

type Params = { params: Promise<{ id: string }> };

export const POST = apiRoute(
  RateLimitPresets.MUTATION,
  requirePermission('ar.customer.approve', async (request, actor, { params }: Params) => {
    const { id } = await params;
    const body = await request.json();
    
    const input = ApproveCustomerInputSchema.safeParse(body);
    if (!input.success) {
      throw ValidationError.fromZod(input.error);
    }
    
    const service = await getCustomerService();
    const customer = await service.approve(id, input.data, actor);
    
    return NextResponse.json(customer);
  })
);
```

---

## 3. Service Wiring (Hexagonal DI)

```typescript
// lib/customer-services.server.ts
import 'server-only';
import { cache } from 'react';
import { 
  CustomerService,
  CustomerRepositoryPort,
  AuditOutboxPort,
  PolicyPort,
  SequencePort,
} from '@aibos/kernel-core';
import { 
  SqlCustomerAdapter,
  SqlAuditOutboxAdapter,
  SqlPolicyAdapter,
  SqlSequenceAdapter,
} from '@aibos/kernel-adapters';
import { getPool } from '@/lib/db';
import { getActorFromSession } from '@/lib/session';

// =============================================================================
// SERVICE FACTORY (Singleton per request)
// =============================================================================

export const getCustomerService = cache(async () => {
  const pool = await getPool();
  
  // Wire adapters → ports → service
  const customerRepo: CustomerRepositoryPort = new SqlCustomerAdapter(pool);
  const auditOutbox: AuditOutboxPort = new SqlAuditOutboxAdapter(pool);
  const policyPort: PolicyPort = new SqlPolicyAdapter(pool);
  const sequencePort: SequencePort = new SqlSequenceAdapter(pool);
  
  return new CustomerService(
    customerRepo,
    auditOutbox,
    policyPort,
    sequencePort
  );
});

// =============================================================================
// ACTOR CONTEXT (Session-based)
// =============================================================================

export const getCustomerActorContext = cache(async () => {
  const session = await getActorFromSession();
  return {
    tenantId: session.tenantId,
    userId: session.userId,
    permissions: session.permissions,
  };
});
```

---

## 4. Error Handling (Domain-Specific)

```typescript
// lib/customer-error-handler.ts
import { NextResponse } from 'next/server';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  ConflictError,
  InvalidStateError,
  SoDViolationError,
  handleApiError,
} from '@/lib/api';
import { CustomerCellError } from '@aibos/kernel-core';

// Map domain errors to API errors
export function handleCustomerError(
  error: unknown,
  operation: string
): NextResponse {
  // Map domain-specific errors
  if (error instanceof CustomerCellError) {
    switch (error.code) {
      case 'CUSTOMER_NOT_FOUND':
        throw new NotFoundError('Customer', error.details?.customerId);
      case 'DUPLICATE_CUSTOMER_CODE':
        throw new ConflictError('Customer code already exists', error.details);
      case 'INVALID_STATE_TRANSITION':
        throw new InvalidStateError(
          error.details?.currentStatus,
          error.details?.targetStatus
        );
      case 'SOD_VIOLATION':
        throw new SoDViolationError('approve', 'create');
      case 'ARCHIVED_IMMUTABLE':
        throw new InvalidStateError('archived', 'any', 'Archived customers cannot be modified');
    }
  }
  
  // Re-throw API errors as-is
  if (error instanceof ApiError) {
    throw error;
  }
  
  // Wrap unknown errors
  console.error(`Customer ${operation} failed:`, error);
  throw error;
}
```

---

## 5. React Query Hooks (Client-Side DRY)

```typescript
// features/customer/hooks/useCustomers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer, CreateCustomerInput, ListCustomersQuery } from '../schemas';

const QUERY_KEY = ['customers'];

// =============================================================================
// LIST HOOK
// =============================================================================

export function useCustomers(query: ListCustomersQuery = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.status) params.set('status', query.status);
      if (query.riskLevel) params.set('riskLevel', query.riskLevel);
      if (query.search) params.set('search', query.search);
      params.set('limit', String(query.limit ?? 50));
      params.set('offset', String(query.offset ?? 0));
      
      const res = await fetch(`/api/ar/customers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json() as Promise<{ data: Customer[]; total: number }>;
    },
  });
}

// =============================================================================
// SINGLE HOOK
// =============================================================================

export function useCustomer(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/ar/customers/${id}`);
      if (!res.ok) throw new Error('Customer not found');
      return res.json() as Promise<Customer>;
    },
    enabled: !!id,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      const res = await fetch('/api/ar/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json() as Promise<Customer>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useApproveCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: number }) => {
      const res = await fetch(`/api/ar/customers/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json() as Promise<Customer>;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
```

---

## 6. Permissions Configuration

```typescript
// lib/api/permissions/ar-permissions.ts
export const ARPermissions = {
  // Customer Master
  'ar.customer.create': 'Create customer (draft)',
  'ar.customer.read': 'View customers',
  'ar.customer.update': 'Update customer (draft only)',
  'ar.customer.submit': 'Submit customer for approval',
  'ar.customer.approve': 'Approve/reject customers',
  'ar.customer.archive': 'Archive customers',
  
  // Credit Limit
  'ar.credit.request': 'Request credit limit change',
  'ar.credit.approve': 'Approve credit limit change',
} as const;

export type ARPermission = keyof typeof ARPermissions;
```

---

## 7. Server Components (Page Layer)

```typescript
// app/(dashboard)/ar/customers/page.tsx
import { Suspense } from 'react';
import { CustomerTable } from '@/features/customer/components/CustomerTable';
import { CustomerTableSkeleton } from '@/features/customer/components/CustomerTableSkeleton';
import { getCustomerService, getCustomerActorContext } from '@/lib/customer-services.server';

export const metadata = {
  title: 'Customers | AR',
};

// Server Component — Fetches initial data
export default async function CustomersPage() {
  const [service, actor] = await Promise.all([
    getCustomerService(),
    getCustomerActorContext(),
  ]);
  
  const initialData = await service.list({ limit: 50, offset: 0 }, actor);
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Customer Master</h1>
      
      <Suspense fallback={<CustomerTableSkeleton />}>
        <CustomerTable initialData={initialData} />
      </Suspense>
    </div>
  );
}
```

---

## 8. Performance Optimizations

### 8.1 Request Deduplication

```typescript
// Service factory uses React cache() for request-level deduplication
export const getCustomerService = cache(async () => {
  // Called once per request, even if invoked multiple times
});
```

### 8.2 Parallel Data Fetching

```typescript
// Fetch multiple resources in parallel
const [customers, approvalQueue, dashboardStats] = await Promise.all([
  service.list(query, actor),
  service.getApprovalQueue(actor),
  service.getDashboardStats(actor),
]);
```

### 8.3 Streaming with Suspense

```typescript
// page.tsx
export default async function Page() {
  return (
    <div>
      <Suspense fallback={<StatsCardSkeleton />}>
        <DashboardStats />
      </Suspense>
      
      <Suspense fallback={<TableSkeleton />}>
        <CustomerTable />
      </Suspense>
    </div>
  );
}
```

### 8.4 Cache Invalidation

```typescript
// On mutation, invalidate related caches
import { revalidatePath, revalidateTag } from 'next/cache';

export async function approveCustomer(id: string, input: ApproveCustomerInput) {
  const result = await service.approve(id, input, actor);
  
  // Invalidate server-side caches
  revalidatePath('/ar/customers');
  revalidateTag('customers');
  
  return result;
}
```

---

## 9. Security Checklist (from ADR_002)

| Check | Implementation |
|-------|----------------|
| ✅ Never trust client CanonContext | Derive from server session |
| ✅ Authenticate every request | `apiRoute()` includes `requireAuth()` |
| ✅ Validate all input with Zod | Schema validation before service call |
| ✅ Check permissions | `requirePermission('ar.customer.approve')` |
| ✅ Enforce SoD | Service layer checks `createdBy !== approverId` |
| ✅ Don't expose internal errors | `handleApiError()` sanitizes messages |
| ✅ Rate limit endpoints | `RateLimitPresets.MUTATION` |
| ✅ Log with context | Request ID + tenant ID in all logs |

---

## 10. Testing Strategy

### 10.1 Unit Tests (Service Layer)

```typescript
// __tests__/CustomerService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CustomerService } from '../CustomerService';
import { createMockCustomerRepo } from './__mocks__/customerRepo';

describe('CustomerService', () => {
  it('should enforce SoD on approval', async () => {
    const repo = createMockCustomerRepo();
    const service = new CustomerService(repo, mockAudit, mockPolicy, mockSeq);
    
    const customer = { id: '1', createdBy: 'user-1', status: 'submitted' };
    repo.getById.mockResolvedValue(customer);
    
    await expect(
      service.approve('1', { version: 1 }, { userId: 'user-1' }) // Same user
    ).rejects.toThrow('SoD violation');
  });
});
```

### 10.2 Integration Tests (API Routes)

```typescript
// __tests__/api/customers.integration.test.ts
import { describe, it, expect } from 'vitest';
import { createTestClient } from '@/test/utils';

describe('GET /api/ar/customers', () => {
  it('should return customers for authenticated user', async () => {
    const client = await createTestClient({ permissions: ['ar.customer.read'] });
    
    const res = await client.get('/api/ar/customers');
    
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('data');
    expect(res.data).toHaveProperty('total');
  });
  
  it('should reject unauthenticated requests', async () => {
    const res = await fetch('/api/ar/customers');
    expect(res.status).toBe(401);
  });
});
```

---

## Summary: DRY Patterns Applied

| Pattern | Application |
|---------|-------------|
| **Schema SSOT** | Define once in `schemas/`, derive inputs/queries |
| **`apiRoute()` Composer** | Combines error handling + rate limiting + auth |
| **Service Factory** | `cache()` for request-level singleton |
| **Error Mapping** | Domain errors → API errors in one place |
| **React Query Hooks** | Consistent data fetching + cache invalidation |
| **Parallel Fetching** | `Promise.all()` for multiple resources |
| **Streaming** | `Suspense` for progressive loading |
| **Permission Constants** | Single source for all AR permissions |

---

**Last Updated:** 2025-12-17  
**Maintainer:** Finance Cell Team
