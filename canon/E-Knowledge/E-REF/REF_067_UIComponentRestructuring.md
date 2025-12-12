# REF_067: UI Component Restructuring Strategy

**Date:** 2025-01-27  
**Status:** ✅ **IMPLEMENTED**  
**Related:** CONT_01_CanonIdentity, ADR_001_NextJsAppRouter  
**Purpose:** Define optimal UI component organization for hexagonal monorepo

---

## 📊 Executive Summary

**Problem Solved:**
- ✅ UI components isolated in `packages/ui/` package
- ✅ `packages/bioskin/` now properly depends on `@aibos/ui` (no cross-boundary coupling)
- ✅ Clear separation between atomic UI and domain components
- ✅ Consistent import paths (`@aibos/ui` for all atomic components)

**Implementation:** ✅ **COMPLETE**

---

## 🎯 Final Structure

```
AI-BOS-Finance/
├── canon/                          # Plane A-E: Governance
│   ├── A-Governance/              # Laws & Decisions
│   ├── B-Functional/              # UI Registry (B-COMP)
│   ├── C-DataLogic/               # Schemas & Policies
│   ├── D-Operations/               # Tools
│   └── E-Knowledge/               # References
│
├── packages/                       # Isolated Packages (Cell Boundaries)
│   ├── ui/                        # ✅ Atomic UI Components
│   │   ├── src/
│   │   │   ├── atoms/            # Surface, Txt, Btn, Input, StatusDot
│   │   │   ├── utils.ts          # cn utility function
│   │   │   └── index.ts          # Barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── bioskin/                   # ✅ Living Components
│       └── src/                   # BioCell, BioObject, BioList
│
├── src/                            # Application Code (Domain Layer)
│   ├── components/                 # Domain-Specific Components
│   │   ├── ui/                    # Radix UI primitives (stays here)
│   │   ├── canon/                 # Canon-specific UI
│   │   ├── bio/                   # Generative UI (ZodBioObject)
│   │   └── ...                    # Other domain folders
│   │
│   ├── modules/                    # Feature Modules
│   │   └── payment/
│   │       └── components/        # Payment-specific components
│   │
│   └── lib/
│       └── utils.ts               # Shared utilities (cn stays here for src/)
│
└── app/                            # Next.js App Router
    └── [routes]/                   # Route handlers
```

---

## 🔍 Why This Structure?

### **1. Hexagonal Architecture Alignment**

Your architecture follows the **"Biological Monorepo"** pattern:

| Layer | Location | Purpose | Example |
|-------|----------|---------|---------|
| **DNA (Schemas)** | `canon/C-DataLogic/` | Data structure | `C-SCH/registry.yaml` |
| **Proteins (Atoms)** | `packages/ui/` | Atomic UI | `Surface`, `Txt`, `Btn` |
| **Cells (BioSkin)** | `packages/bioskin/` | Living components | `BioCell`, `BioObject` |
| **Tissue (Domain)** | `src/components/` | Domain-specific | `PaymentTable`, `AuditSidebar` |
| **Skin (Pages)** | `app/` | Route handlers | `app/payments/page.tsx` |

**Benefits:**
- ✅ Clear boundaries (no circular dependencies)
- ✅ Proper dependency flow: `packages/ui` → `packages/bioskin` → `src/components`
- ✅ Isolated testing and versioning

---

### **2. Next.js Best Practices**

**Next.js App Router** recommends:
- ✅ **Colocation:** Keep components near where they're used
- ✅ **Barrel Exports:** Use `index.ts` for clean imports
- ✅ **Package Isolation:** Shared components in packages

**Your structure follows this:**
- Domain components stay in `src/components/` (colocated)
- Atomic components in `packages/ui/` (shared)
- Clear import boundaries

---

### **3. Monorepo Cell-Based Pattern**

Your **"Cell-Based"** metaphor means:
- Each package is a **"Cell"** (isolated, self-contained)
- Cells communicate via **"DNA"** (schemas) and **"Proteins"** (atoms)
- No direct coupling between cells

**Before (Violation):**
```typescript
// ❌ BAD: packages/bioskin depends on src/components/ui
import { Txt } from '@/components/ui/Txt'  // Cross-boundary!
```

**After (Fixed):**
```typescript
// ✅ GOOD: packages/bioskin depends on packages/ui
import { Txt } from '@aibos/ui'  // Proper package dependency
```

---

## 📋 Implementation Details

### **Package Structure**

**`packages/ui/package.json`:**
```json
{
  "name": "@aibos/ui",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./atoms": "./src/atoms/index.ts"
  }
}
```

**`packages/ui/src/index.ts`:**
```typescript
// Re-export all atoms
export * from './atoms'
export { cn } from './utils'
```

---

### **Import Patterns**

**Atomic Components (from `packages/ui/`):**
```typescript
// ✅ Clean, consistent imports
import { Surface, Txt, Btn, Input, StatusDot } from '@aibos/ui'
```

**BioSkin Components (from `packages/bioskin/`):**
```typescript
// ✅ Proper package dependency
import { BioCell, BioObject, BioList } from '@aibos/bioskin'
import { Surface, Txt } from '@aibos/ui'  // Depends on ui package
```

**Domain Components (from `src/components/`):**
```typescript
// ✅ Domain-specific, colocated
import { PaymentTable } from '@/modules/payment/components'
import { AuditSidebar } from '@/modules/payment/components'
import { Surface, Txt } from '@aibos/ui'  // Uses atomic components
```

---

## ✅ Benefits

### **1. Clear Dependency Graph**
```
packages/ui (atoms)
    ↓
packages/bioskin (cells)
    ↓
src/components (tissue)
    ↓
app/ (skin)
```

**No circular dependencies possible!**

---

### **2. Proper TypeScript Resolution**
- ✅ Package-level type checking
- ✅ Clear import boundaries
- ✅ Better IDE autocomplete

---

### **3. Testing Isolation**
- ✅ Test `packages/ui/` independently
- ✅ Mock `@aibos/ui` in tests
- ✅ Version components separately

---

### **4. Build Optimization**
- ✅ Next.js can tree-shake unused atoms
- ✅ Package-level code splitting
- ✅ Faster builds (isolated packages)

---

## 📊 Migration Status

### **✅ Completed**

- [x] Create `packages/ui/` directory structure
- [x] Create `packages/ui/package.json`
- [x] Move atomic components (`Surface`, `Txt`, `Btn`, `Input`, `StatusDot`)
- [x] Create `packages/ui/src/index.ts` barrel export
- [x] Create `packages/ui/src/utils.ts` (cn utility)
- [x] Update `tsconfig.json` paths
- [x] Update `packages/bioskin/` imports
- [x] Update `src/modules/payment/` imports
- [x] Update `src/components/bio/` imports
- [x] Update `src/components/simulation/` imports

---

## 🎯 Import Patterns After Restructure

### **Atomic Components**
```typescript
// ✅ All atomic components from @aibos/ui
import { Surface, Txt, Btn, Input, StatusDot } from '@aibos/ui'
```

### **BioSkin Components**
```typescript
// ✅ BioSkin depends on @aibos/ui
import { BioCell, BioObject, BioList } from '@aibos/bioskin'
import { Surface, Txt } from '@aibos/ui'
```

### **Domain Components**
```typescript
// ✅ Domain components use @aibos/ui
import { PaymentTable } from '@/modules/payment/components'
import { Surface, Txt, Btn } from '@aibos/ui'
```

---

## ⚠️ What Stays in `src/components/ui/`

**Radix UI Primitives** remain in `src/components/ui/`:
- `button.tsx`, `dialog.tsx`, `card.tsx`, `badge.tsx`, etc.
- These are framework-specific wrappers
- Only move if creating multiple Next.js apps

**Utils** remain in `src/lib/utils.ts`:
- `cn` function stays for `src/` components
- `packages/ui/` has its own `utils.ts` for isolation

---

## 🚀 Next Steps

### **Optional Enhancements**

1. **Move Generative UI to Package:**
   - Consider moving `src/components/bio/` → `packages/bio/`
   - Better isolation, can be versioned independently

2. **Add Workspace Configuration:**
   - Add `workspaces` to root `package.json` (if using npm workspaces)
   - Currently using path aliases (works fine with Next.js)

3. **Update Storybook:**
   - Move stories from `src/components/ui/*.stories.tsx` → `packages/ui/src/atoms/*.stories.tsx`
   - Update Storybook config to include `packages/ui/`

---

## 📚 Related Documents

- **CONT_01_CanonIdentity.md** - Canon Identity Contract
- **ADR_001_NextJsAppRouter.md** - Next.js Architecture Decision
- **REF_051_GenerativeUIEvolution.md** - Generative UI Architecture
- **REF_047_AtomicNormalizationSystem.md** - Atomic Components System

---

## 🎯 Final Status

**✅ UI Component Restructuring Complete**

This structure:
- ✅ Aligns with hexagonal architecture
- ✅ Follows Next.js best practices
- ✅ Prevents circular dependencies
- ✅ Enables proper monorepo isolation
- ✅ Matches your "cell-based" biological metaphor

**No more import debugging hell!** 🎉

---

*Last Updated: 2025-01-27*  
*Status: ✅ Implemented — Ready for Verification*
