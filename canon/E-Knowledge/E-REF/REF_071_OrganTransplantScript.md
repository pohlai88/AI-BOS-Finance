# REF_071: Organ Transplant Migration Script

**Date:** 2025-01-27  
**Status:** 📋 **MIGRATION GUIDE**  
**Purpose:** Step-by-step script for moving components to module homes

---

## 🎯 Migration Strategy

This document provides the exact commands and file operations needed to complete the "Organ Transplant" migration.

---

## ✅ Phase 1: Bio Components (COMPLETE)

**Status:** ✅ **DONE**

- [x] Moved to `packages/bioskin/src/`
- [x] Updated imports
- [x] Updated exports

---

## 🔄 Phase 2: Simulation Module

### **Step 1: Create Module Structure**
```bash
mkdir -p src/modules/simulation/components/primitives
```

### **Step 2: Move Files**
```bash
# Main files
mv src/components/simulation/StabilitySimulation.tsx src/modules/simulation/components/
mv src/components/simulation/useSimulationController.ts src/modules/simulation/components/
mv src/components/simulation/types.ts src/modules/simulation/components/
mv src/components/simulation/index.ts src/modules/simulation/components/

# Primitives
mv src/components/simulation/primitives/* src/modules/simulation/components/primitives/
```

### **Step 3: Update Imports**

**Files to Update:**
- `src/modules/simulation/components/StabilitySimulation.tsx`
  - `./useSimulationController` → `./useSimulationController` (same)
  - `./primitives` → `./primitives` (same)

- `src/views/LandingPage.tsx`
  - `@/components/simulation` → `@/modules/simulation/components`

- `src/components/landing/StabilitySimulation.tsx` (if different)
  - Check if this is duplicate or different

---

## 🔄 Phase 3: Landing Module

### **Step 1: Create Module Structure**
```bash
mkdir -p src/modules/landing/components
mkdir -p src/modules/landing/components/__tests__
```

### **Step 2: Move Files**
```bash
# Move all landing components
mv src/components/landing/*.tsx src/modules/landing/components/
mv src/components/landing/*.ts src/modules/landing/components/
mv src/components/landing/__tests__/* src/modules/landing/components/__tests__/
```

### **Step 3: Update Imports**

**Files to Update:**
- `src/views/LandingPage.tsx`
  - `@/components/landing/*` → `@/modules/landing/components/*`

---

## 🔄 Phase 4: Metadata Module

### **Step 1: Create Module Structure**
```bash
mkdir -p src/modules/metadata/components
```

### **Step 2: Move Files**
```bash
mv src/components/metadata/* src/modules/metadata/components/
```

### **Step 3: Update Imports**

**Files to Update:**
- `src/views/META_02_MetadataGodView.tsx`
  - `@/components/metadata/*` → `@/modules/metadata/components/*`

- `src/modules/payment/components/PaymentTable.tsx`
  - `@/components/metadata/SuperTable` → `@/modules/metadata/components/SuperTable`

- `src/modules/inventory/INV_01_Dashboard.tsx`
  - `@/components/metadata/SuperTable` → `@/modules/metadata/components/SuperTable`

---

## 📋 Import Update Patterns

### **Simulation**
```typescript
// ❌ BEFORE
import { StabilitySimulation } from '@/components/simulation'

// ✅ AFTER
import { StabilitySimulation } from '@/modules/simulation/components'
```

### **Landing**
```typescript
// ❌ BEFORE
import { HeroSection } from '@/components/landing/HeroSection'

// ✅ AFTER
import { HeroSection } from '@/modules/landing/components/HeroSection'
```

### **Metadata**
```typescript
// ❌ BEFORE
import { SuperTable } from '@/components/metadata/SuperTable'

// ✅ AFTER
import { SuperTable } from '@/modules/metadata/components/SuperTable'
```

### **Bio (Already Done)**
```typescript
// ❌ BEFORE
import { ZodBioList } from '@/components/bio/ZodBioObject'

// ✅ AFTER
import { ZodBioList } from '@aibos/bioskin'
```

---

## 🧹 Cleanup

After migration:
```bash
# Remove empty directories
rmdir src/components/simulation
rmdir src/components/landing
rmdir src/components/metadata
rmdir src/components/bio
```

---

## ✅ Verification Checklist

- [ ] All files moved to module homes
- [ ] All imports updated
- [ ] No broken imports
- [ ] Empty directories removed
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server works (`npm run dev`)

---

*Last Updated: 2025-01-27*  
*Status: 📋 Migration Guide — Ready for Execution*
