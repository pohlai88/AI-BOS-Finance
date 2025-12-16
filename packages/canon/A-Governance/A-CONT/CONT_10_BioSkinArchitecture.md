> **🟢 [ACTIVE]** — Certified for Production  
> **Canon Code:** CONT_10  
> **Version:** 2.1.0  
> **Certified Date:** 2025-12-16  
> **Plane:** A — Governance (Contract)  
> **Binding Scope:** All AI-BOS UI/UX implementations  
> **Authority:** BioSkin UI Architecture (Ecosystem Upgrade)

---

# AI-BOS BioSkin 2.1
## Directive-Based Architecture Contract — Next.js 16+ Native

**Framework:** Next.js 16+ (App Router)  
**Language:** TypeScript 5.6+  
**UI Library:** React 19+  
**Design System:** Single Governed Cell (BioSkin)  
**Last Updated:** 2025-12-16

---

## 1. Executive Summary

### 1.1 What Changed from v2.0 to v2.1

| v2.0 (Folder-Based) | **v2.1 (Directive-Based)** | Reason |
|---------------------|---------------------------|--------|
| Separate `server/` and `client/` folders | **Flat structure with directives** | Next.js 16 native pattern |
| Complex folder duplication | **`'use client'` at entry points** | Simpler, less maintenance |
| Manual boundary enforcement | **`server-only`/`client-only` packages** | Framework-native |

### 1.2 Key Insight from Next.js Docs

> **"If you're building a component library, add the `'use client'` directive to entry points that rely on client-only features. This lets your users import components into Server Components without needing to create wrappers."**
> — Next.js Official Documentation

### 1.3 The Boring Constraints (Non-Negotiable)

1. **Directive-Based Boundary:** `'use client'` at entry points, `import 'server-only'` for server code
2. **Exports Map:** `package.json` `"exports"` — two entrypoints (main + server)
3. **Dependency Gate:** Every dependency must unlock a **named feature + acceptance test**
4. **RSC-First Strategy:** Fetch on server, hydrate only interactive parts
5. **shadcn as Foundation:** Private, not external — re-export governed components only

---

## 2. Architecture Contract

### 2.1 The Three Zones (Unchanged)

| Zone | Location | Governance | Rule |
|------|----------|------------|------|
| **Governed UI** | `packages/bioskin/` | BioSkin Team | ALL shared UI here |
| **Routing Only** | `apps/web/app/` | Feature Teams | NO components, only pages |
| **Feature Logic** | `apps/web/src/features/` | Feature Teams | Data fetching, mutations |

### 2.2 The Directive-Based Boundary (Next.js 16+ Native)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @aibos/bioskin                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  index.ts                                                               │ │
│  │  'use client'  ← ONE directive at the entry point!                     │ │
│  │                                                                         │ │
│  │  // All interactive components exported here:                           │ │
│  │  export { BioTable } from './organisms/BioTable';                       │ │
│  │  export { BioForm } from './organisms/BioForm';                         │ │
│  │  export { StatusBadge } from './molecules/StatusBadge';                 │ │
│  │  export { Surface, Txt, Btn } from './atoms';                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  server.ts                                                              │ │
│  │  import 'server-only'  ← Prevents accidental client import!            │ │
│  │                                                                         │ │
│  │  // Pure functions safe for Server Components:                          │ │
│  │  export { introspectZodSchema } from './introspector';                  │ │
│  │  export { formatCurrency, formatDate } from './utils/formatters';       │ │
│  │  export { STATUS_COLORS } from './utils/constants';                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Import Patterns

```typescript
// ✅ In Server Component (page.tsx, layout.tsx)
import { introspectZodSchema, formatCurrency } from '@aibos/bioskin/server';

// ✅ In Client Component or any component needing interactivity
import { BioTable, BioForm, StatusBadge } from '@aibos/bioskin';

// ✅ The bundler handles everything automatically!
```

### 2.4 Why This Works

1. **`'use client'` in `index.ts`:** Marks ALL exports from main entrypoint as client components
2. **`import 'server-only'` in `server.ts`:** Build fails if accidentally imported in client
3. **Bundler does the work:** Next.js automatically handles the boundary
4. **No folder duplication:** Single flat structure, directives define behavior

---

## 3. Dependency Stack (Gated)

### 3.1 Dependency Gate Rule

> **Every dependency must:**
> 1. Unlock a **named BioSkin feature**
> 2. Have **acceptance tests** proving value
> 3. Be approved in this contract before installation

### 3.2 Approved Dependencies

| Dependency | Version | Feature Unlocked | Gate Status |
|------------|---------|------------------|-------------|
| **@tanstack/react-table** | ^8.x | BioTable sort/filter/paginate | ✅ APPROVED |
| **react-hook-form** | ^7.x | BioForm validation | ✅ APPROVED |
| **@hookform/resolvers** | ^3.x | Zod integration with RHF | ✅ APPROVED |
| **jotai** | ^2.x | Atomic component state | ✅ APPROVED |
| **motion** | ^11.x | Spring animations | ✅ APPROVED |
| **@dnd-kit/core** | ^6.x | BioKanban drag-drop | ✅ APPROVED |
| **@dnd-kit/sortable** | ^8.x | BioList reordering | ✅ APPROVED |
| **date-fns** | ^3.x | Date formatting/Calendar | ✅ APPROVED |
| **react-dropzone** | ^14.x | BioForm file upload | ✅ APPROVED |
| **react-use-measure** | ^2.x | Responsive animations | ✅ APPROVED |
| **zod** | ^3.x | Schema validation | ✅ APPROVED |
| **clsx** | ^2.x | Class merging | ✅ APPROVED |
| **tailwind-merge** | ^2.x | Tailwind class deduplication | ✅ APPROVED |
| **lucide-react** | ^0.x | Icons | ✅ APPROVED |
| **server-only** | ^0.x | Server boundary enforcement | ✅ APPROVED |
| **client-only** | ^0.x | Client boundary enforcement | ✅ APPROVED |

### 3.3 Deferred Dependencies (Not Yet Approved)

| Dependency | Proposed Feature | Gate Status | Reason |
|------------|------------------|-------------|--------|
| **@tanstack/react-query** | Server state caching | ⏸️ DEFERRED | RSC-first strategy — evaluate need |
| **zustand** | Global state | ⏸️ DEFERRED | jotai covers component state |

---

## 4. Data Strategy: RSC-First

### 4.1 The Decision

> **AI-BOS uses RSC-First (Server Components fetch data, Client hydrates UI).**

This means:
- Data fetching happens in **Server Components** (page.tsx)
- `BioTable` receives **pre-fetched data** as props
- `BioForm` receives **onSubmit callback** (feature layer handles mutation)
- **No TanStack Query in v2.1** — evaluate in v3.0 if needed

### 4.2 Data Flow Pattern

```typescript
// apps/web/app/payments/page.tsx (SERVER COMPONENT)
import { introspectZodSchema } from '@aibos/bioskin/server';
import { getPayments } from '@/features/payment/api';
import { PaymentTable } from '@/features/payment/components/PaymentTable';

export default async function PaymentsPage() {
  const payments = await getPayments();  // ✅ Server-side fetch
  
  return (
    <PaymentTable 
      data={payments}
      schema={PaymentSchema}
    />
  );
}

// apps/web/src/features/payment/components/PaymentTable.tsx
'use client';

import { BioTable } from '@aibos/bioskin';  // ✅ Client components

export function PaymentTable({ data, schema }) {
  return (
    <BioTable
      schema={schema}
      data={data}
      onRowClick={handleRowClick}
    />
  );
}
```

---

## 5. Directory Structure (v2.1 — Directive-Based)

### 5.1 The BioSkin Package (Flat Structure)

```
packages/bioskin/
├── package.json                       # Exports map (2 entrypoints)
├── tsconfig.json
│
└── src/
    ├── index.ts                       # 'use client' — Main entrypoint
    ├── server.ts                      # import 'server-only' — Server entrypoint
    │
    ├── atoms/                         # Primitives (with 'use client' where needed)
    │   ├── Surface.tsx
    │   ├── Txt.tsx
    │   ├── Btn.tsx
    │   ├── Field.tsx
    │   ├── Icon.tsx
    │   ├── Stack.tsx
    │   ├── Grid.tsx
    │   └── index.ts
    │
    ├── molecules/                     # Composed (with 'use client' where needed)
    │   ├── StatusBadge/
    │   │   ├── StatusBadge.tsx        # Uses motion for pulse
    │   │   ├── StatusIndicator.tsx
    │   │   └── index.ts
    │   ├── Spinner/
    │   │   ├── Spinner.tsx            # 8 variants
    │   │   └── index.ts
    │   ├── Combobox/
    │   ├── Dropzone/
    │   ├── MotionEffect/
    │   ├── EmptyState.tsx
    │   ├── LoadingState.tsx
    │   ├── ErrorState.tsx
    │   └── index.ts
    │
    ├── organisms/                     # Schema-driven (with 'use client' where needed)
    │   ├── BioTable/
    │   │   ├── BioTable.tsx           # Powered by TanStack Table
    │   │   ├── BioTableHeader.tsx
    │   │   ├── BioTableRow.tsx
    │   │   ├── BioTablePagination.tsx
    │   │   ├── BioTableFilters.tsx
    │   │   ├── useBioTable.ts         # jotai atoms for state
    │   │   └── index.ts
    │   ├── BioForm/
    │   │   ├── BioForm.tsx            # Powered by react-hook-form
    │   │   ├── BioFormField.tsx
    │   │   ├── useBioForm.ts
    │   │   └── index.ts
    │   ├── BioKanban/                 # Powered by @dnd-kit
    │   ├── BioCalendar/               # Powered by date-fns
    │   └── index.ts
    │
    ├── introspector/                  # Server-safe (NO 'use client')
    │   ├── ZodSchemaIntrospector.ts
    │   ├── types.ts
    │   └── index.ts
    │
    ├── hooks/                         # Reusable hooks
    │   ├── useControllableState.ts
    │   ├── useDebounce.ts
    │   ├── useLocalStorage.ts
    │   ├── useMediaQuery.ts
    │   └── index.ts
    │
    ├── foundation/                    # PRIVATE shadcn/ui (not exported)
    │   ├── button.tsx
    │   ├── card.tsx
    │   ├── command.tsx
    │   ├── popover.tsx
    │   ├── sheet.tsx
    │   ├── table.tsx
    │   └── ...
    │
    └── utils/
        ├── cn.ts
        ├── formatters.ts              # formatCurrency, formatDate
        ├── constants.ts               # STATUS_COLORS, tokens
        └── index.ts
```

### 5.2 Entry Points

```typescript
// packages/bioskin/src/index.ts
'use client'

// ============================================================
// @aibos/bioskin — Main Entrypoint (Client Components)
// ============================================================

// ATOMS
export { Surface, type SurfaceProps } from './atoms/Surface';
export { Txt, type TxtProps } from './atoms/Txt';
export { Btn, type BtnProps } from './atoms/Btn';
export { Field, type FieldProps } from './atoms/Field';
export { Icon, type IconProps } from './atoms/Icon';

// MOLECULES
export { StatusBadge, type StatusBadgeProps } from './molecules/StatusBadge';
export { Spinner, type SpinnerProps } from './molecules/Spinner';
export { EmptyState, type EmptyStateProps } from './molecules/EmptyState';
export { LoadingState, type LoadingStateProps } from './molecules/LoadingState';
export { ErrorState, type ErrorStateProps } from './molecules/ErrorState';

// ORGANISMS
export { BioTable, type BioTableProps } from './organisms/BioTable';
export { BioForm, type BioFormProps } from './organisms/BioForm';

// HOOKS
export { useDebounce } from './hooks/useDebounce';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useMediaQuery } from './hooks/useMediaQuery';

// UTILS
export { cn } from './utils/cn';
```

```typescript
// packages/bioskin/src/server.ts
import 'server-only'

// ============================================================
// @aibos/bioskin/server — Server-Safe Exports
// ============================================================

// INTROSPECTOR
export { 
  introspectZodSchema,
  type BioFieldDefinition,
  type BioSchemaDefinition 
} from './introspector';

// FORMATTERS
export { formatCurrency, formatDate } from './utils/formatters';

// CONSTANTS
export { STATUS_COLORS, DESIGN_TOKENS } from './utils/constants';
```

### 5.3 Package.json Exports Map (Simplified)

```json
{
  "name": "@aibos/bioskin",
  "version": "2.1.0",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./server": {
      "types": "./dist/server.d.ts",
      "import": "./dist/server.js"
    }
  },
  "typesVersions": {
    "*": {
      "server": ["./dist/server.d.ts"]
    }
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.0.0"
  },
  "dependencies": {
    "@tanstack/react-table": "^8.0.0",
    "react-hook-form": "^7.0.0",
    "@hookform/resolvers": "^3.0.0",
    "jotai": "^2.0.0",
    "motion": "^11.0.0",
    "@dnd-kit/core": "^6.0.0",
    "@dnd-kit/sortable": "^8.0.0",
    "date-fns": "^3.0.0",
    "react-dropzone": "^14.0.0",
    "react-use-measure": "^2.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0",
    "server-only": "^0.0.1"
  }
}
```

---

## 6. shadcn/ui as Private Foundation

### 6.1 The Strategy

> **shadcn/ui components live in `packages/bioskin/src/foundation/` as PRIVATE.**
> **They are NOT exported. Only governed BioSkin components are exported.**

```
✅ Consumer imports:
import { BioTable, Surface, StatusBadge } from '@aibos/bioskin';

❌ Consumer CANNOT import:
import { Button } from '@aibos/bioskin/foundation';  // NOT EXPORTED
```

### 6.2 Migration from apps/web

| Current Location | New Location | Action |
|------------------|--------------|--------|
| `apps/web/src/components/ui/` | `packages/bioskin/src/foundation/` | Move |
| `apps/web/components.json` | `packages/bioskin/components.json` | Move |

---

## 7. Component Contracts

### 7.1 BioTable Contract (Powered by TanStack Table)

```typescript
interface BioTableProps<T extends z.ZodRawShape> {
  // REQUIRED
  schema: z.ZodObject<T>;
  data: z.infer<z.ZodObject<T>>[];
  
  // OPTIONAL - Features
  sorting?: boolean;
  filtering?: boolean;
  pagination?: { pageSize: number; serverSide?: boolean; };
  selection?: boolean;
  
  // CALLBACKS
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  onPageChange?: (page: number) => void;
  
  // STATE
  loading?: boolean;
  error?: Error;
}
```

### 7.2 BioForm Contract (Powered by react-hook-form)

```typescript
interface BioFormProps<T extends z.ZodRawShape> {
  // REQUIRED
  schema: z.ZodObject<T>;
  onSubmit: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  
  // OPTIONAL
  defaultValues?: Partial<z.infer<z.ZodObject<T>>>;
  mode?: 'create' | 'edit' | 'view';
  layout?: 'single' | 'two-column' | 'custom';
}
```

---

## 8. Validation & Enforcement

### 8.1 CI Checks (v2.1)

```yaml
name: BioSkin 2.1 Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      # 1. No deep imports
      - name: Check no deep imports
        run: |
          if grep -rn "from '@aibos/bioskin/src" apps/ packages/; then
            echo "❌ Deep imports detected"
            exit 1
          fi
          
      # 2. No hardcoded colors
      - name: Check no hardcoded colors
        run: |
          if grep -rn "#[0-9a-fA-F]\{6\}" packages/bioskin/src --include="*.tsx"; then
            echo "❌ Found hardcoded colors"
            exit 1
          fi
          
      # 3. Dependency gate
      - name: Check unapproved dependencies
        run: node scripts/validate-dependencies.js
```

---

## 9. Success Metrics (v2.1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| UI governance boundaries | 1 | Count packages |
| Hardcoded colors | 0 | grep audit |
| Deep imports | 0 | grep audit |
| Dependency gate violations | 0 | package.json audit |
| Test coverage | ≥90% | Jest coverage |
| Bundle size increase | <50KB | bundlesize |

---

## 10. Migration Path (v2.1)

### Simplified Sprint Plan

| Day | Task | Duration |
|-----|------|----------|
| 1 | Add `server-only` package, create `server.ts` entry | 2 hours |
| 2 | Update `index.ts` with `'use client'` directive | 1 hour |
| 3 | Move shadcn to foundation/ | 4 hours |
| 4 | Install ecosystem dependencies | 2 hours |
| 5 | Update package.json exports map | 1 hour |
| 6-8 | Implement BioTable with TanStack | 3 days |
| 9-11 | Implement BioForm with RHF | 3 days |
| 12-13 | Add motion animations | 2 days |
| 14-15 | Validation & testing | 2 days |

**Total: ~15 days (3 weeks)**

---

## 11. Summary

### The v2.1 Rules

1. **ONE governed UI cell:** `packages/bioskin/`
2. **Directive-based boundary:** `'use client'` + `server-only`
3. **TWO exports:** Main (client) + `/server`
4. **Dependency gate:** Approved list only
5. **RSC-first:** Server fetches, client hydrates
6. **shadcn is private:** Foundation, not exported

### The v2.1 Power

```
@aibos/bioskin = 
  GSS Tokens (Figma) 
  + shadcn Foundation (Private)
  + TanStack Table (Data)
  + react-hook-form (Forms)
  + jotai (State)
  + motion (Animation)
  + @dnd-kit (Interaction)
  + Next.js 16 Native Directives
```

---

## 7. Testing Standard

BIOSKIN mandates unified testing with **Vitest Browser Mode + Playwright**.

### Testing Philosophy

```
Unit + Component + Integration = ONE Test Runner (Real Browser)
```

### Coverage KPIs

| Metric | Minimum | Target |
|--------|---------|--------|
| Line Coverage | 70% | 85% |
| Branch Coverage | 60% | 75% |
| Function Coverage | 80% | 90% |

### Test Requirements by Layer

| Layer | Requirement |
|-------|-------------|
| Atoms | Props render correctly |
| Molecules | All variants + states |
| Organisms | Schema-driven behavior |
| Hooks | State management |
| Utils | Pure function coverage |

### Test Commands

```bash
pnpm test           # Run all (headless)
pnpm test:watch     # Watch mode
pnpm test:coverage  # Coverage report
pnpm test:headed    # See browser
```

### PR Merge Gate

- All tests pass
- Coverage meets thresholds
- Type check passes
- New components have tests

> **Full Standard:** `packages/bioskin/TESTING.md`

---

**Status:** ✅ IMPLEMENTED (Sprint 1-3 Complete)  
**Supersedes:** CONT_10 v2.0  
**Testing:** Vitest Browser Mode + Playwright

---

**Last Updated:** 2024-12-16  
**Maintainer:** AI-BOS Architecture Team  
**Review Cycle:** Quarterly
