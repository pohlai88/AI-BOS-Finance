# CONT_00 — AI-BOS Constitution

> **The Supreme Governance Document**  
> Defines the architectural pillars, hierarchy, and immutable laws of the AI-BOS Platform.

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Canon Code** | CONT_00 |
| **Version** | 1.0.0 |
| **Status** | 🟢 ACTIVE |
| **Classification** | SUPREME — All other contracts derive from this |
| **Author** | AI-BOS Architecture Team |
| **Last Updated** | 2025-01-15 |

---

## 🏛️ Preamble

This Constitution establishes the foundational architecture of **AI-BOS** (Artificial Intelligence Business Operating System) — an enterprise-grade platform for AI-governed business operations.

All architectural decisions, contracts, and implementations **MUST** conform to this Constitution. Any conflict between this document and derived contracts shall be resolved in favor of this Constitution.

---

## 📐 Article I: The Six Pillars of AI-BOS

The AI-BOS Platform consists of **six architectural pillars**, each with distinct responsibilities and boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI-BOS PLATFORM ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│    │    KERNEL    │◄──►│    CANON     │◄──►│      WEB     │                 │
│    │  (Control)   │    │  (Business)  │    │  (Frontend)  │                 │
│    └──────┬───────┘    └──────┬───────┘    └──────────────┘                 │
│           │                   │                                              │
│           │            ┌──────┴───────┐                                      │
│           │            │   MOLECULE   │                                      │
│           │            │  (Cluster)   │                                      │
│           │            └──────┬───────┘                                      │
│           │                   │                                              │
│           │            ┌──────┴───────┐                                      │
│           │            │     CELL     │                                      │
│           │            │ (Transaction)│                                      │
│           │            └──────────────┘                                      │
│           │                                                                  │
│           ▼                                                                  │
│    ┌──────────────┐                                                          │
│    │      DB      │                                                          │
│    │ (Data Fabric)│                                                          │
│    └──────────────┘                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pillar Definitions

| Pillar | Name | Purpose | Location |
|--------|------|---------|----------|
| **1** | **Kernel** | Control Plane — Identity, Authorization, Gateway, Audit | `apps/kernel/` |
| **2** | **Canon** | Business Logic Layer — Domain-specific operations | `apps/canon/<domain>/` |
| **3** | **Molecule** | Functional Cluster — Groups of related Cells | `apps/canon/<domain>/<molecule>/` |
| **4** | **Cell** | Atomic Transaction Unit — Single function ledger | `apps/canon/<domain>/<molecule>/<cell>/` |
| **5** | **DB** | Data Fabric — Schema governance, migrations, seeds | `apps/db/` |
| **6** | **Web** | Frontend — User interface (Next.js App Router) | `apps/web/` |

---

## 📜 Article II: Pillar Responsibilities

### Section 2.1 — Kernel (Control Plane)

**Governing Contract:** [CONT_02_KernelArchitecture.md](./CONT_02_KernelArchitecture.md)

The Kernel is the **Identity-to-Evidence Control Plane** that governs all platform operations.

| Responsibility | Description |
|---------------|-------------|
| **Identity** | Tenant and user authentication (JWT, sessions) |
| **Authorization** | Role-Based Access Control (RBAC) |
| **Gateway** | Request routing, rate limiting, circuit breaking |
| **Audit** | Immutable event logging (`kernel.audit_events`) |
| **Cell Registry** | Registration and health monitoring of Cells |

**Non-Negotiables:**
- ❌ Kernel MUST NOT contain business logic
- ❌ Kernel MUST NOT directly access business data
- ✅ Kernel MUST authenticate every request
- ✅ Kernel MUST log every state-changing action

---

### Section 2.2 — Canon (Business Logic Layer)

**Location:** `apps/canon/<domain>/`

Canons represent **bounded contexts** in Domain-Driven Design. Each Canon encapsulates a complete business domain.

| Canon | Domain | Status |
|-------|--------|--------|
| `finance/` | Financial Operations | 🟡 Active |
| `hrm/` | Human Resource Management | ⬜ Planned |
| `crm/` | Customer Relationship Management | ⬜ Planned |
| `scm/` | Supply Chain Management | ⬜ Planned |

**Non-Negotiables:**
- ❌ Canons MUST NOT share database tables across domains
- ❌ Canons MUST NOT bypass Kernel for authentication
- ✅ Canons MUST expose APIs via the Kernel Gateway
- ✅ Canons MUST emit domain events for cross-domain communication

---

### Section 2.3 — Molecule (Functional Cluster)

**Location:** `apps/canon/<domain>/<molecule>/`

Molecules group related Cells into functional clusters. They represent sub-domains within a Canon.

| Example | Canon | Molecule | Description |
|---------|-------|----------|-------------|
| `accounts-payable/` | Finance | AP | Vendor payments, approvals |
| `accounts-receivable/` | Finance | AR | Customer invoicing, collections |
| `treasury/` | Finance | Treasury | Cash pooling, FX |
| `general-ledger/` | Finance | GL | Journal entries, reconciliation |

**Non-Negotiables:**
- ❌ Molecules MUST NOT have cross-molecule database joins
- ✅ Molecules MAY share code via `<canon>/shared/`
- ✅ Molecules MUST define clear port interfaces

---

### Section 2.4 — Cell (Atomic Transaction Unit)

**Governing Contract:** [CONT_04_PaymentHubArchitecture.md](./CONT_04_PaymentHubArchitecture.md) (example)

**Location:** `apps/canon/<domain>/<molecule>/<cell>/`

Cells are the **atomic units** of business logic. Each Cell represents a single, well-defined transaction ledger.

| Example | Molecule | Cell | Transaction |
|---------|----------|------|-------------|
| `payment-hub/` | AP | Payment Hub | Payment governance & approval |
| `vendor-master/` | AP | Vendor Master | Vendor CRUD |
| `invoice-matching/` | AP | Invoice Match | 3-way matching |

**Architecture Pattern:** Hexagonal (Ports & Adapters)

```
┌─────────────────────────────────────────────┐
│                   CELL                       │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │          DOMAIN CORE                │    │
│  │  • Entities                         │    │
│  │  • Value Objects                    │    │
│  │  • Domain Services                  │    │
│  └─────────────────────────────────────┘    │
│                    │                         │
│  ┌─────────┐  ┌────┴────┐  ┌─────────┐     │
│  │ INBOUND │  │  PORTS  │  │OUTBOUND │     │
│  │  PORTS  │  │         │  │  PORTS  │     │
│  └────┬────┘  └─────────┘  └────┬────┘     │
│       │                         │           │
│  ┌────┴────┐              ┌────┴────┐      │
│  │ADAPTERS │              │ADAPTERS │      │
│  │ (API)   │              │ (DB/FX) │      │
│  └─────────┘              └─────────┘      │
└─────────────────────────────────────────────┘
```

**Non-Negotiables:**
- ❌ Cells MUST NOT call other Cells directly (use Kernel Gateway)
- ❌ Cells MUST NOT share in-memory state
- ✅ Cells MUST be independently deployable
- ✅ Cells MUST have their own health endpoints

---

### Section 2.5 — DB (Data Fabric)

**Governing Contract:** [CONT_03_DatabaseArchitecture.md](./CONT_03_DatabaseArchitecture.md)

**Location:** `apps/db/`

The DB pillar provides **schema governance** and database operations as an intelligent abstraction layer.

| Component | Location | Purpose |
|-----------|----------|---------|
| Migrations | `apps/db/migrations/<schema>/` | Schema versioning |
| Seeds | `apps/db/seeds/<schema>/` | Test/demo data |
| Tools | `apps/db/tools/` | Schema Guardian, validators |

**Schema Isolation:**

| Schema | Owner | Purpose |
|--------|-------|---------|
| `kernel` | Kernel | Identity, sessions, audit |
| `finance` | Canon Finance | Financial transactions |
| `config` | Platform | Provider profiles, routing |

**Non-Negotiables:**
- ❌ Frontend MUST NOT connect directly to DB
- ❌ Cross-schema JOINs are FORBIDDEN
- ✅ All tables MUST have `tenant_id` (except global tables)
- ✅ All tables MUST have `created_at` timestamp
- ✅ Immutable tables (journals, audit) MUST NOT have `updated_at`

---

### Section 2.6 — Web (Frontend)

**Location:** `apps/web/`

The Web pillar provides the **user interface** using Next.js App Router.

| Pattern | Description |
|---------|-------------|
| **BFF (Backend for Frontend)** | Route Handlers proxy to Canon/Kernel |
| **Server Components** | Data fetching on server |
| **Client Components** | Interactive UI elements |

**Communication Flow:**

```
User → Web (Next.js)
         ↓
      Route Handler (BFF)
         ↓
      Kernel Gateway (Auth)
         ↓
      Canon Cell (Business Logic)
         ↓
      DB (Data)
```

**Non-Negotiables:**
- ❌ Web MUST NOT connect directly to DB
- ❌ Web MUST NOT bypass Kernel for auth
- ✅ Web MUST use Kernel Gateway for all backend calls
- ✅ Web MUST validate user input client-side AND server-side

---

## ⚖️ Article III: Immutable Laws

These laws are **absolute** and cannot be overridden by any derived contract.

### Law 1: Separation of Concerns

> Each pillar has ONE primary responsibility. Pillars MUST NOT encroach on others' domains.

### Law 2: Tenant Isolation

> All tenant data MUST be isolated. Cross-tenant data access is FORBIDDEN except via explicit federation contracts.

### Law 3: Audit Trail

> Every state-changing operation MUST be recorded in `kernel.audit_events`. Audit logs are IMMUTABLE.

### Law 4: Authentication Required

> No business operation may proceed without valid authentication. The Kernel is the SOLE authenticator.

### Law 5: Schema Boundaries

> Database schemas are boundaries. Cross-schema queries are FORBIDDEN. Use API orchestration instead.

### Law 6: Cell Independence

> Cells are independently deployable. A Cell failure MUST NOT cascade to other Cells.

### Law 7: Evidence Over Trust

> The system trusts EVIDENCE (audit logs, signatures) over CLAIMS. Every claim must be verifiable.

---

## 🗂️ Article IV: Directory Structure

The canonical directory structure for AI-BOS:

```
AI-BOS-Finance/
├── apps/
│   ├── kernel/                      # Pillar 1: Control Plane
│   │   ├── src/                     # Core Kernel logic
│   │   ├── app/api/                 # Gateway API routes
│   │   └── docker-compose.yml
│   │
│   ├── canon/                       # Pillar 2-4: Business Logic
│   │   ├── finance/                 # Canon: Finance
│   │   │   ├── dom03-accounts-payable/    # Molecule: AP
│   │   │   │   ├── payment-hub/     # Cell: Payment Hub
│   │   │   │   └── vendor-master/   # Cell: Vendor Master
│   │   │   ├── treasury/            # Molecule: Treasury
│   │   │   └── general-ledger/      # Molecule: GL
│   │   ├── hrm/                     # Canon: HRM (future)
│   │   └── crm/                     # Canon: CRM (future)
│   │
│   ├── db/                          # Pillar 5: Data Fabric
│   │   ├── migrations/
│   │   │   ├── kernel/
│   │   │   ├── finance/
│   │   │   └── config/
│   │   ├── seeds/
│   │   └── tools/
│   │
│   └── web/                         # Pillar 6: Frontend
│       ├── app/                     # Next.js App Router
│       └── components/
│
├── packages/
│   ├── canon/                       # Governance contracts
│   │   └── A-Governance/
│   │       ├── A-CONT/              # Contracts (CONT_*)
│   │       └── A-ADR/               # Architecture Decision Records
│   ├── ui/                          # Shared UI components
│   └── shared/                      # Shared utilities
│
└── package.json                     # Root workspace
```

---

## 📜 Article V: Contract Hierarchy

All governance documents derive authority from this Constitution:

```
CONT_00 — Constitution (SUPREME)
    │
    ├── CONT_01 — Canon Identity (Naming & Codes)
    │
    ├── CONT_02 — Kernel Architecture (Control Plane)
    │
    ├── CONT_03 — Database Architecture (Data Fabric)
    │
    ├── CONT_04 — Payment Hub Architecture (Cell: AP-05)
    │
    ├── CONT_05 — Naming & Structure
    │
    ├── CONT_06 — Schema & Type Governance
    │
    ├── CONT_07 — Finance Canon Architecture (NEW)
    │
    └── ADR_* — Architecture Decision Records
```

**Precedence Rules:**
1. CONT_00 (Constitution) overrides all
2. CONT_01 (Identity) defines naming conventions
3. CONT_02-04 define pillar-specific rules
4. ADRs document specific decisions within contracts

---

## ✅ Article VI: Compliance

### Verification Tools

| Tool | Location | Purpose |
|------|----------|---------|
| Schema Guardian | `apps/db/tools/validate-schema.ts` | Validates SQL migrations |
| Governance Stamps | `scripts/TOOL_03_CheckGovernanceStamps.ts` | Validates Canon codes |

### Compliance Checklist

Before any PR is merged:

- [ ] All new tables have `tenant_id` (if tenant-scoped)
- [ ] All new tables have `created_at`
- [ ] No cross-schema JOINs introduced
- [ ] Cell changes do not affect other Cells
- [ ] Kernel routes are authenticated
- [ ] Audit events are emitted for state changes
- [ ] PRD/Contract updated if architecture changes

---

## 📎 Article VII: Amendments

This Constitution may be amended only by:

1. Creating an ADR documenting the proposed change
2. Updating this document with version increment
3. Approval by Architecture Team
4. Update of all derived contracts for consistency

**Amendment History:**

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2025-01-15 | Initial Constitution |

---

## 🔗 Related Documents

- [CONT_01: Canon Identity](./CONT_01_CanonIdentity.md) — Naming conventions
- [CONT_02: Kernel Architecture](./CONT_02_KernelArchitecture.md) — Control Plane
- [CONT_03: Database Architecture](./CONT_03_DatabaseArchitecture.md) — Data Fabric
- [CONT_04: Payment Hub Architecture](./CONT_04_PaymentHubArchitecture.md) — Cell: AP-05
- [CONT_05: Naming & Structure](./CONT_05_NamingAndStructure.md) — File Organization
- [CONT_06: Schema & Type Governance](./CONT_06_SchemaAndTypeGovernance.md) — Type Definitions
- [CONT_07: Finance Canon Architecture](./CONT_07_FinanceCanonArchitecture.md) — Finance Domain

---

**This Constitution is the supreme law of AI-BOS. All code, contracts, and decisions must align with its principles.**

---

**End of CONT_00 — AI-BOS Constitution v1.0.0**
