# CONT_05 — Naming and Structure Standard

> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_05  
> **Version:** 1.0.0  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS repositories  
> **Authority:** AI-BOS Architecture Naming & Structure Standard  
> **Derives From:** [CONT_00_Constitution.md](./CONT_00_Constitution.md), [CONT_01_CanonIdentity.md](./CONT_01_CanonIdentity.md)

---

## 📋 Document Control

| Property | Value |
|----------|-------|
| **Version** | 1.0.1 |
| **Status** | 🟢 ACTIVE |
| **Last Updated** | 2025-12-15 |
| **Supersedes** | CONT_05 v1.0.0 (2025-12-15) |
| **Related Contracts** | CONT_00 (Constitution), CONT_01 (Canon Identity), CONT_02 (Kernel), CONT_03 (Database) |

---

## 📜 Normative Terms

This document uses RFC 2119 terminology:

- **MUST** / **MUST NOT** — Required/forbidden (enforced by validators)
- **SHOULD** / **SHOULD NOT** — Recommended/not recommended (best practice)
- **MAY** — Optional (permitted but not required)

---

## 🎯 Purpose

This contract standardizes **naming conventions** and **directory structure** across all AI-BOS layers to enforce the "Lego vs. Jenga" architecture philosophy. It ensures:

1. **Consistency** — Predictable naming patterns across all layers
2. **Discoverability** — Easy to find and understand components
3. **Boundary Enforcement** — Prevents architectural violations
4. **Automation** — Enables tooling for validation and enforcement

---

## 🏛️ The AI-BOS Architecture Hierarchy

The system follows a strict hierarchy enforcing boundaries and enabling safe composability:

```
┌─────────────────────────────────────────────────────────────┐
│                    KERNEL (Control Plane)                    │
│              Identity, Security, Gateway, Audit              │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼────────┐
│   CANON        │            │      WEB        │
│ (Business)     │            │   (Frontend)    │
└───────┬────────┘            └─────────────────┘
        │
┌───────▼────────┐
│   MOLECULE     │
│   (Cluster)    │
└───────┬────────┘
        │
┌───────▼────────┐
│     CELL       │
│   (Atomic)     │
└────────────────┘
```

---

## 📏 Layer Naming Conventions

### 1. Kernel (Control Plane)

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| **Directory** | `apps/kernel/` | `apps/kernel/` | Root |
| **Service Name** | `kernel` or `aibos-kernel` | `kernel` | Docker, K8s |
| **Database Role** | `aibos_kernel_role` | `aibos_kernel_role` | PostgreSQL |
| **Database Schema** | `kernel` | `kernel` | PostgreSQL |
| **Package Name** | `@aibos/kernel` | `@aibos/kernel` | package.json |
| **Event Prefix** | `kernel.*` | `kernel.user.created` | Event Bus |

**Rules:**
- ✅ MUST use `kernel` as the base name
- ✅ Database roles MUST use `aibos_kernel_role` pattern
- ❌ MUST NOT contain business logic
- ❌ MUST NOT reference Canon domains directly

---

### 2. Canon (Business Domain)

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| **Directory** | `apps/canon/<domain>/` | `apps/canon/finance/` | Root |
| **Domain Name** | `canon-<domain>` | `canon-finance` | Service name |
| **Package Name** | `@aibos/canon-<domain>` | `@aibos/canon-finance` | package.json |
| **Database Schema** | `<domain>` | `finance` | PostgreSQL |
| **Database Role** | `aibos_<domain>_role` | `aibos_finance_role` | PostgreSQL |
| **Event Prefix** | `<domain>.*` | `finance.payment.created` | Event Bus |

**Domain Examples:**
- `finance` — Financial operations
- `hr` — Human resources
- `supply-chain` — Supply chain management
- `inventory` — Inventory management

**Rules:**
- ✅ Domain names MUST be lowercase, hyphenated
- ✅ MUST depend on Kernel (never reverse)
- ❌ MUST NOT depend on other Canons directly
- ❌ MUST NOT access Kernel database tables directly

---

### 3. Molecule (Functional Cluster)

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| **Directory** | `apps/canon/<domain>/<molecule>/` | `apps/canon/finance/dom03-accounts-payable/` | Under Canon |
| **Molecule Name** | `<domain>-<molecule>` | `finance-accounts-payable` | Service name |
| **Package Name** | `@aibos/mol-<domain>-<molecule>` | `@aibos/mol-finance-accounts-payable` | package.json |
| **Database Schema** | `<domain>` (shared) | `finance` | PostgreSQL |
| **Event Prefix** | `<domain>.<molecule>.*` | `finance.accounts-payable.*` | Event Bus |

**⚠️ Package Name Uniqueness:** Package names MUST include domain prefix to prevent collisions across domains (e.g., `accounts-payable` could exist in both `finance` and `hr`).

**Molecule Examples:**
- `accounts-payable` — Vendor payments
- `accounts-receivable` — Customer receivables
- `general-ledger` — Chart of accounts, journals
- `treasury` — Cash management, FX

**Rules:**
- ✅ Molecule names MUST be lowercase, hyphenated
- ✅ MUST be under a Canon domain
- ✅ MUST share the Canon's database schema
- ❌ MUST NOT create separate database schemas
- ❌ MUST NOT depend on other Molecules directly

---

### 4. Cell (Atomic Transaction Unit)

**Definition:** Cells are backend services (domain runtime) that execute business logic. They are NOT React components. React components live under `apps/web` or `packages/ui`.

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| **Directory** | `apps/canon/<domain>/<molecule>/<cell>/` | `apps/canon/finance/dom03-accounts-payable/payment-hub/` | Under Molecule |
| **Cell Name** | `cell-<domain>-<molecule>-<cell>` | `cell-finance-accounts-payable-payment-hub` | Service name |
| **Package Name** | `@aibos/cell-<domain>-<molecule>-<cell>` | `@aibos/cell-finance-accounts-payable-payment-hub` | package.json |
| **Canon Code** | `CELL_<DOMAIN>_<MOL>_<CELL>` | `CELL_FINANCE_AP_PAYHUB` | CONT_01 |
| **Event Prefix** | `<domain>.<molecule>.<cell>.*` | `finance.accounts-payable.payment-hub.*` | Event Bus |

**Cell Naming Rules:**
- ✅ Cell names MUST be lowercase, hyphenated
- ✅ Service names MUST include full path: `cell-<domain>-<molecule>-<cell>`
- ✅ Package names MUST include full path: `@aibos/cell-<domain>-<molecule>-<cell>`
- ✅ MUST be under a Molecule
- ✅ MUST have a Canon Code (per CONT_01)
- ❌ MUST NOT be nested (no `cell-a/cell-b/`)
- ❌ MUST NOT depend on other Cells directly

**Special Suffixes (`-demo`, `-test`, `-stub`):**

Suffixes MUST propagate to **all** naming layers:

| Layer | Without Suffix | With `-demo` Suffix |
|-------|----------------|---------------------|
| **Directory** | `payment-hub/` | `payment-hub-demo/` |
| **Service Name** | `cell-finance-accounts-payable-payment-hub` | `cell-finance-accounts-payable-payment-hub-demo` |
| **Package Name** | `@aibos/cell-finance-accounts-payable-payment-hub` | `@aibos/cell-finance-accounts-payable-payment-hub-demo` |

**⚠️ Critical Rule:** If directory ends with `-demo/-test/-stub`, then:
- Service name MUST include the suffix
- Package name MUST include the suffix
- OR the folder MUST NOT have a `package.json` (treated as example-only, not a deployable package)

**⚠️ Important:** Suffixes like `-demo`, `-test`, `-stub` are **intentional markers** for non-production implementations. They MUST be documented in the Cell's PRD.

---

### 5. Database (Data Fabric)

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| **Directory** | `apps/db/` | `apps/db/` | Root |
| **Migration** | `<schema>/<version>_<name>.sql` | `finance/101_double_entry_constraint.sql` | `migrations/` |
| **Seed** | `<schema>/seed-<name>.ts` | `finance/seed-demo-corp.ts` | `seeds/` |
| **Schema** | `<domain>` or `kernel` | `finance`, `kernel` | PostgreSQL |
| **Table** | `<entity>_<type>` | `journal_entries`, `audit_events` | PostgreSQL |
| **Role** | `aibos_<scope>_role` | `aibos_finance_role` | PostgreSQL |
| **View** | `v_<name>` | `v_governance_summary` | PostgreSQL |
| **Function** | `<schema>.<verb>_<noun>()` | `finance.check_balance_on_post()` | PostgreSQL |

**Migration Naming:**
- ✅ Schema prefix: `kernel/`, `finance/`, `config/`
- ✅ Version: **Per-schema 3-digit sequence** (e.g., `001_`, `002_`, `101_`)
- ✅ Description: Snake_case (e.g., `governance_views`)
- ✅ Example: `kernel/016_governance_views.sql`, `finance/101_double_entry_constraint.sql`

**⚠️ Migration Versioning Rule:** Each schema maintains its own 3-digit sequence starting from `001_`. This ensures readability per schema while preventing collisions.

**Table Naming:**
- ✅ Plural snake_case nouns: `journal_entries`, `users`, `audit_events`
- ✅ MUST include `tenant_id` (except global tables)
- ✅ MUST include `created_at` timestamp

**⚠️ Table Naming Rule:** Tables are plural snake_case nouns. No `<entity>_<type>` pattern required.

---

### 6. Web (Frontend)

| Entity | Pattern | Example | Location |
|--------|---------|---------|----------|
| **Directory** | `apps/web/` | `apps/web/` | Root |
| **Page Route** | `app/<route>/page.tsx` | `app/payments/page.tsx` | Next.js App Router |
| **Component** | `PascalCase` | `PaymentHubForm` | React |
| **Canon Page** | `canon-pages/<domain>/<page>.mdx` | `canon-pages/finance/pay-01-payment-hub.mdx` | MDX |
| **Canon Code** | `PAGE_<CODE>` | `PAGE_PAY_01` | CONT_01 |

**Rules:**
- ✅ Pages MUST use Next.js App Router conventions
- ✅ Components MUST use PascalCase
- ✅ Canon pages MUST have `PAGE_META` export (per CONT_01)
- ✅ Canon page directories MUST be lowercase (kebab-case)
- ❌ MUST NOT connect directly to database
- ❌ MUST NOT contain business logic (domain decisions, approval rules, posting rules)
- ✅ MAY contain UI orchestration (form handling, validation, calling Canon APIs via Server Actions)

**⚠️ Web Layer Logic Rule:** Server Actions MAY do validation and call Canon APIs, but MUST NOT contain domain decisions (approval rules, posting rules, etc.). Domain logic belongs in Cells.

---

## 📦 Shared Packages

Shared packages are allowed and explicitly named:

| Package | Location | Purpose |
|---------|----------|---------|
| `@aibos/ui` | `packages/ui/` | Shared UI components |
| `@aibos/schemas` | `packages/schemas/` | Zod schemas and validation |
| `@aibos/shared` | `packages/shared/` | Shared utilities |
| `@aibos/contracts` | `packages/contracts/` | Event contracts and types |
| `@aibos/kernel-core` | `packages/kernel-core/` | Kernel types and interfaces |

**Rules:**
- ✅ Shared packages MAY be imported by any layer
- ✅ Shared packages MUST follow kebab-case naming
- ❌ Shared packages MUST NOT contain business logic (domain-specific code)

---

## 🚫 Reserved Words & Protected Paths

The following directory names are **reserved** and MUST NOT be used unless explicitly allowed:

**Forbidden in `apps/canon/`:**
- `shared`, `common`, `utils`, `tmp`, `misc`, `old`, `backup`

**Allowed Locations:**
- `packages/shared/` — Shared utilities
- `packages/common/` — Common code
- `scripts/` — Tooling scripts

**Rationale:** Prevents architectural drift and ensures clear boundaries.

---

## 🚫 Anti-Patterns (Forbidden)

### Directory Structure Violations

| Violation | Example | Correct |
|-----------|---------|---------|
| Cell outside Molecule | `apps/canon/finance/payment-hub/` | `apps/canon/finance/dom03-accounts-payable/payment-hub/` |
| Molecule outside Canon | `apps/molecules/accounts-payable/` | `apps/canon/finance/dom03-accounts-payable/` |
| Nested Cells | `apps/canon/finance/payment-hub/invoice-matching/` | Separate cells under molecule |
| Mixed naming | `apps/canon/Finance/AccountsPayable/` | `apps/canon/finance/dom03-accounts-payable/` |

### Naming Violations

| Violation | Example | Correct |
|-----------|---------|---------|
| PascalCase directories | `PaymentHub/` | `payment-hub/` |
| Underscores in directories | `payment_hub/` | `payment-hub/` |
| CamelCase service names | `paymentHub` | `cell-payment-hub` |
| Missing prefixes | `payment-hub` (service) | `cell-payment-hub` |
| Inconsistent suffixes | `payment-hub-example` | `payment-hub-demo` (documented) |

### Dependency Violations

| Violation | Example | Correct |
|-----------|---------|---------|
| Cell imports Cell | `import { ... } from '../other-cell'` | Use Kernel Gateway or Events |
| Canon imports Canon | `import { ... } from '@aibos/canon-hr'` | Use Kernel Gateway |
| Molecule imports Molecule | `import { ... } from '../other-molecule'` | Use Canon interface |
| Frontend imports DB | `import { pool } from '@aibos/db'` | Use Server Actions |

---

## 🔧 Enforcement Mechanisms

### 1. Directory Structure Validator

**Tool:** `scripts/validate-structure.ts`

```typescript
// Validates directory structure matches CONT_05
const violations = await validateStructure({
  root: 'apps/',
  rules: {
    kernel: { path: 'apps/kernel/', required: true },
    canon: { path: 'apps/canon/<domain>/', pattern: /^[a-z-]+$/ },
    molecule: { path: 'apps/canon/<domain>/<molecule>/', pattern: /^[a-z-]+$/ },
    cell: { path: 'apps/canon/<domain>/<molecule>/<cell>/', pattern: /^[a-z-]+(-demo|-test|-stub)?$/ },
  }
});
```

### 2. Naming Convention Linter

**Tool:** ESLint rule `@aibos/naming-convention`

```javascript
// eslint.config.js
rules: {
  '@aibos/naming-convention': ['error', {
    directories: 'kebab-case',
    services: {
      kernel: 'kernel',
      canon: 'canon-<domain>',
      molecule: '<domain>-<molecule>',
      cell: 'cell-<name>',
    },
    packages: {
      kernel: '@aibos/kernel',
      canon: '@aibos/canon-<domain>',
      molecule: '@aibos/mol-<domain>-<molecule>',
      cell: '@aibos/cell-<domain>-<molecule>-<cell>',
    }
  }]
}
```

### 3. Dependency Boundary Checker

**Tool:** `scripts/check-boundaries.ts`

```typescript
// Validates dependency rules
const violations = await checkBoundaries({
  cell: 'apps/canon/finance/dom03-accounts-payable/payment-hub/',
  forbidden: [
    '../other-cell',
    '@aibos/canon-hr',
    '@aibos/db', // Direct DB access from frontend
  ],
  allowed: [
    '@aibos/kernel',
    '@aibos/canon-finance', // Same domain
    '@aibos/db/lib/tenant-db', // Via TenantDb only
    '@aibos/ui', // Shared UI components
    '@aibos/schemas', // Shared schemas
    '@aibos/shared', // Shared utilities
    '@aibos/contracts', // Event contracts
    '@aibos/kernel-core', // Kernel types
  ]
});
```

### 4. Pre-commit Hook

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
# Validate structure and naming before commit
pnpm validate:structure
pnpm lint:naming
pnpm check:boundaries
```

---

## 📋 Validation Checklist

Before merging any PR, verify:

- [ ] Directory structure matches CONT_05 patterns
- [ ] All names use kebab-case (lowercase, hyphenated)
- [ ] Service names use correct prefixes (`cell-`, `canon-`, etc.)
- [ ] No dependency violations (Cell → Cell, Canon → Canon)
- [ ] Database roles follow `aibos_<scope>_role` pattern
- [ ] Migrations follow `<schema>/<version>_<name>.sql` pattern
- [ ] Special suffixes (`-demo`, `-test`, `-stub`) are documented
- [ ] ESLint passes with `@aibos/naming-convention` rule
- [ ] Structure validator passes (`pnpm validate:structure`)

---

## 🎓 Examples

### ✅ Correct Structure

```
apps/
├── kernel/                          # ✅ Kernel (Control Plane)
│   ├── src/
│   └── package.json                 # ✅ @aibos/kernel
├── canon/
│   └── finance/                     # ✅ Canon Finance
│       ├── dom03-accounts-payable/         # ✅ Molecule AP
│       │   ├── payment-hub-demo/     # ✅ Cell (demo suffix documented)
│       │   │   ├── src/
│       │   │   └── package.json     # ✅ @aibos/cell-finance-accounts-payable-payment-hub-demo
│       │   └── vendor-master/       # ✅ Cell
│       └── accounts-receivable/     # ✅ Molecule AR
└── db/                              # ✅ Data Fabric
    ├── migrations/
    │   ├── kernel/016_governance_views.sql  # ✅ Correct pattern
    │   └── finance/101_double_entry_constraint.sql
    └── package.json                 # ✅ @aibos/db
```

### ❌ Incorrect Structure

```
apps/
├── Kernel/                          # ❌ PascalCase
├── canon/
│   └── Finance/                    # ❌ PascalCase
│       └── AccountsPayable/        # ❌ PascalCase
│           └── payment_hub/        # ❌ Underscores
│               └── src/
│                   └── index.ts
│                       import { ... } from '../other_cell'  # ❌ Cell → Cell
```

---

## 🔄 Migration Guide

### Renaming Existing Components

1. **Update directory structure** (git mv)
2. **Update package.json** names
3. **Update imports** (use IDE refactor)
4. **Update docker-compose.yml** service names
5. **Update database roles** (if applicable)
6. **Update documentation** (PRD, README)
7. **Run validators** (`pnpm validate:structure`)

### Example: Renaming `payment-hub` → `payment-hub-demo`

```bash
# 1. Rename directory
git mv apps/canon/finance/dom03-accounts-payable/payment-hub \
       apps/canon/finance/dom03-accounts-payable/payment-hub-demo

# 2. Update package.json
# Change: "name": "@aibos/cell-finance-accounts-payable-payment-hub"
# To:     "name": "@aibos/cell-finance-accounts-payable-payment-hub-demo"

# 3. Update docker-compose.yml service name
# Change: cell-finance-accounts-payable-payment-hub:
# To:     cell-finance-accounts-payable-payment-hub-demo:
# Change: context: ../canon/finance/dom03-accounts-payable/payment-hub
# To:     context: ../canon/finance/dom03-accounts-payable/payment-hub-demo

# 4. Update PRD documentation
# Add note: "This is a demo implementation (suffix: -demo)"

# 5. Validate
pnpm validate:structure
```

---

## 📚 Related Documents

- [CONT_00: Constitution](./CONT_00_Constitution.md) — Architectural pillars
- [CONT_01: Canon Identity](./CONT_01_CanonIdentity.md) — Canon codes and identity
- [CONT_02: Kernel Architecture](./CONT_02_KernelArchitecture.md) — Kernel patterns
- [CONT_03: Database Architecture](./CONT_03_DatabaseArchitecture.md) — DB naming

---

## 🎓 Training & Onboarding

### Quick Reference Card

**Print this and keep it visible:**

```
┌─────────────────────────────────────────────────────────────┐
│              CONT_05 QUICK REFERENCE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DIRECTORY NAMING:                                          │
│  ✅ kebab-case (lowercase, hyphenated)                      │
│  ❌ PascalCase, camelCase, snake_case                       │
│                                                             │
│  STRUCTURE:                                                 │
│  apps/kernel/                    → Kernel                   │
│  apps/canon/<domain>/            → Canon                     │
│  apps/canon/<domain>/<mol>/      → Molecule                 │
│  apps/canon/<domain>/<mol>/<cell>/ → Cell                   │
│                                                             │
│  PACKAGE NAMES:                                             │
│  @aibos/kernel                  → Kernel                    │
│  @aibos/canon-<domain>          → Canon                     │
│  @aibos/mol-<molecule>          → Molecule                  │
│  @aibos/cell-<name>            → Cell                       │
│                                                             │
│  SPECIAL SUFFIXES:                                           │
│  -demo, -test, -stub          → Documented in PRD          │
│                                                             │
│  FORBIDDEN:                                                  │
│  ❌ Cell → Cell imports                                     │
│  ❌ Canon → Canon imports                                   │
│  ❌ Frontend → DB direct                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Common Pitfalls & Solutions

| Pitfall | Why It's Wrong | How to Fix |
|---------|----------------|------------|
| **Creating `apps/payment-hub/`** | Cell outside molecule | Move to `apps/canon/finance/dom03-accounts-payable/payment-hub/` |
| **Naming service `paymentHub`** | Missing `cell-` prefix | Use `cell-payment-hub` |
| **Package name `@aibos/payment-hub`** | Missing `cell-` prefix | Use `@aibos/cell-payment-hub` |
| **Importing `../other-cell`** | Cell → Cell violation | Use Kernel Gateway or Event Bus |
| **Directory `PaymentHub/`** | PascalCase violation | Rename to `payment-hub/` |
| **Suffix `-example`** | Non-standard suffix | Use `-demo`, `-test`, or `-stub` |

### Decision Tree: "Where Should This Go?"

```
Is it identity/auth/audit?
├─ YES → apps/kernel/
└─ NO
   ├─ Is it business logic?
   │  ├─ YES → Which domain?
   │  │  ├─ Finance → apps/canon/finance/
   │  │  ├─ HR → apps/canon/hr/
   │  │  └─ Other → apps/canon/<domain>/
   │  │     └─ Which molecule?
   │  │        └─ Which cell?
   │  └─ NO
   │     ├─ Is it database migrations?
   │     │  └─ YES → apps/db/migrations/<schema>/
   │     └─ Is it frontend?
   │        └─ YES → apps/web/
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/structure-validation.yml
name: Structure Validation

on:
  pull_request:
    paths:
      - 'apps/**'
      - 'packages/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm validate:structure --json > violations.json
      - name: Check violations
        run: |
          if [ $(jq '.summary.errors' violations.json) -gt 0 ]; then
            echo "❌ Structure validation failed"
            cat violations.json | jq '.violations[] | select(.severity=="error")'
            exit 1
          fi
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Validating structure..."
pnpm validate:structure

if [ $? -ne 0 ]; then
  echo "❌ Structure validation failed. Fix violations before committing."
  exit 1
fi
```

---

## 📊 Validation Report Format

The validator supports JSON output for CI/CD integration:

```json
{
  "valid": false,
  "violations": [
    {
      "path": "apps/canon/finance/dom03-accounts-payable/PaymentHub",
      "rule": "Cell names MUST be kebab-case",
      "expected": "/^[a-z]+(-[a-z]+)*(-demo|-test|-stub)?$/",
      "actual": "PaymentHub",
      "severity": "error",
      "suggestion": "Rename to: \"payment-hub\""
    }
  ],
  "summary": {
    "total": 1,
    "errors": 1,
    "warnings": 0
  }
}
```

---

## ✅ Acceptance Criteria

This contract is considered **implemented** when:

- [x] CONT_05 document created and reviewed
- [x] Structure validator (`validate-structure.ts`) exists
- [ ] All existing directories follow CONT_05 patterns
- [ ] ESLint rule `@aibos/naming-convention` is active
- [ ] Boundary checker (`check-boundaries.ts`) exists and passes
- [ ] Pre-commit hook enforces validation
- [ ] CI/CD pipeline includes structure validation
- [ ] Team training completed
- [ ] Quick reference distributed

---

## 🚀 Roadmap

### v1.1.0 (Planned)
- [ ] Auto-fix capability (`--fix` flag)
- [ ] ESLint plugin implementation
- [ ] Boundary checker implementation
- [ ] Visual structure diagram generator

### v1.2.0 (Future)
- [ ] IDE extension (VS Code) for real-time validation
- [ ] Automated refactoring tools
- [ ] Structure migration wizard

---

**Version:** 1.0.1  
**Status:** 🟢 ACTIVE  
**Last Updated:** 2025-12-15  
**Next Review:** 2026-01-15

---

## 📝 Changelog

### v1.0.1 (2025-12-15)
- ✅ Fixed package name uniqueness (added domain prefix to molecule/cell packages)
- ✅ Fixed suffix propagation rule (suffixes now propagate to service/package names)
- ✅ Fixed table naming pattern (removed `<entity>_<type>`, clarified plural snake_case)
- ✅ Fixed canon-pages path example (lowercase instead of uppercase)
- ✅ Defined migration versioning rule (per-schema 3-digit sequence)
- ✅ Tightened Web layer business logic rule (clarified Server Actions scope)
- ✅ Added normative terms block (MUST/SHOULD/MAY)
- ✅ Added shared packages naming
- ✅ Added reserved words and protected paths
- ✅ Clarified Cell definition (backend service, not React component)
