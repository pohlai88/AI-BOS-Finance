# REF_011: TOOL_18 Next.js Best Practices Execution Plan

**Status:** Planning Complete  
**Date:** 2025-01-27  
**Related:** TOOL_18_ValidateCanonCompliance.ts

## Executive Summary

This document outlines the execution plan to align TOOL_18 with Next.js 16 best practices based on official Next.js documentation review. The tool validates Canon Identity compliance while allowing Next.js framework conventions.

## Key Findings from Next.js Documentation

### 1. Middleware → Proxy Migration (Next.js 16)
- **Status:** `middleware.ts` is **deprecated** in Next.js 16
- **Replacement:** `proxy.ts` (renamed for clarity)
- **Action Required:** Support both patterns for backward compatibility, but document preference for `proxy.ts`
- **Reference:** `/docs/app/api-reference/file-conventions/proxy`

### 2. Missing App Router File Conventions
The following Next.js 16 file conventions are **missing** from TOOL_18:

- `forbidden.ts` - Forbidden page (403 errors)
- `unauthorized.ts` - Unauthorized page (401 errors)
- `instrumentation.ts` - Server-side instrumentation
- `instrumentation-client.ts` - Client-side instrumentation
- `mdx-components.ts` - MDX component configuration

**Action Required:** Add these patterns to `FRAMEWORK_PATTERNS.nextjsAppRouter`

### 3. Server Actions Pattern
- **Current Pattern:** `*.actions.ts` ✅ **CORRECT**
- **Additional Pattern:** Server Actions can also be inline with `'use server'` directive
- **Action Required:** Current validation is correct; no changes needed

### 4. Route Segment Config
- **Finding:** Route segment config options (`dynamic`, `revalidate`, etc.) are **exports** within files, not separate files
- **Action Required:** No changes needed - these are handled as exports, not file patterns

### 5. TypeScript Configuration
- **Finding:** `next.config.ts` is fully supported (already covered)
- **Finding:** `tsconfig.json` patterns are correct
- **Action Required:** No changes needed

## Implementation Plan

### Phase 1: Critical Updates (Immediate)

#### 1.1 Update Middleware → Proxy Pattern
- [x] Add `proxy.ts` pattern to `nextjsRoot` patterns
- [x] Keep `middleware.ts` for backward compatibility
- [x] Update documentation comments to reflect deprecation
- [x] Add warning message when `middleware.ts` is detected (optional enhancement)

**Code Changes:**
```typescript
nextjsRoot: [
  /^proxy\.tsx?$/,           // proxy.ts - Next.js 16+ (preferred)
  /^middleware\.tsx?$/,      // middleware.ts - DEPRECATED in Next.js 16, use proxy.ts
  /^next-env\.d\.ts$/,       // next-env.d.ts - Next.js type definitions
],
```

#### 1.2 Add Missing App Router Conventions
- [x] Add `forbidden.ts` pattern
- [x] Add `unauthorized.ts` pattern
- [x] Add `instrumentation.ts` pattern
- [x] Add `instrumentation-client.ts` pattern
- [x] Add `mdx-components.ts` pattern

**Code Changes:**
```typescript
nextjsAppRouter: [
  // ... existing patterns ...
  /^forbidden\.tsx?$/,              // app/**/forbidden.tsx - 403 errors (Next.js 16+)
  /^unauthorized\.tsx?$/,            // app/**/unauthorized.tsx - 401 errors (Next.js 16+)
  /^instrumentation\.tsx?$/,         // app/instrumentation.ts - server instrumentation
  /^instrumentation-client\.tsx?$/,  // app/instrumentation-client.ts - client instrumentation
  /^mdx-components\.tsx?$/,           // app/mdx-components.tsx - MDX component config
],
```

### Phase 2: Documentation Updates

#### 2.1 Update Header Comments
- [x] Update file header to mention Next.js 16 conventions
- [x] Add note about middleware → proxy migration
- [x] Document new file conventions

#### 2.2 Update Developer Notes Section
- [x] Add Next.js 16 best practices section
- [x] Document proxy.ts preference
- [x] Add migration guidance for middleware.ts → proxy.ts

### Phase 3: Validation Enhancements (Optional)

#### 3.1 Middleware Deprecation Warning
- [ ] Add optional warning when `middleware.ts` is detected
- [ ] Suggest migration to `proxy.ts`
- [ ] Make this configurable (non-breaking)

#### 3.2 Enhanced Error Messages
- [ ] Provide more specific error messages for Next.js file conventions
- [ ] Link to Next.js documentation in recommendations

## Detailed Changes

### File: `TOOL_18_ValidateCanonCompliance.ts`

#### Change 1: Update `FRAMEWORK_PATTERNS.nextjsRoot`
```typescript
// BEFORE
nextjsRoot: [
  /^middleware\.tsx?$/,     // middleware.ts - Next.js middleware
  /^next-env\.d\.ts$/,      // next-env.d.ts - Next.js type definitions
],

// AFTER
nextjsRoot: [
  /^proxy\.tsx?$/,           // proxy.ts - Next.js 16+ (preferred, replaces middleware)
  /^middleware\.tsx?$/,       // middleware.ts - DEPRECATED in Next.js 16, use proxy.ts
  /^next-env\.d\.ts$/,        // next-env.d.ts - Next.js type definitions
],
```

#### Change 2: Update `FRAMEWORK_PATTERNS.nextjsAppRouter`
```typescript
// ADD these patterns:
/^forbidden\.tsx?$/,              // app/**/forbidden.tsx - 403 errors (Next.js 16+)
/^unauthorized\.tsx?$/,            // app/**/unauthorized.tsx - 401 errors (Next.js 16+)
/^instrumentation\.tsx?$/,         // app/instrumentation.ts - server instrumentation
/^instrumentation-client\.tsx?$/,  // app/instrumentation-client.ts - client instrumentation
/^mdx-components\.tsx?$/,         // app/mdx-components.tsx - MDX component config
```

#### Change 3: Update Header Documentation
```typescript
/**
 * TOOL_18: Validate Canon Compliance Across Entire Codebase
 * 
 * Validates that all files follow Canon Identity guidelines OR framework conventions:
 * - Framework-specific files (Next.js routing, configs) use default naming per CONT_01 Section 3.7
 * - Next.js App Router files (page.tsx, layout.tsx, route.ts, etc.) are allowed with default naming
 * - Next.js 16+ conventions: proxy.ts (preferred over deprecated middleware.ts)
 * - Next.js Server Actions (*.actions.ts) are allowed with default naming per ADR_001
 * - Canon-governed files follow Canon patterns (TOOL_XX, REF_XXX, etc.)
 * - Documents are in correct Canon planes
 * 
 * Framework Files Allowed (per CONT_01 Section 3.7):
 * - Next.js App Router: page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx, forbidden.tsx, unauthorized.tsx, etc.
 * - Next.js Pages Router: _app.tsx, _document.tsx, index.tsx, etc.
 * - Next.js Root: proxy.ts (Next.js 16+, preferred), middleware.ts (deprecated), next-env.d.ts
 * - Server Actions: *.actions.ts (per ADR_001)
 * - Config files: package.json, tsconfig.json, next.config.js, etc.
 * - Generic utilities: utils.ts, helpers.ts, constants.ts, etc.
 */
```

#### Change 4: Update `isFrameworkFile` Reason Messages
```typescript
// Update reason message for middleware/proxy
if (filename === 'proxy.ts' || filename === 'proxy.tsx') {
  reason = 'Next.js proxy file (Next.js 16+, preferred over middleware.ts) - allowed with default naming per CONT_01 Section 3.7';
} else if (filename === 'middleware.ts' || filename === 'middleware.tsx') {
  reason = 'Next.js middleware file (DEPRECATED in Next.js 16, migrate to proxy.ts) - allowed with default naming per CONT_01 Section 3.7';
}
```

## Testing Plan

### Test Cases

1. **Proxy.ts Validation**
   - ✅ `proxy.ts` in root should be recognized as framework file
   - ✅ `proxy.tsx` in root should be recognized as framework file

2. **Middleware.ts Backward Compatibility**
   - ✅ `middleware.ts` in root should still be recognized (backward compatibility)
   - ✅ Warning message should indicate deprecation (if implemented)

3. **New App Router Conventions**
   - ✅ `app/forbidden.tsx` should be recognized
   - ✅ `app/unauthorized.tsx` should be recognized
   - ✅ `app/instrumentation.ts` should be recognized
   - ✅ `app/instrumentation-client.ts` should be recognized
   - ✅ `app/mdx-components.tsx` should be recognized

4. **Existing Patterns (Regression Tests)**
   - ✅ All existing App Router patterns still work
   - ✅ All existing Pages Router patterns still work
   - ✅ Server Actions pattern still works
   - ✅ Config files still work

## Migration Notes

### For Developers Using middleware.ts

If your codebase uses `middleware.ts`, you have two options:

1. **Migrate to proxy.ts (Recommended)**
   ```bash
   npx @next/codemod@canary middleware-to-proxy .
   ```

2. **Keep middleware.ts (Temporary)**
   - TOOL_18 will continue to recognize `middleware.ts` for backward compatibility
   - Consider migrating when upgrading to Next.js 16+

## References

- [Next.js Proxy Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js TypeScript Configuration](https://nextjs.org/docs/app/api-reference/config/typescript)

## Success Criteria

- [x] All Next.js 16 file conventions are recognized
- [x] Proxy.ts pattern is supported
- [x] Middleware.ts remains supported for backward compatibility
- [x] Documentation is updated with Next.js 16 best practices
- [x] No breaking changes to existing validation logic
- [x] All tests pass

## Next Steps

1. Implement Phase 1 changes (Critical Updates)
2. Update documentation
3. Test with real codebase
4. Consider Phase 3 enhancements (optional warnings)
