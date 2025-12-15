# CONT_05 Implementation Plan

> **Purpose:** Training and enforcement plan for CONT_05 Naming and Structure Standard  
> **Status:** 🟡 DRAFT  
> **Created:** 2025-12-15

---

## 🎯 Objective

Establish a **systematic approach** to train, maintain, and enforce naming conventions across AI-BOS, ensuring adherence to the "Lego vs. Jenga" architecture philosophy.

---

## 📋 Implementation Phases

### Phase 1: Documentation & Awareness (Week 1)

**Deliverables:**
- ✅ CONT_05_NamingAndStructure.md created
- ✅ README updated with CONT_05 reference
- ⬜ Team training session scheduled
- ⬜ Quick reference guide created

**Actions:**
1. Review CONT_05 with architecture team
2. Create visual diagrams for common patterns
3. Document migration path for existing violations
4. Schedule team training session

---

### Phase 2: Tooling & Automation (Week 2)

**Deliverables:**
- ✅ `scripts/validate-structure.ts` created
- ⬜ ESLint rule `@aibos/naming-convention` implemented
- ⬜ `scripts/check-boundaries.ts` created
- ⬜ Pre-commit hook configured

**Actions:**
1. Complete `validate-structure.ts` implementation
2. Create ESLint plugin for naming conventions
3. Implement dependency boundary checker
4. Configure Husky pre-commit hook
5. Add to CI/CD pipeline

---

### Phase 3: Migration & Cleanup (Week 3-4)

**Deliverables:**
- ⬜ All existing directories renamed to match CONT_05
- ⬜ All package.json names updated
- ⬜ All imports refactored
- ⬜ Documentation updated

**Priority Order:**
1. **Critical:** Fix directory structure violations
2. **High:** Update service/package names
3. **Medium:** Refactor imports
4. **Low:** Update documentation references

---

### Phase 4: Enforcement & Monitoring (Ongoing)

**Deliverables:**
- ⬜ CI/CD blocks PRs with violations
- ⬜ Monthly structure audit reports
- ⬜ Automated violation detection

**Actions:**
1. Add structure validation to GitHub Actions
2. Create monthly audit script
3. Set up violation tracking dashboard

---

## 🔧 Tooling Roadmap

### 1. Structure Validator (`validate-structure.ts`)

**Status:** ✅ Created (basic)

**Features:**
- ✅ Validates directory naming (kebab-case)
- ✅ Validates cell names (with -demo/-test/-stub suffixes)
- ✅ Validates migration naming
- ⬜ Validates package.json names
- ⬜ Auto-fix mode (--fix flag)

**Next Steps:**
- Add package.json validation
- Add auto-fix capability
- Add JSON output for CI/CD

---

### 2. ESLint Rule (`@aibos/naming-convention`)

**Status:** ⬜ Not Started

**Features:**
- Directory naming validation
- Import path validation
- Service name validation
- Package name validation

**Implementation:**
```javascript
// eslint.config.js
import namingConvention from '@aibos/eslint-plugin-naming';

export default {
  plugins: {
    '@aibos/naming': namingConvention,
  },
  rules: {
    '@aibos/naming/directories': 'error',
    '@aibos/naming/imports': 'error',
    '@aibos/naming/services': 'error',
  },
};
```

---

### 3. Boundary Checker (`check-boundaries.ts`)

**Status:** ⬜ Not Started

**Features:**
- Detects Cell → Cell imports
- Detects Canon → Canon imports
- Detects frontend → DB direct access
- Suggests correct patterns

**Example Output:**
```
❌ Violation: Cell imports Cell
   File: apps/canon/finance/accounts-payable/payment-hub/src/index.ts
   Line 5: import { ... } from '../vendor-master'
   Fix: Use Kernel Gateway or Events instead
```

---

### 4. Pre-commit Hook

**Status:** ⬜ Not Started

**Configuration:**
```bash
#!/bin/sh
# .husky/pre-commit
pnpm validate:structure
pnpm lint:naming
pnpm check:boundaries
```

---

## 📚 Training Materials

### Quick Reference Card

**Directory Structure:**
```
apps/
├── kernel/                    # ✅ Control Plane
├── canon/
│   └── <domain>/             # ✅ Business Domain (kebab-case)
│       └── <molecule>/       # ✅ Functional Cluster (kebab-case)
│           └── <cell>/       # ✅ Atomic Unit (kebab-case, optional -demo/-test/-stub)
└── db/                       # ✅ Data Fabric
```

**Naming Patterns:**
- Directories: `kebab-case` (lowercase, hyphenated)
- Services: `cell-<name>`, `canon-<domain>`, `kernel`
- Packages: `@aibos/cell-<name>`, `@aibos/canon-<domain>`, `@aibos/kernel`
- Migrations: `<schema>/NNN_description.sql`

**Forbidden:**
- ❌ PascalCase directories (`PaymentHub/`)
- ❌ Underscores (`payment_hub/`)
- ❌ Cell → Cell imports
- ❌ Canon → Canon imports

---

### Common Violations & Fixes

| Violation | Fix |
|-----------|-----|
| `PaymentHub/` | `payment-hub/` |
| `payment_hub/` | `payment-hub/` |
| `cell-payment-hub` (service) | `cell-payment-hub` ✅ (already correct) |
| `payment-hub` (service) | `cell-payment-hub` |
| `import from '../other-cell'` | Use Kernel Gateway or Events |

---

## ✅ Success Metrics

**Phase 1 (Documentation):**
- [ ] CONT_05 reviewed and approved
- [ ] Team training completed
- [ ] Quick reference distributed

**Phase 2 (Tooling):**
- [ ] Structure validator passes on all directories
- [ ] ESLint rule catches violations
- [ ] Pre-commit hook prevents violations

**Phase 3 (Migration):**
- [ ] 0 directory structure violations
- [ ] 0 package naming violations
- [ ] 0 dependency boundary violations

**Phase 4 (Enforcement):**
- [ ] CI/CD blocks all violations
- [ ] Monthly audit shows 0 violations
- [ ] New developers onboarded successfully

---

## 🚀 Next Steps

1. **Immediate:** Review CONT_05 with architecture team
2. **This Week:** Complete `validate-structure.ts` implementation
3. **Next Week:** Create ESLint rule
4. **Week 3:** Begin migration of existing violations
5. **Week 4:** Add to CI/CD pipeline

---

**Version:** 1.0.0  
**Status:** 🟡 DRAFT  
**Last Updated:** 2025-12-15
