# Canon Identity Contract v2.1.0 - Implementation Checklist

**Date:** 2024-12-10  
**Purpose:** Verify Canon v2.1.0 is fully installed and operational

---

## ✅ Pre-Implementation Verification

### 1. Contract Documents
- [ ] `CANON_IDENTITY_CONTRACT_v2.1.0.md` exists and is the SSOT
- [ ] `README.md` is synced from contract (run `npm run canon:sync-readme`)
- [ ] `SSOT_DEFINITION.md` documents the SSOT hierarchy
- [ ] `PRODUCTION_APPROVAL.md` contains "Day 1" execution plan

### 2. Directory Structure
- [ ] `canon/` directory exists (for YAML registries)
- [ ] `apps/web/canon-pages/` exists (for canonical page implementations)
- [ ] `packages/ui/canon/tables/` exists (for canonical components)
- [ ] `scripts/` directory contains `sync-canon.ts` and `validate-canon.ts`

---

## ✅ Tooling Installation

### 3. Dependencies
- [ ] `eslint-plugin-local-rules` installed (`npm install --save-dev eslint-plugin-local-rules`)
- [ ] `js-yaml` installed (`npm install --save-dev js-yaml`)
- [ ] `glob` installed (`npm install --save-dev glob`)
- [ ] `tsx` installed (`npm install --save-dev tsx`)

### 4. Scripts
- [ ] `package.json` contains `"canon:sync": "tsx scripts/sync-canon.ts"`
- [ ] `package.json` contains `"canon:validate": "tsx scripts/validate-canon.ts"`
- [ ] `package.json` contains `"canon:sync-readme": "tsx scripts/sync-readme.ts"`

### 5. ESLint Configuration
- [ ] `eslint-local-rules.js` exists in project root
- [ ] `eslint.config.js` imports and registers `canon/require-page-meta` rule
- [ ] ESLint rule is enabled for canonical page files:
  ```javascript
  {
    files: [
      'src/pages/**/*.tsx',
      'src/modules/**/*Page.tsx',
      'apps/web/canon-pages/**/*.tsx',
    ],
    rules: {
      'canon/require-page-meta': 'error',
    },
  }
  ```

---

## ✅ Pilot Implementation (PAY_01)

### 6. Canonical Page
- [ ] `apps/web/canon-pages/PAY/PAY_01_PaymentHubPage.tsx` exists
- [ ] Page contains `export const PAGE_META = { ... } as const satisfies PageMeta;`
- [ ] `PAGE_META` includes: `code`, `version`, `name`, `route`, `domain`, `owner`

### 7. Route Wrapper (Next.js)
- [ ] `apps/web/app/payments/page.tsx` exists (thin wrapper)
- [ ] Wrapper imports and re-exports canonical page
- [ ] Metadata is re-exported (if applicable)

### 8. Registry Generation
- [ ] Run `npm run canon:sync`
- [ ] `canon/pages.yaml` is generated/updated
- [ ] `PAY_01` entry appears in `canon/pages.yaml` with correct fields
- [ ] `impl_file` and `entry_file` paths are correct

### 9. Validation
- [ ] Run `npm run canon:validate`
- [ ] Validation passes (no errors)
- [ ] ESLint passes (no `canon/require-page-meta` errors)

---

## ✅ TypeScript Types

### 10. Type Definitions
- [ ] `src/types/canon.ts` exists
- [ ] Contains `PageMeta`, `ComponentMeta`, `CellMeta` interfaces
- [ ] Contains `CanonContext` interface
- [ ] Contains registry interfaces (`PageRegistryItem`, etc.)
- [ ] Types match YAML structure

---

## ✅ Security Implementation

### 11. Security Helpers
- [ ] `lib/canon/verifyCanonContext.ts` exists
- [ ] `lib/canon/registry.ts` contains `getCellConfig` function
- [ ] Route Handlers use `verifyCanonContext` (Section 8.1 pattern)
- [ ] Server Actions use `verifyCanonContext` (Section 8.2 pattern)

### 12. Database Schema
- [ ] `meta_flex_field` table includes:
  - `page_code TEXT NOT NULL`
  - `schema_code TEXT NOT NULL`
  - `tab_code TEXT NOT NULL`
  - `policy_code TEXT NOT NULL` (primary policy from `policy_codes[0]`)
  - `cell_id TEXT NOT NULL`
  - `cell_id_created TEXT` (for versioning)

---

## ✅ CI/CD Integration

### 13. Pre-commit / CI
- [ ] `canon:validate` runs in CI pipeline
- [ ] `canon:sync` runs before commits (or in CI)
- [ ] PRs require `canon/pages.yaml` to be updated
- [ ] ESLint rule fails builds if `PAGE_META` is missing

---

## ✅ Documentation

### 14. Team Onboarding
- [ ] Team knows about "Red Line" rule: No PR merged without `canon:sync`
- [ ] Team understands `PAGE_META` is required for all canonical pages
- [ ] Team knows to run `npm run canon:sync` after adding/updating pages

---

## ✅ Verification Commands

Run these commands to verify installation:

```bash
# 1. Check scripts are available
npm run canon:sync
npm run canon:validate
npm run canon:sync-readme

# 2. Check ESLint rule works
npm run lint

# 3. Verify registry is generated
cat canon/pages.yaml

# 4. Verify types compile
npx tsc --noEmit
```

---

## Status

**Total Items:** 14 categories, ~40 checkboxes  
**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete

---

**Once all items are checked, Canon v2.1.0 is fully installed and operational.**

