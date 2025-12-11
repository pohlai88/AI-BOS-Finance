# REF_028: Canon Refactor Definition of Done (DOD)

**DOD Version:** 1.0.0  
**Effective From:** 2025-01-27  
**Status:** Active Standard  
**Owner:** Canon Governance / Platform  
**Purpose:** Standardized checklist for all Canon refactoring operations  
**Related:** REF_027_StabilizationSequenceExecution.md

---

## Version History

| Version | Date | Changes | Effective From |
|---------|------|---------|---------------|
| 1.0.0 | 2025-01-27 | Initial DOD checklist created | 2025-01-27 |

**Note:** When executing a refactor, always reference the DOD version used (e.g., "Followed REF_028 v1.0.0"). This ensures auditability even if the DOD evolves.

---

## Overview

This document defines the **Definition of Done (DOD)** for Canon refactoring operations. Use this checklist for every refactor to ensure consistency, auditability, and reversibility.

**Principle:** Every refactor must be:
- ✅ **Reversible** (git history preserved)
- ✅ **Auditable** (mapping files, documentation)
- ✅ **Testable** (CI passes, manual verification)
- ✅ **Reviewable** (clear PR with context)

---

## Roles & Sign-Off

### Roles

- **Author/Executor:** Developer performing the refactor
- **Reviewer:** Code reviewer (required for all refactors)
- **Approver:** Governance/Architecture reviewer (required for high-risk refactors)

### Sign-Off Requirements

**Low-Risk Refactors** (e.g., tool/reference renames, isolated file moves):
- ✅ 1 Reviewer (code review)

**Medium-Risk Refactors** (e.g., domain batch migrations, import path updates):
- ✅ 1 Reviewer (code review)
- ✅ 1 Approver (governance/architecture) - if affects critical paths

**High-Risk Refactors** (e.g., PAY/REG domain migrations, routing changes):
- ✅ 1 Reviewer (code review)
- ✅ 1 Approver (governance/architecture) - **required**
- ✅ Manual testing verification

**Canon-Critical Refactors** (e.g., core Canon patterns, identity contract changes):
- ✅ 1 Reviewer (code review)
- ✅ 1 Approver (governance/architecture) - **required**
- ✅ Architecture review
- ✅ Manual testing + E2E verification

---

## Pre-Flight Checklist (Before Any Refactor)

### 1. Branch Management
- [ ] Create dedicated feature branch: `feat/canon-refactor-{phase}-{description}`
- [ ] Ensure working directory is clean: `git status`
- [ ] Verify no uncommitted changes

### 2. Baseline Validation
- [ ] Run TOOL_18: `npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts`
- [ ] Record baseline metrics (invalid files, unknown files, etc.)
- [ ] Run type check: `npm run typecheck` or `tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm run test` (if applicable)
- [ ] Document baseline state in PR description

### 3. Tool Verification (For Automated Refactors)
- [ ] Run tool in **dry-run mode** first
- [ ] Review generated mapping file
- [ ] Spot-check 2-3 sample files for correctness
- [ ] Review cross-reference report
- [ ] Verify naming scheme matches Canon patterns

### 4. Impact Assessment
- [ ] Identify all files that will be affected
- [ ] Document import paths that need updating
- [ ] Check for circular dependencies
- [ ] Identify any routing/config that needs updates

**Only proceed to execution after all pre-flight checks pass.**

---

## Phase 2 DOD: Rename Files (TOOL_23)

### Execution
- [ ] Run TOOL_23 in dry-run: `npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts`
- [ ] Review mapping file: `canon/D-Operations/D-TOOL/TOOL_23_RENAME_MAPPING.json`
- [ ] Verify all renames are correct (check 2-3 samples)
- [ ] Review cross-reference report
- [ ] Execute: `npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts --execute`

### Post-Execution
- [ ] **Update References:**
  - [ ] Fix broken imports found by TOOL_23
  - [ ] Search for old filenames: `grep -r "figma-push\|AUDIT_PAYMENT_HUB" .`
  - [ ] Update documentation links
  - [ ] Update any hardcoded paths

- [ ] **Run Validations:**
  - [ ] TOOL_18: Verify invalid files reduced
  - [ ] Type check: `npm run typecheck`
  - [ ] Linter: `npm run lint`
  - [ ] Tests: `npm run test` (if applicable)
  - [ ] Build: `npm run build` (verify no build errors)

- [ ] **Update Documentation:**
  - [ ] Update REF_027 with execution date and commit hash
  - [ ] Update any docs referencing old filenames
  - [ ] Attach mapping file to PR

- [ ] **PR Requirements:**
  - [ ] Title: `Canon Refactor – Phase 2: Rename Tools & Refs`
  - [ ] Description includes:
    - **DOD Version Used:** REF_028 v1.0.0
    - Links to REF_014, REF_026, REF_027
    - Mapping table or link to mapping file
    - Baseline vs. after metrics
    - List of cross-references updated
  - [ ] All checks pass
  - [ ] Code review approved (see Roles & Sign-Off above)

**Phase 2 is DONE when PR is merged and all validations pass.**

---

## Phase 3 DOD: Canon Pages Migration (Per Batch)

### Pre-Batch Checklist
- [ ] Review REF_026 migration plan for batch
- [ ] Verify target directory exists: `canon-pages/{DOMAIN}/`
- [ ] Document current import paths for batch files
- [ ] Create backup branch: `git branch backup/pre-batch-{DOMAIN}`

### Batch Execution
- [ ] **Move Files:**
  - [ ] Use `git mv` for each file in batch
  - [ ] Verify files moved correctly
  - [ ] Check git status shows renames (not deletions + additions)

- [ ] **Update Imports:**
  - [ ] Update imports in moved files
  - [ ] Update Next.js route files (`app/**/page.tsx`)
  - [ ] Update any routing constants/config
  - [ ] Update path aliases if needed (`tsconfig.json`)

- [ ] **Update Routes:**
  - [ ] Ensure thin wrapper pattern (ADR_001)
  - [ ] Verify route files import from `canon-pages/{DOMAIN}/`
  - [ ] Re-export metadata if needed

### Post-Batch Validation
- [ ] **Run Validations:**
  - [ ] TOOL_18: Verify batch files no longer show as invalid
  - [ ] Type check: `npm run typecheck`
  - [ ] Linter: `npm run lint`
  - [ ] Build: `npm run build`

- [ ] **Manual Testing:**
  - [ ] Start dev server: `npm run dev`
  - [ ] Open each migrated page in browser
  - [ ] Verify routing works
  - [ ] Check metadata/SEO still works
  - [ ] Test navigation to/from migrated pages

- [ ] **Update Documentation:**
  - [ ] Mark batch as "COMPLETED" in REF_026 mapping table
  - [ ] Add completion date and commit hash
  - [ ] Update REF_027 with batch status

- [ ] **PR Requirements:**
  - [ ] Title: `Canon Migration – Batch {N}: {DOMAIN} Domain`
  - [ ] Description includes:
    - **DOD Version Used:** REF_028 v1.0.0
    - Batch number and domain
    - List of files moved
    - Import path changes made
    - Manual testing results
    - Link to REF_026
  - [ ] All checks pass
  - [ ] Code review approved (see Roles & Sign-Off above)
  - [ ] Governance approval (if required per risk level)

**Batch is DONE when PR is merged, validations pass, and manual testing confirms routes work.**

---

## Post-Migration DOD (All Batches Complete)

### Final Validation
- [ ] **TOOL_18:**
  - [ ] Run: `npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts`
  - [ ] Verify: 0 invalid files (or only expected exceptions)
  - [ ] Document final metrics

- [ ] **Full Application Test:**
  - [ ] Build succeeds: `npm run build`
  - [ ] All routes accessible
  - [ ] No runtime errors in console
  - [ ] Navigation works correctly
  - [ ] Metadata/SEO intact

- [ ] **Cleanup:**
  - [ ] Remove old import paths (if any remain)
  - [ ] Clean up unused files
  - [ ] Update registry YAML if needed

- [ ] **Documentation:**
  - [ ] Update REF_026: Mark all batches complete
  - [ ] Update REF_027: Phase 3 completion
  - [ ] Update any architecture docs
  - [ ] Create migration summary

- [ ] **Final PR (if needed):**
  - [ ] Title: `Canon Migration – Phase 3 Complete`
  - [ ] Description includes:
    - **DOD Version Used:** REF_028 v1.0.0
    - Summary of all batches
    - Final validation results
    - Links to all batch PRs
  - [ ] All checks pass
  - [ ] Code review approved
  - [ ] Governance approval (required for Phase 3 completion)

**Phase 3 is DONE when all batches are merged and final validation passes.**

---

## Rollback Procedure

If any phase fails validation or causes issues:

### Immediate Rollback
1. **Stop execution immediately**
2. **Revert to backup branch:**
   ```bash
   git checkout backup/pre-{phase}
   # or
   git reset --hard backup/pre-{phase}
   ```
3. **Document issue** in REF_027 or create issue ticket

### Partial Rollback (For Batches)
1. **Revert specific batch PR:**
   ```bash
   git revert {commit-hash}
   ```
2. **Update REF_026:** Mark batch as "ROLLED BACK"
3. **Investigate issue** before retrying

### Post-Rollback
- [ ] Document what went wrong
- [ ] Update process if needed
- [ ] Create new backup branch
- [ ] Retry with fixes

---

## Quality Gates

### Must Pass (Blocking)
- ✅ TOOL_18: No new violations
- ✅ Type check: No type errors
- ✅ Build: Successful build
- ✅ Tests: All tests pass (if applicable)

### Should Pass (Warning)
- ⚠️ Linter: No new warnings
- ⚠️ Manual testing: All routes work
- ⚠️ Documentation: Updated

### Nice to Have (Non-blocking)
- 💡 Performance: No regression
- 💡 Coverage: Maintained or improved

---

## Audit Trail Requirements

Every refactor must leave an audit trail:

1. **Mapping Files:**
   - Generated by tools (e.g., `TOOL_23_RENAME_MAPPING.json`)
   - Stored in `canon/D-Operations/D-TOOL/`
   - Committed to git

2. **Documentation Updates:**
   - REF_027: Execution status
   - REF_026: Migration progress (for Phase 3)
   - Any relevant ADRs or specs

3. **PR Documentation:**
   - Clear title and description
   - Links to related REFs
   - Baseline vs. after metrics
   - Manual testing results

4. **Git History:**
   - Use `git mv` (not delete + add)
   - Meaningful commit messages
   - Tagged releases if applicable

---

## Reusability Pattern

This DOD checklist is designed to be reusable for future refactors:

1. **Copy this checklist** for new refactor operations
2. **Customize** for specific operation (e.g., "Phase 4: Component Migration")
3. **Follow the pattern:** Pre-flight → Execution → Validation → Documentation
4. **Update REF_028** if process improvements are discovered

---

## Related Documentation

- **REF_014:** TOOL_18 Validation Audit Report
- **REF_026:** Canon Pages Migration Plan
- **REF_027:** Stabilization Sequence Execution
- **REF_029:** Canon Refactor PR Template
- **TOOL_18:** ValidateCanonCompliance.ts
- **TOOL_23:** RenameCanonFiles.ts

---

## PR Template

For all Canon refactor PRs, use the template at:
**`.github/PULL_REQUEST_TEMPLATE/canon-refactor.md`**

This template ensures:
- DOD version is referenced
- Baseline and after metrics are documented
- Sign-off requirements are clear
- All required documentation links are included

See **REF_029** for detailed usage instructions.

---

## Version History

| Version | Date | Changes | Effective From |
|---------|------|---------|----------------|
| 1.0.0 | 2025-01-27 | Initial DOD checklist created | 2025-01-27 |

**Note:** When updating this DOD:
1. Bump version number (e.g., 1.0.0 → 1.0.1)
2. Add entry to version history
3. Update "Effective From" date
4. Document what changed and why
5. Update any references in REF_027 execution logs
