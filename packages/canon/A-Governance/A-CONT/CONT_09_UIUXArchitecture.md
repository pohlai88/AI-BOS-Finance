> **🔴 [DEPRECATED]** — Superseded by CONT_10  
> **Canon Code:** CONT_09  
> **Version:** 1.0.0 (DEPRECATED)  
> **Certified Date:** 2025-12-16  
> **Deprecated Date:** 2025-12-16  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** NONE - See CONT_10  
> **Authority:** SUPERSEDED by CONT_10_BioSkinArchitecture.md
>
> ⚠️ **THIS CONTRACT IS DEPRECATED** ⚠️
> 
> This contract has been superseded by **CONT_10_BioSkinArchitecture.md** which implements 
> the correct hexagonal architecture with a single governed UI cell.
>
> **Key Change:** All UI now lives in ONE package (`packages/bioskin/`) instead of being 
> scattered across `packages/ui-atoms/`, `packages/bioskin/`, and `src/components/canon/`.

---

# AI-BOS / NexusCanon
## UI/UX Architecture & Design System Contract v1.0.0

**Framework:** Next.js 16+ (App Router)  
**Language:** TypeScript 5.6+  
**UI Library:** React 18+  
**Design System:** Dual System (Manual Tokens + Bio Transform Self)  
**Last Updated:** 2025-12-16

---

## 1. Executive Summary

### 1.1 Problem Statement

The current UI system suffers from:

| Issue | Evidence | Impact |
|-------|----------|--------|
| **Token Drift** | `nexus-*` AND `surface-*` coexist | Inconsistent styling |
| **Scattered Organization** | 15+ component folders | Hard to find components |
| **Naming Chaos** | No COMP_* governance | Duplicate components |
| **Missing Bio System** | No `@aibos/bioskin` | No schema-driven UI |
| **User Pairing Confusion** | Elements mixed randomly | Unpredictable UX |

### 1.2 Solution: Dual System Architecture

This contract establishes a **Dual UI System**:

```
┌─────────────────────────────────────────────────────────────┐
│                    DUAL UI SYSTEM                           │
├────────────────────────┬────────────────────────────────────┤
│   MANUAL TOKENS        │    BIO TRANSFORM SELF              │
│   (Static/Config)      │    (Dynamic/Generative)            │
├────────────────────────┼────────────────────────────────────┤
│  1. Design Tokens      │  1. DNA (Zod Schemas)              │
│  2. shadcn/ui          │  2. RNA (Schema Introspector)      │
│  3. COMP_* Governed    │  3. Proteins (@aibos/ui-atoms)     │
│  4. Feature Components │  4. Cells (@aibos/bioskin)         │
├────────────────────────┴────────────────────────────────────┤
│                    RENDERED UI                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Design Token System (SSOT)

### 2.1 Token Categories

| Category | CSS Variable Prefix | Tailwind Prefix | Example |
|----------|---------------------|-----------------|---------|
| **Surface** | `--color-surface-*` | `bg-surface-*` | `bg-surface-card` |
| **Border** | `--color-border-*` | `border-*` | `border-default` |
| **Text** | `--color-text-*` | `text-*` | `text-primary` |
| **Status** | `--color-status-*` | `text-status-*` | `text-status-success` |
| **Primary** | `--color-primary-*` | `*-primary` | `bg-primary` |
| **Spacing** | `--spacing-layout-*` | `*-layout-*` | `p-layout-md` |
| **Typography** | `--text-*` | `text-*` | `text-heading` |

### 2.2 Forbidden Patterns (MUST NOT USE)

```typescript
// ❌ FORBIDDEN - Legacy "nexus-*" classes
className="bg-nexus-void text-nexus-signal border-nexus-structure"

// ❌ FORBIDDEN - Arbitrary values
className="bg-[#0A0A0A] text-[#888888] p-[24px]"

// ❌ FORBIDDEN - Hardcoded colors
const color = "#28E7A2";

// ✅ REQUIRED - Semantic tokens
className="bg-surface-card text-text-primary border-default p-layout-md"

// ✅ REQUIRED - CSS variable reference
const color = "var(--color-primary)";
```

### 2.3 Migration: nexus-* → Semantic

| Old Class | New Class | CSS Variable |
|-----------|-----------|--------------|
| `bg-nexus-void` | `bg-background` | `--color-background` |
| `bg-nexus-matter` | `bg-surface-card` | `--color-surface-card` |
| `bg-nexus-surface` | `bg-surface-subtle` | `--color-surface-subtle` |
| `text-nexus-signal` | `text-text-primary` | `--color-text-primary` |
| `text-nexus-noise` | `text-text-secondary` | `--color-text-secondary` |
| `border-nexus-structure` | `border-default` | `--color-border-default` |
| `border-nexus-border` | `border-subtle` | `--color-border-subtle` |
| `text-nexus-green` | `text-primary` | `--color-primary` |
| `bg-nexus-green` | `bg-primary` | `--color-primary` |

---

## 3. Component Hierarchy

### 3.1 Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 0: Design Tokens (globals.css)                       │
│  ───────────────────────────────────────────────────────────│
│  CSS Variables → Tailwind Config → All Components           │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Primitives (packages/ui-atoms/)                   │
│  ───────────────────────────────────────────────────────────│
│  @aibos/ui-atoms: Surface, Txt, Btn, Field, Icon            │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: shadcn/ui (src/components/ui/)                    │
│  ───────────────────────────────────────────────────────────│
│  Card, Button, Input, Dialog, Table, etc.                   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: COMP_* Governed (src/components/canon/)           │
│  ───────────────────────────────────────────────────────────│
│  COMP_StatCard, COMP_StatusBadge, COMP_DataTable, etc.      │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: BioSkin Generative (packages/bioskin/)            │
│  ───────────────────────────────────────────────────────────│
│  @aibos/bioskin: BioObject, BioForm, BioTable               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 5: Feature Components (src/features/*/components/)   │
│  ───────────────────────────────────────────────────────────│
│  PaymentHub, MetadataGodView, DashboardWidget, etc.         │
├─────────────────────────────────────────────────────────────┤
│  LAYER 6: Page Shells (app/**/page.tsx)                     │
│  ───────────────────────────────────────────────────────────│
│  Thin wrappers that compose features                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Directory Structure (Target State)

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (Layer 2)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   │
│   │   └── canon/                  # COMP_* governed (Layer 3)
│   │       ├── COMP_StatCard.tsx
│   │       ├── COMP_StatusBadge.tsx
│   │       ├── COMP_DataTable.tsx
│   │       ├── COMP_FormBuilder.tsx
│   │       └── index.ts
│   │
│   ├── features/                   # Feature components (Layer 5)
│   │   ├── payment/
│   │   │   ├── components/
│   │   │   │   └── PaymentHub.tsx
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── metadata/
│   │   │   ├── components/
│   │   │   │   ├── GodView.tsx
│   │   │   │   └── DetailDrawer.tsx
│   │   │   └── hooks/
│   │   │
│   │   └── dashboard/
│   │       ├── components/
│   │       └── widgets/
│   │
│   └── styles/
│       └── globals.css             # Design Tokens (Layer 0)
│
└── app/                            # Page Shells (Layer 6)
    ├── payments/
    │   └── page.tsx
    ├── meta-registry/
    │   └── page.tsx
    └── dashboard/
        └── page.tsx

packages/
├── ui-atoms/                       # @aibos/ui-atoms (Layer 1)
│   ├── package.json
│   └── src/
│       ├── Surface.tsx
│       ├── Txt.tsx
│       ├── Btn.tsx
│       ├── Field.tsx
│       └── index.ts
│
└── bioskin/                        # @aibos/bioskin (Layer 4)
    ├── package.json
    └── src/
        ├── introspector/
        │   └── ZodSchemaIntrospector.ts
        ├── components/
        │   ├── BioObject.tsx
        │   ├── BioForm.tsx
        │   └── BioTable.tsx
        └── index.ts
```

### 3.3 Folders to DELETE/MIGRATE

| Current Folder | Action | Migrate To |
|----------------|--------|------------|
| `components/nexus/` | **DELETE** | `components/canon/` |
| `components/landing/` | **MIGRATE** | `features/marketing/components/` |
| `components/metadata/` | **MIGRATE** | `features/metadata/components/` |
| `components/dashboard/` | **MIGRATE** | `features/dashboard/components/` |
| `components/radar/` | **MIGRATE** | `features/radar/components/` |
| `components/simulation/` | **DELETE** | Remove (one-off demo) |
| `components/magicui/` | **MIGRATE** | `components/canon/` (if governed) |
| `components/shell/` | **MIGRATE** | `features/shell/components/` |
| `components/auth/` | **MIGRATE** | `features/auth/components/` |
| `components/health/` | **MIGRATE** | `features/health/components/` |
| `components/sys/` | **MIGRATE** | `features/system/components/` |
| `components/figma/` | **DELETE** | Built into CI pipeline |
| `components/lynx/` | **MIGRATE** | `features/ai/components/` |
| `components/kernel/` | **MIGRATE** | `features/kernel/components/` |
| `components/icons/` | **KEEP** | `components/icons/` (utility) |
| `components/motion/` | **KEEP** | `components/motion/` (utility) |

---

## 4. COMP_* Component Governance

### 4.1 Required COMPONENT_META Export

Every governed component MUST export `COMPONENT_META`:

```typescript
// src/components/canon/COMP_StatCard.tsx

import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  className?: string;
}

export function COMP_StatCard({ icon: Icon, value, label, className }: StatCardProps) {
  return (
    <Card className={cn('bg-surface-card border-default p-layout-sm', className)}>
      <Icon className="w-5 h-5 text-text-secondary" aria-hidden="true" />
      <div className="text-heading font-bold text-text-primary">{value}</div>
      <div className="text-label text-text-tertiary">{label}</div>
    </Card>
  );
}

// ✅ REQUIRED - COMPONENT_META export
export const COMPONENT_META = {
  code: 'COMP_StatCard',
  version: '1.0.0',
  family: 'CARD',
  purpose: 'METRICS',
  status: 'active',
  layer: 3,
  dependencies: ['@/components/ui/card'],
} as const satisfies ComponentMeta;
```

### 4.2 ComponentMeta Type Definition

```typescript
// packages/canon/src/types/component.types.ts

export interface ComponentMeta {
  code: `COMP_${string}`;
  version: `${number}.${number}.${number}`;
  family: 'CARD' | 'TABLE' | 'FORM' | 'BUTTON' | 'INPUT' | 'LAYOUT' | 'FEEDBACK' | 'NAVIGATION' | 'DATA';
  purpose: 'METRICS' | 'DATA' | 'ACTION' | 'INPUT' | 'DISPLAY' | 'NAVIGATION' | 'FEEDBACK';
  status: 'active' | 'deprecated' | 'experimental';
  layer: 1 | 2 | 3 | 4 | 5;
  dependencies: string[];
  accessibilityLevel?: 'AA' | 'AAA';
  schemaSupport?: boolean; // true if works with BioSkin
}
```

### 4.3 Component Naming Convention

| Pattern | Example | Location |
|---------|---------|----------|
| `COMP_<Family><Purpose>` | `COMP_StatCard` | `components/canon/` |
| `COMP_<Family><Index>` | `COMP_TBLM01` | `components/canon/` |
| No prefix (shadcn) | `Card`, `Button` | `components/ui/` |
| No prefix (feature) | `PaymentHub` | `features/*/components/` |

---

## 5. Bio Transform Self System

### 5.1 DNA Layer (Zod Schemas)

All entity schemas MUST be defined in `packages/schemas/`:

```typescript
// packages/schemas/src/payment.schema.ts
import { z } from 'zod';

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  paymentNumber: z.string().describe('Payment reference number'),
  vendorId: z.string().uuid().describe('Vendor UUID'),
  vendorName: z.string().describe('Vendor display name'),
  amount: z.number().positive().describe('Payment amount'),
  currency: z.string().length(3).describe('ISO 4217 currency code'),
  status: z.enum(['draft', 'pending', 'approved', 'executed', 'completed', 'failed']),
  createdAt: z.date(),
  updatedAt: z.date(),
}).describe('Payment entity');

export type Payment = z.infer<typeof PaymentSchema>;
```

### 5.2 RNA Layer (Schema Introspector)

```typescript
// packages/bioskin/src/introspector/ZodSchemaIntrospector.ts
import { z } from 'zod';

export interface BioFieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'array' | 'object';
  label: string;
  description?: string;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  uiHints?: {
    component?: string;
    placeholder?: string;
    readonly?: boolean;
  };
}

export interface BioSchemaDefinition {
  name: string;
  description?: string;
  fields: BioFieldDefinition[];
}

export function introspectZodSchema(schema: z.ZodType): BioSchemaDefinition {
  // Implementation extracts field info from Zod schema
  // Returns structured definition for UI generation
}
```

### 5.3 Proteins Layer (@aibos/ui-atoms)

```typescript
// packages/ui-atoms/src/Surface.tsx
export interface SurfaceProps {
  children: React.ReactNode;
  variant?: 'card' | 'subtle' | 'nested' | 'glass';
  className?: string;
}

export function Surface({ children, variant = 'card', className }: SurfaceProps) {
  const variantClasses = {
    card: 'bg-surface-card border-default',
    subtle: 'bg-surface-subtle border-subtle',
    nested: 'bg-surface-nested border-subtle',
    glass: 'bg-surface-card/60 backdrop-blur-md border-default',
  };
  
  return (
    <div className={cn('rounded-lg p-layout-md', variantClasses[variant], className)}>
      {children}
    </div>
  );
}
```

### 5.4 Cells Layer (@aibos/bioskin)

```typescript
// packages/bioskin/src/components/BioObject.tsx
import { introspectZodSchema } from '../introspector/ZodSchemaIntrospector';
import { Surface, Txt, Field } from '@aibos/ui-atoms';

export interface BioObjectProps<T extends z.ZodType> {
  schema: T;
  data: z.infer<T>;
  mode?: 'view' | 'edit';
  layout?: 'vertical' | 'horizontal' | 'grid';
  onSave?: (data: z.infer<T>) => void;
}

export function BioObject<T extends z.ZodType>({ 
  schema, 
  data, 
  mode = 'view',
  layout = 'vertical',
  onSave 
}: BioObjectProps<T>) {
  const definition = introspectZodSchema(schema);
  
  return (
    <Surface>
      <Txt variant="h3">{definition.name}</Txt>
      <div className={layoutClasses[layout]}>
        {definition.fields.map(field => (
          <Field 
            key={field.name}
            field={field}
            value={data[field.name]}
            mode={mode}
          />
        ))}
      </div>
      {mode === 'edit' && onSave && (
        <Btn onClick={() => onSave(data)}>Save</Btn>
      )}
    </Surface>
  );
}

// Usage Example:
// <BioObject schema={PaymentSchema} data={payment} mode="view" />
```

---

## 6. Accessibility Requirements

### 6.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | 4.5:1 minimum for text |
| **Focus Indicators** | Visible focus ring on all interactive elements |
| **Keyboard Navigation** | All features usable via keyboard |
| **Screen Reader** | ARIA labels on all interactive elements |
| **Motion** | Respect `prefers-reduced-motion` |

### 6.2 Required Patterns

```typescript
// ✅ REQUIRED - Focus visible
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

// ✅ REQUIRED - ARIA labels
<Button aria-label="Submit payment">
  <CheckIcon aria-hidden="true" />
</Button>

// ✅ REQUIRED - Role and state
<div role="region" aria-labelledby="payment-title" aria-expanded={isOpen}>

// ✅ REQUIRED - Motion preference
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

---

## 7. Migration Strategy

### 7.1 Phase 1: Token Cleanup (Week 1)

**Objective:** Replace all `nexus-*` classes with semantic tokens.

**Script: `scripts/TOOL_20_MigrateNexusTokens.ts`**

```typescript
// Auto-replace nexus-* classes
const MIGRATIONS = {
  'bg-nexus-void': 'bg-background',
  'bg-nexus-matter': 'bg-surface-card',
  'bg-nexus-surface': 'bg-surface-subtle',
  'text-nexus-signal': 'text-text-primary',
  'text-nexus-noise': 'text-text-secondary',
  'border-nexus-structure': 'border-default',
  'border-nexus-border': 'border-subtle',
  'text-nexus-green': 'text-primary',
  'bg-nexus-green': 'bg-primary',
  // ... more mappings
};
```

**Steps:**
1. Run migration script
2. Remove `nexus-*` from Tailwind config
3. Remove `nexus-*` from globals.css
4. Verify visual regression

### 7.2 Phase 2: Component Consolidation (Week 2)

**Objective:** Move components to correct folders.

**Steps:**
1. Create `src/features/` structure
2. Move components per Section 3.3
3. Update all imports
4. Delete empty folders
5. Add COMPONENT_META to canon components

### 7.3 Phase 3: Bio System Creation (Week 3)

**Objective:** Implement @aibos/ui-atoms and @aibos/bioskin.

**Steps:**
1. Create `packages/ui-atoms/` package
2. Implement Surface, Txt, Btn, Field, Icon
3. Create `packages/bioskin/` package
4. Implement ZodSchemaIntrospector
5. Implement BioObject, BioForm, BioTable
6. Create integration examples

### 7.4 Phase 4: Feature Migration (Week 4)

**Objective:** Convert feature components to use Bio system.

**Steps:**
1. Replace hardcoded forms with BioForm
2. Replace hardcoded tables with BioTable
3. Add schema definitions for all entities
4. Verify all features work

---

## 8. Validation & Enforcement

### 8.1 ESLint Rules

```javascript
// eslint-local-rules.js
module.exports = {
  'no-nexus-classes': {
    meta: { fixable: 'code' },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name.name === 'className') {
            const value = node.value?.value || '';
            if (/nexus-/.test(value)) {
              context.report({
                node,
                message: 'Use semantic tokens instead of nexus-* classes',
              });
            }
          }
        }
      };
    }
  },
  
  'require-component-meta': {
    create(context) {
      const filename = context.getFilename();
      if (!filename.includes('/canon/COMP_')) return {};
      
      return {
        Program(node) {
          const hasExport = node.body.some(
            n => n.type === 'ExportNamedDeclaration' &&
                 n.declaration?.declarations?.[0]?.id?.name === 'COMPONENT_META'
          );
          if (!hasExport) {
            context.report({
              node,
              message: 'Canon components must export COMPONENT_META',
            });
          }
        }
      };
    }
  }
};
```

### 8.2 CI/CD Validation

```yaml
# .github/workflows/ui-validation.yml
name: UI Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Check for nexus-* classes
        run: |
          if grep -rn "nexus-" --include="*.tsx" apps/web/src/; then
            echo "❌ Found legacy nexus-* classes"
            exit 1
          fi
          
      - name: Validate COMPONENT_META
        run: npx tsx scripts/TOOL_21_ValidateComponentMeta.ts
        
      - name: Visual Regression Test
        run: pnpm test:visual
```

---

## 9. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **nexus-* usage** | 424 instances | 0 | `grep` count |
| **Component folders** | 15+ | 5 | Directory count |
| **COMPONENT_META coverage** | ~20% | 100% | Script validation |
| **BioSkin components** | 0 | 10+ | Package exports |
| **Accessibility score** | ~60% | 100% AA | Lighthouse audit |
| **Token consistency** | ~70% | 100% | ESLint rule |

---

## 10. Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| CONT_01 | Canon Identity | `A-Governance/A-CONT/` |
| DESIGN_SYSTEM.md | Visual design guide | `apps/web/src/docs/02-design-system/` |
| SCHEMA_FIRST_ARCHITECTURE.md | Schema patterns | `apps/web/src/docs/01-architecture/` |
| globals.css | Token definitions | `apps/web/src/styles/` |
| tailwind.config.js | Token mappings | `apps/web/` |

---

## 11. Appendix: Quick Reference

### 11.1 Token Cheat Sheet

```css
/* Surfaces */
bg-background         /* Main background */
bg-surface-card       /* Card/panel background */
bg-surface-subtle     /* Subtle/nested background */
bg-surface-hover      /* Hover states */

/* Borders */
border-default        /* Standard borders */
border-subtle         /* Subtle borders */
border-active         /* Active/focus borders */

/* Text */
text-text-primary     /* Primary text */
text-text-secondary   /* Secondary text */
text-text-tertiary    /* Muted text */
text-text-disabled    /* Disabled text */

/* Status */
text-status-success   /* Success (green) */
text-status-warning   /* Warning (amber) */
text-status-danger    /* Danger (red) */
text-status-info      /* Info (blue) */

/* Primary Brand */
text-primary          /* Primary text */
bg-primary            /* Primary background */
border-primary        /* Primary border */

/* Spacing */
p-layout-xs           /* 8px */
p-layout-sm           /* 16px */
p-layout-md           /* 24px */
p-layout-lg           /* 32px */
p-layout-xl           /* 64px */
```

### 11.2 Import Patterns

```typescript
// ✅ Layer 1: Primitives
import { Surface, Txt, Btn } from '@aibos/ui-atoms';

// ✅ Layer 2: shadcn/ui
import { Card, Button, Input } from '@/components/ui';

// ✅ Layer 3: Canon governed
import { COMP_StatCard, COMP_DataTable } from '@/components/canon';

// ✅ Layer 4: BioSkin generative
import { BioObject, BioForm, BioTable } from '@aibos/bioskin';

// ✅ Layer 5: Feature components
import { PaymentHub } from '@/features/payment/components';

// ❌ FORBIDDEN: Direct from deleted folders
import { NexusCard } from '@/components/nexus'; // DELETED
```

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Run Phase 1 Token Cleanup

---

**Last Updated:** 2025-12-16  
**Maintainer:** AI-BOS Architecture Team  
**Review Cycle:** Quarterly
