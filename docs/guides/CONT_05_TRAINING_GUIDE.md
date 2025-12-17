# CONT_05 Training Guide

> **Purpose:** Onboarding and training materials for CONT_05 Naming and Structure Standard  
> **Audience:** New developers, code reviewers, architects  
> **Last Updated:** 2025-12-15

---

## 🎯 Learning Objectives

After completing this guide, you will be able to:

1. ✅ Identify the correct location for any component
2. ✅ Name directories, services, and packages correctly
3. ✅ Recognize and fix naming violations
4. ✅ Understand architectural boundaries
5. ✅ Use validation tools effectively

---

## 📚 Module 1: The Lego Philosophy

### Why "Lego vs. Jenga"?

**Lego Architecture (✅ Good):**
- Each piece has standard connectors
- Pieces snap together safely
- Removing one piece doesn't collapse the structure
- Predictable and composable

**Jenga Architecture (❌ Bad):**
- Pieces depend on each other in unpredictable ways
- Removing one piece can collapse everything
- Hard to understand and maintain
- Fragile and risky

### How CONT_05 Enforces Lego Architecture

1. **Standardized Naming** → Predictable locations
2. **Strict Hierarchy** → Clear boundaries
3. **Dependency Rules** → Safe connections only
4. **Automated Validation** → Prevents violations

---

## 📚 Module 2: Directory Structure

### The Four Layers

```
apps/
├── kernel/                    ← Layer 1: Control Plane
│   └── (Identity, Auth, Gateway)
│
├── canon/                     ← Layer 2: Business Domain
│   └── finance/               ← Domain (e.g., finance, hr)
│       └── dom03-accounts-payable/  ← Layer 3: Molecule (Cluster)
│           └── payment-hub-demo/ ← Layer 4: Cell (Atomic)
│
└── db/                        ← Data Fabric
```

### Rules of Thumb

| Question | Answer |
|----------|--------|
| "Where does payment logic go?" | `apps/canon/finance/dom03-accounts-payable/<cell>/` |
| "Where does authentication go?" | `apps/kernel/` |
| "Can I create `apps/payment-hub/`?" | ❌ No - Cells must be under Molecules |
| "Can I create `apps/canon/payment-hub/`?" | ❌ No - Cells must be under Molecules |
| "Can I create `apps/canon/finance/payment-hub/`?" | ❌ No - Must be under a Molecule |

---

## 📚 Module 3: Naming Conventions

### The Kebab-Case Rule

**✅ Correct:**
- `payment-hub`
- `accounts-payable`
- `vendor-master`

**❌ Incorrect:**
- `PaymentHub` (PascalCase)
- `paymentHub` (camelCase)
- `payment_hub` (snake_case)
- `payment hub` (spaces)

### Special Suffixes

| Suffix | Purpose | Example | Documentation Required |
|--------|---------|---------|----------------------|
| `-demo` | Demo/example implementation | `payment-hub-demo` | ✅ Yes (in PRD) |
| `-test` | Test harness | `payment-hub-test` | ✅ Yes |
| `-stub` | Stub/mock | `payment-hub-stub` | ✅ Yes |

**⚠️ Important:** Suffixes MUST be documented in the Cell's PRD.

---

## 📚 Module 4: Package Names

### Pattern Matching

| Component | Pattern | Example |
|-----------|---------|---------|
| Kernel | `@aibos/kernel` | `@aibos/kernel` |
| Canon | `@aibos/canon-<domain>` | `@aibos/canon-finance` |
| Molecule | `@aibos/mol-<molecule>` | `@aibos/mol-accounts-payable` |
| Cell | `@aibos/cell-<name>` | `@aibos/cell-payment-hub` |

**Note:** Cell package names do NOT include suffixes:
- Directory: `payment-hub-demo/`
- Package: `@aibos/cell-payment-hub` (not `@aibos/cell-payment-hub-demo`)

---

## 📚 Module 5: Architectural Boundaries

### The Dependency Rule

**Allowed Dependencies:**
```
Kernel ← Canon ← Molecule ← Cell
  ↑
  └── Web (Frontend)
```

**Forbidden Dependencies:**
- ❌ Cell → Cell (use Kernel Gateway or Events)
- ❌ Canon → Canon (use Kernel Gateway)
- ❌ Molecule → Molecule (use Canon interface)
- ❌ Web → DB (use Server Actions)

### Examples

**❌ Forbidden:**
```typescript
// In payment-hub cell
import { createInvoice } from '../vendor-master';  // Cell → Cell
```

**✅ Correct:**
```typescript
// In payment-hub cell
import { KernelGateway } from '@aibos/kernel';
await KernelGateway.call('vendor-master', 'createInvoice', data);
```

---

## 📚 Module 6: Using Validation Tools

### Structure Validator

```bash
# Basic validation
pnpm validate:structure

# JSON output (for CI/CD)
pnpm validate:structure --json
```

**What it checks:**
- ✅ Directory naming (kebab-case)
- ✅ Package.json names
- ✅ Migration naming
- ✅ Docker service names

### Boundary Checker

```bash
# Check dependency boundaries
pnpm check:boundaries

# JSON output
pnpm check:boundaries --json
```

**What it checks:**
- ✅ No Cell → Cell imports
- ✅ No Canon → Canon imports
- ✅ No Frontend → DB direct access

---

## 📚 Module 7: Common Scenarios

### Scenario 1: Creating a New Cell

**Task:** Create a new "Invoice Matching" cell for Accounts Payable.

**Steps:**
1. ✅ Choose location: `apps/canon/finance/dom03-accounts-payable/invoice-matching/`
2. ✅ Create directory: `mkdir -p apps/canon/finance/dom03-accounts-payable/invoice-matching`
3. ✅ Set package name: `"name": "@aibos/cell-finance-accounts-payable-invoice-matching"`
4. ✅ Validate: `pnpm validate:structure`

### Scenario 2: Renaming a Cell

**Task:** Rename `payment-hub` to `payment-hub-demo`.

**Steps:**
1. ✅ Rename directory: `git mv payment-hub payment-hub-demo`
2. ✅ Update package.json: `"name": "@aibos/cell-finance-accounts-payable-payment-hub-demo"`
3. ✅ Update docker-compose.yml service: `cell-finance-accounts-payable-payment-hub-demo:`
4. ✅ Update docker-compose.yml context: `context: ../payment-hub-demo`
5. ✅ Update PRD: Add note about `-demo` suffix
6. ✅ Validate: `pnpm validate:structure`

### Scenario 3: Fixing a Violation

**Violation:** Directory `PaymentHub/` found.

**Fix:**
1. ✅ Rename: `git mv PaymentHub payment-hub`
2. ✅ Update imports: Use IDE refactor
3. ✅ Validate: `pnpm validate:structure`

---

## 📚 Module 8: Review Checklist

Before submitting a PR, verify:

- [ ] All directories use kebab-case
- [ ] Cell is under a Molecule
- [ ] Molecule is under a Canon
- [ ] Package.json name matches pattern
- [ ] No Cell → Cell imports
- [ ] No Canon → Canon imports
- [ ] `pnpm validate:structure` passes
- [ ] `pnpm check:boundaries` passes

---

## 🎓 Practice Exercises

### Exercise 1: Identify Violations

Find the violations in this structure:

```
apps/
├── Kernel/                    ← Violation?
├── canon/
│   └── Finance/              ← Violation?
│       └── AccountsPayable/ ← Violation?
│           └── payment_hub/ ← Violation?
```

**Answers:**
- `Kernel/` → ❌ PascalCase (should be `kernel/`)
- `Finance/` → ❌ PascalCase (should be `finance/`)
- `AccountsPayable/` → ❌ PascalCase (should be `accounts-payable/`)
- `payment_hub/` → ❌ Underscores (should be `payment-hub/`)

### Exercise 2: Choose Location

Where should these components go?

1. User authentication → `apps/kernel/`
2. Payment processing → `apps/canon/finance/dom03-accounts-payable/<cell>/`
3. Vendor management → `apps/canon/finance/dom03-accounts-payable/vendor-master/`
4. Database migrations → `apps/db/migrations/<schema>/`

---

## 📚 Resources

- **Contract:** [CONT_05_NamingAndStructure.md](../../packages/canon/A-Governance/A-CONT/CONT_05_NamingAndStructure.md)
- **Implementation Plan:** [CONT_05_IMPLEMENTATION_PLAN.md](./CONT_05_IMPLEMENTATION_PLAN.md)
- **Constitution:** [CONT_00_Constitution.md](../../packages/canon/A-Governance/A-CONT/CONT_00_Constitution.md)

---

**Version:** 1.0.0  
**Status:** 🟢 ACTIVE  
**Last Updated:** 2025-12-15
