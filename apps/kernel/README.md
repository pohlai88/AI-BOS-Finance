MCP# @aibos/kernel — Control Plane Service

> **Build 1**: Walking Skeleton MVP with Anti-Gravity Architecture

## Overview

The Kernel is the **Control Plane** for AIBOS — the single source of truth for:
- **Tenant Management** — Multi-tenant isolation
- **Service Registry** — Service discovery and routing (Build 2)
- **Policy Engine** — RBAC and data access control (Build 2)
- **Audit Trail** — Complete audit logging

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ANTI-GRAVITY                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ apps/kernel (Next.js App Router)                                 ││
│  │ ├── app/api/kernel/     ← Route Handlers (HTTP layer)           ││
│  │ ├── middleware.ts       ← Correlation ID injection              ││
│  │ └── src/server/         ← Container + HTTP utilities            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                               │                                      │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ @aibos/kernel-core (Pure TypeScript)                            ││
│  │ ├── domain/             ← Pure data types                       ││
│  │ ├── ports/              ← Interfaces (TenantRepoPort, etc.)     ││
│  │ └── application/        ← Use-cases (createTenant, listTenants) ││
│  └─────────────────────────────────────────────────────────────────┘│
│                               │                                      │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ @aibos/kernel-adapters                                           ││
│  │ └── memory/             ← In-memory implementations              ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ @aibos/contracts                                                 ││
│  │ ├── kernel/tenants      ← Zod schemas (request/response)        ││
│  │ ├── kernel/audit        ← Audit event schema                    ││
│  │ └── shared/envelope     ← Standard API envelopes                ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Anti-Gravity Rules (Hard Enforcement)

### ✅ Allowed Imports

| From | Can Import |
|------|------------|
| `apps/kernel/app/api/**` | `@aibos/contracts`, `@aibos/kernel-core`, `apps/kernel/src/server/*` |
| `apps/kernel/src/server/*` | `@aibos/kernel-core`, `@aibos/kernel-adapters`, `@aibos/contracts` |
| `@aibos/kernel-core` | `@aibos/contracts` (schemas only) |
| `@aibos/kernel-adapters` | `@aibos/kernel-core` (ports), `@aibos/contracts` |

### ❌ Forbidden Imports

| From | Cannot Import |
|------|---------------|
| UI pages | `@aibos/kernel-adapters`, any DB layer |
| `@aibos/kernel-core` | `apps/kernel`, Next.js modules, adapters |
| `@aibos/kernel-adapters` | `apps/kernel`, Next.js modules |

## Quick Start

```bash
# From monorepo root
pnpm install

# Start Kernel dev server (port 3001)
pnpm --filter @aibos/kernel dev
```

## API Endpoints

### Health Check

```bash
GET /api/kernel/health

# Response
{
  "ok": true,
  "service": "kernel",
  "version": "0.1.0",
  "correlation_id": "uuid"
}
```

### Create Tenant

```bash
POST /api/kernel/tenants
Content-Type: application/json

{
  "name": "ACME Corporation"
}

# Response (201)
{
  "id": "uuid",
  "name": "ACME Corporation",
  "status": "ACTIVE",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### List Tenants

```bash
GET /api/kernel/tenants

# Response
{
  "items": [
    {
      "id": "uuid",
      "name": "ACME Corporation",
      "status": "ACTIVE",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Build 1 Deliverables

- ✅ Next.js (App Router) Kernel app boots
- ✅ `/api/kernel/health` returns OK + `correlation_id`
- ✅ `/api/kernel/tenants` supports POST + GET (in-memory repo)
- ✅ Every request is validated by **contracts schemas**
- ✅ Every critical action writes an **audit event**
- ✅ Anti-Gravity enforced by folder structure

## Correlation ID

Every request receives a `x-correlation-id` header:

1. If client provides `x-correlation-id`, we use it (for tracing)
2. Otherwise, we generate a new UUID
3. Response always includes `x-correlation-id` header

This enables end-to-end request tracing across microservices.

## Audit Trail

Every mutation (POST, PUT, DELETE) writes an audit event:

```typescript
{
  id: "uuid",
  tenant_id: "uuid",
  actor_id: "uuid",  // From auth session
  action: "kernel.tenant.create",
  resource: "kernel_tenant",
  result: "OK",
  correlation_id: "uuid",
  payload: { name: "ACME" },
  created_at: "2024-01-01T00:00:00.000Z"
}
```

## Next: Build 2

- Service Registry endpoints
- Gateway route `/api/gateway/[...path]`
- Minimal RBAC gate at the gateway
  