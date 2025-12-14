# AI-BOS Kernel Architecture

> **AI-BOS Kernel** — The Identity-to-Evidence Control Plane powering AI-BOS Finance.
> 
> Understanding the Control Plane, Data Plane, and why Cells exist.

---

## 1. The Ecosystem Hierarchy

We organize complexity using a biological metaphor:

```
Canon (Bounded Context)         → Accounting, HRM, CRM
  └── Molecule (Functional Unit)  → Accounts Payable, Payroll, Recruitment
        └── Cell (Atomic Function)  → Payment Hub, Invoice Matcher, Ledger Writer
```

| Level | Scope | Example | Deploys As |
|-------|-------|---------|------------|
| **Canon** | Business domain | `canon-accounting` | Namespace/boundary |
| **Molecule** | Feature group | `molecule-accounts-payable` | Service mesh |
| **Cell** | Single function | `cell-payment-hub` | Container |

**The Kernel** is the nervous system that connects these Cells.

---

## 2. Control Plane vs Data Plane

```
┌──────────────────────────────────────────────────────────────────┐
│                        CONTROL PLANE                              │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │                        KERNEL                               │  │
│   │                                                              │  │
│   │  ┌──────┐ ┌──────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐  │  │
│   │  │ Auth │ │ RBAC │ │ Gateway │ │ Registry │ │ Audit/Bus │  │  │
│   │  └──────┘ └──────┘ └─────────┘ └──────────┘ └───────────┘  │  │
│   │                                                              │  │
│   └────────────────────────────────────────────────────────────┘  │
│                              │                                     │
│                    Injects: x-tenant-id                            │
│                             x-user-sub                             │
│                             x-correlation-id                       │
│                              ▼                                     │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                         DATA PLANE                                │
│                                                                    │
│   ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│   │   Payment Hub    │  │  Invoice Matcher │  │    Ledger     │  │
│   │   ┌──────────┐   │  │   ┌──────────┐   │  │  ┌─────────┐  │  │
│   │   │ gateway  │   │  │   │ matcher  │   │  │  │ writer  │  │  │
│   │   │processor │   │  │   │ rules    │   │  │  │ reader  │  │  │
│   │   │ ledger   │   │  │   │ cache    │   │  │  │ archive │  │  │
│   │   └──────────┘   │  │   └──────────┘   │  │  └─────────┘  │  │
│   └──────────────────┘  └──────────────────┘  └───────────────┘  │
│                                                                    │
│   [Each Cell has internal "cells" that can fail independently]    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. The Kernel Promise (Why Use It?)

> **If you use the Kernel, you get Auth, Audit, and Resilience for free.**  
> **If you bypass it, you build it yourself.**

### What the Kernel Guarantees to Cells:

| Guarantee | Description | Without Kernel |
|-----------|-------------|----------------|
| **Unified Identity** | Cells don't manage users. Kernel passes trusted `x-user-sub` and `x-tenant-id` | Build your own auth |
| **Audit by Default** | Every mutating request is logged with `correlation_id` | Build your own audit trail |
| **Resilience** | If a Cell dies, Kernel handles 503/timeout gracefully | Caller crashes |
| **Policy Enforcement** | Change RBAC in one place, not 50 Cells | Scattered permission checks |
| **Request Tracing** | `x-correlation-id` flows through all services | No end-to-end tracing |

### The Trust Model

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Client    │ ───► │   Kernel    │ ───► │    Cell     │
│             │      │ (Verifies)  │      │  (Trusts)   │
│  Sends JWT  │      │  JWT Valid? │      │  Headers    │
│             │      │  Has Perm?  │      │  from Kernel│
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │              [AUTH POINT]         [TRUST POINT]
       │                    │                    │
       └────────────────────┴────────────────────┘
                  JWT validation happens ONCE
```

**Rule:** Cells NEVER validate JWTs. They trust the headers injected by the Kernel.

---

## 4. Cell-Based Resilience

Cells are designed to fail gracefully. Each Cell exposes a `/health` endpoint that reports the status of its internal dependencies.

### The Health Model

```typescript
type CellStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthResponse {
  service: string;           // e.g., "cell-payment-hub"
  status: CellStatus;        // Aggregate status
  cells: {
    [name: string]: {
      status: CellStatus;
      lastChecked: string;   // ISO timestamp
    };
  };
}
```

### Example: Payment Hub Health

```json
{
  "service": "cell-payment-hub",
  "status": "degraded",
  "cells": {
    "gateway": { "status": "healthy", "lastChecked": "2025-12-14T15:42:00Z" },
    "processor": { "status": "healthy", "lastChecked": "2025-12-14T15:42:00Z" },
    "ledger": { "status": "unhealthy", "lastChecked": "2025-12-14T15:44:27Z" }
  }
}
```

### What Happens When a Cell Fails?

| Cell Status | Kernel Behavior | Client Sees |
|-------------|-----------------|-------------|
| `healthy` | Routes request | 200 OK |
| `degraded` | Routes with warning | 200 OK (logged) |
| `unhealthy` | Rejects request | 503 Service Unavailable |

---

## 5. Request Flow (End-to-End)

```
1. Client sends POST /api/gateway/payments/process
   └── Headers: Authorization: Bearer <JWT>
   └── Body: { amount: 500, currency: "USD", beneficiary: "Acme" }
   
2. Kernel Gateway receives request
   ├── Extracts JWT, verifies signature
   ├── Decodes claims: { sub: "user-123", tid: "tenant-abc", permissions: [...] }
   ├── Checks RBAC: Does user have "finance.payment.execute"?
   ├── Generates x-correlation-id if not present
   └── Logs: GATEWAY_REQUEST { path, method, tenant_id, user_id, correlation_id }

3. Kernel looks up route in Registry
   └── Finds: /payments/process → cell-payment-hub:4000

4. Kernel proxies to Cell
   ├── Adds headers: x-tenant-id, x-user-sub, x-correlation-id
   └── Forwards: POST http://cell-payment-hub:4000/payments/process

5. Cell processes request
   ├── Trusts x-tenant-id (scopes data)
   ├── Logs [correlation_id]: Processing payment...
   └── Returns: { ok: true, data: { transaction_id: "..." } }

6. Kernel receives response
   ├── Logs: GATEWAY_RESPONSE { status: 200, correlation_id }
   └── Returns response to client

7. Audit Trail created
   └── Event: { action: "finance.payment.execute", actor_id, tenant_id, correlation_id, details }
```

---

## 6. Security Model

### JWT Claims (Decoded)

```json
{
  "sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",  // User ID
  "tid": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",  // Tenant ID
  "email": "admin@demo.local",
  "permissions": ["finance.payment.execute", "kernel.audit.read"],
  "iat": 1702569600,
  "exp": 1702573200
}
```

### RBAC Enforcement

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    User     │ ──── │    Role     │ ──── │ Permission  │
└─────────────┘      └─────────────┘      └─────────────┘
      │                    │                    │
   user_roles         role_permissions      permissions
      │                    │                    │
   (N:M)               (N:M)               (lookup)
```

### Permission Naming Convention

```
{domain}.{resource}.{action}

Examples:
- kernel.iam.user.create
- kernel.registry.canon.register
- finance.payment.execute
- finance.ledger.read
```

---

## 7. The Audit Trail

Every significant action is logged to the immutable `audit_events` table.

### Audit Event Structure

```json
{
  "id": "uuid",
  "tenant_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "actor_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  "action": "finance.payment.execute",
  "resource": "/payments/process",
  "details": {
    "amount": 500,
    "currency": "USD",
    "beneficiary": "Acme Corp",
    "transaction_id": "..."
  },
  "correlation_id": "b8fbd438-dfc0-4d9c-909b-d40d86bede72",
  "ip_address": "192.168.1.100",
  "created_at": "2025-12-14T15:44:09.087Z"
}
```

### Correlation ID Flow

```
Client Request
     │
     ▼
  x-correlation-id: abc123  ──────────────────────────────────┐
     │                                                         │
     ▼                                                         │
  Kernel logs: [abc123] Gateway received                       │
     │                                                         │
     ▼                                                         │
  Cell logs: [abc123] Processing payment                       │
     │                                                         │
     ▼                                                         │
  Audit Event: { correlation_id: "abc123", ... }              │
     │                                                         │
     └─────────────────────────────────────────────────────────┘
                    All linked by correlation_id
```

---

## 8. Glossary

| Term | Definition |
|------|------------|
| **Canon** | A bounded context (e.g., Accounting, HRM). Contains Molecules. |
| **Molecule** | A functional grouping within a Canon (e.g., Accounts Payable). Contains Cells. |
| **Cell** | The atomic unit of functionality. A single-purpose microservice. |
| **Kernel** | The Control Plane. Handles Auth, RBAC, Gateway, Registry, Audit, Events. |
| **Gateway** | The Kernel's reverse proxy that routes requests to Cells. |
| **Registry** | Database of Canons and their Routes. |
| **RBAC** | Role-Based Access Control. Permissions → Roles → Users. |
| **Tenant** | An isolated organizational unit. All data is scoped by `tenant_id`. |
| **Correlation ID** | A unique trace ID (`x-correlation-id`) that flows through all services. |
| **Chaos Endpoint** | An endpoint that simulates failure for testing resilience. |
| **Cell Health** | The status of internal dependencies: healthy, degraded, unhealthy. |
| **Bootstrap** | Initial system setup (first tenant, first admin user). |

---

## 9. Design Decisions (ADRs)

| Decision | Rationale | Reference |
|----------|-----------|-----------|
| Postgres over In-Memory | Persistence, ACID, production-ready | PRD-KERNEL-MVP Day 1 |
| Cell-Based Health | Graceful degradation, chaos engineering | PRD-KERNEL-MVP Day 5 |
| JWT at Gateway Only | Single enforcement point, Cells trust headers | Security Rules |
| SQL Adapters | Hexagonal architecture, swappable persistence | PRD-KERNEL Day 2 |
| Correlation ID Propagation | End-to-end request tracing | Audit requirements |

---

**Next:** [Cell Integration Guide](cell-integration-guide.md) — Build your own Finance Cell
