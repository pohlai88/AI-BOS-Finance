# 🧹 FRONTEND CLEANUP & REFACTOR PLAN
## AI-BOS Finance - Clean State Before BioSkin 3.0

**Canon Code:** SPEC_FRONTEND_03  
**Version:** 1.0.0  
**Status:** 🔴 ACTIVE — Cleanup Required  
**Created:** 2025-01-XX  
**Maintainer:** AI-BOS Frontend Team

---

## 📋 Executive Summary

### Current Problem
The frontend codebase has **mixed architecture** with scattered code across multiple directories, making it difficult to:
- Identify what code belongs to what domain
- Test components in isolation
- Apply BioSkin 3.0 systematically
- Maintain clean separation (like backend)

### Goal
Establish a **clean, feature-based architecture** before BioSkin 3.0 integration, matching the backend's domain separation philosophy.

### Success Criteria
- ✅ All domain code consolidated into `src/features/{domain}/`
- ✅ All routes thinned to <10 lines (delegate to features)
- ✅ Zero code duplication
- ✅ 100% domain separation
- ✅ All tests passing
- ✅ Documentation up-to-date

---

## 🔍 Current State Analysis

### Directory Audit

```
Current Structure (Mixed):
apps/web/
├── app/
│   ├── payments/
│   │   ├── page.tsx                    ← Route (thin) ✅
│   │   ├── _components/                ← Components ❌ (should be in src/features)
│   │   │   ├── ApprovalButton.tsx
│   │   │   ├── PaymentActionMenu.tsx
│   │   │   └── RiskQueueDashboard.tsx
│   │   └── _hooks/                     ← Hooks ❌ (should be in src/features)
│   │       └── usePaymentActions.ts
│   ├── dashboard/page.tsx              ← Thick route ❌ (130 lines)
│   └── api/
│       ├── payments/                   ← API routes ✅
│       └── meta/                       ← API routes ✅
│
└── src/
    ├── views/                          ← Pages ✅
    │   ├── PAY_01_PaymentHubPage.tsx
    │   ├── META_02_MetadataGodView.tsx
    │   └── SYS_01_SysBootloaderPage.tsx
    ├── features/                       ← Partial feature structure ⚠️
    │   ├── payment/                    ← Payments (some components)
    │   ├── metadata/                   ← Metadata (some components)
    │   ├── auth/                       ← Auth (some components)
    │   └── shell/                      ← Shell (layout components)
    ├── components/                     ← Mixed components ❌
    │   ├── ui/                         ← Shadcn/ui ✅ (keep)
    │   ├── canon/                      ← Canon components ⚠️
    │   ├── radar/                      ← Radar components ❌ (should be in features/metadata)
    │   ├── lynx/                       ← Lynx components ❌ (should be in features/metadata)
    │   └── sys/                        ← System components ❌ (should be in features/system)
    └── hooks/                          ← Shared hooks ⚠️
```

### Problems Identified

| Problem | Impact | Example |
|---------|--------|---------|
| **Scattered Payment Code** | Hard to maintain | `app/payments/_components/` + `src/features/payment/` |
| **Thick Routes** | Tight coupling | `app/dashboard/page.tsx` (130 lines) |
| **Mixed Components** | No clear ownership | `src/components/radar/` (should be in features) |
| **Hooks in app/** | Can't reuse | `app/payments/_hooks/` |
| **Duplicate Locations** | Confusing | Views in `src/views/` but components scattered |

---

## 🎯 Target State Architecture

### Clean Structure (Feature-Based)

```
Target Structure (Clean):
apps/web/
├── app/                               ← THIN ROUTING (5-10 lines per route)
│   ├── (auth)/                        ← Route group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (payments)/                    ← Route group
│   │   └── payments/page.tsx          → import from @/features/payments
│   ├── (metadata)/                    ← Route group
│   │   └── meta-registry/page.tsx     → import from @/features/metadata
│   ├── (system)/                      ← Route group
│   │   ├── bootloader/page.tsx
│   │   └── organization/page.tsx
│   ├── (finance)/                     ← Route group (future)
│   │   ├── ap/page.tsx
│   │   ├── ar/page.tsx
│   │   └── gl/page.tsx
│   ├── api/                           ← API routes (thin handlers)
│   │   └── [...domain]/route.ts
│   ├── layout.tsx
│   ├── page.tsx                       ← Landing
│   ├── not-found.tsx
│   └── providers.tsx
│
└── src/                               ← THICK FEATURES (business logic)
    ├── features/                      ← Self-contained domains
    │   ├── auth/                      ← 🔐 Authentication
    │   │   ├── views/
    │   │   │   ├── REG_01_LoginPage.tsx
    │   │   │   ├── REG_02_SignUpPage.tsx
    │   │   │   └── REG_03_ResetPasswordPage.tsx
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── types/
    │   │   └── index.ts
    │   │
    │   ├── payments/                  ← 💳 Payments
    │   │   ├── views/
    │   │   │   └── PAY_01_PaymentHubPage.tsx
    │   │   ├── components/
    │   │   │   ├── PaymentForm/
    │   │   │   ├── PaymentTable/
    │   │   │   ├── ApprovalButton/
    │   │   │   ├── PaymentActionMenu/
    │   │   │   └── RiskQueueDashboard/
    │   │   ├── hooks/
    │   │   │   └── usePaymentActions.ts
    │   │   ├── api/
    │   │   │   └── payment-handlers.ts
    │   │   ├── types/
    │   │   └── index.ts
    │   │
    │   ├── metadata/                  ← 🗂️ Metadata
    │   │   ├── views/
    │   │   │   ├── META_01_MetadataArchitecturePage.tsx
    │   │   │   ├── META_02_MetadataGodView.tsx
    │   │   │   ├── META_03_ThePrismPage.tsx
    │   │   │   ├── META_04_MetaRiskRadarPage.tsx
    │   │   │   ├── META_05_MetaCanonMatrixPage.tsx
    │   │   │   ├── META_06_MetaHealthScanPage.tsx
    │   │   │   ├── META_07_MetaLynxCodexPage.tsx
    │   │   │   └── META_08_ImplementationPlaybookPage.tsx
    │   │   ├── components/
    │   │   │   ├── MetaNavTrigger/
    │   │   │   ├── MetaSideNav/
    │   │   │   ├── MetaPageHeader/
    │   │   │   ├── radar/             ← Radar components
    │   │   │   └── lynx/              ← Lynx components
    │   │   ├── hooks/
    │   │   ├── types/
    │   │   └── index.ts
    │   │
    │   ├── system/                    ← ⚙️ System
    │   │   ├── views/
    │   │   │   ├── SYS_01_SysBootloaderPage.tsx
    │   │   │   ├── SYS_02_SysOrganizationPage.tsx
    │   │   │   ├── SYS_03_SysAccessPage.tsx
    │   │   │   └── SYS_04_SysProfilePage.tsx
    │   │   ├── components/
    │   │   │   ├── MissionControl/
    │   │   │   └── SetupCompanion/
    │   │   ├── hooks/
    │   │   └── index.ts
    │   │
    │   ├── finance/                   ← 🏦 Finance (future)
    │   │   ├── ap/                    ← Accounts Payable
    │   │   ├── ar/                    ← Accounts Receivable
    │   │   └── gl/                    ← General Ledger
    │   │
    │   ├── dashboard/                 ← 📊 Dashboard
    │   │   ├── views/
    │   │   │   └── DashboardPage.tsx
    │   │   ├── components/
    │   │   └── index.ts
    │   │
    │   ├── marketing/                 ← 🎨 Marketing (landing pages)
    │   │   ├── views/
    │   │   │   └── LandingPage.tsx
    │   │   ├── components/
    │   │   └── index.ts
    │   │
    │   └── shared/                    ← Shared utilities
    │       ├── ui/                    ← Shadcn/ui components
    │       ├── hooks/                 ← Shared hooks
    │       ├── utils/                 ← Shared utilities
    │       └── types/                 ← Shared types
    │
    └── lib/                           ← Global utilities
        ├── utils.ts
        ├── env.ts
        └── kernel-client.ts
```

---

## 📋 Cleanup Tasks Breakdown

### Phase 1: Analysis & Planning (Day 1)

#### Task 1.1: Inventory Current Code

```bash
# Find all components
find apps/web -name "*.tsx" | grep -v node_modules

# Find all hooks
find apps/web -name "use*.ts" | grep -v node_modules

# Find API routes
find apps/web/app/api -name "route.ts"

# Find pages
find apps/web/src/views -name "*.tsx"
```

**Deliverable:** Complete file inventory with domain classification

#### Task 1.2: Identify Dependencies

**Tool:**
```typescript
// scripts/analyze-dependencies.ts
import { analyzeImports } from './tools';

// Find cross-domain imports
const crossDomainImports = analyzeImports('apps/web/src');
console.log('Cross-domain imports:', crossDomainImports);
```

**Deliverable:** Dependency graph showing cross-domain imports

#### Task 1.3: Classify Components by Domain

| Component | Current Location | Target Location | Domain |
|-----------|-----------------|-----------------|--------|
| `ApprovalButton.tsx` | `app/payments/_components/` | `src/features/payments/components/` | Payments |
| `PaymentActionMenu.tsx` | `app/payments/_components/` | `src/features/payments/components/` | Payments |
| `RiskQueueDashboard.tsx` | `app/payments/_components/` | `src/features/payments/components/` | Payments |
| `usePaymentActions.ts` | `app/payments/_hooks/` | `src/features/payments/hooks/` | Payments |
| `TacticalRadar.tsx` | `src/components/radar/` | `src/features/metadata/components/radar/` | Metadata |
| `LynxChatMessage.tsx` | `src/components/lynx/` | `src/features/metadata/components/lynx/` | Metadata |
| `MissionControl.tsx` | `src/components/sys/` | `src/features/system/components/` | System |
| `SetupCompanion.tsx` | `src/components/sys/` | `src/features/system/components/` | System |

**Deliverable:** Complete classification table (50+ components)

---

### Phase 2: Create Feature Structure (Day 1-2)

#### Task 2.1: Create Feature Directories

```bash
# Create feature structure
mkdir -p apps/web/src/features/{auth,payments,metadata,system,finance,dashboard,marketing,shared}

# Create subdirectories for each feature
for feature in auth payments metadata system finance dashboard marketing; do
  mkdir -p apps/web/src/features/$feature/{views,components,hooks,api,types,__tests__}
  touch apps/web/src/features/$feature/index.ts
  touch apps/web/src/features/$feature/README.md
done

# Create shared subdirectories
mkdir -p apps/web/src/features/shared/{ui,hooks,utils,types}
```

**Deliverable:** Feature directory structure

#### Task 2.2: Create Public API Files

```typescript
// apps/web/src/features/payments/index.ts
// Public API - Only export what other features need

// Views
export { PAY_01_PaymentHubPage } from './views/PAY_01_PaymentHubPage';

// Components (if shared)
export { PaymentForm } from './components/PaymentForm';
export { PaymentTable } from './components/PaymentTable';
export { ApprovalButton } from './components/ApprovalButton';

// Hooks (if shared)
export { usePaymentActions } from './hooks/usePaymentActions';

// Types (if shared)
export type { Payment, PaymentStatus } from './types';
```

**Deliverable:** `index.ts` for each feature

---

### Phase 3: Move Code to Features (Day 2-3)

#### Task 3.1: Move Payment Code

**Current Location → Target Location:**

```bash
# Move components from app/payments/_components/
mv apps/web/app/payments/_components/ApprovalButton.tsx \
   apps/web/src/features/payments/components/ApprovalButton/ApprovalButton.tsx

mv apps/web/app/payments/_components/PaymentActionMenu.tsx \
   apps/web/src/features/payments/components/PaymentActionMenu/PaymentActionMenu.tsx

mv apps/web/app/payments/_components/RiskQueueDashboard.tsx \
   apps/web/src/features/payments/components/RiskQueueDashboard/RiskQueueDashboard.tsx

# Move hooks from app/payments/_hooks/
mv apps/web/app/payments/_hooks/usePaymentActions.ts \
   apps/web/src/features/payments/hooks/usePaymentActions.ts

# Move views from src/views/
mv apps/web/src/views/PAY_01_PaymentHubPage.tsx \
   apps/web/src/features/payments/views/PAY_01_PaymentHubPage.tsx

# Move existing feature components
mv apps/web/src/features/payment/* \
   apps/web/src/features/payments/
```

**Update Imports:**

```typescript
// Before (in any file)
import { ApprovalButton } from '@/app/payments/_components/ApprovalButton';
import { usePaymentActions } from '@/app/payments/_hooks/usePaymentActions';

// After
import { ApprovalButton, usePaymentActions } from '@/features/payments';
```

**Deliverable:** All payment code in `src/features/payments/`

#### Task 3.2: Move Metadata Code

```bash
# Move views
mv apps/web/src/views/META_*.tsx \
   apps/web/src/features/metadata/views/

# Move components
mv apps/web/src/components/radar/* \
   apps/web/src/features/metadata/components/radar/

mv apps/web/src/components/lynx/* \
   apps/web/src/features/metadata/components/lynx/

mv apps/web/src/components/Meta*.tsx \
   apps/web/src/features/metadata/components/

# Move existing feature components
mv apps/web/src/features/metadata/* \
   apps/web/src/features/metadata/
```

**Deliverable:** All metadata code in `src/features/metadata/`

#### Task 3.3: Move System Code

```bash
# Move views
mv apps/web/src/views/SYS_*.tsx \
   apps/web/src/features/system/views/

# Move components
mv apps/web/src/components/sys/* \
   apps/web/src/features/system/components/

# Move context
mv apps/web/src/context/SysConfigContext.tsx \
   apps/web/src/features/system/context/
```

**Deliverable:** All system code in `src/features/system/`

#### Task 3.4: Move Auth Code

```bash
# Move views
mv apps/web/src/views/REG_*.tsx \
   apps/web/src/features/auth/views/

# Move existing feature components
mv apps/web/src/features/auth/* \
   apps/web/src/features/auth/
```

**Deliverable:** All auth code in `src/features/auth/`

#### Task 3.5: Move Dashboard Code

```bash
# Move view
mv apps/web/src/views/DashboardPage.tsx \
   apps/web/src/features/dashboard/views/

# Move existing components
mv apps/web/src/features/dashboard/* \
   apps/web/src/features/dashboard/
```

**Deliverable:** All dashboard code in `src/features/dashboard/`

#### Task 3.6: Move Marketing Code

```bash
# Move view
mv apps/web/src/views/LandingPage.tsx \
   apps/web/src/features/marketing/views/

# Move existing components
mv apps/web/src/features/marketing/* \
   apps/web/src/features/marketing/
```

**Deliverable:** All marketing code in `src/features/marketing/`

#### Task 3.7: Move Shared Code

```bash
# Move UI components (Shadcn)
mv apps/web/src/components/ui/* \
   apps/web/src/features/shared/ui/

# Move shared hooks
mv apps/web/src/hooks/* \
   apps/web/src/features/shared/hooks/

# Move lib utilities (keep in lib/ root for now)
# apps/web/src/lib/ → Keep as-is
```

**Deliverable:** All shared code in `src/features/shared/`

---

### Phase 4: Thin Out Routes (Day 3)

#### Task 4.1: Create Route Groups

```bash
# Create route groups in app/
mkdir -p apps/web/app/\(auth\)
mkdir -p apps/web/app/\(payments\)
mkdir -p apps/web/app/\(metadata\)
mkdir -p apps/web/app/\(system\)
mkdir -p apps/web/app/\(finance\)
mkdir -p apps/web/app/\(dashboard\)
```

#### Task 4.2: Refactor Thick Routes

**Before:**
```tsx
// app/dashboard/page.tsx (130 lines)
'use client'

export default function DashboardPage() {
  const [message, setMessage] = useState('...');
  const [status, setStatus] = useState<'neutral' | 'success' | 'error'>('neutral');
  
  useEffect(() => {
    // ... 50 lines of logic
  }, []);
  
  return (
    <div>
      {/* ... 70 lines of JSX */}
    </div>
  );
}
```

**After:**
```tsx
// app/(dashboard)/dashboard/page.tsx (5 lines)
import { DashboardPage } from '@/features/dashboard';

export default function DashboardRoute() {
  return <DashboardPage />;
}
```

```tsx
// src/features/dashboard/views/DashboardPage.tsx (130 lines)
'use client'

export function DashboardPage() {
  const [message, setMessage] = useState('...');
  // ... all the logic moved here
}
```

**Deliverable:** All routes <10 lines

#### Task 4.3: Update Route Imports

**Routes to Update:**

| Route | Current | Target |
|-------|---------|--------|
| `/login` | `app/(auth)/login/page.tsx` | Import from `@/features/auth` |
| `/payments` | `app/(payments)/payments/page.tsx` | Import from `@/features/payments` |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Import from `@/features/dashboard` |
| `/meta-registry` | `app/(metadata)/meta-registry/page.tsx` | Import from `@/features/metadata` |
| `/system` | `app/(system)/system/page.tsx` | Import from `@/features/system` |

**Pattern:**
```tsx
// All route files follow this pattern
import { PageComponent } from '@/features/{domain}';

export default function Route() {
  return <PageComponent />;
}
```

---

### Phase 5: Update Imports (Day 3-4)

#### Task 5.1: Global Find & Replace

**Tool:**
```bash
# Find all old import patterns
rg "from '@/app/payments/_components" apps/web/src
rg "from '@/app/payments/_hooks" apps/web/src
rg "from '@/components/radar" apps/web/src
rg "from '@/components/lynx" apps/web/src
rg "from '@/components/sys" apps/web/src
rg "from '@/views/" apps/web/src
```

**Replace Patterns:**

| Old Import | New Import |
|------------|------------|
| `from '@/app/payments/_components/ApprovalButton'` | `from '@/features/payments'` |
| `from '@/app/payments/_hooks/usePaymentActions'` | `from '@/features/payments'` |
| `from '@/components/radar/TacticalRadar'` | `from '@/features/metadata'` |
| `from '@/components/lynx/LynxChatMessage'` | `from '@/features/metadata'` |
| `from '@/components/sys/MissionControl'` | `from '@/features/system'` |
| `from '@/views/PAY_01_PaymentHubPage'` | `from '@/features/payments'` |
| `from '@/views/META_02_MetadataGodView'` | `from '@/features/metadata'` |
| `from '@/views/SYS_01_SysBootloaderPage'` | `from '@/features/system'` |
| `from '@/components/ui/button'` | `from '@/features/shared/ui'` |

#### Task 5.2: Update tsconfig Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/ui": ["./src/features/shared/ui"],
      "@/hooks": ["./src/features/shared/hooks"],
      "@/utils": ["./src/features/shared/utils"],
      "@/types": ["./src/features/shared/types"]
    }
  }
}
```

**Deliverable:** All imports updated, no broken imports

---

### Phase 6: Clean Up (Day 4)

#### Task 6.1: Remove Empty Directories

```bash
# After moving files, remove old directories
rm -rf apps/web/app/payments/_components
rm -rf apps/web/app/payments/_hooks
rm -rf apps/web/app/payments/_actions  # If API handlers moved
rm -rf apps/web/src/components/radar
rm -rf apps/web/src/components/lynx
rm -rf apps/web/src/components/sys
rm -rf apps/web/src/views  # If all views moved
```

#### Task 6.2: Remove Unused Files

**Audit:**
```bash
# Find unused components
npx tsx scripts/find-unused-exports.ts

# Find unused imports
npx knip
```

**Deliverable:** Zero unused files

#### Task 6.3: Update Documentation

**Files to Update:**
- `apps/web/README.md` — Update architecture section
- `apps/web/src/features/*/README.md` — Create feature documentation
- Update import examples in all docs

---

### Phase 7: Testing & Verification (Day 5)

#### Task 7.1: Run Tests

```bash
# Type check
pnpm --filter @aibos/web type-check

# Unit tests
pnpm --filter @aibos/web test

# E2E tests
pnpm --filter @aibos/web test:e2e

# Lint
pnpm --filter @aibos/web lint
```

**Exit Criteria:**
- ✅ No TypeScript errors
- ✅ All tests passing
- ✅ No linter errors

#### Task 7.2: Manual Testing

**Test Checklist:**
- [ ] Login page loads
- [ ] Payment hub page loads
- [ ] Metadata pages load (META_01-08)
- [ ] System pages load (SYS_01-04)
- [ ] Dashboard loads
- [ ] All features functional
- [ ] No console errors
- [ ] No broken images
- [ ] No broken links

#### Task 7.3: Performance Check

```bash
# Build production bundle
pnpm --filter @aibos/web build

# Analyze bundle
pnpm --filter @aibos/web analyze

# Check bundle sizes
ls -lh apps/web/.next/static/chunks/
```

**Targets:**
- Initial bundle <300KB
- Route chunks <100KB each

---

## 📊 Verification Checklist

### Pre-Cleanup State

- [ ] All files inventoried
- [ ] Dependencies mapped
- [ ] Components classified by domain

### Post-Cleanup State

- [ ] All domain code in `src/features/{domain}/`
- [ ] All routes <10 lines
- [ ] Zero code duplication
- [ ] All imports updated
- [ ] All tests passing (100%)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] No unused files
- [ ] Documentation updated
- [ ] Bundle size within target (<300KB)

---

## 🎯 Success Metrics

| Metric | Before | Target | Status |
|--------|--------|--------|--------|
| **Domain Separation** | ~30% | 100% | 🔴 Pending |
| **Route Complexity** | ~50 lines avg | <10 lines | 🔴 Pending |
| **Code Duplication** | ~10% | <5% | 🔴 Pending |
| **Test Coverage** | ~40% | >50% | 🔴 Pending |
| **Unused Files** | ~15 | 0 | 🔴 Pending |
| **Bundle Size** | TBD | <300KB | 🟡 Audit |

---

## 📚 Related Documents

- **PRD:** `PRD_FRONTEND_APPLICATION.md`
- **Architecture:** `FRONTEND_ARCHITECTURE_GUIDE.md`
- **Diagrams:** `FRONTEND_ARCHITECTURE_DIAGRAM.md`
- **BioSkin Integration:** `BIOSKIN_3_CUSTOMIZATION_GUIDE.md`

---

## 🔄 Post-Cleanup: Next Steps

After cleanup is complete:

1. **Update PRD Status:** Change from DRAFT to ACTIVE
2. **Create Clean State Snapshot:** Document final structure
3. **Begin BioSkin Integration:** Start Phase 4 (Integration)
4. **Create Migration Guide:** For other devs to follow pattern

---

**Document Status:** 🔴 ACTIVE — Cleanup in Progress  
**Estimated Duration:** 5 days  
**Owner:** Frontend Team  
**Start Date:** TBD  
**Target Completion:** TBD
