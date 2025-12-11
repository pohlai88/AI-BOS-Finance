# REF_026: Canon Pages Migration Plan

**Date:** 2025-01-27  
**Status:** Planning Complete  
**Related:** REF_014_TOOL18_ValidationAudit.md  
**Purpose:** Define target structure and migration strategy for Canon pages currently in wrong locations

---

## Executive Summary

This document defines the migration plan for moving Canon-governed page files from `src/pages/` and `src/modules/` to the proper Canon directory structure (`canon-pages/{DOMAIN}/`).

**Scope:** 20 files across 5 domains (META, PAY, REG, SYS, INV)

---

## Target Structure Specification

### Root Directory
```
canon-pages/
```

### Domain-Based Organization
Each domain gets its own subdirectory:

```
canon-pages/
├── META/          # Metadata domain pages
├── PAY/           # Payment domain pages
├── REG/           # Registration/Auth domain pages
├── SYS/           # System domain pages
└── INV/           # Inventory domain pages
```

### File Naming Pattern
```
{DOMAIN}_{ID}_{Title}.tsx
```

**Examples:**
- `META_01_MetadataArchitecturePage.tsx`
- `PAY_01_PaymentHubPage.tsx`
- `REG_01_LoginPage.tsx`

### Thin Wrapper Pattern (ADR_001)

After migration, Next.js route files (`app/**/page.tsx`) should be thin wrappers:

```tsx
// app/canon/meta/page.tsx (thin wrapper)
import { META_01_MetadataArchitecturePage } from '@/canon-pages/META/META_01_MetadataArchitecturePage';
import { PAGE_META } from '@/canon-pages/META/META_01_MetadataArchitecturePage';

export { PAGE_META };
export default META_01_MetadataArchitecturePage;
```

---

## Migration Mapping Table

| # | Old Path | New Path | Domain | Canon ID | Status |
|---|----------|----------|--------|----------|--------|
| 1 | `src/pages/META_01_MetadataArchitecturePage.tsx` | `canon-pages/META/META_01_MetadataArchitecturePage.tsx` | META | META_01 | ⏳ Pending |
| 2 | `src/pages/META_02_MetadataGodView.tsx` | `canon-pages/META/META_02_MetadataGodView.tsx` | META | META_02 | ⏳ Pending |
| 3 | `src/pages/META_03_ThePrismPage.tsx` | `canon-pages/META/META_03_ThePrismPage.tsx` | META | META_03 | ⏳ Pending |
| 4 | `src/pages/META_04_MetaRiskRadarPage.tsx` | `canon-pages/META/META_04_MetaRiskRadarPage.tsx` | META | META_04 | ⏳ Pending |
| 5 | `src/pages/META_05_MetaCanonMatrixPage.tsx` | `canon-pages/META/META_05_MetaCanonMatrixPage.tsx` | META | META_05 | ⏳ Pending |
| 6 | `src/pages/META_06_MetaHealthScanPage.tsx` | `canon-pages/META/META_06_MetaHealthScanPage.tsx` | META | META_06 | ⏳ Pending |
| 7 | `src/pages/META_07_MetaLynxCodexPage.tsx` | `canon-pages/META/META_07_MetaLynxCodexPage.tsx` | META | META_07 | ⏳ Pending |
| 8 | `src/pages/META_08_ImplementationPlaybookPage.tsx` | `canon-pages/META/META_08_ImplementationPlaybookPage.tsx` | META | META_08 | ⏳ Pending |
| 9 | `src/pages/PAY_01_PaymentHubPage.tsx` | `canon-pages/PAY/PAY_01_PaymentHubPage.tsx` | PAY | PAY_01 | ⏳ Pending |
| 10 | `src/modules/payment/PAY_01_PaymentHub.tsx` | `canon-pages/PAY/PAY_01_PaymentHub.tsx` | PAY | PAY_01 | ⏳ Pending |
| 11 | `src/pages/REG_01_LoginPage.tsx` | `canon-pages/REG/REG_01_LoginPage.tsx` | REG | REG_01 | ⏳ Pending |
| 12 | `src/pages/REG_02_SignUpPage.tsx` | `canon-pages/REG/REG_02_SignUpPage.tsx` | REG | REG_02 | ⏳ Pending |
| 13 | `src/pages/REG_03_ResetPasswordPage.tsx` | `canon-pages/REG/REG_03_ResetPasswordPage.tsx` | REG | REG_03 | ⏳ Pending |
| 14 | `src/pages/SYS_01_SysBootloaderPage.tsx` | `canon-pages/SYS/SYS_01_SysBootloaderPage.tsx` | SYS | SYS_01 | ⏳ Pending |
| 15 | `src/pages/SYS_02_SysOrganizationPage.tsx` | `canon-pages/SYS/SYS_02_SysOrganizationPage.tsx` | SYS | SYS_02 | ⏳ Pending |
| 16 | `src/pages/SYS_03_SysAccessPage.tsx` | `canon-pages/SYS/SYS_03_SysAccessPage.tsx` | SYS | SYS_03 | ⏳ Pending |
| 17 | `src/pages/SYS_04_SysProfilePage.tsx` | `canon-pages/SYS/SYS_04_SysProfilePage.tsx` | SYS | SYS_04 | ⏳ Pending |
| 18 | `src/modules/system/SYS_01_Bootloader.tsx` | `canon-pages/SYS/SYS_01_Bootloader.tsx` | SYS | SYS_01 | ⏳ Pending |
| 19 | `src/modules/inventory/INV_01_Dashboard.tsx` | `canon-pages/INV/INV_01_Dashboard.tsx` | INV | INV_01 | ⏳ Pending |

**Note:** File #10 (`PAY_01_PaymentHub.tsx`) may conflict with #9 (`PAY_01_PaymentHubPage.tsx`). Review to determine if they should be merged or renamed.

---

## Migration Strategy

### Phase 1: Preparation

1. **Create Directory Structure**
   ```bash
   mkdir -p canon-pages/{META,PAY,REG,SYS,INV}
   ```

2. **Verify Dependencies**
   - Identify all files that import these pages
   - Document import paths
   - Check for circular dependencies

3. **Backup Current State**
   - Ensure git is clean
   - Create backup branch: `git branch backup/pre-migration`

### Phase 2: Incremental Migration (Recommended)

**Batch 1: META Domain (8 files)**
- Lowest risk (metadata pages, likely fewer dependencies)
- Test routing after migration
- Verify imports work

**Batch 2: REG Domain (3 files)**
- Authentication pages
- Critical for app functionality
- Test thoroughly

**Batch 3: SYS Domain (5 files)**
- System configuration pages
- May have complex dependencies

**Batch 4: PAY Domain (2 files)**
- Payment hub (business critical)
- Requires careful testing

**Batch 5: INV Domain (1 file)**
- Inventory dashboard
- Final migration

### Phase 3: Post-Migration

1. **Update Imports**
   - Find all imports: `grep -r "from.*src/pages" .`
   - Update to new paths: `@/canon-pages/{DOMAIN}/...`
   - Or use path alias: `canon-pages/{DOMAIN}/...`

2. **Update Next.js Routes**
   - Ensure `app/**/page.tsx` files are thin wrappers
   - Import from `canon-pages/`
   - Re-export metadata if needed

3. **Verify Routing**
   - Test all routes in development
   - Verify build succeeds
   - Check for runtime errors

4. **Update Registry**
   - Update registry YAML files if needed
   - Document new locations

---

## Import Path Updates

### Current Import Pattern
```tsx
import { META_01_MetadataArchitecturePage } from '@/src/pages/META_01_MetadataArchitecturePage';
// or
import { META_01_MetadataArchitecturePage } from '../../pages/META_01_MetadataArchitecturePage';
```

### New Import Pattern
```tsx
import { META_01_MetadataArchitecturePage } from '@/canon-pages/META/META_01_MetadataArchitecturePage';
// or
import { META_01_MetadataArchitecturePage } from '@/canon-pages/META';
```

### Path Alias Configuration

Ensure `tsconfig.json` or `next.config.js` has path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/canon-pages/*": ["./canon-pages/*"]
    }
  }
}
```

---

## Risk Assessment

### Low Risk
- **META domain:** Metadata pages, likely isolated
- **File moves:** Using `git mv` preserves history

### Medium Risk
- **Import updates:** May miss some references
- **Build configuration:** Path aliases may need updates

### High Risk
- **Routing breaks:** If Next.js routes aren't updated
- **Runtime errors:** If imports are incorrect
- **PAY domain:** Business-critical, requires thorough testing

### Mitigation Strategies

1. **Incremental Migration:** Move in small batches
2. **Automated Testing:** Run tests after each batch
3. **Manual Verification:** Test routes manually
4. **Rollback Plan:** Keep backup branch ready

---

## Execution Checklist

### Pre-Migration
- [ ] Create directory structure
- [ ] Document all current imports
- [ ] Create backup branch
- [ ] Verify git is clean

### Migration (Per Batch)
- [ ] Move files using `git mv`
- [ ] Update imports in moved files
- [ ] Update Next.js route files
- [ ] Run build: `npm run build`
- [ ] Test routes in dev: `npm run dev`
- [ ] Update registry if needed
- [ ] Mark batch as complete in mapping table

### Post-Migration
- [ ] Run TOOL_18 to verify compliance
- [ ] Update documentation
- [ ] Remove old import paths
- [ ] Clean up unused files
- [ ] Update this document with completion status

---

## Notes

- **File Conflicts:** `PAY_01_PaymentHub.tsx` and `PAY_01_PaymentHubPage.tsx` both use `PAY_01`. Review to determine if:
  - They should be merged
  - One should be renamed (e.g., `PAY_01_PaymentHubComponent.tsx`)
  - They serve different purposes and both are valid

- **Module Files:** Files in `src/modules/` may be components rather than pages. Review to determine if they should:
  - Move to `canon-pages/` (if they're page components)
  - Move to `packages/ui/canon/` (if they're reusable components)
  - Stay in modules (if they're domain-specific utilities)

- **Thin Wrapper Pattern:** After migration, ensure Next.js route files follow the thin wrapper pattern from ADR_001.

---

## Related Documentation

- **REF_014:** TOOL_18 Validation Audit Report
- **ADR_001:** Next.js App Router Adoption
- **CONT_01:** Canon Identity Contract
- **REF_013:** TOOL_18 Developer Guide

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial migration plan created |
