# 📱 PRODUCT REQUIREMENTS DOCUMENT: Frontend Application
## AI-BOS Finance - Next.js 16 App Router

**Canon Code:** PRD_FRONTEND_01  
**Version:** 2.0.0  
**Status:** ✅ ACTIVE — Clean Architecture Achieved  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Maintainer:** AI-BOS Frontend Team

---

## 📋 Executive Summary

### Purpose
This PRD defines the architecture, standards, and development practices for the AI-BOS Finance frontend application with its **feature-based modular structure** ready for BioSkin 3.0 integration.

### Current State (Post-Cleanup)
- **Framework:** Next.js 16.0.10 (Turbopack)
- **Architecture:** Feature-based modular structure ✅
- **UI Library:** Shadcn/ui + Radix UI + BioSkin 3.0
- **State Management:** SWR, React Hook Form, Zod
- **Styling:** Tailwind CSS 3.4.17
- **Testing:** Vitest + Playwright
- **Package Manager:** pnpm (workspace monorepo)

### Achieved Goals
| Goal | Status |
|------|--------|
| ✅ **Clean Architecture** | Feature-based modular structure |
| ✅ **Domain Separation** | 100% (8 feature modules) |
| ✅ **Thin Routes** | All routes <15 lines |
| ✅ **Type Safety** | TypeScript strict mode |
| ✅ **BioSkin Ready** | Foundation complete (Phase 1-3) |

---

## 🎯 Product Vision

### Mission Statement
> Build a **scalable, industry-agnostic frontend platform** that serves multiple business domains (Finance, Supply Chain, Kernel) with clean separation, powered by BioSkin 3.0 for customization.

### Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Domain Separation** | 100% | 100% | ✅ Complete |
| **Route Complexity** | <15 lines | <15 lines | ✅ Complete |
| **Page Load (LCP)** | <2.5s | TBD | 🟡 Measure |
| **Bundle Size** | <300KB | TBD | 🟡 Measure |
| **Test Coverage** | >80% | ~40% | 🟡 Improve |
| **BioSkin Integration** | 100% | Phase 1-3 done | 🟡 Phase 4 next |

---

## 🏗️ Architecture Overview

### Tech Stack

```yaml
Framework:
  core: Next.js 16.0.10
  bundler: Turbopack
  router: App Router (app/ directory)
  rendering: SSR + SSG + ISR

UI Layer:
  primitives: Radix UI (@radix-ui/react-*)
  components: Shadcn/ui (in features/shared/ui/)
  bioskin: @aibos/bioskin (BioTable, BioForm, etc.)
  icons: Lucide React 0.487.0
  styling: Tailwind CSS 3.4.17
  animations: Motion 12.23.25

State Management:
  server: SWR 2.3.8 (data fetching)
  forms: React Hook Form 7.55.0
  validation: Zod 4.1.13

Data Layer:
  tables: TanStack Table 8.21.3 (via BioTable)
  charts: Recharts 2.15.0
  drag-drop: @dnd-kit/* 6.3.1

Testing:
  unit: Vitest 4.0.15 (browser mode)
  e2e: Playwright 1.57.0
  coverage: Vitest Coverage v8
```

---

## 📂 Current Directory Structure

### Three-Layer Architecture

```
apps/web/
│
├── app/                               ← 🗺️ ROUTING LAYER (thin)
│   │                                    Routes delegate to features
│   ├── payments/page.tsx              → imports from @/features/payments
│   ├── meta-registry/page.tsx         → imports from @/features/metadata
│   ├── system/page.tsx                → imports from @/features/system
│   ├── dashboard/page.tsx             → imports from @/features/dashboard
│   └── api/                           ← API routes
│       ├── payments/                  → 12 endpoints
│       ├── meta/                      → 11 endpoints
│       └── webhooks/                  → 2 endpoints
│
├── src/                               ← 🎯 IMPLEMENTATION LAYER (thick)
│   ├── features/                      ← Self-contained domains
│   │   ├── auth/                      ← 🔐 Authentication
│   │   ├── payments/                  ← 💳 Payments
│   │   ├── metadata/                  ← 🗂️ Metadata
│   │   ├── system/                    ← ⚙️ System
│   │   ├── dashboard/                 ← 📊 Dashboard
│   │   ├── marketing/                 ← 🎨 Marketing
│   │   ├── health/                    ← Health monitoring
│   │   ├── shell/                     ← App shell/layout
│   │   └── shared/                    ← 🔧 Shared utilities
│   │       └── ui/                    ← Shadcn/ui (48 components)
│   └── lib/                           ← Global utilities
│
└── canon-pages/                       ← 📋 GOVERNANCE LAYER
    ├── AUTH/                          ← Auth page definitions
    ├── PAYMENT/                       ← Payment page definitions
    ├── META/                          ← Metadata page definitions
    ├── SYSTEM/                        ← System page definitions
    └── registry.ts                    ← Central Canon registry
```

---

## 🧩 Feature Modules (8 Total)

### Module Structure Pattern

```
src/features/{domain}/
├── views/                     ← Page components (Canon-identified)
│   └── {CODE}_{Name}Page.tsx  ← e.g., PAY_01_PaymentHubPage.tsx
├── components/                ← UI components
├── hooks/                     ← Custom hooks
├── api/                       ← API handlers (optional)
├── types/                     ← TypeScript types
├── schemas/                   ← Zod schemas (optional)
├── adapters/                  ← BioSkin adapters (optional)
└── index.ts                   ← Public API exports
```

### Feature Inventory

| Feature | Views | Components | Hooks | Status |
|---------|-------|------------|-------|--------|
| **payments** | 1 | 18 | 5 | ✅ Complete |
| **metadata** | 11 | 15+ | 2 | ✅ Complete |
| **system** | 4 | 2 | - | ✅ Complete |
| **auth** | 3 | 4 | - | ✅ Complete |
| **dashboard** | 1 | 3 | - | ✅ Complete |
| **marketing** | 1 | 27 | - | ✅ Complete |
| **health** | - | 4 | - | ✅ Complete |
| **shell** | - | 12 | - | ✅ Complete |
| **shared** | - | 48 (UI) | - | ✅ Complete |

---

## 🎨 Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT LAYERS                                   │
│                                                                              │
│  Layer 5: PAGES (Canon-identified)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ src/features/{domain}/views/                                            ││
│  │ PAY_01, META_01-08, SYS_01-04, REG_01-03                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    ↓ uses                                    │
│  Layer 4: ORGANISMS (BioSkin 3.0)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ @aibos/bioskin                                                          ││
│  │ BioTable, BioForm, BioKanban, BioGantt, BioCalendar, BioNavbar         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    ↓ uses                                    │
│  Layer 3: MOLECULES (BioSkin 3.0)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ @aibos/bioskin                                                          ││
│  │ BioToast, BioFilterBar, BioExportButton, BioCommandPalette             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    ↓ uses                                    │
│  Layer 2: ATOMS (Shadcn/ui)                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ src/features/shared/ui/                                                 ││
│  │ Button, Input, Card, Dialog, Table, Badge, Tooltip, etc. (48 total)    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    ↓ uses                                    │
│  Layer 1: PRIMITIVES (Radix UI)                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ @radix-ui/react-*                                                       ││
│  │ Unstyled, accessible primitives                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Routing Pattern

### Thin Route Convention

All routes follow this pattern — **delegate to features, don't implement logic**:

```tsx
// ✅ CORRECT: Thin route (10 lines)
// app/payments/page.tsx

'use client'

import { Suspense } from 'react'
import { PAY_01_PaymentHubPage } from '@/features/payments'

export default function PaymentsRoute() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PAY_01_PaymentHubPage />
    </Suspense>
  )
}
```

### Current Routes

| Route | Feature Import | Page Component |
|-------|---------------|----------------|
| `/payments` | `@/features/payments` | `PAY_01_PaymentHubPage` |
| `/meta-registry` | `@/features/metadata` | `META_02_MetadataGodView` |
| `/system` | `@/features/system` | `SYS_01_SysBootloaderPage` |
| `/dashboard` | Direct (temp) | Test page |
| `/` | `@/features/marketing` | `LandingPage` |

---

## 📦 Import Conventions

### Path Aliases (tsconfig.json)

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/features/*": ["./src/features/*"],
    "@/ui": ["./src/features/shared/ui"],
    "@/ui/*": ["./src/features/shared/ui/*"],
    "@/lib/*": ["./lib/*"],
    "@/app/*": ["./app/*"]
  }
}
```

### Import Examples

```typescript
// ✅ Import from feature public API
import { PAY_01_PaymentHubPage, PaymentTable } from '@/features/payments';
import { META_02_MetadataGodView } from '@/features/metadata';
import { SYS_01_SysBootloaderPage } from '@/features/system';

// ✅ Import shared UI
import { Button, Card, Dialog } from '@/ui';

// ✅ Import BioSkin
import { BioTable, BioForm, Surface } from '@aibos/bioskin';

// ❌ DON'T import feature internals directly
import { SomeInternalComponent } from '@/features/payments/components/internal';
```

---

## 🎯 BioSkin 3.0 Integration Status

### Completed Phases

| Phase | Component | Status | Tests |
|-------|-----------|--------|-------|
| **Phase 1** | BioRegistry | ✅ Complete | 37/37 ✅ |
| **Phase 2** | BioCapabilities | ✅ Complete | 31/31 ✅ |
| **Phase 3** | BioTokens | ✅ Complete | 14/14 ✅ |
| **Phase 4** | Integration | 🚧 Next | - |
| **Phase 5** | Adapters | 🔲 Planned | - |
| **Phase 6** | Validation | 🔲 Planned | - |

### Next Step: Phase 4 Integration

Update pages to use BioSkin components:

```tsx
// src/features/payments/views/PAY_01_PaymentHubPage.tsx
// BEFORE
import { Table } from '@/components/ui/table';

// AFTER
import { BioTable } from '@aibos/bioskin';
import { useCapability } from '@aibos/bioskin/capabilities';

export function PAY_01_PaymentHubPage() {
  const canBulkEdit = useCapability('bulkEdit');
  
  return (
    <BioTable
      data={payments}
      columns={columns}
      enableBulkEdit={canBulkEdit}
    />
  );
}
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
         E2E (10%)
        ┌─────────┐
       /  Playwright\
      /   Critical   \
     /   User Flows   \
    └─────────────────┘

   Integration (20%)
  ┌─────────────────────┐
 /  Vitest Browser Mode  \
/   Component + Hooks     \
└─────────────────────────┘

       Unit (70%)
┌─────────────────────────┐
│        Vitest           │
│   Functions + Utils     │
│   Hooks + Logic         │
└─────────────────────────┘
```

### Commands

```bash
# Unit tests
pnpm --filter @aibos/web test

# E2E tests
pnpm --filter @aibos/web test:e2e

# Coverage report
pnpm --filter @aibos/web test:coverage

# Type check
pnpm --filter @aibos/web type-check
```

---

## 🚀 Performance Targets

### Core Web Vitals

| Metric | Target | Threshold |
|--------|--------|-----------|
| **LCP** | <2.5s | <4s |
| **FID** | <100ms | <300ms |
| **CLS** | <0.1 | <0.25 |
| **TTFB** | <800ms | <1800ms |

### Bundle Budget

| Asset | Budget |
|-------|--------|
| **Initial JS** | <300KB |
| **Initial CSS** | <50KB |
| **Route Chunk** | <100KB |
| **Total Page** | <1MB |

---

## 🔒 Security Requirements

### API Route Pattern

```typescript
// app/api/payments/route.ts

export async function POST(request: Request) {
  // 1. Authenticate
  const session = await getSession(request);
  if (!session) return unauthorized();
  
  // 2. Validate (Zod)
  const body = await request.json();
  const validated = paymentSchema.parse(body);
  
  // 3. Authorize
  if (!hasPermission(session.user, 'payment:create')) {
    return forbidden();
  }
  
  // 4. Process
  const result = await createPayment(validated);
  return NextResponse.json(result);
}
```

---

## 🛠️ Development Workflow

### Quick Start

```bash
# Install
pnpm install

# Start dev server
pnpm --filter @aibos/web dev
# → http://localhost:3000

# Run tests
pnpm --filter @aibos/web test

# Type check
pnpm --filter @aibos/web type-check

# Lint
pnpm --filter @aibos/web lint
```

### Creating a New Feature

1. **Create directory structure:**
```bash
mkdir -p src/features/{feature}/views
mkdir -p src/features/{feature}/components
mkdir -p src/features/{feature}/hooks
touch src/features/{feature}/index.ts
```

2. **Create public API (index.ts):**
```typescript
// src/features/{feature}/index.ts
export { FeaturePage } from './views/FeaturePage';
export { useFeatureHook } from './hooks/useFeatureHook';
```

3. **Create thin route:**
```tsx
// app/{route}/page.tsx
import { FeaturePage } from '@/features/{feature}';
export default function Route() {
  return <FeaturePage />;
}
```

---

## 📋 Checklist: Adding a New Page

- [ ] Create view in `src/features/{domain}/views/{CODE}_{Name}Page.tsx`
- [ ] Export from feature `index.ts`
- [ ] Create thin route in `app/{route}/page.tsx`
- [ ] Add Canon page definition in `canon-pages/{DOMAIN}/`
- [ ] Add to Canon registry
- [ ] Write tests
- [ ] Update documentation

---

## 📚 Related Documents

| Document | Purpose |
|----------|---------|
| `FRONTEND_ARCHITECTURE_GUIDE.md` | Detailed architecture explanation |
| `FRONTEND_ARCHITECTURE_DIAGRAM.md` | Visual diagrams |
| `FRONTEND_CLEANUP_REFACTOR_PLAN.md` | Historical cleanup plan |
| `FRONTEND_CLEAN_STATE_REVIEW.md` | Clean state verification |
| `FRONTEND_AUDIT_AND_FINAL_SOLUTION.md` | Next.js MCP audit |
| `PRD_BIOSKIN_02_IndustryAgnosticPlatform.md` | BioSkin PRD |
| `BIOSKIN_3_CUSTOMIZATION_GUIDE.md` | When to customize BioSkin |
| `CONT_11-14` | UI/UX Governance Contracts |

---

## 🎯 Roadmap

### Completed ✅

- [x] Feature-based architecture (8 modules)
- [x] Domain separation (100%)
- [x] Thin route pattern
- [x] BioSkin Phase 1-3 (Registry, Capabilities, Tokens)

### In Progress 🚧

- [ ] BioSkin Phase 4: Component integration
- [ ] Performance baseline measurement
- [ ] Test coverage improvement (40% → 80%)

### Planned 🔲

- [ ] BioSkin Phase 5: Industry adapters
- [ ] BioSkin Phase 6: Multi-industry validation
- [ ] Production deployment optimization

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-01-XX | Complete rewrite post-cleanup |
| 1.0.0 | 2025-01-XX | Initial PRD (pre-cleanup) |

---

**Document Status:** ✅ ACTIVE  
**Architecture Status:** ✅ Clean (Feature-Based)  
**BioSkin Status:** 🚧 Phase 4 Ready  
**Next Action:** Begin BioSkin Phase 4 Integration
