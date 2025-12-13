# REF_101: Root Directory Cleanup Execution Plan

**Date:** 2025-01-27  
**Status:** 🟢 Active  
**Purpose:** Step-by-step execution plan for cleaning root directory  
**Related:** REF_100_RootDirectoryCleanupPlan, REF_074_DocsValidationReport

---

## 🎯 Immediate Actions

### Step 1: Remove Duplicate Files in `src/docs/` Root

**Files to Remove:**
- `src/docs/META_NAV_DESIGN.md` (duplicate of `src/docs/01-architecture/META_NAV_DESIGN.md`)
- `src/docs/META_NAVIGATION_AUDIT_SYSTEM.md` (duplicate of `src/docs/01-architecture/META_NAVIGATION_AUDIT_SYSTEM.md`)

**Action:** Delete these duplicate files immediately

---

### Step 2: Complete Documentation Standardization

**Remaining Standardized Documents to Create:**
1. REF_075 - Design System (consolidated)
2. REF_076 - Brand Identity (consolidated)
3. REF_077 - UX Guidelines (consolidated)
4. REF_080 - Technical Register
5. REF_082 - Page Coding Standards (consolidated)
6. REF_085 - META Navigation Design (consolidated)
7. REF_086 - META Navigation Audit (consolidated)
8. REF_087 - Build Ready Checklist
9. REF_088 - Quick Start Guide (consolidated)
10. REF_089 - Keyboard Shortcuts (consolidated)
11. REF_092 - Developer Handoff
12. REF_093 - REG Series Completion
13. REF_094 - META Series Completion
14. REF_095 - SYS Series Completion
15. REF_096 - Completion Pack Template
16. REF_097 - Documentation Index
17. REF_098 - Audit Trail Example

**Status:** 3/25 complete (REF_074, REF_081, REF_099)

---

### Step 3: Promote All Standardized Documents to Canon

**After all documents are standardized:**
```bash
# Promote each standardized document
npm run canon:promote .staging-docs/E-Knowledge/E-REF/REF_074_DocsValidationReport.md
npm run canon:promote .staging-docs/E-Knowledge/E-REF/REF_081_SchemaFirstArchitecture.md
npm run canon:promote .staging-docs/E-Knowledge/E-REF/REF_099_DocsStandardizationSummary.md
npm run canon:promote .staging-docs/E-Knowledge/E-REF/REF_100_RootDirectoryCleanupPlan.md
npm run canon:promote .staging-docs/E-Knowledge/E-REF/REF_101_CleanupExecutionPlan.md
# ... continue for all remaining REF_075-REF_098
```

---

### Step 4: Remove `src/docs/` Directory

**After all files are promoted to Canon:**
```bash
# Verify all files are in Canon
# Then remove src/docs directory
Remove-Item -Recurse -Force src/docs/
```

**Verification:**
- ✅ All 27 files standardized and in Canon
- ✅ No broken references
- ✅ All Canon IDs assigned

---

## 📋 Cleanup Checklist

### Immediate (Can Do Now)
- [ ] Remove `src/docs/META_NAV_DESIGN.md` (duplicate)
- [ ] Remove `src/docs/META_NAVIGATION_AUDIT_SYSTEM.md` (duplicate)
- [ ] Verify root directory only has README.md

### Short-term (Complete Standardization)
- [ ] Create remaining 17 standardized documents (REF_075-REF_098)
- [ ] Promote all standardized documents to Canon
- [ ] Verify all files in `canon/E-Knowledge/E-REF/`

### Final (Cleanup)
- [ ] Remove `src/docs/` directory
- [ ] Update any code references to old paths
- [ ] Verify clean root directory

---

## 🚀 Quick Start: Remove Duplicates Now

**Execute these commands:**

```powershell
# Navigate to project root
cd c:\AI-BOS\AI-BOS-Finance

# Remove duplicate files
Remove-Item src\docs\META_NAV_DESIGN.md
Remove-Item src\docs\META_NAVIGATION_AUDIT_SYSTEM.md

# Verify removal
Get-ChildItem src\docs\*.md -File
```

**Expected Result:**
- Only `README.md` and `AUDIT_TRAIL_EXAMPLE.md` remain at `src/docs/` root level
- All other files are in subdirectories

---

## 📊 Progress Tracking

### Documentation Standardization
- **Total Files:** 27
- **Canon IDs Assigned:** 25 (after consolidation)
- **Standardized:** 5 (REF_074, REF_081, REF_099, REF_100, REF_101)
- **Remaining:** 20
- **Completion:** 20%

### Root Directory Cleanup
- **Duplicate Files Found:** 2
- **Removed:** 0
- **Remaining:** 2
- **Completion:** 0%

---

**Status:** 🟢 Ready for Execution  
**Next Action:** Remove duplicate files, then continue standardization  
**Maintainer:** Canon Governance System  
**Last Updated:** 2025-01-27
