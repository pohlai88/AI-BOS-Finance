# REF_070: Organ Transplant Migration — Module Restructuring

**Date:** 2025-01-27  
**Status:** 🔄 **IN PROGRESS**  
**Related:** REF_067_UIComponentRestructuring, REF_069_SelfConsumeMigration  
**Purpose:** Document the migration of floating components to proper module homes

---

## 📊 Executive Summary

**Goal:** Empty `src/components/` by moving feature-specific components into `src/modules/{feature}/components/`

**Status:** ✅ **MIGRATION COMPLETE** - All modules successfully migrated to their proper homes.

---

## 🎯 Migration Plan

### **Target Structure**

```
src/
├── modules/                    # ✅ ORGANS (Business Logic + Components)
│   ├── payment/
│   │   └── components/        # ✅ Already organized
│   ├── simulation/            # 🆕 The Forensic Engine
│   │   └── components/
│   ├── landing/               # 🆕 The Marketing Face
│   │   └── components/
│   └── metadata/              # 🆕 The Knowledge Graph
│       └── components/
│
└── components/                 # ⚠️ Should be minimal (shell, shared only)
    ├── shell/                  # ✅ App shell (stays)
    ├── canon/                  # ✅ Canon-specific (stays)
    └── ui/                     # ✅ Radix primitives (stays)
```

---

## ✅ Migration Status

### **Phase 1: Bio Components → Package** ✅

- [x] Moved `ZodBioObject.tsx` → `packages/bioskin/src/ZodBioObject.tsx`
- [x] Moved `ZodSchemaIntrospector.ts` → `packages/bioskin/src/ZodSchemaIntrospector.ts`
- [x] Moved `ZodBioDemo.tsx` → `packages/bioskin/src/ZodBioDemo.tsx`
- [x] Updated `packages/bioskin/src/index.ts` exports
- [x] Updated imports in `app/bio-demo/page.tsx`
- [x] Updated imports in `src/modules/payment/components/PaymentTableGenerative.tsx`

**Import Changes:**
- `@/components/bio/ZodBioObject` → `@aibos/bioskin`
- `@/components/bio/ZodBioDemo` → `@aibos/bioskin`

---

### **Phase 2: Simulation Module** ✅

**Target:** `src/modules/simulation/components/`

**Status:** ✅ **COMPLETE**

**Files Moved:**
- ✅ `src/components/simulation/StabilitySimulation.tsx` → `src/modules/simulation/components/StabilitySimulation.tsx`
- ✅ `src/components/simulation/useSimulationController.ts` → `src/modules/simulation/components/useSimulationController.ts`
- ✅ `src/components/simulation/types.ts` → `src/modules/simulation/components/types.ts`
- ✅ `src/components/simulation/primitives/` → `src/modules/simulation/components/primitives/`
- ✅ `src/components/simulation/index.ts` → `src/modules/simulation/components/index.ts`

**Import Updates:**
- ✅ `src/views/LandingPage.tsx`: `@/components/simulation` → `@/modules/simulation`

---

### **Phase 3: Landing Module** ✅

**Target:** `src/modules/landing/components/`

**Status:** ✅ **COMPLETE**

**Files Moved:**
- ✅ All files from `src/components/landing/` (25+ files including `__tests__/`)
- ✅ Preserved directory structure

**Import Updates:**
- ✅ `src/views/LandingPage.tsx`: `@/components/landing/*` → `@/modules/landing/components/*`

---

### **Phase 4: Metadata Module** ✅

**Target:** `src/modules/metadata/components/`

**Status:** ✅ **COMPLETE**

**Files Moved:**
- ✅ All files from `src/components/metadata/` (11 files)
- ✅ Created `src/modules/metadata/index.ts` barrel export

**Import Updates:**
- ✅ `src/views/META_02_MetadataGodView.tsx`: `@/components/metadata/*` → `@/modules/metadata/components/*`
- ✅ `src/modules/payment/components/PaymentTable.tsx`: `@/components/metadata/SuperTable` → `@/modules/metadata/components/SuperTable`
- ✅ `src/modules/inventory/INV_01_Dashboard.tsx`: `@/components/metadata/SuperTable` → `@/modules/metadata/components/SuperTable`
- ✅ Fixed relative import in `SuperTable.tsx`: `../nexus/NexusCard` → `@/components/nexus/NexusCard`

---

## 📋 Files That Stay in `src/components/`

### **✅ Shell Components** (App Infrastructure)
- `shell/` - App shell, navigation, error boundaries
- `canon/` - Canon-specific UI components
- `ui/` - Radix UI primitives (stays until moved to `packages/ui/primitives/`)

### **✅ Shared Components** (Cross-Module)
- `motion/` - Animation utilities
- `icons/` - Icon components
- `nexus/` - Nexus-specific components

---

## 🎯 Import Patterns (After Migration)

### **✅ Module Components**
```typescript
// Simulation module
import { StabilitySimulation } from '@/modules/simulation/components'

// Landing module
import { HeroSection } from '@/modules/landing/components'

// Metadata module
import { SuperTable } from '@/modules/metadata/components'
```

### **✅ Package Components**
```typescript
// BioSkin package
import { ZodBioList, ZodBioObject } from '@aibos/bioskin'

// UI package
import { Surface, Txt, Btn } from '@aibos/ui'
```

---

## 📚 Related Documents

- **REF_067_UIComponentRestructuring.md** - UI package restructuring
- **REF_069_SelfConsumeMigration.md** - Self-contained package migration
- **CONT_01_CanonIdentity.md** - Canon Identity Contract

---

*Last Updated: 2025-01-27*  
*Status: 🔄 In Progress — Bio Components Complete*
