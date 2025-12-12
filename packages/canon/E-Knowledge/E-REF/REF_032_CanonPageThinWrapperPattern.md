# REF_032: Canon Page Thin Wrapper Pattern

**Date:** 2025-01-27  
**Status:** Active Standard  
**Purpose:** Maintainable, scalable thin wrapper pattern for Canon pages in Next.js App Router  
**Related:** REF_026_CANON_PAGE_MIGRATION_PLAN.md, ADR_001_NextJsAppRouter.md

---

## Overview

This document defines the **production-ready thin wrapper pattern** for Canon pages in Next.js App Router. Focus is on **maintainability and scalability**, not textbook examples.

**Principle:** Every Canon page follows the same pattern, making the system:
- ✅ **Maintainable:** One place to change (CanonPageShell)
- ✅ **Scalable:** Template-based generation
- ✅ **Auditable:** Registry-driven indexing
- ✅ **Type-safe:** Shared contracts

---

## Target Structure

```
canon-pages/
├── META/
│   ├── META_01_MetadataArchitecture.mdx
│   ├── META_02_MetadataGodView.mdx
│   └── ...
├── PAY/
│   ├── PAY_01_PaymentHub.mdx
│   └── ...
├── REG/
│   ├── REG_01_Login.mdx
│   └── ...
├── SYS/
│   ├── SYS_01_Bootloader.mdx
│   └── ...
└── INV/
    └── INV_01_Dashboard.mdx

app/
└── canon/
    ├── meta/
    │   ├── meta-01-metadata-architecture/
    │   │   └── page.tsx  # Thin wrapper
    │   └── ...
    ├── pay/
    │   ├── pay-01-payment-hub/
    │   │   └── page.tsx  # Thin wrapper
    │   └── ...
    └── ...
```

**Key Points:**
- **MDX files** in `canon-pages/{DOMAIN}/` contain all content
- **Route files** in `app/canon/{domain}/{slug}/page.tsx` are thin wrappers
- **URL slugs** are kebab-case versions of Canon IDs (e.g., `META_01` → `meta-01-metadata-architecture`)

---

## Core Components

### 1. CanonPageShell (Shared Shell)

**Location:** `app/components/canon/CanonPageShell.tsx`

**Purpose:** Single shell component used by all Canon pages. Change once, affects all.

**Features:**
- Canon ID and domain display
- Consistent header/breadcrumb
- Content area
- Metadata integration
- Type-safe props

**Maintenance Benefit:** Update styling/layout in one place.

---

### 2. Canon Page Registry

**Location:** `canon/registry/canon-pages.ts`

**Purpose:** Central registry of all Canon pages for:
- Navigation/indexing
- Type generation
- Route validation
- God View integration

**Maintenance Benefit:** Single source of truth for all Canon pages.

---

### 3. Template Generator Helper

**Location:** `canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts`

**Purpose:** Generate thin wrapper files from registry.

**Maintenance Benefit:** Automated generation prevents drift.

---

## Implementation

### CanonPageShell Component

```tsx
// app/components/canon/CanonPageShell.tsx
import type { ReactNode } from 'react';
import type { CanonPageInfo } from '@/canon/registry/canon-pages';

interface CanonPageShellProps {
  /** Canon page information from registry */
  pageInfo: CanonPageInfo;
  /** Page content (MDX component) */
  children: ReactNode;
  /** Optional custom header content */
  headerContent?: ReactNode;
}

/**
 * Shared shell component for all Canon pages.
 * 
 * Maintainability: Update styling/layout here, affects all Canon pages.
 * Scalability: Registry-driven, no hardcoded values.
 */
export function CanonPageShell({
  pageInfo,
  children,
  headerContent,
}: CanonPageShellProps) {
  const { canonId, domain, title, description, version } = pageInfo;

  return (
    <main className="flex min-h-screen flex-col bg-nexus-void">
      {/* Header */}
      <header className="border-b border-nexus-border/50 bg-nexus-surface/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          {/* Canon ID Badge */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-nexus-signal/70">
              {domain}
            </span>
            <span className="text-xs text-nexus-signal/50">·</span>
            <span className="text-xs font-mono text-nexus-green/80">
              {canonId}
            </span>
            {version && (
              <>
                <span className="text-xs text-nexus-signal/50">·</span>
                <span className="text-xs text-nexus-signal/60">v{version}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-nexus-signal">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="mt-2 text-sm text-nexus-signal/80">{description}</p>
          )}

          {/* Custom header content */}
          {headerContent}
        </div>
      </header>

      {/* Content Area */}
      <section className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </section>
    </main>
  );
}
```

**Maintenance Benefits:**
- Single component to update
- Type-safe via registry
- Consistent styling
- Easy to extend

---

### Canon Page Registry

```typescript
// canon/registry/canon-pages.ts
/**
 * Canon Page Registry
 * 
 * Single source of truth for all Canon pages.
 * Used for:
 * - Type generation
 * - Route validation
 * - Navigation/indexing
 * - Thin wrapper generation
 */

export interface CanonPageInfo {
  /** Canon ID (e.g., "META_01") */
  canonId: string;
  /** Domain (e.g., "META") */
  domain: string;
  /** Human-readable title */
  title: string;
  /** Short description for metadata */
  description: string;
  /** Version (optional) */
  version?: string;
  /** Route slug (kebab-case) */
  slug: string;
  /** Full route path */
  route: string;
  /** MDX file path (relative to canon-pages/) */
  mdxPath: string;
}

/**
 * Registry of all Canon pages.
 * 
 * Maintenance: Add new pages here, then run TOOL_24 to generate wrappers.
 */
export const CANON_PAGES: Record<string, CanonPageInfo> = {
  META_01: {
    canonId: 'META_01',
    domain: 'META',
    title: 'The Forensic Metadata Architecture',
    description:
      'Defines the group-level metadata OS, depth limits, and governance model across all domains.',
    version: '1.0.0',
    slug: 'meta-01-metadata-architecture',
    route: '/canon/meta/meta-01-metadata-architecture',
    mdxPath: 'META/META_01_MetadataArchitecture.mdx',
  },
  META_02: {
    canonId: 'META_02',
    domain: 'META',
    title: 'Metadata God View',
    description: 'Central registry and navigation hub for all Canon pages.',
    version: '1.0.0',
    slug: 'meta-02-metadata-god-view',
    route: '/canon/meta/meta-02-metadata-god-view',
    mdxPath: 'META/META_02_MetadataGodView.mdx',
  },
  // ... more pages
  PAY_01: {
    canonId: 'PAY_01',
    domain: 'PAY',
    title: 'Payment Hub Canon',
    description:
      'Defines the compliant, cell-based payment flow canon including invoice, tax, approval, and treasury cells.',
    version: '1.0.0',
    slug: 'pay-01-payment-hub',
    route: '/canon/pay/pay-01-payment-hub',
    mdxPath: 'PAY/PAY_01_PaymentHub.mdx',
  },
  // ... more pages
} as const;

/**
 * Get page info by Canon ID
 */
export function getCanonPageInfo(canonId: string): CanonPageInfo | undefined {
  return CANON_PAGES[canonId];
}

/**
 * Get all pages for a domain
 */
export function getPagesByDomain(domain: string): CanonPageInfo[] {
  return Object.values(CANON_PAGES).filter((page) => page.domain === domain);
}

/**
 * Get all pages (for indexing/navigation)
 */
export function getAllCanonPages(): CanonPageInfo[] {
  return Object.values(CANON_PAGES);
}
```

**Maintenance Benefits:**
- Single source of truth
- Type-safe
- Easy to query
- Enables automation

---

### Thin Wrapper Template

```tsx
// app/canon/{domain}/{slug}/page.tsx
// Generated by TOOL_24 from registry

import type { Metadata } from 'next';
import { CanonPageShell } from '@/app/components/canon/CanonPageShell';
import { getCanonPageInfo } from '@/canon/registry/canon-pages';

// Dynamic import of MDX content
import CanonContent from '@/canon-pages/{MDX_PATH}';

// Get page info from registry
const pageInfo = getCanonPageInfo('{CANON_ID}');
if (!pageInfo) {
  throw new Error(`Canon page {CANON_ID} not found in registry`);
}

// Generate metadata from registry
export const metadata: Metadata = {
  title: `${pageInfo.canonId} – ${pageInfo.title}`,
  description: pageInfo.description,
};

// Thin wrapper - no business logic
export default function CanonPage() {
  return (
    <CanonPageShell pageInfo={pageInfo}>
      <CanonContent />
    </CanonPageShell>
  );
}
```

**Maintenance Benefits:**
- Consistent pattern
- Registry-driven (no hardcoded values)
- Type-safe
- Easy to generate

---

## MDX Configuration

### MDX Components (Global)

```tsx
// mdx-components.tsx (at project root)
import type { MDXComponents } from 'mdx/types';
import { CanonLink } from '@/app/components/canon/CanonLink';
import { CanonCodeBlock } from '@/app/components/canon/CanonCodeBlock';

/**
 * Global MDX components for all Canon pages.
 * 
 * Maintenance: Add shared components here.
 */
const components: MDXComponents = {
  // Custom link component for Canon references
  a: ({ href, children, ...props }) => {
    if (href?.startsWith('/canon/')) {
      return <CanonLink href={href}>{children}</CanonLink>;
    }
    return <a href={href} {...props}>{children}</a>;
  },
  
  // Code blocks with syntax highlighting
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return <code className="px-1 py-0.5 rounded bg-nexus-surface" {...props}>{children}</code>;
    }
    return <CanonCodeBlock className={className} {...props}>{children}</CanonCodeBlock>;
  },
  
  // Headings with anchor links
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4 text-nexus-signal" id={slugify(children)}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3 text-nexus-signal" id={slugify(children)}>
      {children}
    </h2>
  ),
  // ... more heading styles
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
```

**Maintenance Benefits:**
- Global styling for all MDX
- Consistent components
- Easy to extend

---

## Template Generator Tool

```typescript
// canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts
/**
 * TOOL_24: Generate Canon Page Wrappers
 * 
 * Generates thin wrapper files from canon-pages registry.
 * Ensures consistency and prevents drift.
 * 
 * Usage:
 *   npx tsx canon/D-Operations/D-TOOL/TOOL_24_GenerateCanonPageWrapper.ts
 */

import { CANON_PAGES } from '@/canon/registry/canon-pages';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

function generateWrapper(pageInfo: CanonPageInfo): string {
  return `// app/canon/${pageInfo.domain.toLowerCase()}/${pageInfo.slug}/page.tsx
// Auto-generated by TOOL_24 - DO NOT EDIT MANUALLY
// Source: canon/registry/canon-pages.ts

import type { Metadata } from 'next';
import { CanonPageShell } from '@/app/components/canon/CanonPageShell';
import { getCanonPageInfo } from '@/canon/registry/canon-pages';
import CanonContent from '@/canon-pages/${pageInfo.mdxPath}';

const pageInfo = getCanonPageInfo('${pageInfo.canonId}');
if (!pageInfo) {
  throw new Error(\`Canon page ${pageInfo.canonId} not found in registry\`);
}

export const metadata: Metadata = {
  title: \`\${pageInfo.canonId} – \${pageInfo.title}\`,
  description: pageInfo.description,
};

export default function CanonPage() {
  return (
    <CanonPageShell pageInfo={pageInfo}>
      <CanonContent />
    </CanonPageShell>
  );
}
`;
}

async function main() {
  console.log('🚀 TOOL_24: Generate Canon Page Wrappers\n');
  
  for (const [canonId, pageInfo] of Object.entries(CANON_PAGES)) {
    const wrapperPath = join(
      process.cwd(),
      'app',
      'canon',
      pageInfo.domain.toLowerCase(),
      pageInfo.slug,
      'page.tsx'
    );
    
    // Create directory
    mkdirSync(dirname(wrapperPath), { recursive: true });
    
    // Generate wrapper
    const content = generateWrapper(pageInfo);
    writeFileSync(wrapperPath, content, 'utf-8');
    
    console.log(`✅ Generated: ${wrapperPath}`);
  }
  
  console.log(`\n✨ Generated ${Object.keys(CANON_PAGES).length} wrapper files`);
}

main().catch(console.error);
```

**Maintenance Benefits:**
- Automated generation
- Prevents drift
- Consistent pattern
- Easy to regenerate

---

## Migration Workflow

### For Each Batch (Per REF_026)

1. **Convert TSX to MDX:**
   - Move content from `src/pages/META_01_*.tsx` to `canon-pages/META/META_01_*.mdx`
   - Extract business logic, keep only content

2. **Add to Registry:**
   - Add entry to `canon/registry/canon-pages.ts`
   - Include all required fields

3. **Generate Wrapper:**
   - Run `TOOL_24_GenerateCanonPageWrapper.ts`
   - Or manually create using template

4. **Update Imports:**
   - Update any files that import old paths
   - Update navigation/routing

5. **Validate:**
   - Run TOOL_18
   - Test route in browser
   - Verify metadata

---

## Scalability Features

### 1. Registry-Driven

**Benefit:** Add new pages by updating registry, then regenerate wrappers.

**Example:**
```typescript
// Add to registry
META_09: {
  canonId: 'META_09',
  domain: 'META',
  title: 'New Metadata Page',
  description: '...',
  slug: 'meta-09-new-page',
  route: '/canon/meta/meta-09-new-page',
  mdxPath: 'META/META_09_NewPage.mdx',
},

// Run TOOL_24 → wrapper generated automatically
```

### 2. Type Generation

**Benefit:** TypeScript types generated from registry.

```typescript
// Generated types
type CanonPageId = 'META_01' | 'META_02' | 'PAY_01' | ...;
type CanonDomain = 'META' | 'PAY' | 'REG' | 'SYS' | 'INV';
```

### 3. Navigation/Indexing

**Benefit:** Registry enables automatic navigation generation.

```typescript
// Generate navigation from registry
export function generateCanonNavigation() {
  const pages = getAllCanonPages();
  return pages.map(page => ({
    label: page.title,
    href: page.route,
    domain: page.domain,
  }));
}
```

---

## Maintenance Checklist

### When Adding New Canon Page

1. [ ] Create MDX file in `canon-pages/{DOMAIN}/`
2. [ ] Add entry to `canon/registry/canon-pages.ts`
3. [ ] Run `TOOL_24` to generate wrapper
4. [ ] Verify route works
5. [ ] Update navigation (if needed)

### When Updating Shell

1. [ ] Update `CanonPageShell.tsx`
2. [ ] All Canon pages automatically updated
3. [ ] Test a few pages to verify

### When Updating MDX Components

1. [ ] Update `mdx-components.tsx`
2. [ ] All MDX files automatically updated
3. [ ] Test rendering

---

## Examples

### Example 1: META_01

**Registry Entry:**
```typescript
META_01: {
  canonId: 'META_01',
  domain: 'META',
  title: 'The Forensic Metadata Architecture',
  description: 'Defines the group-level metadata OS...',
  slug: 'meta-01-metadata-architecture',
  route: '/canon/meta/meta-01-metadata-architecture',
  mdxPath: 'META/META_01_MetadataArchitecture.mdx',
}
```

**Generated Wrapper:**
```tsx
// app/canon/meta/meta-01-metadata-architecture/page.tsx
import type { Metadata } from 'next';
import { CanonPageShell } from '@/app/components/canon/CanonPageShell';
import { getCanonPageInfo } from '@/canon/registry/canon-pages';
import CanonContent from '@/canon-pages/META/META_01_MetadataArchitecture.mdx';

const pageInfo = getCanonPageInfo('META_01');
if (!pageInfo) {
  throw new Error('Canon page META_01 not found in registry');
}

export const metadata: Metadata = {
  title: `${pageInfo.canonId} – ${pageInfo.title}`,
  description: pageInfo.description,
};

export default function CanonPage() {
  return (
    <CanonPageShell pageInfo={pageInfo}>
      <CanonContent />
    </CanonPageShell>
  );
}
```

### Example 2: PAY_01

**Registry Entry:**
```typescript
PAY_01: {
  canonId: 'PAY_01',
  domain: 'PAY',
  title: 'Payment Hub Canon',
  description: 'Defines the compliant, cell-based payment flow...',
  slug: 'pay-01-payment-hub',
  route: '/canon/pay/pay-01-payment-hub',
  mdxPath: 'PAY/PAY_01_PaymentHub.mdx',
}
```

**Generated Wrapper:** (Same pattern, different values)

---

## Benefits Summary

### Maintainability

- **Single Shell:** Update `CanonPageShell` once, affects all pages
- **Single Registry:** All page info in one place
- **Consistent Pattern:** Every wrapper follows same structure
- **Type-Safe:** TypeScript ensures correctness

### Scalability

- **Automated Generation:** TOOL_24 generates wrappers
- **Registry-Driven:** Add pages by updating registry
- **Easy Indexing:** Registry enables navigation generation
- **No Hardcoding:** All values come from registry

### Auditability

- **Clear Separation:** Content (MDX) vs. Routing (Next.js)
- **Registry as SSOT:** Single source of truth
- **Generated Files:** Can regenerate from registry
- **Type Safety:** Prevents errors

---

## Next.js MDX Configuration

### Required Setup

**1. Install Dependencies:**
```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

**2. Configure next.config.js:**
```js
import createMDX from '@next/mdx'

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({})
export default withMDX(nextConfig)
```

**3. MDX Components File:**
- Location: `mdx-components.tsx` at project root (already created)
- Required by `@next/mdx` for App Router

**4. Path Aliases (tsconfig.json):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/canon/*": ["./canon/*"],
      "@/canon-pages/*": ["./canon-pages/*"],
      "@/app/*": ["./app/*"]
    }
  }
}
```

---

## Related Documentation

- **REF_026:** Canon Pages Migration Plan
- **REF_033:** Canon Page Implementation Guide
- **REF_034:** Canon Page System Summary
- **REF_035:** Canon Page Implementation Roadmap
- **ADR_001:** Next.js App Router Adoption
- **CONT_01:** Canon Identity Contract
- **REF_028:** Canon Refactor DOD

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial thin wrapper pattern defined |
