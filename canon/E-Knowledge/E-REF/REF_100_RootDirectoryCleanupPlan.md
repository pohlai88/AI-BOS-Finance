# REF_100: Root Directory Cleanup Plan

**Date:** 2025-01-27  
**Status:** 🟢 Active  
**Purpose:** Clean up root directory by moving documentation to Canon or removing obsolete files  
**Related:** REF_074_DocsValidationReport, REF_099_DocsStandardizationSummary, REF_041_CanonDirectoryCleanupStrategy

---

## 🎯 Objective

Clean up the root directory by:
1. **Moving** documentation files to Canon structure
2. **Removing** obsolete/duplicate files
3. **Keeping** only essential root-level files (README.md, package.json, etc.)

---

## 📋 Current Root Directory Analysis

### ✅ Files to KEEP (Essential Root Files)

| File | Reason | Status |
|------|--------|--------|
| `README.md` | Project overview - standard root file | ✅ Keep |
| `package.json` | NPM configuration | ✅ Keep |
| `package-lock.json` | NPM lock file | ✅ Keep |
| `tsconfig.json` | TypeScript configuration | ✅ Keep |
| `next.config.mjs` | Next.js configuration | ✅ Keep |
| `tailwind.config.js` | Tailwind configuration | ✅ Keep |
| `eslint.config.js` | ESLint configuration | ✅ Keep |
| `.gitignore` | Git ignore rules | ✅ Keep |
| `.prettierrc` | Prettier configuration | ✅ Keep |

### 📁 Directories to KEEP

| Directory | Reason | Status |
|-----------|--------|--------|
| `canon/` | Canon governance system | ✅ Keep |
| `src/` | Source code | ✅ Keep |
| `app/` | Next.js app directory | ✅ Keep |
| `packages/` | Monorepo packages | ✅ Keep |
| `canon-pages/` | Canon page implementations | ✅ Keep |
| `db/` | Database files | ✅ Keep |
| `.cursor/` | Cursor IDE configuration | ✅ Keep |
| `.github/` | GitHub workflows | ✅ Keep |

---

## 🗑️ Files/Directories to REMOVE or MOVE

### 1. `src/docs/` Directory → MOVE TO CANON

**Status:** ⏳ Ready for Migration  
**Action:** Move all files to Canon structure (already validated in REF_074)

**Files to Move:**
- All 27 documentation files → Canon E-Knowledge/E-REF/
- Already standardized in `.staging-docs/` (REF_074-REF_099)

**Migration Path:**
1. ✅ Validation complete (REF_074)
2. ✅ Standardization in progress (REF_099)
3. ⏳ Promote standardized files to Canon
4. ⏳ Remove `src/docs/` directory

---

### 2. Root-Level Duplicate Files → REMOVE

**If any exist at root level:**
- `META_NAV_DESIGN.md` (if exists at root) → Remove (duplicate of `src/docs/01-architecture/META_NAV_DESIGN.md`)
- `META_NAVIGATION_AUDIT_SYSTEM.md` (if exists at root) → Remove (duplicate)

**Action:** Check and remove any root-level duplicates

---

### 3. Temporary/Obsolete Files → REMOVE

**Check for:**
- `commit-msg.txt` → Review if still needed
- Any `.md` files at root (except README.md) → Move to Canon or remove
- Any analysis/temporary files → Remove

---

## 📊 Cleanup Strategy

### Phase 1: Documentation Migration ✅ COMPLETE
- ✅ Validated all `src/docs/` files (REF_074)
- ✅ Assigned Canon IDs (REF_074-REF_098)
- ✅ Created standardized versions in `.staging-docs/`
- ⏳ Promote to Canon (next step)

### Phase 2: Root Directory Audit
1. **Check for root-level markdown files**
   ```bash
   # Find all .md files at root
   Get-ChildItem -Path . -Filter *.md -File -Depth 0
   ```

2. **Check for duplicate files**
   - Compare root files with `src/docs/` files
   - Remove duplicates

3. **Check for temporary files**
   - Review `commit-msg.txt` and similar files
   - Remove if obsolete

### Phase 3: Execute Cleanup
1. **Promote standardized docs to Canon**
   ```bash
   npm run canon:promote .staging-docs/E-Knowledge/E-REF/REF_074_DocsValidationReport.md
   # ... repeat for all standardized files
   ```

2. **Remove `src/docs/` directory**
   ```bash
   # After all files are promoted
   Remove-Item -Recurse -Force src/docs/
   ```

3. **Remove root-level duplicates**
   ```bash
   # Remove any duplicate files found
   Remove-Item META_NAV_DESIGN.md  # if exists at root
   Remove-Item META_NAVIGATION_AUDIT_SYSTEM.md  # if exists at root
   ```

### Phase 4: Verification
1. **Verify Canon structure**
   - All docs in `canon/E-Knowledge/E-REF/`
   - All files have Canon headers
   - All files registered in `canon/registry.ts`

2. **Verify root directory**
   - Only essential files remain
   - No duplicate documentation
   - Clean, organized structure

---

## 🎯 Success Criteria

### Root Directory Should Contain:
- ✅ `README.md` (project overview)
- ✅ Configuration files (`package.json`, `tsconfig.json`, etc.)
- ✅ Source directories (`src/`, `app/`, `canon/`, etc.)
- ❌ NO documentation files (except README.md)
- ❌ NO duplicate files
- ❌ NO temporary/obsolete files

### Canon Directory Should Contain:
- ✅ All standardized documentation (REF_074-REF_098)
- ✅ All files with Canon headers
- ✅ All files registered in `registry.ts`

---

## 📝 Cleanup Checklist

### Documentation Migration
- [x] Validate all `src/docs/` files
- [x] Assign Canon IDs
- [x] Create standardized versions
- [ ] Promote all standardized files to Canon
- [ ] Remove `src/docs/` directory

### Root Directory Cleanup
- [ ] Audit root-level files
- [ ] Identify duplicates
- [ ] Remove duplicate files
- [ ] Remove temporary files
- [ ] Verify clean root directory

### Final Verification
- [ ] All docs in Canon structure
- [ ] Root directory clean
- [ ] No broken references
- [ ] Update any code references to old paths

---

## 🚀 Next Steps

1. **Complete Documentation Standardization**
   - Finish creating remaining standardized documents (REF_075-REF_098)
   - Promote all to Canon

2. **Execute Root Cleanup**
   - Run root directory audit
   - Remove duplicates and obsolete files
   - Verify clean structure

3. **Update References**
   - Update any code/docs referencing old `src/docs/` paths
   - Update internal links

---

## 📊 Expected Results

### Before Cleanup:
```
AI-BOS-Finance/
├── README.md ✅
├── src/
│   └── docs/          ❌ 27 files (should be in Canon)
│       ├── 01-foundations/
│       ├── 02-architecture/
│       └── ...
└── canon/
    └── E-Knowledge/
        └── E-REF/     ⏳ (will contain standardized docs)
```

### After Cleanup:
```
AI-BOS-Finance/
├── README.md ✅
├── src/
│   └── (no docs directory) ✅
└── canon/
    └── E-Knowledge/
        └── E-REF/
            ├── REF_074_DocsValidationReport.md ✅
            ├── REF_075_DesignSystem.md ✅
            ├── REF_076_BrandIdentity.md ✅
            └── ... (all 25 standardized docs) ✅
```

---

**Status:** 🟢 Active  
**Next Action:** Complete documentation standardization, then execute cleanup  
**Maintainer:** Canon Governance System  
**Last Updated:** 2025-01-27
