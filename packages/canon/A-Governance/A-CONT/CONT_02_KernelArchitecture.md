> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_02  
> **Version:** 1.0.0  
> **Certified Date:** 2025-12-11  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS / NexusCanon repos  
> **Authority:** Kernel Architecture & Canon/Molecule/Cell Scaffolding Standard

---

# AI-BOS / NexusCanon
## Kernel Architecture & Canon/Molecule/Cell Scaffolding Standard v1.0.0

**Framework:** Next.js 14+ (App Router)  
**Language:** TypeScript 5.6+  
**UI Library:** React 18+  
**Last Updated:** 2025-12-11

---

## Document Status

**Version:** 1.0.0  
**Status:** Production Ready  
**SSOT:** This document is the **Single Source of Truth (SSOT)** for Kernel Architecture and Canon/Molecule/Cell scaffolding standards.  
**Derived Documents:** `README.md` is a navigation index derived from this contract.  
**Framework Target:** Next.js App Router with Kernel control plane architecture  
**Implementation Status:** Specification Complete

**Changelog:** 
- **v1.0.0** - Initial Release (2025-12-11)
  - ✅ Kernel Constitution defined
  - ✅ Canon Scaffold Specification defined
  - ✅ Molecule Scaffold Specification defined
  - ✅ Cell Scaffold Specification defined
  - 🟢 **CONT_02 – Execution Version** - Enterprise-grade, Fortune-500 caliber standard

---

# AI-BOS / NexusCanon
## Kernel Architecture & Canon/Molecule/Cell Scaffolding Standard v1.0.0

> **Canon Code:** CONT_02  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** Kernel Architecture, Canon/Molecule/Cell scaffolding standards across all AI-BOS / NexusCanon repos.

**Framework:** Next.js 14+ (App Router)  
**Language:** TypeScript 5.6+  
**UI Library:** React 18+  
**Last Updated:** 2025-12-11

---

## Table of Contents

1. [Kernel Constitution](#1-kernel-constitution)
2. [Canon Scaffold Specification](#2-canon-scaffold-specification)
3. [Molecule Scaffold Specification](#3-molecule-scaffold-specification)
4. [Cell Scaffold Specification](#4-cell-scaffold-specification)

---

## 1. Kernel Constitution

### 1.1 Purpose

**Kernel = Control Plane (governance + connectivity + evidence).**

It is the rigid LEGO baseplate that makes Canons/Molecules/Cells snap-in safely.

### 1.2 Non-Negotiable Rules

1. **No Canon talks to another Canon directly.**
   - All sync traffic goes through **API Gateway**
   - All async side effects go through **Event Bus**

2. **Kernel contains zero business logic.**
   - Kernel never knows "Payroll" or "Customer"
   - It only enforces identity, policy, routing, evidence

3. **Schema-first everywhere.**
   - Contracts are the SSOT
   - FE/BE types and validators are generated

4. **Every cross-boundary interaction is via Ports + Contracts.**
   - No "shared utils" that smuggle domain logic

5. **Observability is mandatory, not optional.**
   - Correlation IDs and structured logs must exist end-to-end

### 1.3 Kernel Responsibilities (Must)

| Responsibility | Description |
|----------------|-------------|
| **Identity & Access (IAM)** | Tenants, users, roles, sessions |
| **Policy Decision & Enforcement** | RBAC (MVP), policy hooks for ABAC later |
| **API Gateway** | Single ingress, auth, routing, rate limiting, schema validation |
| **Service Registry** | Canon catalog (name/version/capabilities/health) |
| **Event Bus** | Pub/sub with standard envelope |
| **Audit Evidence** | Immutable audit trail + export/query |
| **Observability** | Logs + traces + health + dashboards (platform level) |
| **Governance Metadata** | Metadata registry (your `mdm_meta_*` layer), ownership, versioning |

### 1.4 Kernel Forbidden (Must Not)

| Forbidden | Reason |
|-----------|--------|
| Payroll computation | Business logic belongs in Canons |
| CRM journaling logic | Business logic belongs in Canons |
| GL posting logic | Business logic belongs in Canons |
| Domain workflows | Business logic belongs in Canons |
| Domain state machines | Business logic belongs in Canons |
| Writing Canon data tables | Kernel only reads/writes control plane data |

### 1.5 Data Boundary (No Confusion)

| Boundary | Scope | Enforcement |
|----------|-------|-------------|
| **Kernel DB = Control Plane only** | Governance truth: IAM, policies, metadata registry, manifest/canon registry, audit, telemetry summaries | Permissions + ports |
| **Canon DB = Data Plane** | Business truth: HRM/CRM/Finance transactions and domain records | Permissions + ports |

**Note:** Physical deployment may be 1 Postgres with separate schemas; boundaries are enforced by **permissions + ports**, not by "one vs many DBs."

### 1.6 Kernel Minimum Ports (MVP)

#### Northbound (UI/Admin)

| Port | Purpose |
|------|---------|
| `KernelAdminPort` | Tenants/users/roles management |
| `GovernancePort` | Metadata/policies management |
| `AuditPort` | Query/export audit trails |
| `ManifestOrRegistryPort` | Register/validate/version Canons |

#### East/West (Canon Integration)

| Port | Purpose |
|------|---------|
| `AuthzDecisionPort` | Canon asks; Kernel decides authorization |
| `CanonRegistryPort` | Where/what is Canon (service discovery) |
| `KernelEventPort` | Publish/subscribe bridge |

#### Southbound (Infra Adapters)

| Port | Purpose |
|------|---------|
| `PersistencePort` | Database abstraction |
| `QueuePort` | Event bus abstraction |
| `SecretsConfigPort` | Secrets and configuration management |
| `NotificationPort` | Optional notification service |

### 1.7 Standard Event Envelope (MVP)

```typescript
interface EventEnvelope {
  tenant_id: string;
  actor_id: string;
  timestamp: string; // ISO 8601
  correlation_id: string;
  source: string; // Canon name
  event_name: string;
  payload: Record<string, unknown>;
  version: string; // Event schema version
}
```

### 1.8 MVP Cut-Line (Kernel is "shippable" when)

**Walking Skeleton passes:**

1. ✅ Create tenant
2. ✅ Invite user
3. ✅ Assign role
4. ✅ Request via gateway
5. ✅ Routed to Hello-Canon
6. ✅ Event emitted
7. ✅ Audit trail shows it with correlation_id
8. ✅ Canon cannot access `kernel_*` schema directly (permission denied)

### 1.9 MVP vs Full Stack (Kernel)

| Capability | MVP (Ship) | Full Stack (Later) |
|------------|------------|---------------------|
| **Schema-first** | SSOT schema + generated types/validators/SDK | Multi-version negotiation + compatibility suite |
| **Gateway** | Auth + routing + validation + basic rate limit | Dev portal, monetization, multi-region policy routing |
| **Registry** | Static registry + health | Dynamic discovery + mesh integration |
| **Event bus** | Pub/sub + envelope + basic retries | DLQ, sagas, idempotency keys |
| **Observability** | Logs+traces+dashboards | SLOs/SLIs, anomaly detection, forensic exports |
| **Security** | RBAC | ABAC + policy-as-code |

---

## 2. Canon Scaffold Specification

### 2.1 Canon Definition

A **Canon** is a domain engine (HRM/CRM/Finance). It owns **business truth** and exposes capabilities through Kernel governance.

### 2.2 Canon Boundary Rules

| Rule | Description |
|------|-------------|
| **No Kernel Internals** | Cannot import Kernel internals (only **contracts + generated Kernel client**) |
| **No Control Plane Writes** | Cannot write Kernel control-plane tables |
| **Event-Driven Cross-Canon** | Emits domain events; does not cause cross-canon side effects via direct calls |

### 2.3 Canon Required Interfaces (MVP)

| Interface | Purpose | Implementation |
|-----------|---------|----------------|
| **Sync** | Exposed via Kernel Gateway routing | REST/GraphQL (your choice) |
| **Async** | Publishes events to Kernel Event Bus | Standard event envelope |
| **Health** | `/health` (and optionally `/ready`) | Health check endpoint |
| **Capability Manifest** | Name, version, endpoints, events, permissions required | Registry entry |

### 2.4 Canon Folder Structure (Suggested)

```
/canons/{CanonName}/
  canon.config.ts
  manifest.json (or registry.json for MVP)
  /api/                 (inbound adapters)
  /application/         (use-cases)
  /domain/              (entities, rules)
  /ports/               (interfaces)
  /adapters/            (db, queue, external)
  /events/              (emitters, handlers)
  /tests/
```

### 2.5 Canon Required Files

| File | Purpose | Required |
|------|---------|----------|
| `canon.config.ts` | Name, version, owner, contact, deps | ✅ Yes |
| `registry.json` (MVP) or `manifest.json` (Full stack) | Service registry entry | ✅ Yes |
| `permissions.md` | Canon permissions it requests from Kernel | ✅ Yes |
| `events.catalog.md` | Events emitted/consumed | ✅ Yes |
| `openapi.yaml` or `schema/*.json` | Contracts SSOT | ✅ Yes |

### 2.6 Canon Required Runtime Behavior (MVP)

#### All Incoming Requests

1. ✅ Validate schema
2. ✅ Log with `correlation_id`
3. ✅ Call `AuthzDecisionPort` before sensitive operations
4. ✅ Emit audit-worthy event for critical actions

#### All Outgoing Calls

1. ✅ Use generated clients from `/packages/contracts` (no ad-hoc fetch)

### 2.7 Canon "Definition of Done" (MVP)

- ✅ Registers in Service Registry (name/version/health ok)
- ✅ Handles one "golden" endpoint via Gateway
- ✅ Emits at least one event through Event Bus
- ✅ Produces traceable logs + correlation_id
- ✅ Unit tests exist for one core use-case

---

## 3. Molecule Scaffold Specification

### 3.1 Molecule Definition

A **Molecule** is a coherent feature cluster *inside one Canon* (e.g., Payroll, Recruitment, L&D). It may orchestrate multiple Cells but never crosses Canon boundaries directly.

### 3.2 Molecule Boundary Rules

| Rule | Description |
|------|-------------|
| **No Cross-Canon Dependencies** | Molecule cannot depend on another Canon's domain model |
| **Kernel-Mediated Cross-Canon** | Cross-canon needs must be expressed as:<br/>- A Kernel-mediated sync call (gateway) **or**<br/>- An event subscription (preferred for side effects) |

### 3.3 Molecule Folder Structure (Suggested)

```
/canons/{CanonName}/molecules/{MoleculeName}/
  molecule.config.ts
  /application/      (orchestrations)
  /cells/            (atomic units)
  /domain/            (molecule-level rules)
  /events/            (molecule-level events)
  /tests/
```

### 3.4 Molecule Required Artifacts

| Artifact | Purpose | Required |
|----------|---------|----------|
| `molecule.config.ts` | Scope, owners, dependent cells | ✅ Yes |
| `events.catalog.md` | Events it emits/subscribes | ✅ Yes |
| `contracts/` | Schemas for molecule APIs or internal commands, if any | ✅ Yes |

### 3.5 Molecule DoD (MVP)

- ✅ At least 2 cells orchestrated OR 1 cell + 1 event flow
- ✅ Clear inputs/outputs for orchestration
- ✅ Tests cover orchestration happy path + one failure path

---

## 4. Cell Scaffold Specification

### 4.1 Cell Definition

A **Cell** is the smallest atomic capability with clear boundaries, I/O, and auditability.

**Examples:** "Create Candidate", "Approve Leave", "Compute Payslip Draft"

### 4.2 Cell Non-Negotiables

| Requirement | Description |
|-------------|-------------|
| **Single Purpose** | One capability |
| **Deterministic Rules** | No hidden side effects |
| **Explicit I/O** | Explicit inputs/outputs via contracts |
| **Event Emission** | Emits events (if side effects) using the standard envelope |
| **Audit Entries** | Produces audit entries for critical actions |

### 4.3 Cell Folder Structure (Suggested)

```
/canons/{CanonName}/molecules/{MoleculeName}/cells/{CellName}/
  cell.config.ts
  contract.input.json
  contract.output.json
  usecase.ts
  policy.ts            (required permissions)
  events.ts            (what it emits)
  test.spec.ts
```

### 4.4 Cell Required Interfaces

| Interface | Purpose | Format |
|-----------|---------|--------|
| **Input Contract** | Schema-first (JSON Schema/OpenAPI component) | JSON Schema or OpenAPI |
| **Output Contract** | Schema-first | JSON Schema or OpenAPI |
| **Policy Hook** | Calls Kernel `AuthzDecisionPort` or enforces received decision | TypeScript interface |
| **Event Hook (optional)** | Publishes event(s) to Event Bus | Standard event envelope |

### 4.5 Cell Execution Template (MVP)

```typescript
async function executeCell(input: InputContract): Promise<OutputContract> {
  // 1. Validate input schema
  validateInput(input);
  
  // 2. Authorize (Kernel decision)
  const decision = await kernel.authzDecisionPort.check(input.actor_id, input.action);
  if (!decision.allowed) throw new ForbiddenError();
  
  // 3. Execute domain rule(s)
  const result = await domainRule.execute(input);
  
  // 4. Persist to Canon data plane
  await persistencePort.save(result);
  
  // 5. Emit event (if applicable)
  if (result.requiresEvent) {
    await eventBus.publish(createEventEnvelope(result));
  }
  
  // 6. Write audit evidence + logs with correlation_id
  await auditPort.record({
    correlation_id: input.correlation_id,
    action: input.action,
    result: result,
  });
  
  // 7. Return output schema
  return transformToOutputContract(result);
}
```

### 4.6 Cell DoD (MVP)

- ✅ Input/output schemas exist and are code-generated
- ✅ One use-case test (happy path) + one policy denial test
- ✅ Emits at least one structured log containing correlation_id
- ✅ No direct access to Kernel control-plane tables

---

## 5. Implementation Checklist

### 5.1 Kernel Implementation

- [ ] API Gateway with auth + routing + validation
- [ ] Service Registry (static MVP)
- [ ] Event Bus (pub/sub with standard envelope)
- [ ] IAM (tenants, users, roles, sessions)
- [ ] Policy Decision Port (RBAC MVP)
- [ ] Audit Evidence system
- [ ] Observability (logs + traces + health)
- [ ] Governance Metadata registry

### 5.2 Canon Implementation

- [ ] Canon config file (`canon.config.ts`)
- [ ] Registry entry (`registry.json`)
- [ ] Permissions manifest (`permissions.md`)
- [ ] Events catalog (`events.catalog.md`)
- [ ] API contracts (OpenAPI or JSON Schema)
- [ ] Health endpoint (`/health`)
- [ ] One "golden" endpoint via Gateway
- [ ] Event emission to Event Bus
- [ ] Unit tests for one core use-case

### 5.3 Molecule Implementation

- [ ] Molecule config file (`molecule.config.ts`)
- [ ] Events catalog (`events.catalog.md`)
- [ ] At least 2 cells orchestrated OR 1 cell + 1 event flow
- [ ] Tests covering orchestration happy path + failure path

### 5.4 Cell Implementation

- [ ] Cell config file (`cell.config.ts`)
- [ ] Input contract (JSON Schema/OpenAPI)
- [ ] Output contract (JSON Schema/OpenAPI)
- [ ] Policy hook implementation
- [ ] Use-case implementation
- [ ] Event emission (if applicable)
- [ ] One use-case test (happy path)
- [ ] One policy denial test

---

## 6. References

- **CONT_01:** Canon Identity & Cell Registration Standard
- **Kernel Architecture:** See Section 1 (Kernel Constitution)
- **Canon Architecture:** See Section 2 (Canon Scaffold Specification)
- **Molecule Architecture:** See Section 3 (Molecule Scaffold Specification)
- **Cell Architecture:** See Section 4 (Cell Scaffold Specification)

---

## 7. Compliance

All Canons, Molecules, and Cells must comply with:

1. **CONT_01** - Canon Identity & Cell Registration Standard
2. **CONT_02** - This document (Kernel Architecture & Scaffolding)
3. Kernel boundary rules (Section 1.2)
4. Canon boundary rules (Section 2.2)
5. Molecule boundary rules (Section 3.2)
6. Cell non-negotiables (Section 4.2)

---

**End of Contract CONT_02**




