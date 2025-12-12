# AI-BOS / NexusCanon
## Canon Identity & Cell Registration Standard v2.2.0

> **Canon Code:** CONT_01  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** Canon Identity & Cell Registration across all AI-BOS / NexusCanon repos.

**Framework:** Next.js 14+ (App Router)  
**Language:** TypeScript 5.6+  
**UI Library:** React 18+  
**Last Updated:** 2025-12-11

---

## Document Status

**Version:** 2.2.0  
**Status:** Production Ready - Canon Planes Expansion  
**SSOT:** This document is the **Single Source of Truth (SSOT)** for the Canon Identity Contract.  
**Derived Documents:** `README.md` is a navigation index derived from this contract.  
**Template Source:** Derived from v1.0.0 + concrete YAML structures + Next.js best practices + Canon Planes taxonomy  
**Framework Target:** Next.js App Router (with Vite adaptation notes)  
**Implementation Status:** Steps 1 & 2 Complete (Enforcer + Generator)

**Changelog:** 
- **v2.2.0** - Canon Planes & Prefixes Expansion (Major Update ✅)
  - ✅ Expanded Section 3 with comprehensive 5-plane taxonomy (Governance, Functional, Data & Logic, Operations, Knowledge)
  - ✅ Added conflict resolution rules (ENT vs SCH, POLY vs CONST, TOOL vs POLY, etc.)
  - ✅ Added exclusions section (what NOT to govern - framework configs, utilities, etc.)
  - ✅ Updated repository layout (Section 4) to reflect new 5-plane structure
  - ✅ Expanded TypeScript types to include all plane prefixes (CONT, ADR, ENT, CONST, TOOL, MIG, INFRA, SPEC, REF)
  - ✅ Added Plane E (Knowledge) for specifications and references
  - ✅ Clarified distinction between logical identity (Canon IDs) and physical filenames
  - 🟢 **Enterprise-Grade Taxonomy** - Zero ambiguity, anti-pattern prevention

- **v2.1.0** - Implementation Complete (Production Approved ✅)
  - ✅ Added ESLint rule (`eslint-local-rules.js`) to enforce `PAGE_META` export in canonical pages
  - ✅ Improved auto-sync script (`scripts/sync-canon.ts` v1.1) with robust regex parsing
  - ✅ Integrated ESLint rule into `eslint.config.js` (flat config format)
  - ✅ Added `canon:sync` and `canon:validate` scripts to `package.json`
  - ✅ Complete closed-loop governance system (Enforcer + Generator)
  - ✅ Fixed section numbering (9.2 → 9.3, 9.3 → 9.4, 9.4 → 9.5)
  - ✅ Verified consistency of `bff_handler` paths
  - ✅ Security alignment for Server Actions (Section 8.2) - Server-side verification of `CanonContext`
  - ✅ Policy codes clarification (Section 5.5) - Explicitly stated primary policy persistence
  - 🟢 **Approved for Production** - Fortune-500 caliber standard

- **v2.0.1** - Security & Architecture Enhancements
  - ✅ Added security validation pattern (Section 8.1) - Never trust client CanonContext
  - ✅ Added auto-sync script foundation to eliminate "Three Sources of Truth" problem
  - ✅ Added Cell ID versioning strategy for database migration
  - ✅ Applied technical corrections: middleware pattern, Server Actions separation, route group clarification, Cell ID convention, Next.js BFF clarification

---

## 1. Purpose

AI-BOS and NexusCanon are **schema-first**. Every screen, component, flex-field and policy must be:

* **Uniquely identifiable** by a stable code (not by filename or English name),
* **Traceable end-to-end** (frontend → BFF → DB → logs),
* **Searchable in IDE and registry** without ambiguity,
* **Resistant to drift** when files are moved, renamed, or refactored.

This document defines the **Canon Identity Model** and the repository pattern from:

> **Repo → Project → Page → Component → Schema/Policy → Final Cell**

It is the foundation for future **schema registration** (Supabase / Manifestor Engine / Metadata Registry).

---

## 2. Problems We Are Solving

1. **IDE Drift / "Ghost Screens"**
   * Correct code gets refactored or moved; filenames and comments are not updated.
   * Obsolete identifiers remain in the repo forever; search results lie.

2. **Communication Gaps**
   * Business says: "Check the **Canon Landing Page**."
   * Devs ask: "Is that `/`, `/home`, `MarketingLandingPage.tsx` or something else?"
   * No single, guaranteed mapping from business name → code → file → route.

3. **Next.js File-System Routing Ambiguity**
   * With App Router, `app/**/page.tsx` defines routes.
   * Different teams may implement "canon" logic in multiple page.tsx files with no shared identity.
   * We need a pattern that preserves Next.js routing but still anchors each screen to a **stable code**.

4. **Dynamic / Flexi Fields Without Governance**
   * Flexible schemas (Meta_09, Tab_10, Policy_25…) can break silently.
   * Without a Canon ID, it is impossible to say precisely *where* the error occurred.

---

## 3. Canon Identity Model

We assign codes to all important artefacts across **five governance planes**. This taxonomy ensures zero ambiguity and prevents anti-patterns (e.g., assigning IDs to framework configs).

> **Core Principle:** Logical Identity vs. Physical Filename  
> We assign **Canon IDs** only to **Business & Architectural Assets** that define your unique IP.  
> Standard infrastructure files (e.g., `package.json`, `eslint.config.js`) remain un-ID'd.

---

### 3.1 Canon Planes Overview

AI-BOS Canon Governance operates across **five planes**:

1. **Plane A — Governance** (laws & decisions)
2. **Plane B — Functional** (pages, components, cells)
3. **Plane C — Data & Logic** (entities, schemas, policies, constants)
4. **Plane D — Operations** (tools, migrations, infrastructure)
5. **Plane E — Knowledge** (specifications, references)

Each plane uses reserved **prefix codes**. Only artefacts in these planes receive Canon IDs.

---

### 3.2 Plane A — Governance (Laws & Decisions)

These define the rules of the game. Immutable architectural standards.

| Plane | Prefix | Type     | Pattern           | Description                                   | Example                                    |
| ----- | ------ | -------- | ----------------- | --------------------------------------------- | ------------------------------------------ |
| A     | CONT   | Contract | `CONT_[0-9]{2,3}` | Canon / policy documents (non-negotiable law) | `CONT_01_CanonIdentity.md`                 |
| A     | ADR    | Decision | `ADR_[0-9]{3}`    | Architecture Decision Records (immutable)     | `ADR_005_SwitchToTurborepo.md`             |

**Examples:**
* `CONT_01_CanonIdentity.md` – Canon Identity & Cell Registration Standard (this document)
* `ADR_005_SwitchToTurborepo.md` – Decision to adopt Turborepo

**Versioning:** Contracts use SemVer. ADRs are immutable snapshots (no versioning).

---

### 3.3 Plane B — Functional (User-Facing Behavior)

These are the parts users touch. Routable screens and reusable UI components.

| Plane | Prefix | Type      | Pattern                                              | Description                                                     | Example                                    |
| ----- | ------ | --------- | ---------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------ |
| B     | PAGE   | Page      | `PAGE_<PageCode>_<ShortName>`                        | Routable screen or entry point                                  | `PAGE_META_02_GodView` (code: `META_02`)   |
| B     | COMP   | Component | `COMP_<ComponentCode>_<ShortName>`                   | Reusable governed UI component                                 | `COMP_TBLM01_MonetizeFullTable` (code: `TBLM01`) |
| B     | CELL   | Cell      | `CELL_<PageNum>_<SchemaNum>_<Tab>_<PolicyNumOrNULL>` | Atomic governed unit (Page + Schema + Tab + Policy + Component) | `CELL_META_09_101_10_25`                    |

**Alignment with Canon Identity v2.1.0:**
* `PageCode` (e.g. `META_02`, `PAY_01`) is the **core code**.
  * Full identity: `PAGE_META_02_GodView` (filename: `META_02_CanonLandingPage.tsx`)
* `ComponentCode` (e.g. `TBLM01`, `TBLL01`) is the **UI code**.
  * Full identity: `COMP_TBLM01_MonetizeFullTable` (filename: `TBLM01_MonetizeFullTable.tsx`)
* `cell_id` remains in the compressed format:
  * `CELL_META_09_101_10_25` → `META_09 / SCH_101 / TAB_10 / POLY_25`

**Versioning:** All functional artefacts use SemVer.

---

### 3.4 Plane C — Data & Logic (Business Truth & Rules)

These enforce data integrity and business rules.

| Plane | Prefix | Type     | Pattern            | Description                                         | Example                                    |
| ----- | ------ | -------- | ------------------ | --------------------------------------------------- | ------------------------------------------ |
| C     | ENT    | Entity   | `ENT_[0-9]{3}`     | Persistence model (database table / collection)     | `ENT_010_Payment`                          |
| C     | SCH    | Schema   | `SCH_[0-9]{3}`     | Runtime validation / data shape                     | `SCH_101_PaymentFlexFields`                |
| C     | POLY   | Policy   | `POLY_[0-9]{2,3}`  | Business rule sets (limits, workflows, permissions) | `POLY_25_PaymentMetadataPolicy`            |
| C     | CONST  | Constant | `CONST_[0-9]{2,3}` | Static application constants                        | `CONST_01_SupportedCurrencies`             |

**Conflict Resolution Rules:**

* **ENT vs SCH:**
  * `ENT_010_Payment` – how data is **stored** (DB table definition).
  * `SCH_101_PaymentFlexFields` – how data is **validated** at the boundary (API/Form).
  * *Traceability:* The `SCH` verifies data before it enters the `ENT`.

* **POLY vs CONST vs Config:**
  * `POLY_25_PaymentMetadataPolicy` – **executable logic** (permissions, limits, workflows).
  * `CONST_01_SupportedCurrencies` – **fixed code constant** (static app data).
  * Environment/config files remain **un-ID'd** (see Section 3.7).

* **SCH vs TYPE:**
  * Pure TypeScript interfaces (`types.ts`) are just code. We don't ID them.
  * `SCH` implies **runtime validation** (Zod, JSON Schema, etc.).

**Versioning:** All data/logic artefacts use SemVer.

---

### 3.5 Plane D — Operations (Machinery & Automation)

This is where developers often get messy. We distinguish between **Tooling** and **Infrastructure**.

| Plane | Prefix | Type      | Pattern                      | Description                                    | Example                                    |
| ----- | ------ | --------- | ---------------------------- | ---------------------------------------------- | ------------------------------------------ |
| D     | TOOL   | Tool      | `TOOL_[0-9]{2,3}`            | Internal CLIs / scripts (Dev/Ops utilities)    | `TOOL_01_CanonSync.ts`                     |
| D     | MIG    | Migration | `MIG_<YYYYMMDD>_<ShortSlug>` | Database schema migrations (evolving ENT)      | `MIG_20241211_AddUserRole.sql`            |
| D     | INFRA  | Infra     | `INFRA_[0-9]{2,3}`           | IaC definitions (Terraform, Docker, K8s, etc.) | `INFRA_01_RedisCluster.tf`                 |

**Conflict Resolution:**

* **TOOL vs POLY:**
  * Does it run in CI/CD pipeline or on a dev laptop? → **`TOOL`**.
  * Does it run when a user clicks "Buy"? → **`POLY`**.

* **MIG vs ENT:**
  * `ENT_010_Payment` – the **current** table definition.
  * `MIG_20241211_AddUserRole` – the **change** that created/modified the ENT.

**Versioning:** TOOL and INFRA use SemVer. MIG uses date-based naming (immutable snapshots).

---

### 3.6 Plane E — Knowledge (Library & Evidence)

These artifacts support the architecture but do not execute. They are the "library" of the ERP.

| Plane | Prefix | Type          | Pattern         | Description                                        | Example                                    |
| ----- | ------ | ------------- | --------------- | -------------------------------------------------- | ------------------------------------------ |
| E     | SPEC   | Specification | `SPEC_[0-9]{3}` | Feature / functional dossiers (what to build)      | `SPEC_010_PaymentHub_v2.md`                |
| E     | REF    | Reference     | `REF_[0-9]{3}`   | External / static references (standards, research) | `REF_001_ISO27001.pdf`                     |

**Examples:**
* `SPEC_010_PaymentHub_v2.md` – Payment Hub functional dossier (requirements)
* `REF_001_ISO27001.pdf` – ISO 27001 reference text
* `REF_050_GDPR_Text.pdf` – GDPR regulation text

**Relationships:**
* A **SPEC** is implemented by one or more **PAGE / CELL / ENT / SCH / POLY**.
* A **CONT** or **POLY** may cite **REF** documents as justification or evidence.

**Conflict Resolution:**

* **SPEC vs PAGE:**
  * `SPEC_010_PaymentHub` describes *what* to build (The Requirements). It is a document (Markdown/PDF).
  * `PAGE_PAY_01_PaymentHub` is *what was built* (The Code). It is a React file.
  * *Lifecycle:* The `SPEC` is written first. The `PAGE` implements the `SPEC`.

* **REF vs CONT:**
  * The PDF itself is **`REF_050_GDPR_Text`** (It is just a file in the library).
  * Your internal rule saying "We must encrypt emails to satisfy GDPR" is **`CONT_05_DataPrivacy`** or **`POLY_10_Encryption`**.
  * *Relationship:* The `CONT` references the `REF` as evidence.

* **REF vs ADR:**
  * The article is **`REF_100_MonorepoArticle`**.
  * Your decision to *use* a Monorepo is **`ADR_001_RepoStructure`**.
  * *Relationship:* The `ADR` links to the `REF` in its "Context" section.

**Versioning:** SPEC uses SemVer. REF uses version numbers from the source (e.g., `REF_002_StripeAPI_v3.md`).

---

### 3.7 Exclusions (Non-Governed Files)

The following **MUST NOT** receive Canon IDs. These are treated as **standard infrastructure**, not governed artefacts:

1. **Framework Configs:**
   * `package.json`, `eslint.config.js`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `turbo.json`, etc.
   * *Why:* These are standard industry files. Their identity is defined by their filename.

2. **Environment Variables:**
   * `.env`, `.env.local`, remote secret stores.
   * *Why:* These are infrastructure, not architectural assets.

3. **Generic Utilities:**
   * Small helpers such as `formatDate.ts`, `stringUtils.ts`, `logger.ts`.
   * *Why:* These are helpers, not architectural pillars.

4. **Pure Type Definition Bundles:**
   * `types.ts` (unless they serve as runtime schemas, in which case they become `SCH_*`).
   * *Why:* Types are abstract. We govern `SCH` (Schemas) because they run at runtime.

**Rule:** If it doesn't fit `CONT`, `ADR`, `PAGE`, `COMP`, `CELL`, `ENT`, `SCH`, `POLY`, `CONST`, `TOOL`, `MIG`, `INFRA`, `SPEC`, or `REF`, it is likely dead code or technical debt. Delete it or refactor it into a governed artefact.

---

### 3.8 Summary Table

| Plane | Prefix | Type      | Pattern                      | Core Code Example | Full Identity Example                      |
| ----- | ------ | --------- | ---------------------------- | ----------------- | ------------------------------------------ |
| A     | CONT   | Contract  | `CONT_[0-9]{2,3}`            | `CONT_01`         | `CONT_01_CanonIdentity.md`                 |
| A     | ADR    | Decision  | `ADR_[0-9]{3}`               | `ADR_005`         | `ADR_005_SwitchToTurborepo.md`            |
| B     | PAGE   | Page      | `PAGE_<PageCode>_<Name>`     | `META_02`         | `PAGE_META_02_GodView`                     |
| B     | COMP   | Component | `COMP_<ComponentCode>_<Name>` | `TBLM01`          | `COMP_TBLM01_MonetizeFullTable`            |
| B     | CELL   | Cell      | `CELL_<PAGE_CODE>_<SCHEMA_NUM>_<TAB_NUM>_<POLICY_NUM_OR_NULL>` | `CELL_META_09_101_10_25` | `CELL_META_09_101_10_25` (compressed) |
| C     | ENT    | Entity    | `ENT_[0-9]{3}`               | `ENT_010`         | `ENT_010_Payment`                          |
| C     | SCH    | Schema    | `SCH_[0-9]{3}`               | `SCH_101`         | `SCH_101_PaymentFlexFields`                |
| C     | POLY   | Policy    | `POLY_[0-9]{2,3}`            | `POLY_25`         | `POLY_25_PaymentMetadataPolicy`            |
| C     | CONST  | Constant  | `CONST_[0-9]{2,3}`           | `CONST_01`        | `CONST_01_SupportedCurrencies`            |
| D     | TOOL   | Tool      | `TOOL_[0-9]{2,3}`            | `TOOL_01`         | `TOOL_01_CanonSync.ts`                    |
| D     | MIG    | Migration | `MIG_<YYYYMMDD>_<Slug>`      | `MIG_20241211`    | `MIG_20241211_AddUserRole.sql`            |
| D     | INFRA  | Infra     | `INFRA_[0-9]{2,3}`           | `INFRA_01`        | `INFRA_01_RedisCluster.tf`                 |
| E     | SPEC   | Spec      | `SPEC_[0-9]{3}`              | `SPEC_010`        | `SPEC_010_PaymentHub_v2.md`                |
| E     | REF    | Reference | `REF_[0-9]{3}`               | `REF_001`         | `REF_001_ISO27001.pdf`                     |

> **Rule:** All serious discussion uses these codes, not ambiguous names.  
> Humans may say *"Canon Landing Page"*, but code and logs must say **`META_02`** or **`PAGE_META_02_GodView`**.

---

## 4. Repository Layout (Next.js App Router)

Based on the 5-plane taxonomy, your file structure should look like this. Note that **Filenames** follow Framework standards (Next.js/Drizzle), but **Internal IDs** (Meta blocks) define the Governance.

```text
aibos/
├── canon/                                   # Canon root (Governance + Registry)
│   ├── contracts/                           # Plane A — Governance (CONT, ADR)
│   │   ├── CONT_01_CanonIdentity.md         # This document
│   │   ├── CONT_02_DataPrivacy.md
│   │   └── adrs/
│   │       ├── ADR_001_RepoStructure.md
│   │       └── ADR_005_SwitchToTurborepo.md
│   │
│   └── registry/                            # Registry & manifests (source of truth)
│       ├── pages.yaml
│       ├── components.yaml
│       ├── schemas.yaml
│       ├── policies.yaml
│       └── cells.yaml
│
├── knowledge/                               # Plane E — Knowledge (SPEC, REF)
│   ├── specs/
│   │   ├── SPEC_010_PaymentHub_v2.md
│   │   └── SPEC_011_FraudDetection.md
│   └── references/
│       ├── REF_001_ISO27001.pdf
│       ├── REF_002_StripeAPI_v3.md
│       └── REF_050_GDPR_Text.pdf
│
├── apps/
│   └── web/
│       ├── app/                             # Next.js routes (wrappers only)
│       │   ├── canon/page.tsx               # wraps PAGE_META_02 (META_02)
│       │   ├── meta/flex/page.tsx           # wraps PAGE_META_09
│       │   └── payments/page.tsx            # wraps PAGE_PAY_01
│       └── canon-pages/                     # Plane B — PAGE / CELL
│           ├── META/
│           │   ├── META_02_CanonLandingPage.tsx        # PAGE_META_02
│           │   └── META_09_FlexFieldsPage.tsx          # PAGE_META_09
│           └── PAY/
│               └── PAY_01_PaymentHubPage.tsx           # PAGE_PAY_01
│
├── packages/
│   ├── canon/                               # Canon types package
│   │   └── src/
│   │       └── types.ts                     # Canon type definitions (import from '@aibos/canon')
│   │
│   ├── ui/                                  # Plane B — COMP
│   │   └── canon/
│   │       └── tables/
│   │           ├── TBLM01_MonetizeFullTable.tsx        # COMP_TBLM01
│   │           └── TBLL01_LiteTable.tsx                # COMP_TBLL01
│   │
│   ├── database/                            # Plane C + D (ENT, MIG)
│   │   ├── schema.ts                        # exports ENT_001_User, ENT_010_Payment
│   │   └── migrations/
│   │       └── MIG_20241211_AddUserRole.sql
│   │
│   ├── schemas/                             # Plane C — SCH
│   │   ├── payment/
│   │   │   └── SCH_101_PaymentFlexFields.ts
│   │   └── metadata/
│   │       └── SCH_301_MetadataRegistry.ts
│   │
│   ├── policies/                            # Plane C — POLY
│   │   ├── POLY_25_PaymentMetadataPolicy.ts
│   │   └── POLY_30_DataRetentionPolicy.ts
│   │
│   └── core/                                # Plane C — CONST
│       └── constants/
│           └── CONST_01_SupportedCurrencies.ts
│
├── scripts/                                 # Plane D — TOOL
│   ├── TOOL_01_CanonSync.ts
│   └── TOOL_02_SeedInitialData.ts
│
├── infra/                                   # Plane D — INFRA (IaC)
│   ├── INFRA_01_RedisCluster.tf
│   └── INFRA_02_AWSVPC.tf
│
└── (standard configs, un-ID'd)              # UNGOVERNED INFRASTRUCTURE
    ├── package.json
    ├── eslint.config.js
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    └── turbo.json
```

**Next.js Best Practices:**
* **Routing lives under `/app/**/page.tsx`** (Next.js requirement)
* **Canonical pages live under `/canon-pages/**` with codes in filenames**
* **App Router `page.tsx` files are thin wrappers** that import and re-export the canonical page
* **Route groups `(canon)` are invisible in URLs.** The URL segment comes from the folder **inside** the group: `app/(canon)/canon/page.tsx` → `/canon` (the group name `(canon)` does not appear in the URL). If you use `app/(canon)/page.tsx`, it maps to `/`, not `/canon`.

**Directory Organization by Plane:**
* **Plane A (Governance):** `canon/contracts/` directory
* **Plane B (Functional):** `apps/web/canon-pages/` and `packages/ui/canon/`
* **Plane C (Data & Logic):** `packages/database/`, `packages/schemas/`, `packages/policies/`, `packages/core/constants/`
* **Plane D (Operations):** `scripts/` and `infra/`
* **Plane E (Knowledge):** `knowledge/` directory
* **Registry (Machine-Readable):** `canon/registry/` (YAML manifests)

---

## 5. Canon Registry Templates

**Template Source:** Derived from v1.0.0 + concrete YAML structures + Next.js App Router patterns

These YAML files are **stack-agnostic**; whether you are in Next.js or Vite, they remain the same. Only `impl_file` / `entry_file` fields differ.

### 5.1 `canon/pages.yaml` – Page Registry

**Goal:** One record per screen. Must be able to answer:

> "Where is `META_02` in the repo, and what route is it?"

**Template:**

```yaml
# canon/pages.yaml
# All routable pages / screens.

pages:
  - code: META_02                # REQUIRED, unique. e.g. META_02, SYS_03
    version: 1.0.0               # REQUIRED. SemVer
    name: "Canon Landing Page"   # REQUIRED. Human label
    domain: "METADATA"           # REQUIRED. e.g. METADATA | SYSTEM | PAYMENT | AUTH | LANDING
    app: "web"                   # REQUIRED. app name or "web"
    route: "/canon"              # REQUIRED. URL path (Next.js route)
    impl_file: "apps/web/canon-pages/META/META_02_CanonLandingPage.tsx"
                                  # REQUIRED. Canonical React page implementation
    entry_file: "apps/web/app/canon/page.tsx"
                                  # REQUIRED. Next.js: app/**/page.tsx wrapper
                                  # Vite: "src/routes/registry.ts#META_02"
    status: "active"             # REQUIRED. active | draft | deprecated
    owner: "CID_METADATA"        # REQUIRED. team or role identifier
    description: >               # OPTIONAL. Multi-line description
      Main Canon landing page for NexusCanon.
      Displays metadata registry with search and filters.

  - code: META_09
    version: 1.0.0
    name: "Metadata Flex Fields"
    domain: "METADATA"
    app: "web"
    route: "/meta/flex"
    impl_file: "apps/web/canon-pages/META/META_09_FlexFieldsPage.tsx"
    entry_file: "apps/web/app/meta/flex/page.tsx"
    status: "active"
    owner: "CID_METADATA"
    description: >
      Flexible metadata fields page with dynamic schema support.
      Uses SCH_101 schema and POLY_25 policy.

  - code: SYS_03
    version: 1.0.0
    name: "Access Control"
    domain: "SYSTEM"
    app: "web"
    route: "/sys/access"
    impl_file: "apps/web/canon-pages/SYS/SYS_03_AccessControlPage.tsx"
    entry_file: "apps/web/app/sys/access/page.tsx"
    status: "active"
    owner: "CID_SYSTEM"
    description: >
      User access control, RBAC, invites, and team management.

  - code: PAY_01
    version: 1.0.0
    name: "Payment Hub"
    domain: "PAYMENT"
    app: "web"
    route: "/payments"
    impl_file: "apps/web/canon-pages/PAY/PAY_01_PaymentHubPage.tsx"
    entry_file: "apps/web/app/payments/page.tsx"
    status: "active"
    owner: "CID_FINANCE"
    description: >
      Payment hub dashboard with transaction management and approvals.
```

**Next.js Specific Notes:**
* `route` must match the file path in `app/` directory
* `entry_file` points to the `page.tsx` wrapper
* Route groups like `(canon)` are optional but recommended for organization

---

### 5.2 `canon/components.yaml` – Canonical UI Components

**Goal:** Make it obvious which **exact table** is being used (e.g. monetize vs lite).

**Template:**

```yaml
# canon/components.yaml
# Canonical UI components – especially where variants matter.

components:
  - code: TBLM01
    version: 1.0.0
    name: "Monetize Full-Stack Table"
    family: "TABLE"        # TABLE | FORM | WIDGET | SHELL
    purpose: "MONETIZE"    # MONETIZE | GENERAL | INTERNAL
    impl_file: "packages/ui/canon/tables/TBLM01_MonetizeFullTable.tsx"
    status: "active"       # active | draft | deprecated
    owner: "FINANCE_UI"
    notes: >
      TanStack full stack table. Must be used for any monetized flows.
      Includes advanced filtering, sorting, pagination, and export features.
      Enforces financial data governance rules.

  - code: TBLL01
    version: 1.0.0
    name: "Lite Table"
    family: "TABLE"
    purpose: "GENERAL"
    impl_file: "packages/ui/canon/tables/TBLL01_LiteTable.tsx"
    status: "active"
    owner: "UI_CORE"
    notes: >
      Light table variant, no heavy filters, for non-monetary screens.
      Optimized for performance with large datasets.

  - code: FRMM01
    version: 1.0.0
    name: "Monetize Form"
    family: "FORM"
    purpose: "MONETIZE"
    impl_file: "packages/ui/canon/forms/FRMM01_MonetizeForm.tsx"
    status: "active"
    owner: "FINANCE_UI"
    notes: >
      Standardized form for payment and financial data entry.
      Includes validation, error handling, and audit trail integration.
```

**Enforcement Rule:**
* **Monetize flows must use `TBLM01`** – this is how you enforce it via registry validation.

---

### 5.3 `canon/schemas.yaml` – Validation Schemas

**Goal:** Tie `SCH_101` to a real TypeScript / Zod schema.

**Template:**

```yaml
# canon/schemas.yaml
# Schema codes for flex fields, validation, etc.

schemas:
  - code: SCH_101
    version: 2.0.0
    name: "Payment Flex Fields"
    kind: "zod"                      # zod | json_schema | drizzle | prisma | typescript
    module: "@aibos/schemas/payment" # TS module path
    export: "paymentFlexSchema"      # Export name in the module
    impl_file: "packages/schemas/src/payment/paymentFlexSchema.ts"
    status: "active"
    owner: "CID_METADATA"
    description: >
      Schema 101 for payment-related flexible metadata fields.
      Used in META_09 flex fields page with POLY_25 policy.

  - code: SCH_201
    version: 1.0.0
    name: "Customer Flex Fields"
    kind: "zod"
    module: "@aibos/schemas/customer"
    export: "customerFlexSchema"
    impl_file: "packages/schemas/src/customer/customerFlexSchema.ts"
    status: "draft"
    owner: "CID_METADATA"
    description: >
      Schema for customer-related flexible metadata fields.

  - code: SCH_301
    version: 1.0.0
    name: "Metadata Registry Schema"
    kind: "typescript"
    module: "@/types/metadata"
    export: "MetadataRecord"
    impl_file: "src/types/metadata.ts"
    status: "active"
    owner: "CID_METADATA"
    description: >
      TypeScript interface for metadata registry records.
      Used in META_02 God View table.
```

**Schema Types Supported:**
* `zod` - Zod validation schemas
* `json_schema` - JSON Schema
* `drizzle` - Drizzle ORM schema
* `prisma` - Prisma schema
* `typescript` - TypeScript interfaces/types

---

### 5.4 `canon/policies.yaml` – Policies / Rule Sets

**Goal:** `POLY_25` is not just a string; it points to real code.

**Template:**

```yaml
# canon/policies.yaml
# Business policies / rule sets.

policies:
  - code: POLY_25
    version: 1.0.2
    name: "Payment Metadata Policy"
    impl_file: "apps/bff/src/policies/paymentMetadataPolicy.ts"
    config_key: "payment_metadata_policy_v1"   # Optional link to config store
    status: "active"
    owner: "CID_GOVERNANCE"
    description: >
      Rules for payment metadata (limits, conditions, roles, etc.) used with SCH_101.
      Enforces financial compliance and audit requirements.

  - code: POLY_10
    version: 1.0.0
    name: "Basic KYC Policy"
    impl_file: "apps/bff/src/policies/kycPolicy.ts"
    config_key: "kyc_policy_v1"
    status: "active"
    owner: "CID_GOVERNANCE"
    description: >
      Basic Know Your Customer policy for user onboarding.

  - code: POLY_30
    version: 1.0.0
    name: "Data Retention Policy"
    impl_file: "apps/bff/src/policies/dataRetentionPolicy.ts"
    config_key: "data_retention_policy_v1"
    status: "active"
    owner: "CID_GOVERNANCE"
    description: >
      Policy governing data retention periods and archival rules.
```

---

### 5.5 `canon/cells.yaml` – Final Cells (Meta_09 + SCH_101 + TAB_10 + POLY_25)

**This is the key for debugging hell.**

Each cell is the tuple:

> Page + Schema + Tab + Policy (+ Component)

**Template:**

```yaml
# canon/cells.yaml
# Final governed UI cells.

cells:
  - cell_id: "CELL_META_09_101_10_25"          # REQUIRED. Stable ID.
    version: 1.0.0                             # REQUIRED.
    page_code: "META_09"                       # REQUIRED. from pages.yaml
    schema_code: "SCH_101"                     # REQUIRED. from schemas.yaml
    tab_code: "TAB_10"                         # REQUIRED. layout/tab variant
    policy_codes:                              # REQUIRED. 1+ policy codes
      - "POLY_25"
    component_code: "TBLM01"                   # REQUIRED. which canonical table
    impl_file: "apps/web/canon-pages/META/META_09_FlexFieldsCell.tsx"
    bff_handler: "apps/web/app/api/meta/flex/route.ts"
                                  # Next.js Route Handler (recommended)
                                  # OR: "apps/bff/src/routes/meta/meta09FlexCell.ts" (separate service)
    db_table: "meta_flex_field"                # Optional but very useful
    status: "active"
    owner: "CID_METADATA"
    description: >
      Flex field block on META_09 using schema SCH_101, policy POLY_25,
      layout TAB_10, rendered with monetize table TBLM01.
      This cell handles payment metadata flex fields with financial governance.

  - cell_id: "CELL_META_02_301_01_NULL"
    version: 1.0.0
    page_code: "META_02"
    schema_code: "SCH_301"
    tab_code: "TAB_01"
    policy_codes: []                           # Empty array if no policy
    component_code: "TBLL01"
    impl_file: "apps/web/canon-pages/META/META_02_RegistryTable.tsx"
    bff_handler: "apps/bff/src/routes/meta/registry.ts"
    db_table: "metadata_registry"
    status: "active"
    owner: "CID_METADATA"
    description: >
      Main registry table on META_02 God View page.
      Uses lite table (TBLL01) for general metadata display.
```

**Cell ID Format (compressed numeric form):**

We store **full codes** in YAML (`schema_code: "SCH_101"`, `policy_codes: ["POLY_25"]`), but the `cell_id` uses a **compressed numeric form for speed-of-reading and search**:

```text
CELL_<PAGE_PREFIX>_<PAGE_NUM>_<SCHEMA_NUM>_<TAB_NUM>_<POLICY_NUM_OR_NULL>
```

**Examples:**

* `META_09`, `SCH_101`, `TAB_10`, `POLY_25`
  → `CELL_META_09_101_10_25`
* `META_02`, `SCH_301`, `TAB_01`, (no policy)
  → `CELL_META_02_301_01_NULL`

**Rule:** The YAML fields with full codes (`schema_code: "SCH_101"`, `policy_codes: ["POLY_25"]`) are the **canonical source of truth**. The compressed ID is a **shortcut for visual reference and IDE search** - it uses only the numeric parts for brevity.

**Policy Codes vs Database Schema:**

In the Canon registry, `policy_codes` is an array (1+ policies):

```yaml
policy_codes:          # REQUIRED. 1+ policy codes
  - "POLY_25"
```

However, in the database schema, we currently store a single `policy_code`:

```sql
policy_code TEXT NOT NULL,    -- POLY_25
```

**Design Decision:** For now, the **first entry** in `policy_codes` is treated as the **primary policy** and is persisted as `policy_code` in the database. Secondary policies (if any) are governance-only and not stored in `meta_flex_field`. If multi-policy persistence is required later, `policy_code` can be migrated to `policy_codes JSONB` or `TEXT[]`.

**Cell ID Versioning Strategy:**

When a policy upgrades (e.g., `POLY_25` → `POLY_26`), the Cell ID changes:
- Old: `CELL_META_09_101_10_25`
- New: `CELL_META_09_101_10_26`

**Database Impact:**
If you store `cell_id` in the database (e.g., for saved user preferences or flex field data), you must handle versioning:

**Option A: Versioned Cell IDs (Recommended)**
- Store both `cell_id` (current) and `cell_id_created` (snapshot at creation)
- When Cell ID changes, old data remains valid with `cell_id_created`
- New data uses new Cell ID

**Option B: Cell ID Aliases**
- Maintain a mapping: `CELL_META_09_101_10_25` → `CELL_META_09_101_10_26`
- Query both old and new IDs
- Migrate data gradually

**Option C: Immutable Cell IDs**
- Never change Cell ID once created
- Create new Cell ID for policy upgrades
- Mark old Cell ID as `deprecated`

**Recommendation:** Use Option A for flexibility, Option C for strict governance.

**Debugging Power:**
Now, whenever something explodes, the log can say:

> Error at `CELL_META_09_101_10_25 (META_09 / SCH_101 / TAB_10 / POLY_25, component TBLM01)`

…and you have **one line** in YAML that points to exact files.

---

## 6. TypeScript Type Definitions

**Template Source:** Derived from YAML structures + TypeScript best practices

```typescript
// packages/canon/src/types.ts
// Canon Identity Model Type Definitions
// Import as: import type { PageCode, CanonContext } from '@aibos/canon';

// ============================================================================
// CODE TYPES (Canon Planes A-E)
// ============================================================================

// ============================================================================
// PLANE A — Governance
// ============================================================================

export type ContractCode = `CONT_${number}`;
export type DecisionCode = `ADR_${number}`;

// ============================================================================
// PLANE B — Functional
// ============================================================================

// Note: This union is illustrative. The true list is generated from canon/pages.yaml
// When adding new pages, update both the YAML registry and this type.
export type PageCode =
  | 'LAND_01'
  | 'META_01' | 'META_02' | 'META_03' | 'META_04'
  | 'META_05' | 'META_06' | 'META_07' | 'META_08' | 'META_09'
  | 'PAY_01' | 'PAY_02' | 'PAY_03' | 'PAY_04'
  | 'SYS_01' | 'SYS_02' | 'SYS_03' | 'SYS_04'
  | 'REG_01' | 'REG_02' | 'REG_03';

export type ComponentCode =
  | 'TBLM01'  // Monetize Full Table
  | 'TBLL01'  // Lite Table
  | 'FRMM01'; // Monetize Form

export type TabCode = `TAB_${number}`;
export type CellId = `CELL_${string}`; // e.g., CELL_META_09_101_10_25

// ============================================================================
// PLANE C — Data & Logic
// ============================================================================

export type EntityCode = `ENT_${number}`;
export type SchemaCode = `SCH_${number}`;
export type PolicyCode = `POLY_${number}`;
export type ConstantCode = `CONST_${number}`;

// ============================================================================
// PLANE D — Operations
// ============================================================================

export type ToolCode = `TOOL_${number}`;
export type MigrationCode = `MIG_${string}`; // e.g., MIG_20241211_AddUserRole
export type InfraCode = `INFRA_${number}`;

// ============================================================================
// PLANE E — Knowledge
// ============================================================================

export type SpecCode = `SPEC_${number}`;
export type RefCode = `REF_${number}`;

// ============================================================================
// COMMON TYPES
// ============================================================================

export type Domain = 'METADATA' | 'PAYMENT' | 'SYSTEM' | 'AUTH' | 'LANDING';
// Rule: New domains must be registered in this type before use in pages.yaml

export type Status = 'active' | 'draft' | 'deprecated';
export type ComponentFamily = 'TABLE' | 'FORM' | 'WIDGET' | 'SHELL';
export type SchemaKind = 'zod' | 'json_schema' | 'drizzle' | 'prisma' | 'typescript';

// ============================================================================
// REGISTRY INTERFACES
// ============================================================================

export interface PageRegistryItem {
  code: PageCode;
  version: string;
  name: string;
  domain: Domain;
  app: string;
  route: string;
  impl_file: string;
  entry_file: string;
  status: Status;
  owner: string;
  description?: string;
}

export interface ComponentRegistryItem {
  code: ComponentCode;
  version: string;
  name: string;
  family: ComponentFamily;
  purpose: string;
  impl_file: string;
  status: Status;
  owner: string;
  notes?: string;
}

export interface SchemaRegistryItem {
  code: SchemaCode;
  version: string;
  name: string;
  kind: SchemaKind;
  module: string;
  export: string;
  impl_file: string;
  status: Status;
  owner: string;
  description?: string;
}

export interface PolicyRegistryItem {
  code: PolicyCode;
  version: string;
  name: string;
  impl_file: string;
  config_key?: string;
  status: Status;
  owner: string;
  description?: string;
}

export interface CellRegistryItem {
  cell_id: string;
  version: string;
  page_code: PageCode;
  schema_code: SchemaCode;
  tab_code: TabCode;
  policy_codes: PolicyCode[];
  component_code: ComponentCode;
  impl_file: string;
  bff_handler?: string;
  db_table?: string;
  status: Status;
  owner: string;
  description?: string;
}

// ============================================================================
// IN-CODE META INTERFACES
// ============================================================================

export interface PageMeta {
  code: PageCode;
  version: string;
  name: string;
  route: string;
  domain: Domain;
  status: Status;
  owner?: string;
  classification?: string;
}

export interface ComponentMeta {
  code: ComponentCode;
  version: string;
  family: ComponentFamily;
  name: string;
  purpose: string;
  status: Status;
  owner?: string;
}

export interface CellMeta {
  cellId: string;
  pageCode: PageCode;
  schemaCode: SchemaCode;
  tabCode: TabCode;
  policyCodes: PolicyCode[];
  version: string;
  componentCode?: ComponentCode;
}

// ============================================================================
// CANON CONTEXT (for API requests)
// ============================================================================

export interface CanonContext {
  pageCode: PageCode;
  schemaCode?: SchemaCode;
  tabCode?: TabCode;
  policyCodes?: PolicyCode[];
  cellId?: string;
  componentCode?: ComponentCode;
}

// ============================================================================
// REGISTRY COLLECTIONS
// ============================================================================

export interface CanonRegistry {
  pages: PageRegistryItem[];
  components: ComponentRegistryItem[];
  schemas: SchemaRegistryItem[];
  policies: PolicyRegistryItem[];
  cells: CellRegistryItem[];
}
```

---

## 7. Next.js Implementation Patterns

### 7.1 Canonical Page Implementation

**File:** `apps/web/canon-pages/META/META_02_CanonLandingPage.tsx`

```tsx
// ============================================================================
// PAGE CANON: META_02  // CANON LANDING PAGE
// VERSION:   1.0.0
// DOMAIN:    METADATA
// SUMMARY:   Main Canon landing page for NexusCanon
// ============================================================================

import { Metadata } from 'next';
import { MetaPageHeader } from '@/packages/ui/shells/MetaPageHeader';
import { MonetizeFullTable } from '@/packages/ui/canon/tables/TBLM01_MonetizeFullTable';

export const PAGE_META = {
  code: 'META_02',
  version: '1.0.0',
  name: 'CANON LANDING PAGE',
  subtitle: 'Main Canon landing page for NexusCanon',
  route: '/canon',
  domain: 'METADATA',
  owner: 'CID_METADATA',
  classification: 'PUBLIC',
} as const satisfies PageMeta;

// Next.js Metadata API
export const metadata: Metadata = {
  title: `${PAGE_META.code} - ${PAGE_META.name}`,
  description: PAGE_META.subtitle,
};

export default function CanonLandingPage() {
  return (
    <>
      <MetaPageHeader
        code={PAGE_META.code}
        version={PAGE_META.version}
        title={PAGE_META.name}
        subtitle={PAGE_META.subtitle}
      />
      <MonetizeFullTable /* props */ />
    </>
  );
}
```

### 7.2 Next.js Route Wrapper

**File:** `apps/web/app/canon/page.tsx`

```tsx
// ============================================================================
// NEXT.JS ROUTE WRAPPER: META_02
// Route: /canon
// ============================================================================

import CanonLandingPage from '@/canon-pages/META/META_02_CanonLandingPage';

export default CanonLandingPage;

// Re-export metadata for Next.js
export { metadata } from '@/canon-pages/META/META_02_CanonLandingPage';
```

**Next.js Best Practices:**
* Thin wrapper pattern preserves file-system routing
* Re-export metadata for SEO (re-exporting is valid; `generateMetadata` is optional for dynamic SEO)
* Can add route-specific logic (auth, redirects) inside the async page component
* **Note:** Middleware must be in `middleware.ts` at project root, not exported from `page.tsx`

**Example with Auth Check:**
```tsx
// apps/web/app/canon/page.tsx
import { redirect } from 'next/navigation';
import CanonLandingPage, { metadata } from '@/canon-pages/META/META_02_CanonLandingPage';
import { getSession } from '@/lib/auth';

export { metadata };

export default async function CanonRoute() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return <CanonLandingPage />;
}
```

### 7.3 Canonical Component Implementation

**File:** `packages/ui/canon/tables/TBLM01_MonetizeFullTable.tsx`

```tsx
// ============================================================================
// COMPONENT CANON: TBLM01  // Monetize Full-Stack Table
// VERSION:   1.0.0
// FAMILY:    TABLE
// PURPOSE:   MONETIZE_FLOW_ONLY
// ============================================================================

'use client'; // Next.js client component

import { useReactTable } from '@tanstack/react-table';

export const COMPONENT_META = {
  code: 'TBLM01',
  version: '1.0.0',
  family: 'TABLE',
  purpose: 'MONETIZE',
  owner: 'FINANCE_UI',
  status: 'active',
} as const satisfies ComponentMeta;

interface MonetizeFullTableProps {
  canon?: CanonContext;
  // ... other props
}

export function MonetizeFullTable({ canon, ...props }: MonetizeFullTableProps) {
  // Implementation with TanStack Table
  const table = useReactTable({
    // ... config
  });

  return (
    <div>
      {/* Table implementation */}
    </div>
  );
}
```

### 7.4 Cell Implementation (Flex Fields)

**File:** `apps/web/canon-pages/META/META_09_FlexFieldsCell.tsx`

```tsx
// ============================================================================
// CELL CANON: META_09 / SCH_101 / TAB_10 / POLY_25
// CELL ID:    CELL_META_09_101_10_25
// VERSION:    1.0.0
// PURPOSE:    Payment Metadata Flex Fields (Tab 10)
// ============================================================================

'use client';

import { MonetizeFullTable } from '@/packages/ui/canon/tables/TBLM01_MonetizeFullTable';

export const CELL_META = {
  cellId: 'CELL_META_09_101_10_25',
  pageCode: 'META_09',
  schemaCode: 'SCH_101',
  tabCode: 'TAB_10',
  policyCodes: ['POLY_25'],
  version: '1.0.0',
  componentCode: 'TBLM01',
} as const satisfies CellMeta;

export function Meta09FlexFieldsCell() {
  return (
    <MonetizeFullTable
      canon={CELL_META}        // forwarded to BFF + logs
      /* other props */
    />
  );
}
```

---

## 8. Data & Logging Contract (BFF / Backend / DB)

Every request originating from a governed cell must carry **Canon context**:

```typescript
interface CanonContext {
  pageCode: PageCode;       // "META_09"
  schemaCode?: SchemaCode; // "SCH_101"
  tabCode?: TabCode;        // "TAB_10"
  policyCodes?: PolicyCode[]; // ["POLY_25"]
  cellId?: string;          // "CELL_META_09_101_10_25"
  componentCode?: ComponentCode; // "TBLM01"
}
```

**Example API Payload:**

```json
{
  "canon": {
    "pageCode": "META_09",
    "schemaCode": "SCH_101",
    "tabCode": "TAB_10",
    "policyCodes": ["POLY_25"],
    "cellId": "CELL_META_09_101_10_25",
    "componentCode": "TBLM01"
  },
  "payload": {
    "fieldValues": { /* ... */ }
  }
}
```

**Backend Usage (Next.js Route Handlers):**

> **Important:** In this architecture, Next.js App Router **Route Handlers** (`app/api/**/route.ts`) *act as the primary BFF layer*. In most cases you **do not need** a separate Express/Fastify BFF service.
> A separate BFF service is still possible for special cases (see "Alternative (Separate BFF Service)" below).

```typescript
// apps/web/app/api/meta/flex/route.ts (Next.js Route Handler)

import { NextRequest, NextResponse } from 'next/server';
import type { CanonContext } from '@/types/canon';

export async function POST(request: NextRequest) {
  const { canon, payload } = await request.json();

  // ============================================================================
  // SECURITY: Verify, Don't Trust
  // ============================================================================
  
  // 1. Validate canon context exists
  if (!canon?.pageCode) {
    return NextResponse.json(
      { error: 'Missing canon context' },
      { status: 400 }
    );
  }

  // 2. Authenticate user
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 3. Derive cell config from server-side registry (don't trust client)
  const cellConfig = await getCellConfig(canon.pageCode, canon.tabCode);
  if (!cellConfig) {
    return NextResponse.json(
      { error: 'Invalid cell configuration' },
      { status: 400 }
    );
  }

  // 4. Verify client's schemaCode matches server's expected schema
  if (canon.schemaCode && canon.schemaCode !== cellConfig.schemaCode) {
    logSecurityWarning('Schema mismatch', {
      client: canon.schemaCode,
      expected: cellConfig.schemaCode,
      pageCode: canon.pageCode,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: 'Invalid schema' },
      { status: 400 }
    );
  }

  // 5. Use server-derived schema (not client-provided)
  const schema = await loadSchema(cellConfig.schemaCode);
  const policy = await loadPolicy(cellConfig.policyCodes[0]);

  // 6. Verify user has permission for this policy
  const hasPermission = await checkPolicyPermission(session.user, policy);
  if (!hasPermission) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  // ============================================================================
  // Process Request (Now Safe)
  // ============================================================================

  try {
    // Use server-derived config, not client's canon
    const result = await processFlexField(
      { ...cellConfig, cellId: canon.cellId }, // Use server config
      payload
    );
    return NextResponse.json(result);
  } catch (err) {
    logError('SCHEMA_VALIDATION_FAILED', {
      pageCode: cellConfig.pageCode,
      schemaCode: cellConfig.schemaCode,
      tabCode: cellConfig.tabCode,
      policyCodes: cellConfig.policyCodes,
      cellId: canon.cellId,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 400 }
    );
  }
}
```

**Alternative (Separate BFF Service):**
If you prefer a separate BFF service (e.g., for microservices architecture), you can still use the same pattern:

```typescript
// apps/bff/src/routes/meta/meta09FlexCell.ts (Separate service)

export async function handleMeta09Flex(req: Request) {
  const { canon, payload } = await req.json();
  // ... same logic as above
}
```

**DB Tables** for flex fields should also include these codes:

```sql
CREATE TABLE meta_flex_field (
  id UUID PRIMARY KEY,
  page_code TEXT NOT NULL,      -- META_09
  schema_code TEXT NOT NULL,    -- SCH_101
  tab_code TEXT NOT NULL,       -- TAB_10
  policy_code TEXT NOT NULL,    -- POLY_25
  cell_id TEXT NOT NULL,        -- CELL_META_09_101_10_25 (current)
  cell_id_created TEXT,         -- CELL_META_09_101_10_25 (snapshot at creation)
                                  -- Used for versioning when Cell ID changes
  field_values JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for cell versioning queries
CREATE INDEX idx_meta_flex_cell_ids ON meta_flex_field(cell_id, cell_id_created);
```

**Cell Versioning in Database:**
- `cell_id`: Current Cell ID (may change when policy upgrades)
- `cell_id_created`: Snapshot at creation (immutable)
- Query both when Cell ID changes: `WHERE cell_id = ? OR cell_id_created = ?`

---

## 8.1 Security: CanonContext Validation

> **🔴 CRITICAL SECURITY REQUIREMENT:** Never trust CanonContext from the client. Always verify and derive from server-side registry.

**Security Risk:**
A malicious user could intercept requests and change `schemaCode` (e.g., `SCH_101` → `SCH_000`) to bypass validation.

**Security Pattern:**

1. **Authenticate** the user
2. **Derive** cell config from `pageCode` + `tabCode` (server-side lookup from registry)
3. **Verify** client's `schemaCode` matches server's expected schema
4. **Check** user permissions for the policy
5. **Use** server-derived config, not client-provided values

**Example Helper Function:**

```typescript
// lib/canon/verifyCanonContext.ts

import type { CanonContext } from '@/types/canon';
import { getCellConfig } from '@/lib/canon/registry';

export async function verifyCanonContext(
  clientCanon: CanonContext,
  session: Session
): Promise<{ valid: boolean; serverConfig?: CellConfig; error?: string }> {
  // 1. Derive from server registry (don't trust client)
  const serverConfig = await getCellConfig(
    clientCanon.pageCode,
    clientCanon.tabCode
  );
  
  if (!serverConfig) {
    return { valid: false, error: 'Invalid cell configuration' };
  }
  
  // 2. Verify schema matches
  if (clientCanon.schemaCode && clientCanon.schemaCode !== serverConfig.schemaCode) {
    logSecurityWarning('Schema mismatch', {
      client: clientCanon.schemaCode,
      expected: serverConfig.schemaCode,
      userId: session.user.id,
    });
    return { valid: false, error: 'Schema mismatch' };
  }
  
  // 3. Check permissions
  const hasPermission = await checkPolicyPermission(
    session.user,
    serverConfig.policyCodes[0]
  );
  
  if (!hasPermission) {
    return { valid: false, error: 'Insufficient permissions' };
  }
  
  return { valid: true, serverConfig };
}
```

**Updated Route Handler with Security:**

```typescript
// apps/web/app/api/meta/flex/route.ts

import { verifyCanonContext } from '@/lib/canon/verifyCanonContext';

export async function POST(request: NextRequest) {
  const { canon, payload } = await request.json();
  const session = await getSession(request);
  
  // Verify CanonContext (security check)
  const verification = await verifyCanonContext(canon, session);
  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.error === 'Insufficient permissions' ? 403 : 400 }
    );
  }
  
  // Use server-derived config (not client's canon)
  const { serverConfig } = verification;
  const schema = await loadSchema(serverConfig.schemaCode);
  const policy = await loadPolicy(serverConfig.policyCodes[0]);
  
  // Process with verified config
  const result = await processFlexField(serverConfig, payload);
  return NextResponse.json(result);
}
```

---

## 8.2 Next.js Server Actions (Optional Enhancement)

For form submissions and mutations, you can use Next.js Server Actions with Canon context:

> **🔴 Security Alignment:** Server Actions must also verify CanonContext server-side, just like Route Handlers (Section 8.1). The `canon` argument is a *hint*, not a source of truth. Always call `verifyCanonContext` / `getCellConfig` and use the **server-derived** schema & policy.

**Server Action File (Separate Module - Secured):**

```tsx
// apps/web/canon-pages/META/META_09_FlexFields.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { CanonContext } from '@/types/canon';
import { verifyCanonContext } from '@/lib/canon/verifyCanonContext';
import { getSession } from '@/lib/auth';

export async function submitFlexField(
  canon: CanonContext,
  formData: FormData
) {
  // ============================================================================
  // SECURITY: Verify, Don't Trust (same pattern as Route Handlers)
  // ============================================================================
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const verification = await verifyCanonContext(canon, session);
  if (!verification.valid) {
    throw new Error(verification.error ?? 'Invalid canon context');
  }

  // Use server-derived config (not client's canon)
  const { serverConfig } = verification;
  const schema = await loadSchema(serverConfig.schemaCode);
  const policy = await loadPolicy(serverConfig.policyCodes[0]);

  // ============================================================================
  // Process Request (Now Safe)
  // ============================================================================
  const validated = schema.parse(formData);
  await policy.validate(validated);
  
  // Save to DB with server-derived canon context
  await saveFlexField({
    ...validated,
    page_code: serverConfig.pageCode,
    schema_code: serverConfig.schemaCode,
    cell_id: serverConfig.cellId,
  });
  
  revalidatePath('/meta/flex');
}
```

**Page File (Imports Action):**

```tsx
// apps/web/canon-pages/META/META_09_FlexFieldsPage.tsx
import { submitFlexField } from './META_09_FlexFields.actions';
import { Meta09FlexFieldsCell } from './META_09_FlexFieldsCell';

export default function Meta09FlexFieldsPage() {
  return <Meta09FlexFieldsCell submitAction={submitFlexField} />;
}
```

**Note:** Server Actions should be in dedicated `*.actions.ts` files, not at the top of page component files. This keeps page components clean and separates concerns.

---

## 9. Tooling, Kits & Workflow

### 9.1 CLI Scaffolder (`canon` or `aibos` CLI)

**Commands:**

```bash
# Create a new page
canon create:page META_10
# Prompts: name, route, domain
# Generates:
#   - Entry in canon/pages.yaml
#   - Canonical page file with PAGE_META
#   - Next.js app/**/page.tsx wrapper

# Create a new component
canon create:component TBLM02
# Generates component file with COMPONENT_META + registry entry

# Create a new cell
canon create:cell
# Asks for pageCode, schemaCode, tabCode, policyCodes, component
# Writes cells.yaml entry + scaffolds cell component with CELL_META
```

**Goal:** No one manually edits manifests or meta blocks; everything comes from the CLI.

### 9.2 ESLint & Type Rules

**ESLint Configuration:**

```javascript
// eslint.config.js
// Note: This is illustrative. Refine patterns/paths based on your ESLint version.
export default {
  rules: {
    // Disallow raw @tanstack/react-table imports outside canon tables
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@tanstack/react-table'],
            message: 'Use canonical table components (TBLM01, TBLL01) instead.',
            allowTypeImports: true,
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/canon-pages/**/*.tsx'],
      rules: {
        // Enforce PAGE_META export
        'canon/require-page-meta': 'error',
      },
    },
    {
      files: ['**/canon/tables/**/*.tsx'],
      rules: {
        // Enforce COMPONENT_META export
        'canon/require-component-meta': 'error',
      },
    },
  ],
};
```

### 9.3 Auto-Sync Script (Single Source of Truth)

**Goal:** Generate YAML from Code Meta blocks to eliminate "Three Sources of Truth" problem.

**File:** `scripts/sync-canon.ts`

```bash
npm run canon:sync
```

This script:
1. Scans codebase for `PAGE_META` exports
2. Generates `canon/pages.yaml` automatically
3. Merges with existing YAML (preserves manual overrides)
4. Marks pages not found in code as `deprecated`

**Benefits:**
- ✅ Code Meta is the single source of truth
- ✅ YAML stays in sync automatically
- ✅ No manual YAML entry required
- ✅ Detects drift (code updated but YAML not)

**Usage:**
```bash
# Add to package.json
"canon:sync": "tsx scripts/sync-canon.ts"

# Run sync
npm run canon:sync
```

### 9.4 Validation Script (Pre-commit & CI)

**File:** `scripts/validate-canon.ts`

**Dependencies:** `npm i -D tsx js-yaml glob`

```typescript
#!/usr/bin/env tsx
// scripts/validate-canon.ts

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { glob } from 'glob';

interface ValidationResult {
  passed: boolean;
  errors: string[];
}

async function validateCanonRegistry(): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Load YAML registries
  const pagesYaml = load(readFileSync('canon/pages.yaml', 'utf-8'));
  const componentsYaml = load(readFileSync('canon/components.yaml', 'utf-8'));
  const cellsYaml = load(readFileSync('canon/cells.yaml', 'utf-8'));

  // 2. Scan canonical code files
  const pageFiles = await glob('apps/web/canon-pages/**/*.tsx');
  
  for (const file of pageFiles) {
    const content = readFileSync(file, 'utf-8');
    
    // Extract PAGE_META
    const pageMetaMatch = content.match(/export const PAGE_META = ({[\s\S]*?}) as const/);
    if (!pageMetaMatch) {
      errors.push(`Missing PAGE_META in ${file}`);
      continue;
    }

    // Parse and validate against YAML
    // ... validation logic
  }

  // 3. Verify YAML ↔ code consistency
  // ... validation logic

  return {
    passed: errors.length === 0,
    errors,
  };
}

// Run validation
validateCanonRegistry()
  .then((result) => {
    if (!result.passed) {
      console.error('Canon registry validation failed:');
      result.errors.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }
    console.log('✅ Canon registry validation passed');
  })
  .catch((err) => {
    console.error('Validation error:', err);
    process.exit(1);
  });
```

**CI/CD Integration:**

```yaml
# .github/workflows/validate-canon.yml
name: Validate Canon Registry

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run validate:canon
```

This eliminates **IDE drift**: if someone moves or renames a file but doesn't update the registry or meta blocks, the build fails.

### 9.5 Telemetry Standard

All structured logs include:

* `page_code`
* `schema_code`
* `tab_code`
* `policy_codes`
* `cell_id`
* `component_code` (for critical components like `TBLM01`)

Thus any incident can be reported as:

> "Failure at **META_09 / SCH_101 / TAB_10 / POLY_25** (CELL_META_09_101_10_25)"

and traced across frontend, BFF, DB and audit logs.

---

## 10. Simple End-to-End Use Case

**Scenario:** Bug in "Canon Landing Page" dynamic table.

1. **Business reports:**
   "Filter is broken in Canon Landing Page monetize table."

2. **Architect translates:**
   * Canon Landing Page → `pages.yaml` → **`META_02`**.
   * Monetize table → `components.yaml` → **`TBLM01`**.

3. **Logs show:**
   `SCHEMA_VALIDATION_FAILED at CELL_META_02_101_10_25 (META_02 / SCH_101 / TAB_10 / POLY_25, component TBLM01)`.

4. **Engineer jumps to:**
   * `cells.yaml` → `CELL_META_02_101_10_25` → file path.
   * `META_02_CanonLandingPage.tsx` & `TBLM01_MonetizeFullTable.tsx`.

5. **Fix is applied;** `PAGE_META.version` or `COMPONENT_META.version` is bumped; CLI updates manifests.

No guessing, no hunting; the **codes are the map**.

---

## 11. Vite + React Router Adaptation

**Note:** If you're using Vite instead of Next.js, adapt as follows:

### 11.1 Route Registry (Vite Alternative)

**File:** `src/routes/registry.ts`

```typescript
import type { ComponentType } from 'react';
import type { PageCode, PageMeta } from '@/types/canon';

export interface RouteDefinition {
  code: PageCode;
  path: string;
  component: ComponentType;
  meta: Omit<PageMeta, 'code' | 'route'>;
  aliases?: string[];
}

export const ROUTE_REGISTRY: RouteDefinition[] = [
  {
    code: 'META_02',
    path: '/meta-registry',
    component: () => import('@/pages/META_02_MetadataGodView').then(m => m.MetadataGodView),
    meta: {
      version: '1.0.0',
      name: 'META REGISTRY',
      domain: 'METADATA',
      status: 'active',
    },
    aliases: ['/dashboard'],
  },
  // ... more routes
];
```

**File:** `src/App.tsx`

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTE_REGISTRY } from '@/routes/registry';

function AppRoutes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {ROUTE_REGISTRY.map(({ code, path, component: Component, aliases = [] }) => (
          <>
            <Route key={code} path={path} element={<Component />} />
            {aliases.map(alias => (
              <Route key={`${code}-${alias}`} path={alias} element={<Component />} />
            ))}
          </>
        ))}
      </Routes>
    </Suspense>
  );
}
```

### 11.2 YAML Registry Update

In `canon/pages.yaml`, set:

```yaml
- code: META_02
  entry_file: "src/routes/registry.ts#META_02"  # Vite route registry reference
```

---

## 12. Migration Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Create `canon/` directory with YAML templates
- [ ] Create TypeScript types (`src/types/canon.ts`)
- [ ] Add `PAGE_META` exports to all existing pages
- [ ] Create route registry (Next.js or Vite)

### Phase 2: Registry (Week 3-4)
- [ ] Populate `canon/pages.yaml` with all pages
- [ ] Create `canon/components.yaml` with canonical components
- [ ] Build validation script
- [ ] Integrate with CI/CD

### Phase 3: Advanced (Week 5-6)
- [ ] Add component codes to reusable components
- [ ] Create `canon/schemas.yaml` and `canon/policies.yaml`
- [ ] Implement cell-level governance
- [ ] Build CLI scaffolder

---

## 13. Template Source Attribution

**Template Sources:**
1. **v1.0.0 Contract** - Original Canon Identity Model principles
2. **Concrete YAML Structures** - User-provided templates with real examples
3. **Next.js App Router** - Next.js 14+ file-system routing patterns
4. **TypeScript Best Practices** - Strict typing, const assertions, satisfies operator
5. **React 18 Patterns** - Server/Client components, Metadata API

**Derived From:**
- Next.js App Router documentation
- TypeScript 5.6+ type system
- React 18 Server Components
- YAML schema validation patterns
- Enterprise governance frameworks

---

## 14. Conclusion

This **Canon Identity Contract v2.2.0** provides:

✅ **5-plane taxonomy (A–E)** with enforceable prefixes (CONT, ADR, PAGE, COMP, CELL, ENT, SCH, POLY, CONST, TOOL, MIG, INFRA, SPEC, REF)  
✅ **Concrete, usable templates** (YAML + TypeScript)  
✅ **Next.js App Router integration** (with Vite adaptation notes)  
✅ **Type-safe implementation** (full TypeScript support)  
✅ **End-to-end traceability** (frontend → BFF → DB → logs)  
✅ **Scalable governance** (pages → components → cells)  
✅ **CanonContext security rules** (never trust client, always derive from registry)  
✅ **Conflict resolution rules** (ENT vs SCH, POLY vs CONST, TOOL vs POLY, etc.)  
✅ **Anti-noise exclusions** (what NOT to govern)

**Next Steps:**
1. Review and adapt YAML templates to your repo structure
2. Implement TypeScript types in `packages/canon/src/types.ts`
3. Add `PAGE_META` to existing pages
4. Build validation script
5. Create CLI scaffolder

---

## 15. Real Example: PAY_01 Payment Hub

**Template Source:** Derived from actual codebase (`src/pages/PAY_01_PaymentHubPage.tsx` + `src/modules/payment/`)

> **Important Note:** The `PAY_01` entries in this section are **Vite + React Router examples** only, based on your current codebase structure.
> 
> In a real `canon/pages.yaml`, you must choose either:
> - the **Next.js version** from Section 5.1 (`apps/web/canon-pages/PAY/PAY_01_PaymentHubPage.tsx`), or
> - the **Vite version** from Section 15.1 (`src/modules/payment/PAY_01_PaymentHub.tsx`),
> 
> but **never both at the same time**. The examples here demonstrate the Vite pattern while you are still on Vite + React Router.

This section shows a **complete, real example** from your current codebase, demonstrating how to apply the Canon Identity Contract to an existing page.

### 15.1 `canon/pages.yaml` Entry

```yaml
# canon/pages.yaml

pages:
  - code: PAY_01
    version: 1.0.0
    name: "Payment Hub"
    domain: "PAYMENT"
    app: "web"
    route: "/payments"
    impl_file: "src/modules/payment/PAY_01_PaymentHub.tsx"
    entry_file: "src/pages/PAY_01_PaymentHubPage.tsx"
    status: "active"
    owner: "CID_FINANCE"
    description: >
      Payment hub dashboard with transaction management, approvals, and treasury console.
      Handles group settlement, IC transactions, and batch approvals.
```

### 15.2 Canonical Page Implementation

**File:** `src/modules/payment/PAY_01_PaymentHub.tsx`

```tsx
// ============================================================================
// PAGE CANON: PAY_01  // PAYMENT HUB
// VERSION:   1.0.0
// DOMAIN:    PAYMENT
// SUMMARY:   Group Settlement & Treasury Console
// ============================================================================

import { PAY01PaymentHub } from '@/modules/payment';

export const PAGE_META = {
  code: 'PAY_01',
  version: '1.0.0',
  name: 'PAYMENT HUB',
  subtitle: 'Group Settlement & Treasury Console',
  route: '/payments',
  domain: 'PAYMENT',
  owner: 'CID_FINANCE',
  classification: 'RESTRICTED',
} as const satisfies PageMeta;

export default function PaymentHubPage() {
  return <PAY01PaymentHub />;
}
```

### 15.3 Route Wrapper (Vite + React Router)

**File:** `src/pages/PAY_01_PaymentHubPage.tsx` (Current)

```tsx
// ============================================================================
// ROUTE WRAPPER: PAY_01
// Route: /payments or /payment-hub
// ============================================================================

import { PAY01PaymentHub } from '@/modules/payment';

export default function PAY01PaymentHubPage() {
  return <PAY01PaymentHub />;
}
```

**After Canon Adoption:**

```tsx
// ============================================================================
// ROUTE WRAPPER: PAY_01
// Route: /payments or /payment-hub
// ============================================================================

import PaymentHubPage, { PAGE_META } from '@/modules/payment/PAY_01_PaymentHub';

// Re-export for route registry
export { PAGE_META };
export default PaymentHubPage;
```

### 15.4 Route Registry Entry (Vite)

**File:** `src/routes/registry.ts`

```typescript
import type { RouteDefinition } from './types';

export const ROUTE_REGISTRY: RouteDefinition[] = [
  // ... other routes
  {
    code: 'PAY_01',
    path: '/payments',
    component: () => import('@/pages/PAY_01_PaymentHubPage').then(m => m.default),
    meta: {
      version: '1.0.0',
      name: 'PAYMENT HUB',
      domain: 'PAYMENT',
      status: 'active',
    },
    aliases: ['/payment-hub'],
  },
];
```

### 15.5 Component Code Example (Future)

If you create a canonical payment table component:

**File:** `src/components/payment/TBLM01_PaymentTable.tsx`

```tsx
// ============================================================================
// COMPONENT CANON: TBLM01  // Monetize Full-Stack Table (Payment Variant)
// VERSION:   1.0.0
// FAMILY:    TABLE
// PURPOSE:   MONETIZE (Payment flows)
// ============================================================================

'use client';

import { useReactTable } from '@tanstack/react-table';
import { PAYMENT_SCHEMA } from '@/modules/payment';

export const COMPONENT_META = {
  code: 'TBLM01',
  version: '1.0.0',
  family: 'TABLE',
  purpose: 'MONETIZE',
  owner: 'FINANCE_UI',
  status: 'active',
} as const satisfies ComponentMeta;

interface PaymentTableProps {
  canon?: CanonContext;
  data: Payment[];
  // ... other props
}

export function PaymentTable({ canon, data, ...props }: PaymentTableProps) {
  // Implementation using PAYMENT_SCHEMA
  const table = useReactTable({
    data,
    columns: generateColumnsFromSchema(PAYMENT_SCHEMA),
    // ... config
  });

  return (
    <div>
      {/* Table implementation */}
    </div>
  );
}
```

**File:** `canon/components.yaml`

```yaml
components:
  - code: TBLM01
    version: 1.0.0
    name: "Monetize Full-Stack Table"
    family: "TABLE"
    purpose: "MONETIZE"
    impl_file: "src/components/payment/TBLM01_PaymentTable.tsx"
    status: "active"
    owner: "FINANCE_UI"
    notes: >
      TanStack full stack table for payment flows.
      Must be used for any monetized payment operations.
```

### 15.6 Cell Example (Future - Flex Fields)

If PAY_01 later has flex fields:

**File:** `src/modules/payment/cells/PAY_01_FlexFieldsCell.tsx`

```tsx
// ============================================================================
// CELL CANON: PAY_01 / SCH_101 / TAB_10 / POLY_25
// CELL ID:    CELL_PAY_01_101_10_25
// VERSION:    1.0.0
// PURPOSE:    Payment Flex Fields (Tab 10)
// ============================================================================

'use client';

import { PaymentTable } from '@/components/payment/TBLM01_PaymentTable';

export const CELL_META = {
  cellId: 'CELL_PAY_01_101_10_25',
  pageCode: 'PAY_01',
  schemaCode: 'SCH_101',
  tabCode: 'TAB_10',
  policyCodes: ['POLY_25'],
  version: '1.0.0',
  componentCode: 'TBLM01',
} as const satisfies CellMeta;

export function Pay01FlexFieldsCell() {
  return (
    <PaymentTable
      canon={CELL_META}        // forwarded to BFF + logs
      /* other props */
    />
  );
}
```

**File:** `canon/cells.yaml`

```yaml
cells:
  - cell_id: "CELL_PAY_01_101_10_25"
    version: 1.0.0
    page_code: "PAY_01"
    schema_code: "SCH_101"
    tab_code: "TAB_10"
    policy_codes: ["POLY_25"]
    component_code: "TBLM01"
    impl_file: "src/modules/payment/cells/PAY_01_FlexFieldsCell.tsx"
    bff_handler: "apps/web/app/api/payment/flex/route.ts"
                                  # Next.js Route Handler (recommended)
                                  # OR: "apps/bff/src/routes/payment/flexFields.ts" (separate service)
    db_table: "payment_flex_field"
    status: "active"
    owner: "CID_FINANCE"
    description: >
      Payment flex fields cell on PAY_01 using schema SCH_101, policy POLY_25,
      layout TAB_10, rendered with monetize table TBLM01.
```

### 15.7 Summary

This example shows:

✅ **Real file paths** from your codebase  
✅ **Actual component structure** (`PAY01PaymentHub` from `@/modules/payment`)  
✅ **Vite route pattern** (not Next.js)  
✅ **Complete YAML entries** ready to paste  
✅ **Future expansion** (components, cells)

**Next Steps:**
1. Add `PAGE_META` to `src/modules/payment/PAY_01_PaymentHub.tsx`
2. Create `canon/pages.yaml` with PAY_01 entry
3. Update route registry
4. Run validation script

---

**End of Document**

