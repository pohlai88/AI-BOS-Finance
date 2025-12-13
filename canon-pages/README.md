# Canon Pages — Documentation Presentation Layer

> **🟢 [ACTIVE]** — Canon Pages Directory  
> **Purpose:** MDX-based presentation layer for Canon documentation  
> **Location:** `canon-pages/`  
> **Related:** `canon/` (source of truth), `app/canon/` (Next.js routes)

---

## 🎯 Overview

The `canon-pages/` directory contains **MDX files** that render Canon documentation as interactive web pages. This is the **presentation layer** that transforms governed documentation from `canon/` into browsable, navigable pages.

**Key Principles:**
- ✅ **MDX Format:** All pages use MDX (Markdown + JSX) for rich content
- ✅ **Domain Organization:** Pages organized by domain (META, PAYMENT, SYSTEM)
- ✅ **Registry-Driven:** All pages registered in `registry.ts` for discovery
- ✅ **Thin Wrapper Pattern:** Next.js routes are thin wrappers around MDX content

---

## 📁 Directory Structure

```
canon-pages/
├── META/                    # Metadata domain pages
│   ├── meta-01-architecture.mdx
│   ├── meta-02-god-view.mdx
│   └── meta-03-the-prism.mdx
├── PAYMENT/                 # Payment domain pages
│   └── pay-01-payment-hub.mdx
├── SYSTEM/                  # System domain pages
│   ├── sys-01-bootloader.mdx
│   └── sys-02-organization.mdx
├── mdx-components.tsx       # Global MDX component overrides
├── registry.ts             # SSOT: Page registry and metadata
└── README.md               # This file
```

---

## 🔗 Relationship to `canon/` Directory

### **`canon/` vs `canon-pages/`**

| Aspect | `canon/` | `canon-pages/` |
|--------|----------|----------------|
| **Purpose** | Source of truth (governance) | Presentation layer (rendering) |
| **Format** | Markdown (`.md`) | MDX (`.mdx`) |
| **Content** | Contracts, ADRs, References | Documentation pages |
| **Organization** | By Canon Planes (A-E) | By Domain (META, PAYMENT, etc.) |
| **SSOT** | ✅ Yes | ❌ No (derived from `canon/`) |

### **Workflow**

```
canon/E-Knowledge/E-REF/REF_075_DesignSystem.md  (Source)
    ↓
canon-pages/META/meta-01-architecture.mdx         (Presentation)
    ↓
app/canon/meta/meta-01-architecture/page.tsx      (Route)
```

**Note:** Not all `canon/` files have corresponding `canon-pages/` entries. Only documentation that needs to be browsable as web pages.

---

## 📋 Registry System

### **`registry.ts` — Single Source of Truth**

The `registry.ts` file is the **SSOT** for all Canon pages. It defines:

1. **Page Metadata:** ID, title, status, version, description
2. **Component Mapping:** Lazy-loaded MDX component imports
3. **Section Configuration:** Domain sections (META, PAYMENT, SYSTEM)
4. **Status Configuration:** Status badges and styling

### **Registry Entry Format**

```typescript
'meta/meta-01-architecture': {
  component: () => import('./META/meta-01-architecture.mdx'),
  meta: {
    id: 'META_01',
    title: 'Metadata Architecture',
    status: 'ACTIVE',
    version: '1.0.0',
    lastUpdated: '2025-12-12',
    description: 'Core metadata architecture and data dictionary design',
  },
}
```

### **Key Registry Functions**

```typescript
// Get page by path
getCanonPage('meta/meta-01-architecture')

// Get all pages for a section
getCanonPagesBySection('meta')

// Get pages by status
getCanonPagesByStatus('ACTIVE')

// Get health score
getHealthScore() // Returns percentage of ACTIVE pages
```

---

## ➕ Adding New Pages

### **Step 1: Create MDX File**

Create a new MDX file in the appropriate domain directory:

```bash
# Example: Adding a new META page
canon-pages/META/meta-04-new-feature.mdx
```

### **Step 2: Write MDX Content**

```mdx
# New Feature Title

This is the content of your Canon page.

## Section 1

Content here...

## Section 2

More content...
```

**MDX Features:**
- ✅ Standard Markdown syntax
- ✅ JSX components (via `mdx-components.tsx`)
- ✅ Code blocks with syntax highlighting
- ✅ Tables, lists, links
- ✅ Custom components (if needed)

### **Step 3: Register in `registry.ts`**

Add entry to `CANON_REGISTRY`:

```typescript
'meta/meta-04-new-feature': {
  component: () => import('./META/meta-04-new-feature.mdx'),
  meta: {
    id: 'META_04',
    title: 'New Feature',
    status: 'DRAFT', // or 'ACTIVE'
    version: '0.1.0',
    lastUpdated: '2025-01-27',
    description: 'Description of the new feature',
  },
}
```

### **Step 4: Create Next.js Route (Optional)**

If you want a custom route (not using catch-all), create:

```tsx
// app/canon/meta/meta-04-new-feature/page.tsx
import { getCanonPage } from '@/canon-pages/registry'
import { CanonPageShell } from '@/app/canon/[...slug]/CanonPageShell'

export default async function Page() {
  const page = getCanonPage('meta/meta-04-new-feature')
  if (!page) return <div>Page not found</div>
  
  const Component = await page.component()
  
  return (
    <CanonPageShell meta={page.meta}>
      <Component.default />
    </CanonPageShell>
  )
}
```

**Note:** The catch-all route (`app/canon/[...slug]/page.tsx`) handles most cases automatically.

---

## 🎨 MDX Components

### **Global Components**

All MDX files automatically use components defined in `mdx-components.tsx`:

- **Headings:** `h1`, `h2`, `h3`, `h4` — with anchor links and consistent styling
- **Links:** Internal (`/canon/...`) vs external (`http://...`) styling
- **Code:** Inline code and code blocks with syntax highlighting
- **Tables:** Styled tables with hover effects
- **Lists:** Styled ordered and unordered lists
- **Blockquotes:** Styled quote blocks
- **Mermaid:** Diagram support (if configured)

### **Customizing Components**

To override components for a specific page:

```tsx
// In your route file
import { MDXComponents } from 'mdx/types'

const customComponents: MDXComponents = {
  h1: ({ children }) => <h1 className="custom-class">{children}</h1>,
}

<MDXContent components={customComponents} />
```

---

## 🗺️ URL Structure

### **Route Mapping**

Canon pages are accessible via Next.js routes:

```
canon-pages/META/meta-01-architecture.mdx
    ↓
app/canon/meta/meta-01-architecture/page.tsx
    ↓
URL: /canon/meta/meta-01-architecture
```

### **Catch-All Route**

The catch-all route (`app/canon/[...slug]/page.tsx`) automatically handles:
- Route resolution from slug
- Component loading
- Metadata extraction
- Shell rendering

**Example URLs:**
- `/canon/meta/meta-01-architecture`
- `/canon/payment/pay-01-payment-hub`
- `/canon/system/sys-01-bootloader`

---

## 📊 Current Pages

### **META Series (Metadata)**
- `meta-01-architecture` — Metadata Architecture (ACTIVE)
- `meta-02-god-view` — God View (DRAFT)
- `meta-03-the-prism` — The Prism (DRAFT)

### **PAYMENT Series**
- `pay-01-payment-hub` — Payment Hub (DRAFT)

### **SYSTEM Series**
- `sys-01-bootloader` — System Bootloader (DRAFT)
- `sys-02-organization` — Organization Management (DRAFT)

---

## 🔧 Maintenance

### **Updating Page Status**

Change status in `registry.ts`:

```typescript
meta: {
  status: 'ACTIVE', // Change from 'DRAFT' to 'ACTIVE'
}
```

### **Updating Page Metadata**

Edit the `meta` object in `registry.ts`:

```typescript
meta: {
  version: '1.1.0',        // Update version
  lastUpdated: '2025-01-27', // Update date
  description: 'New description', // Update description
}
```

### **Regenerating Registry**

If using `TOOL_24_GenerateCanonRegistry.ts`:

```bash
npm run canon:generate-registry
```

---

## 🤔 Why Separate from `canon/`?

**Common Question:** "Does this extra layer increase complexity and breakdown risk?"

**Answer:** No. The separation **reduces** complexity and **decreases** breakdown risk.

See **[`ARCHITECTURE_DECISION.md`](./ARCHITECTURE_DECISION.md)** for detailed reasoning:
- ✅ **Code splitting** - 98% smaller initial bundle (7KB vs 505KB+)
- ✅ **Separation of concerns** - Governance (`.md`) vs Presentation (`.mdx`)
- ✅ **Type safety** - Registry-driven, compile-time errors
- ✅ **Next.js best practice** - Dynamic MDX imports with lazy loading
- ✅ **Scalability** - Add pages without bundle bloat

---

## 📚 Related Documentation

- **`ARCHITECTURE_DECISION.md`** — Why separate `canon-pages/` from `canon/`? (Complexity analysis)
- **`canon/README.md`** — Canon directory overview
- **`canon/E-Knowledge/E-REF/REF_032_CanonPageThinWrapperPattern.md`** — Thin wrapper pattern
- **`canon/E-Knowledge/E-REF/REF_033_CanonPageImplementationGuide.md`** — Implementation guide
- **`canon/E-Knowledge/E-REF/REF_034_CanonPageSystemSummary.md`** — System summary
- **`canon/E-Knowledge/E-REF/REF_026_CANON_PAGE_MIGRATION_PLAN.md`** — Migration plan

---

## ✅ Best Practices

### **1. Keep MDX Files Focused**
- One topic per page
- Clear headings and structure
- Use tables for structured data

### **2. Use Registry for Discovery**
- Always register new pages in `registry.ts`
- Keep metadata up-to-date
- Use consistent naming conventions

### **3. Follow Domain Organization**
- Group pages by domain (META, PAYMENT, SYSTEM)
- Use consistent slug patterns (`domain-XX-feature-name`)
- Match Canon IDs when possible

### **4. Status Management**
- Use `DRAFT` for work-in-progress
- Use `ACTIVE` for production-ready pages
- Use `DEPRECATED` for outdated content
- Use `ARCHIVED` for historical reference

### **5. Version Control**
- Update version on significant changes
- Update `lastUpdated` date when editing
- Keep descriptions concise and accurate

---

## 🚀 Quick Start

### **Add a New Page**

1. Create MDX file: `canon-pages/META/meta-04-new-feature.mdx`
2. Write content in Markdown/MDX format
3. Register in `registry.ts`:
   ```typescript
   'meta/meta-04-new-feature': {
     component: () => import('./META/meta-04-new-feature.mdx'),
     meta: { id: 'META_04', title: 'New Feature', ... }
   }
   ```
4. Access at: `/canon/meta/meta-04-new-feature`

### **Update Existing Page**

1. Edit MDX file: `canon-pages/META/meta-01-architecture.mdx`
2. Update metadata in `registry.ts` if needed
3. Changes reflect automatically (Fast Refresh in dev)

---

## 📈 Statistics

**Current Status:**
- **Total Pages:** 6
- **Active:** 1
- **Draft:** 5
- **Deprecated:** 0
- **Archived:** 0
- **Health Score:** 17% (1/6 active)

**By Domain:**
- **META:** 3 pages
- **PAYMENT:** 1 page
- **SYSTEM:** 2 pages

---

**Status:** 🟢 Active  
**Last Updated:** 2025-01-27  
**Maintainer:** Canon Governance System
