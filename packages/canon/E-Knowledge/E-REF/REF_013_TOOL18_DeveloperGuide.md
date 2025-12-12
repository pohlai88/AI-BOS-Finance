# REF_013: TOOL_18 Developer Guide

**Status:** Active Reference  
**Date:** 2025-01-27  
**Related:** TOOL_18_ValidateCanonCompliance.ts  
**Purpose:** Comprehensive developer guide for TOOL_18 validation logic, patterns, and best practices

---

## Table of Contents

1. [Validation Logic Overview](#validation-logic-overview)
2. [Path Normalization](#path-normalization)
3. [Framework File Detection](#framework-file-detection)
4. [Canon File Detection](#canon-file-detection)
5. [Adding New Patterns](#adding-new-patterns)
6. [Common Issues & Fixes](#common-issues--fixes)
7. [Testing & Debugging](#testing--debugging)
8. [Performance Considerations](#performance-considerations)
9. [Next.js 16 Best Practices](#nextjs-16-best-practices)
10. [Next.js Workflow Best Practices](#nextjs-workflow-best-practices)

---

## Validation Logic Overview

This tool validates files against two sets of rules:

1. **Framework conventions** (Next.js, configs, utilities) - allowed with default naming
2. **Canon Identity patterns** (TOOL_XX, REF_XXX, etc.) - required for Canon-governed files

### Validation Flow

```
File → Check Framework Patterns → Check Canon Patterns → Validate Location → Return Result
```

Files are categorized as:
- **FRAMEWORK**: Framework-specific files (Next.js, configs, utilities)
- **CANON**: Canon-governed files following Canon patterns
- **UTILITY**: Generic utility files
- **INVALID**: Files that violate Canon Identity rules
- **UNKNOWN**: Files that don't match any pattern (may need review)

---

## Path Normalization

All paths are normalized to use forward slashes (`/`) for cross-platform compatibility.

- Windows paths: `canon\D-TOOL\...` → `canon/D-TOOL/...`
- Unix paths: `canon/D-TOOL/...` (unchanged)

This ensures pattern matching works consistently on all platforms.

### Implementation

```typescript
const normalizedPath = relativePath.replace(/\\/g, '/');
```

---

## Framework File Detection

Framework files are identified by:

1. **Location** (app/, pages/, root level)
2. **Filename pattern** (page.tsx, route.ts, proxy.ts, etc.)
3. **File extension** and naming conventions

### Location-Based Rules

- **Next.js App Router files** are only valid when inside `app/` directory
- **Next.js Pages Router files** are only valid when inside `pages/` directory
- **Server Actions** (`*.actions.ts`) are valid anywhere (per ADR_001)
- **Root-level files** (proxy.ts, middleware.ts, next-env.d.ts) are valid at project root

### Supported Framework Patterns

#### Next.js App Router (app/ directory)
- `page.tsx`, `layout.tsx`, `route.ts`
- `loading.tsx`, `error.tsx`, `not-found.tsx`
- `forbidden.tsx`, `unauthorized.tsx` (Next.js 16+)
- `instrumentation.ts`, `instrumentation-client.ts`
- `mdx-components.tsx`
- Dynamic routes: `[param]`, `[...slug]`
- Route groups: `(group)`

#### Next.js Pages Router (pages/ directory)
- `_app.tsx`, `_document.tsx`, `_error.tsx`
- `index.tsx`
- Dynamic routes: `[param]`, `[...slug]`

#### Root Level
- `proxy.ts` (Next.js 16+, preferred)
- `middleware.ts` (deprecated, backward compatibility)
- `next-env.d.ts`

#### Server Actions
- `*.actions.ts` (anywhere in repo, per ADR_001)

---

## Canon File Detection

Canon files are identified by:

1. **Filename pattern** matching `CANON_PATTERNS` regex
2. **Location validation** (must be in appropriate `canon/` subdirectory)

### Canon Patterns

| Pattern | Format | Example | Location |
|---------|--------|---------|----------|
| TOOL | `TOOL_\d{2,3}_[A-Za-z0-9_]+\.(ts\|js)` | `TOOL_18_ValidateCanonCompliance.ts` | `canon/D-Operations/D-TOOL/` |
| CONT | `CONT_\d{2,3}_[A-Za-z0-9_]+\.md` | `CONT_01_CanonIdentity.md` | `canon/contracts/` |
| ADR | `ADR_\d{3}_[A-Za-z0-9_]+\.md` | `ADR_001_NextJsAppRouter.md` | `canon/contracts/adrs/` |
| REF | `REF_\d{3}_[A-Za-z0-9_]+\.md` | `REF_013_TOOL18_DeveloperGuide.md` | `canon/E-Knowledge/E-REF/` |
| SPEC | `SPEC_\d{3}_[A-Za-z0-9_]+\.md` | `SPEC_001_FeatureName.md` | `canon/E-Knowledge/E-SPEC/` |
| PAGE | `(PAGE_)?[A-Z]+_\d{2}_[A-Za-z0-9_]+\.tsx?` | `META_02_CanonLandingPage.tsx` | `canon-pages/` or `apps/web/canon-pages/` |
| COMP | `(COMP_)?[A-Z0-9]+_[A-Za-z0-9_]+\.tsx?` | `TBLM01_TableMonetize.tsx` | `packages/ui/canon/` |
| ENT | `ENT_\d{3}_[A-Za-z0-9_]+\.(ts\|yaml\|yml)` | `ENT_001_User.ts` | `canon/C-Data/` |
| SCH | `SCH_\d{3}_[A-Za-z0-9_]+\.(ts\|yaml\|yml)` | `SCH_001_UserSchema.ts` | `canon/C-Data/` |
| POLY | `POLY_\d{2,3}_[A-Za-z0-9_]+\.(ts\|yaml\|yml)` | `POLY_01_UserPolicy.ts` | `canon/C-Data/` |
| CONST | `CONST_\d{2,3}_[A-Za-z0-9_]+\.(ts\|yaml\|yml)` | `CONST_01_AppConstants.ts` | `canon/C-Data/` |
| MIG | `MIG_\d{8}_[A-Za-z0-9_]+\.(sql\|ts\|js)` | `MIG_20250127_AddUsersTable.sql` | `migrations/` |
| INFRA | `INFRA_\d{2,3}_[A-Za-z0-9_]+\.(tf\|yaml\|yml\|json)` | `INFRA_01_CloudConfig.tf` | `infrastructure/` |

### Location Rules

- **Files in `canon/` directory** MUST follow Canon patterns
- **Files with Canon patterns outside `canon/`** are flagged for relocation
- **Canon pages** should be in `canon-pages/` or `apps/web/canon-pages/`
- **Canon components** should be in `packages/ui/canon/`

---

## Adding New Patterns

### Adding New Framework Patterns

To add support for new framework conventions:

1. **Add pattern** to appropriate `FRAMEWORK_PATTERNS` array
2. **Update `isFrameworkFile()`** if location-specific logic is needed
3. **Update reason message** in `validateFile()` for better error messages

**Example:**
```typescript
nextjsAppRouter: [
  /^new-convention\.tsx?$/,  // Add new pattern
],
```

### Adding New Canon Patterns

To add support for new Canon code types:

1. **Add pattern** to `CANON_PATTERNS` object
2. **Update recommendation logic** in `validateFile()` if needed

**Example:**
```typescript
CANON_PATTERNS: {
  NEW_TYPE: /^NEW_\d{3}_[A-Za-z0-9_]+\.(ts|md)$/,
}
```

---

## Common Issues & Fixes

### 1. "File in Canon directory must follow Canon naming pattern"

**Problem:** File in `canon/` directory doesn't match Canon pattern.

**Solution:** Rename file to match appropriate Canon pattern (TOOL_XX, REF_XXX, etc.)

**Example:**
```
❌ canon/E-Knowledge/E-REF/DeveloperGuide.md
✅ canon/E-Knowledge/E-REF/REF_013_TOOL18_DeveloperGuide.md
```

### 2. "Canon file but outside canon/ directory"

**Problem:** File has Canon pattern but is in wrong location.

**Solution:** Move file to appropriate `canon/` subdirectory.

**Example:**
```
❌ src/TOOL_18_ValidateCanonCompliance.ts
✅ canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
```

### 3. False Positives for Valid Utilities

**Problem:** Valid utility file flagged as UNKNOWN.

**Solution:** Add pattern to `genericUtilities` array if it's a common utility pattern.

**Example:**
```typescript
genericUtilities: [
  /^newUtility\.tsx?$/,  // Add common utility pattern
],
```

### 4. Windows Path Issues

**Problem:** Path normalization not working correctly.

**Solution:** All paths are normalized automatically. If issues persist:
- Ensure `relative()` is used consistently
- Check that `normalizedPath` is used for all comparisons

---

## Testing & Debugging

### Running Validation

```bash
# Via npm script
npm run canon:validate-compliance

# Direct execution
npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
```

### Debugging Specific Files

To debug specific files:

1. Add `console.log()` in `validateFile()` before return statements
2. Check `normalizedPath` vs `relativePath` to identify path normalization issues
3. Verify pattern matching with regex testers

**Example Debug Code:**
```typescript
function validateFile(filepath: string): FileValidation {
  const filename = basename(filepath);
  const relativePath = relative(ROOT, filepath);
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Debug logging
  console.log('Validating:', {
    filename,
    relativePath,
    normalizedPath,
    isFramework: isFrameworkFile(filepath, filename),
    canonCheck: isCanonFile(filename),
  });
  
  // ... rest of validation
}
```

---

## Performance Considerations

This tool scans all files in key directories:
- `canon/`
- `src/`
- `apps/`
- `packages/`

### Optimization Strategies

For large codebases, consider:

1. **More specific directory exclusions**
   - Add patterns to skip build artifacts earlier
   - Exclude test directories if not needed

2. **File type filtering earlier in scan**
   - Only process relevant file extensions
   - Skip binary files

3. **Caching results for unchanged files**
   - Use file modification times
   - Cache validation results

4. **Parallel processing**
   - Process directories in parallel
   - Use worker threads for large codebases

---

## Next.js 16 Best Practices

### Middleware → Proxy Migration

**Next.js 16** deprecated `middleware.ts` in favor of `proxy.ts` for clarity.

#### ✅ PREFERRED: Use proxy.ts

- **File:** `proxy.ts` (or `proxy.tsx`)
- **Location:** Project root (same level as `app/` or `pages/`)
- **Purpose:** Run code before request completion (auth, redirects, rewrites)

#### ⚠️ DEPRECATED: middleware.ts

- **File:** `middleware.ts` (or `middleware.tsx`)
- **Migration:** `npx @next/codemod@canary middleware-to-proxy .`
- **Status:** TOOL_18 recognizes both patterns but recommends `proxy.ts`

### New File Conventions (Next.js 16+)

- `forbidden.tsx` - Handle 403 Forbidden errors
- `unauthorized.tsx` - Handle 401 Unauthorized errors
- `instrumentation.ts` - Server-side instrumentation
- `instrumentation-client.ts` - Client-side instrumentation
- `mdx-components.tsx` - MDX component configuration

These are automatically recognized by TOOL_18 when in `app/` directory.

---

## Next.js Workflow Best Practices

### Workflow Checkpoints & Documentation

When stopping work on Next.js files, document:

#### 1. Current State Summary
- Which files were modified (`app/**/page.tsx`, `route.ts`, `*.actions.ts`)
- What Canon codes are involved (`PAGE_XXX`, `COMP_XXX`, etc.)
- Which routes/pages were affected

#### 2. Next Steps Checklist
- [ ] Run validation: `npm run canon:validate-compliance`
- [ ] Verify thin wrapper pattern (`app/**/page.tsx` → `canon-pages/`)
- [ ] Check Server Actions are in `*.actions.ts` files
- [ ] Ensure route handlers follow security patterns (ADR_002)
- [ ] Update registry YAML if new pages/components added

#### 3. Consistency Markers
- **File naming:** Framework files use Next.js conventions, Canon files use Canon patterns
- **Location:** `app/` for routes, `canon-pages/` for business logic
- **Exports:** `PAGE_META` for pages, `COMPONENT_META` for components

### Thin Wrapper Pattern (ADR_001)

#### ✅ CORRECT:
```
app/canon/page.tsx (thin wrapper)
  → imports from canon-pages/META/META_02_CanonLandingPage.tsx
  → re-exports metadata
```

#### ❌ AVOID:
- Business logic in `app/**/page.tsx`
- Canon codes in `app/` directory filenames
- Mixing framework routing with Canon governance

### File Organization Best Practices

#### 1. Next.js Routes (app/ directory)
- Use default Next.js naming: `page.tsx`, `layout.tsx`, `route.ts`
- Keep thin - only routing and metadata re-exports
- Import from `canon-pages/` for actual implementation

#### 2. Canon Pages (canon-pages/ directory)
- Use Canon naming: `PAGE_XXX_Description.tsx`
- Export `PAGE_META` constant
- Contains all business logic

#### 3. Server Actions (*.actions.ts)
- Co-locate with page: `META_02_CanonLandingPage.actions.ts`
- Use `'use server'` directive
- Follow security patterns from ADR_002

#### 4. Route Handlers (app/api/**/route.ts)
- Use default Next.js naming: `route.ts`
- Act as BFF layer (per ADR_001)
- Always verify CanonContext server-side (ADR_002)

### Continuing Work - Avoiding Drift

When resuming work:

#### 1. Check Current State
- Run: `npm run canon:validate-compliance`
- Review any validation errors
- Check git status for uncommitted changes

#### 2. Verify Patterns
- Are new files following thin wrapper pattern?
- Are Server Actions in `*.actions.ts` files?
- Are Canon codes exported correctly?

#### 3. Update Documentation
- Update registry YAML if new pages/components
- Document any new patterns or conventions
- Update ADR if architectural decisions changed

#### 4. Validation Before Commit
- Run: `npm run canon:validate-compliance`
- Fix any INVALID file errors
- Review UNKNOWN files (may need Canon IDs)

### Common Drift Patterns to Watch

#### 1. Business Logic in app/**/page.tsx
**Fix:** Move to `canon-pages/` and import

#### 2. Canon Codes in app/ Directory
**Fix:** `app/**/page.tsx` should NOT have Canon codes in filename. Canon codes belong in `canon-pages/` directory.

#### 3. Missing PAGE_META Exports
**Fix:** All Canon pages must export `PAGE_META` constant

#### 4. Server Actions Not in *.actions.ts
**Fix:** Server Actions must be in separate `*.actions.ts` files. Use `'use server'` directive.

#### 5. Route Handlers Without Security Checks
**Fix:** Always verify CanonContext server-side (ADR_002). Never trust client-provided CanonContext.

### Validation as Continuity Check

Run this tool regularly to catch drift:
- Before starting new features
- After major refactoring
- Before creating PRs
- In CI/CD pipeline

The tool will catch:
- Files that should have Canon IDs but don't
- Canon files in wrong locations
- Framework files using incorrect naming
- Missing or incorrect patterns

### Remarking Work Sessions

When documenting where work stopped, include:

```markdown
## Work Session Summary

**Date:** YYYY-MM-DD
**Files Modified:**
- app/canon/page.tsx (thin wrapper for META_02)
- canon-pages/META/META_02_CanonLandingPage.tsx (business logic)

**Canon Codes Involved:**
- PAGE_META_02 (Canon Landing Page)

**Validation Status:**
- ✅ All files pass validation
- ✅ Thin wrapper pattern maintained
- ✅ PAGE_META exported correctly

**Next Steps:**
- [ ] Add route handler for META_02 API
- [ ] Update registry YAML
- [ ] Add Server Actions if needed
```

This ensures:
- Clear context for next developer/AI
- Validation status is known
- Patterns are documented
- Continuity is maintained

---

## Related Documentation

- **CONT_01:** Canon Identity Contract (Section 3.7 - Framework Files)
- **ADR_001:** Next.js App Router Adoption
- **ADR_002:** Canon Security (Server-Side Verification)
- **REF_011:** TOOL_18 Next.js Best Practices Plan
- **REF_012:** TOOL_18 Implementation Summary

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial documentation extracted from TOOL_18 developer notes |
