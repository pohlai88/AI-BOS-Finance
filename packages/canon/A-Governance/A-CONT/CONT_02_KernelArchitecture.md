> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_02  
> **Version:** 1.4.0  
> **Certified Date:** 2025-12-14  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS / NexusCanon repos  
> **Authority:** Kernel Architecture & Canon/Molecule/Cell Scaffolding Standard

---

# AI-BOS Kernel Architecture
## The Identity-to-Evidence Control Plane v1.4.0

**Infrastructure:** Postgres 15 (Persistence), Docker (Orchestration)  
**Framework:** Next.js 14+ (App Router), TypeScript 5.6+  
**Last Updated:** 2025-12-14

---

## Document Status

| Property | Value |
|----------|-------|
| **Version** | 1.4.0 |
| **Status** | Production Ready (MVP Complete) |
| **SSOT** | Single Source of Truth for Kernel Architecture |
| **Implementation** | MVP Sprint Complete (Day 6 of 7) |

**Changelog:**
- **v1.4.0** (2025-12-14) — Silent Killer roadmap: Cross-IdP Normalization, Policy Proof, Permission Drift Radar, Evidence Packs
- **v1.3.0** (2025-12-14) — Full recomposition with consistent terminology
- **v1.2.0** (2025-12-14) — AI-OS Vision, PEP architecture, JIT Access roadmap
- **v1.1.0** (2025-12-14) — MVP Sprint: Postgres, RBAC, Cell resilience
- **v1.0.0** (2025-12-11) — Initial specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Terminology](#2-terminology)
3. [Kernel Constitution](#3-kernel-constitution)
4. [Canon Specification](#4-canon-specification)
5. [Molecule Specification](#5-molecule-specification)
6. [Cell Specification](#6-cell-specification)
7. [MVP Implementation](#7-mvp-implementation)
8. [Post-MVP Roadmap](#8-post-mvp-roadmap)
9. [Compliance](#9-compliance)

---

## 1. Executive Summary

### 1.1 What is the Kernel?

**Kernel is the Operating System for Domain Cells** — not merely an Identity Provider.

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| **Infrastructure** | Container orchestration, networking | Kubernetes, AWS |
| **Kernel (AI-OS)** | Identity, routing, audit, resilience | AI-BOS Kernel |
| **Domain** | Business logic, transactions | Cells, Molecules, Canons |

### 1.2 The Identity Gap

> **Traditional IAM (Okta/Auth0):** *"Is this Bob?"*  
> **AI-BOS Kernel:** *"Bob is calling Payment Hub, but Ledger is degraded. Should I route this?"*

| Question | Who Answers | Kernel Component |
|----------|-------------|------------------|
| *"Who is this?"* | External IAM OR Kernel | IAM Bridge |
| *"What can they do?"* | **Kernel** | RBAC Engine |
| *"Where should this go?"* | **Kernel** | Gateway |
| *"Is the target healthy?"* | **Kernel** | Registry |
| *"What happened?"* | **Kernel** | Audit Trail |

### 1.3 Core Philosophy

> **"Bring Your Own Identity, We Provide the Trust."**

**Tagline:** AI-BOS Kernel = **"Identity-to-Evidence Control Plane"**
- IdP authenticates users
- Kernel governs access to Canons, produces evidence, makes integrations deterministic

The Kernel federates with external IAMs for **Authentication (AuthN)**, while strictly controlling:
- **Authorization (AuthZ)** — RBAC/ABAC permission enforcement
- **Routing** — Cell-aware request routing
- **Audit** — Forensic domain event logging (with Policy Proof receipts)
- **Orchestration** — Cell health monitoring
- **Evidence** — Auditor-ready compliance packs

### 1.4 The Kernel as Policy Enforcement Point (PEP)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     IDENTITY PROVIDERS (Optional)                    │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│   │  Okta   │  │  Auth0  │  │Entra ID │  │Keycloak │               │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘               │
│        └────────────┴─────┬──────┴──────────────┘                   │
│                    [JWT / OIDC]                                      │
└───────────────────────────┼──────────────────────────────────────────┘
                            ▼
┌───────────────────────────────────────────────────────────────────────┐
│                   AI-BOS KERNEL (CONTROL PLANE)                       │
│                                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐ │
│   │ 1. Validate Token (built-in OR delegate to IdP)                  │ │
│   │ 2. Map to Permissions (RBAC)                                     │ │
│   │ 3. Check Cell Health (Circuit Breaker)                           │ │
│   │ 4. Inject Context (x-tenant-id, x-user-sub, x-correlation-id)   │ │
│   │ 5. Route to Cell (Gateway)                                       │ │
│   │ 6. Record Audit Trail                                            │ │
│   └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  ▼
┌───────────────────────────────────────────────────────────────────────┐
│                        DATA PLANE (CELLS)                              │
│                                                                        │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│   │  Payment Hub    │  │  Invoice Match  │  │  Ledger Writer  │      │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                        │
│   Cells TRUST Kernel headers — they NEVER validate JWTs              │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.5 Complement, Not Compete

> **AI-BOS products supplement existing tools, not replace them.**

| AI-BOS Product | Complements | Does NOT Replace |
|----------------|-------------|------------------|
| **LiteMetadata** | Datadog, Splunk | Full observability platforms |
| **Kernel** | Okta, Auth0, Entra ID | Enterprise IAM |
| **Cells** | Microservices frameworks | Service mesh (Istio) |

---

## 2. Terminology

### 2.1 Hierarchy

```
Canon (Bounded Context)     → Finance, HRM, CRM
  └── Molecule (Feature)    → Accounts Payable, Payroll
       └── Cell (Function)  → Payment Hub, Invoice Matcher
```

### 2.2 Glossary

| Term | Definition | Example |
|------|------------|---------|
| **Kernel** | The Control Plane. Manages identity, routing, audit. | `apps/kernel/` |
| **Canon** | A bounded domain context. Contains Molecules. | Finance Canon |
| **Molecule** | A feature cluster within a Canon. Orchestrates Cells. | Accounts Payable |
| **Cell** | The atomic unit. Single-purpose, independently deployable. | `cell-payment-hub` |
| **Gateway** | Kernel's reverse proxy. Routes requests to Cells. | `/api/gateway/*` |
| **Registry** | Catalog of registered Cells with health status. | `cells` table |
| **Tenant** | Isolated organizational boundary. All data scoped by `tenant_id`. | Demo Corp |
| **Correlation ID** | Unique trace ID for request lifecycle. | `x-correlation-id` |

### 2.3 Data Boundaries

| Boundary | Owner | Contains | Access |
|----------|-------|----------|--------|
| **Control Plane** | Kernel | users, roles, routes, audit | Kernel only |
| **Data Plane** | Cells | invoices, payments, ledger | Cells only |

**Rule:** Kernel NEVER touches Cell data. Cells NEVER touch Kernel data.

---

## 3. Kernel Constitution

### 3.1 Non-Negotiable Rules

| # | Rule | Rationale |
|---|------|-----------|
| 1 | **Kernel is the PEP** | All authorization flows through Kernel |
| 2 | **No direct Cell-to-Cell calls** | All traffic via Gateway or Event Bus |
| 3 | **Cell Health dictates Routing** | Unhealthy Cells are circuit-broken (503) |
| 4 | **Schema-first everywhere** | Contracts (OpenAPI) are the Law |
| 5 | **Zero business logic in Kernel** | Kernel doesn't know "Payroll" or "Invoice" |
| 6 | **Observability is mandatory** | Correlation IDs end-to-end |

### 3.2 Kernel Responsibilities

| Component | Responsibility | MVP Status |
|-----------|----------------|------------|
| **IAM** | Users, Roles, Permissions, Sessions | ✅ Complete |
| **Gateway** | Auth, routing, context injection | ✅ Complete |
| **Registry** | Cell catalog, health monitoring | ✅ Complete |
| **Event Bus** | Pub/sub with RBAC enforcement | ✅ Complete |
| **Audit** | Immutable audit trail | ✅ Complete |
| **Observability** | Correlation IDs, structured logs | ✅ Complete |

### 3.3 Kernel Ports

| Direction | Port | Purpose |
|-----------|------|---------|
| **Northbound** | `KernelAdminPort` | Tenant/user/role management |
| **Northbound** | `AuditPort` | Query audit trails |
| **East/West** | `AuthzDecisionPort` | Permission checks |
| **East/West** | `RegistryPort` | Cell discovery |
| **East/West** | `EventPort` | Pub/sub bridge |
| **Southbound** | `PersistencePort` | Database abstraction |

### 3.4 Standard Event Envelope

```typescript
interface EventEnvelope {
  tenant_id: string;
  actor_id: string;
  correlation_id: string;
  timestamp: string;       // ISO 8601
  source: string;          // Cell name
  event_name: string;
  payload: Record<string, unknown>;
  version: string;
}
```

---

## 4. Canon Specification

### 4.1 Definition

A **Canon** is a bounded domain context (e.g., Finance, HRM, CRM). It contains Molecules and owns business truth.

### 4.2 Boundary Rules

| Rule | Description |
|------|-------------|
| **No Kernel Internals** | Import only contracts + generated clients |
| **No Control Plane Writes** | Cannot write to Kernel tables |
| **Event-Driven Cross-Canon** | Side effects via Event Bus, not direct calls |

### 4.3 Required Artifacts

| Artifact | Purpose |
|----------|---------|
| `canon.config.ts` | Identity: name, version, owner |
| `registry.json` | Service manifest |
| `permissions.md` | Required permissions |
| `events.catalog.md` | Events emitted/consumed |
| `openapi.yaml` | API contracts |

### 4.4 Folder Structure

```
/canons/{CanonName}/
  canon.config.ts
  registry.json
  /molecules/
  /domain/
  /events/
```

---

## 5. Molecule Specification

### 5.1 Definition

A **Molecule** is a feature cluster within a Canon. It orchestrates multiple Cells to deliver a workflow.

**Example:** Accounts Payable Molecule orchestrates:
- Invoice Matcher Cell
- Payment Hub Cell
- Approval Workflow Cell

### 5.2 Boundary Rules

| Rule | Description |
|------|-------------|
| **No Cross-Canon Dependencies** | Cannot import another Canon's domain |
| **Kernel-Mediated Cross-Canon** | Use Gateway or Event Bus |

### 5.3 Required Artifacts

| Artifact | Purpose |
|----------|---------|
| `molecule.config.ts` | Scope, owners, dependent Cells |
| `events.catalog.md` | Events emitted/subscribed |
| `/cells/` | Atomic units |

---

## 6. Cell Specification

### 6.1 Definition

A **Cell** is the atomic unit of deployment. Single-purpose, independently deployable, observable.

**Reference Implementation:** `apps/cell-payment-hub/`

### 6.2 Non-Negotiables

| Requirement | Enforcement |
|-------------|-------------|
| **Health Protocol** | Expose `/ping` (liveness) and `/health` (readiness) |
| **Trust Model** | NEVER validate JWTs — trust Kernel headers |
| **Traceability** | Log `x-correlation-id` in every entry |
| **Graceful Degradation** | Return 503 when internal cells are unhealthy |

### 6.3 Required Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /ping` | Liveness | `{"message": "pong"}` |
| `GET /health` | Readiness | `CellHealthResponse` |
| `POST /chaos/fail/:cell` | Simulate failure | Test only |
| `POST /chaos/recover/:cell` | Recover | Test only |

### 6.4 Health Model

```typescript
type CellStatus = 'healthy' | 'degraded' | 'unhealthy';

interface CellHealthResponse {
  service: string;
  status: CellStatus;
  cells: Record<string, { status: CellStatus; lastChecked: string }>;
  timestamp: string;
}
```

### 6.5 Execution Template

```typescript
app.post('/payments/process', (req, res) => {
  // 1. Context (TRUST Kernel headers)
  const tenant = req.headers['x-tenant-id'];
  const actor = req.headers['x-user-sub'];
  const trace = req.headers['x-correlation-id'];

  console.log(`[${trace}] ${actor}@${tenant} processing payment`);

  // 2. Health Check
  if (cells.ledger.status === 'unhealthy') {
    return res.status(503).json({ error: { code: 'LEDGER_DOWN' } });
  }

  // 3. Domain Logic
  const result = processPayment(req.body, tenant);

  // 4. Response
  res.json({ status: 'PROCESSED', data: result, trace: { correlation_id: trace } });
});
```

### 6.6 Folder Structure

```
/apps/cell-{name}/
  Dockerfile
  package.json
  src/
    index.ts          # Entry point
    cells/            # Internal health units
    domain/           # Business logic
```

---

## 7. MVP Implementation

### 7.1 Status

| Gate | Requirement | Status |
|------|-------------|--------|
| 1 | Create tenant | ✅ |
| 2 | Create user with password | ✅ |
| 3 | Assign role with permissions | ✅ |
| 4 | Login and receive JWT | ✅ |
| 5 | Route request via Gateway | ✅ |
| 6 | Cell receives context headers | ✅ |
| 7 | Publish event with RBAC | ✅ |
| 8 | Query audit trail | ✅ |
| 9 | E2E tests pass | ✅ |

### 7.2 Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| `apps/kernel/` | Next.js app | Control Plane |
| `apps/cell-payment-hub/` | Express app | Reference Cell |
| `packages/kernel-core/` | Library | Ports + types |
| `packages/kernel-adapters/` | Library | SQL adapters |
| `packages/contracts/` | Library | Zod schemas |

### 7.3 Database Schema

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant isolation |
| `users` | Identity + credentials |
| `roles` | Role definitions |
| `permissions` | Permission definitions |
| `role_permissions` | Role → Permission mapping |
| `user_roles` | User → Role mapping |
| `sessions` | Active sessions |
| `cells` | Cell registry |
| `routes` | Gateway routing rules |
| `events` | Event bus messages |
| `audit_events` | Immutable audit trail |

### 7.4 Quick Start

```bash
# 1. Start stack (Kernel + Postgres + Payment Hub)
docker-compose up -d

# 2. Seed demo data
pnpm seed:happy-path

# 3. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/kernel/iam/login \
  -H "x-tenant-id: 11111111-1111-1111-1111-111111111111" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"password123"}' | jq -r .token)

# 4. Process payment via Gateway
curl -X POST http://localhost:3001/api/gateway/payments/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "beneficiary": "Acme Corp"}'
```

---

## 8. Post-MVP Roadmap

### 8.1 Evolution Phases

| Phase | Description | Status |
|-------|-------------|--------|
| **v1.0 (MVP)** | Built-in IAM, RBAC, Gateway, Audit | ✅ Complete |
| **v2.0** | IAM Bridge: Okta, Auth0, Entra ID adapters | 🔲 Planned |
| **v3.0** | JIT Access: AI Agents request scoped permissions | 🔲 Future |

### 8.2 IAM Bridge Adapters

```typescript
interface IAMBridgePort {
  validateToken(token: string): Promise<IdentityClaims>;
  syncUser?(externalId: string): Promise<User>;
  mapRoles?(externalRoles: string[]): Promise<Permission[]>;
}

// Planned adapters
class OktaAdapter implements IAMBridgePort { /* ... */ }
class Auth0Adapter implements IAMBridgePort { /* ... */ }
class EntraIDAdapter implements IAMBridgePort { /* ... */ }
```

### 8.3 JIT Access for AI Agents

```typescript
// AI Agent requests temporary, scoped access
const grant = await kernel.requestJITAccess({
  agent_id: 'invoice-processor',
  permissions: ['finance.payment.execute'],
  duration_ms: 300000,  // 5 minutes
  scope: { tenant_id: 'demo-corp', max_amount: 10000 }
});
```

### 8.4 Unique Differentiators

| Capability | Enterprise IAM | AI-BOS Kernel |
|------------|----------------|---------------|
| SSO / MFA | ✅ Core | 🔌 Delegates |
| Domain Routing | ❌ None | ✅ Gateway |
| Cell Orchestration | ❌ None | ✅ Health model |
| Event Bus | ❌ None | ✅ Domain events |
| Chaos Engineering | ❌ None | ✅ Built-in |
| Schema Governance | ❌ None | ✅ Contract SSOT |
| JIT Agent Access | ❌ None | 🔲 v3.0 |
| Cross-IdP Portability | ❌ None | 🔲 v2.0 |
| Evidence Packs | ❌ None | 🔲 v2.0 |
| Permission Drift Radar | ❌ None | 🔲 v2.0 |

### 8.5 Silent Killer Roadmap

> **Positioning:** AI-BOS Kernel = **"Identity-to-Evidence Control Plane"**
> - IdP authenticates users
> - Kernel governs access to Canons, produces evidence, makes integrations deterministic

These features address market pain points that existing IAM solutions don't solve:

| Pain Point | Feature | Phase |
|------------|---------|-------|
| **Authorization Fragmentation** | BYO-IdP + Kernel Authorization Fabric | v2.0 |
| **Vendor Lock-in** | Cross-IdP Claim Normalization (Portable RBAC) | v2.0 |
| **Evidence Fragmentation** | Policy Proof Receipts + Evidence Packs | v2.0 |
| **Lifecycle Drift** | Permission Drift Radar | v2.0 |
| **High-Risk Access** | JIT Step-Up via IdP | v3.0 |
| **Risk Detection** | Telemetry-to-Policy Loop | v3.0 |

#### 8.5.1 Cross-IdP Claim Normalization (Portable RBAC)

Map external IdP claims/groups → Kernel roles/permissions. Tenants can switch IdPs without rewriting Canon security.

```typescript
interface ClaimNormalizationPort {
  // Normalize claims from any IdP to Kernel identity
  mapClaims(provider: IdPType, claims: ExternalClaims): KernelIdentity;
  
  // Map IdP groups to Kernel permissions
  mapGroups(externalGroups: string[]): Permission[];
}

type IdPType = 'okta' | 'entra' | 'auth0' | 'keycloak' | 'custom';

interface KernelIdentity {
  sub: string;           // Normalized user ID
  tenant_id: string;     // Mapped from IdP org/tenant
  roles: string[];       // Kernel roles
  permissions: string[]; // Resolved permissions
}
```

#### 8.5.2 Policy Proof Receipts

Every allow/deny at the Gateway produces structured audit with:
- `correlation_id` — Full request trace
- `action` — ALLOWED or DENIED
- `reason` — Why (e.g., MISSING_PERMISSION, CELL_UNHEALTHY)
- `required_permissions` — What was needed
- `had_permissions` — What user had

```typescript
interface PolicyProof {
  correlation_id: string;
  timestamp: string;
  actor: { sub: string; tenant_id: string };
  resource: { method: string; path: string; cell: string };
  decision: 'ALLOWED' | 'DENIED';
  reason?: 'MISSING_PERMISSION' | 'CELL_UNHEALTHY' | 'RATE_LIMITED' | 'INVALID_TOKEN';
  required_permissions: string[];
  had_permissions: string[];
}
```

#### 8.5.3 Access Review Lite (IGA-lite)

Not a full SailPoint replacement — focused Canon permission attestations:
- **Snapshot Export:** Who has access to what? (JSON/CSV)
- **Periodic Attestation:** "Is this access still needed?" (Quarterly/Monthly)
- **Remediation Tasks:** Auto-generated when attestation fails

| Full IGA (SailPoint) | Kernel Access Review Lite |
|----------------------|---------------------------|
| All enterprise apps | Canon permissions only |
| Complex workflows | Simple snapshot + attest |
| $100k+/year | Built-in |

#### 8.5.4 Permission Drift Radar

Detect when Cell routes/permissions changed but roles were not updated:

```typescript
interface DriftReport {
  route: { method: string; path: string };
  current_required: string[];
  role_grants: string[];
  gap: string[];  // Permissions required but not granted to any role
  recommendation: string;
}

// Example output:
{
  route: { method: 'POST', path: '/payments/process' },
  current_required: ['finance.payment.execute'],
  role_grants: ['finance.payment.view'],  // Role only has view!
  gap: ['finance.payment.execute'],
  recommendation: 'Add finance.payment.execute to Accountant role or update route'
}
```

#### 8.5.5 JIT Step-Up for High-Risk Routes

For critical routes, require step-up MFA at the IdP:

```typescript
// Route configuration
{
  path: '/payments/process',
  method: 'POST',
  required_permissions: ['finance.payment.execute'],
  risk_level: 'high',
  step_up: {
    required: true,
    max_age_seconds: 300,  // Must have MFA within last 5 minutes
    fallback: 'DENY'
  }
}
```

Kernel checks IdP token `amr` (authentication methods) and `auth_time` claims to enforce step-up.

---

## 9. Compliance

All Canons, Molecules, and Cells MUST comply with:

1. **CONT_01** — Canon Identity & Registration Standard
2. **CONT_02** — This document (Kernel Architecture)
3. **Section 3.1** — Non-Negotiable Rules
4. **Section 6.2** — Cell Non-Negotiables

---

## References

| Document | Location |
|----------|----------|
| **README** | `apps/kernel/README.md` |
| **Architecture** | `apps/kernel/docs/ARCHITECTURE.md` |
| **Cell Integration Guide** | `apps/kernel/docs/cell-integration-guide.md` |
| **Troubleshooting** | `apps/kernel/docs/TROUBLESHOOTING.md` |
| **OpenAPI Spec** | `apps/kernel/docs/openapi.yaml` |
| **MVP Sprint Plan** | `apps/kernel/PRD-KERNEL-MVP.md` |

---

**End of Contract CONT_02 v1.3.0**
