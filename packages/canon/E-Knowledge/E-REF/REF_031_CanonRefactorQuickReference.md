# REF_031: Canon Refactor Quick Reference Card

**Date:** 2025-01-27  
**Status:** Active Quick Reference  
**Purpose:** One-page cheat sheet for Canon refactors  
**Related:** REF_028_CanonRefactorDOD.md

---

## 🚀 Quick Start

**Before any Canon refactor:**
1. Read REF_028 (DOD)
2. Follow Pre-Flight checklist
3. Execute per phase DOD
4. Use PR template
5. Update REF_027

---

## 📋 Pre-Flight Checklist (Always)

- [ ] Create branch: `feat/canon-refactor-{phase}-{description}`
- [ ] Run TOOL_18 → record baseline
- [ ] Run typecheck, lint, tests, build
- [ ] Run tool in dry-run (if automated)
- [ ] Review mapping/cross-references

---

## 🔄 Phase 2: Rename Files (TOOL_23)

**Risk:** Low | **Sign-Off:** 1 Reviewer

```bash
# Dry-run
npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts

# Execute
npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts --execute

# Fix references
grep -r "old-name" .
# Update imports/links

# Validate
npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
npm run typecheck && npm run lint && npm run build
```

**Expected:** Invalid files reduced by number of files renamed.

---

## 📦 Phase 3: Canon Pages Migration (Per Batch)

**Risk:** Medium-High | **Sign-Off:** 1 Reviewer + 1 Approver

```bash
# Create directories
mkdir -p canon-pages/{META,PAY,REG,SYS,INV}

# Move files (per batch)
git mv src/pages/META_01_*.tsx canon-pages/META/

# Update imports
# Update Next.js routes (thin wrapper pattern)

# Validate
npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
npm run build
npm run dev  # Manual test routes
```

**Expected:** Batch files no longer show as invalid in TOOL_18.

---

## 📝 PR Template Checklist

- [ ] DOD Version: REF_028 v1.0.0
- [ ] Baseline metrics documented
- [ ] After metrics documented
- [ ] Mapping file attached (if applicable)
- [ ] REF_027 updated
- [ ] Sign-off section filled

**Template:** `.github/PULL_REQUEST_TEMPLATE/canon-refactor.md`

---

## 🎯 Quality Gates (Must Pass)

- ✅ TOOL_18: No new violations
- ✅ Type check: Pass
- ✅ Build: Success
- ✅ Tests: Pass (if applicable)

---

## 🔙 Rollback

```bash
# Immediate rollback
git checkout backup/pre-{phase}

# Partial rollback (batch)
git revert {commit-hash}
```

---

## 📚 Key Documents

- **REF_028:** DOD (the checklist)
- **REF_027:** Execution log (what was done)
- **REF_029:** PR template guide
- **REF_030:** Culture guide
- **REF_026:** Migration plan (Phase 3)

---

## ⚡ Common Commands

```bash
# Validation
npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts

# Rename tool
npx tsx canon/D-Operations/D-TOOL/TOOL_23_RenameCanonFiles.ts [--execute]

# Find references
grep -r "old-name" .

# Check git status
git status  # Should show renames (R), not delete+add
```

---

## 🎓 Risk Levels & Sign-Off

| Risk | Sign-Off Required |
|------|-------------------|
| Low | 1 Reviewer |
| Medium | 1 Reviewer + 1 Approver (if needed) |
| High | 1 Reviewer + 1 Approver (required) |
| Canon-Critical | 1 Reviewer + 1 Approver + Architecture |

---

## 📊 Expected Metrics (Phase 2)

**Before:**
- Invalid: 35 (4 tools + 12 refs + 20 pages + 1 archive)

**After Phase 2:**
- Invalid: 19 (20 pages + 1 archive remain)

**After Phase 3:**
- Invalid: 0-1 (only archive if not excluded)

---

## 🔗 Quick Links

- DOD: `canon/E-Knowledge/E-REF/REF_028_CanonRefactorDOD.md`
- Execution Log: `canon/E-Knowledge/E-REF/REF_027_StabilizationSequenceExecution.md`
- PR Template: `.github/PULL_REQUEST_TEMPLATE/canon-refactor.md`
- Migration Plan: `canon/E-Knowledge/E-REF/REF_026_CANON_PAGE_MIGRATION_PLAN.md`

---

**Remember:** Every refactor must be reversible, auditable, testable, and reviewable.
