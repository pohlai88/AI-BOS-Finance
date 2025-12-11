# REF_033: Canon Page Implementation Guide

**Date:** 2025-01-27  
**Status:** Active Implementation Guide  
**Purpose:** Step-by-step guide for implementing Canon pages using thin wrapper pattern  
**Related:** REF_032_CanonPageThinWrapperPattern.md, REF_026_CANON_PAGE_MIGRATION_PLAN.md

---

## Overview

This guide provides **concrete implementation steps** for creating Canon pages using the thin wrapper pattern. Focus is on **maintainability and scalability**, not textbook examples.

**Pattern:** Registry → MDX → Wrapper → Route

---

## Implementation Steps

### Step 1: Add Page to Registry

**File:** `canon/registry/canon-pages.ts`

```typescript
META_09: {
  canonId: 'META_09',
  domain: 'META',
  title: 'New Metadata Page',
  description: 'Description for SEO and metadata',
  version: '1.0.0',
  slug: 'meta-09-new-page',
  route: '/canon/meta/meta-09-new-page',
  mdxPath: 'META/META_09_NewPage.mdx',
  classification: 'PUBLIC',
},
```

**Why:** Registry is single source of truth. All other files derive from this.

---

### Step 2: Create MDX File

**Location:** `canon-pages/META/META_09_NewPage.mdx`

```mdx
# New Metadata Page

This is the content for META_09.

## Section 1

Content here...

## Section 2

More content...
```

**Why:** Content lives in MDX, not in route files. Enables:
- Version control
- Easy editing
- Content reuse
- Framework independence

---

### Step 3: Generate Wrapper

**Command:**
```bash
npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute
```

**Output:** `app/canon/meta/meta-09-new-page/page.tsx`

**Why:** Automated generation ensures:
- Consistency
- No drift
- Type safety
- Easy regeneration

---

### Step 4: Verify Route

**Test:**
1. Start dev server: `npm run dev`
2. Navigate to: `/canon/meta/meta-09-new-page`
3. Verify page loads
4. Check metadata (view source)

**Why:** Manual verification catches issues early.

---

## Migration Workflow (Phase 3)

### For Each Batch (META, REG, SYS, PAY, INV)

#### 1. Convert TSX to MDX

**Before:** `src/pages/META_01_MetadataArchitecturePage.tsx`

**After:** `canon-pages/META/META_01_MetadataArchitecture.mdx`

**Process:**
- Extract content (text, headings, lists)
- Keep structure
- Remove React components (move to MDX components if needed)
- Remove business logic (move to separate files)

**Example:**
```tsx
// BEFORE: src/pages/META_01_MetadataArchitecturePage.tsx
export function Meta01Page() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content...</p>
      <ComplexComponent /> {/* Move to MDX component */}
    </div>
  );
}
```

```mdx
# BEFORE: canon-pages/META/META_01_MetadataArchitecture.mdx
# Title

Content...

<ComplexComponent /> {/* Use as MDX component */}
```

#### 2. Add to Registry

Add entry to `canon/registry/canon-pages.ts`:

```typescript
META_01: {
  canonId: 'META_01',
  domain: 'META',
  title: 'The Forensic Metadata Architecture',
  description: 'Defines the group-level metadata OS...',
  slug: 'meta-01-metadata-architecture',
  route: '/canon/meta/meta-01-metadata-architecture',
  mdxPath: 'META/META_01_MetadataArchitecture.mdx',
  classification: 'PUBLIC',
},
```

#### 3. Generate Wrapper

```bash
npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute
```

#### 4. Update Imports

**Find old imports:**
```bash
grep -r "from.*src/pages/META_01" .
grep -r "META_01_MetadataArchitecturePage" .
```

**Update to:**
```typescript
// Old
import { META_01_MetadataArchitecturePage } from '@/src/pages/META_01_MetadataArchitecturePage';

// New
import { navigate } from '@/lib/navigation';
navigate('/canon/meta/meta-01-metadata-architecture');
```

#### 5. Validate

```bash
# Run validations
npx tsx canon/D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts
npm run typecheck
npm run build
npm run dev  # Manual test
```

---

## Maintenance Patterns

### Adding New Canon Page

1. **Create MDX:** `canon-pages/{DOMAIN}/{CANON_ID}_{Title}.mdx`
2. **Add to Registry:** `canon/registry/canon-pages.ts`
3. **Generate Wrapper:** Run TOOL_24
4. **Test Route:** Verify in browser
5. **Update Navigation:** If needed

**Time:** ~5 minutes per page

### Updating Shell Styling

1. **Edit:** `app/components/canon/CanonPageShell.tsx`
2. **All pages updated automatically**
3. **Test:** Check a few pages

**Time:** ~2 minutes, affects all pages

### Updating MDX Components

1. **Edit:** `mdx-components.tsx`
2. **All MDX files updated automatically**
3. **Test:** Check rendering

**Time:** ~2 minutes, affects all MDX

### Regenerating Wrappers

**If wrappers drift or registry changes:**

```bash
npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts --execute
```

**Time:** ~10 seconds for all pages

---

## Scalability Features

### 1. Registry-Driven

**Benefit:** Add pages by updating registry, not creating files manually.

**Example:**
```typescript
// Add 10 new pages to registry
// Run TOOL_24 once
// All 10 wrappers generated automatically
```

### 2. Type Safety

**Benefit:** TypeScript ensures correctness.

```typescript
// Type-safe page lookup
const pageInfo = getCanonPageInfo('META_01');
// pageInfo is CanonPageInfo | undefined

// Type-safe domain filtering
const metaPages = getPagesByDomain('META');
// Returns CanonPageInfo[]
```

### 3. Navigation Generation

**Benefit:** Generate navigation from registry.

```typescript
// Generate navigation automatically
export function generateCanonNavigation() {
  return getAllCanonPages().map(page => ({
    label: page.title,
    href: page.route,
    domain: page.domain,
    canonId: page.canonId,
  }));
}
```

### 4. Indexing/God View

**Benefit:** Registry enables automatic indexing.

```typescript
// Generate God View from registry
export function generateGodView() {
  const pages = getAllCanonPages();
  const byDomain = pages.reduce((acc, page) => {
    if (!acc[page.domain]) acc[page.domain] = [];
    acc[page.domain].push(page);
    return acc;
  }, {} as Record<string, CanonPageInfo[]>);
  
  return byDomain;
}
```

---

## Common Patterns

### Pattern 1: Simple Content Page

**Use Case:** Documentation, guides, references

**Steps:**
1. Create MDX with content
2. Add to registry
3. Generate wrapper
4. Done

**Time:** 5 minutes

### Pattern 2: Interactive Page

**Use Case:** Pages with React components

**Steps:**
1. Create MDX
2. Add React components to `mdx-components.tsx` (if shared)
3. Use components in MDX: `<MyComponent />`
4. Add to registry
5. Generate wrapper

**Time:** 10 minutes

### Pattern 3: Page with Server Data

**Use Case:** Pages that fetch data

**Steps:**
1. Create MDX
2. Create Server Component wrapper (if needed)
3. Add to registry
4. Generate wrapper (may need manual customization)

**Time:** 15 minutes

---

## Troubleshooting

### MDX File Not Found

**Error:** `Cannot find module '@/canon-pages/META/META_01_MetadataArchitecture.mdx'`

**Fix:**
1. Verify MDX file exists at path
2. Check `mdxPath` in registry matches actual file
3. Ensure `@next/mdx` is configured in `next.config.js`

### Wrapper Not Generated

**Error:** TOOL_24 doesn't generate wrapper

**Fix:**
1. Check registry entry is correct
2. Verify `mdxPath` is correct
3. Check file permissions
4. Run with `--execute` flag

### Route Not Working

**Error:** 404 on route

**Fix:**
1. Verify wrapper file exists: `app/canon/{domain}/{slug}/page.tsx`
2. Check route matches registry `route` field
3. Verify Next.js dev server is running
4. Check for typos in slug

### Styling Not Applied

**Error:** MDX content not styled

**Fix:**
1. Verify `mdx-components.tsx` exists at root
2. Check `@next/mdx` is configured
3. Verify components are exported correctly
4. Check Tailwind classes (if using)

---

## Best Practices

### 1. Keep MDX Content Pure

**Do:**
- Use markdown for content
- Use MDX components for interactivity
- Keep business logic separate

**Don't:**
- Put complex React logic in MDX
- Mix routing with content
- Hardcode values in MDX

### 2. Use Registry as SSOT

**Do:**
- Update registry first
- Generate from registry
- Query registry for navigation

**Don't:**
- Hardcode page info in wrappers
- Duplicate page info
- Manually create wrappers

### 3. Maintain Consistency

**Do:**
- Use TOOL_24 for all wrappers
- Follow naming conventions
- Keep MDX structure consistent

**Don't:**
- Create wrappers manually
- Skip registry
- Inconsistent naming

---

## Related Documentation

- **REF_032:** Canon Page Thin Wrapper Pattern
- **REF_026:** Canon Pages Migration Plan
- **REF_028:** Canon Refactor DOD
- **ADR_001:** Next.js App Router Adoption

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial implementation guide created |
