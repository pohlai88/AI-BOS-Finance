# REF_072: Biological Monorepo Architecture — The New World Order

**Date:** 2025-01-27  
**Status:** 🟢 **ACTIVE**  
**Related:** REF_067_UIComponentRestructuring, REF_069_SelfConsumeMigration, REF_070_OrganTransplantMigration  
**Purpose:** Reference guide for the Biological Monorepo architecture

---

## 🧬 The Biological Metaphor

Your codebase is structured like a **living organism**, where each layer has a specific biological role:

| Location | Biological Name | Function | Dependency Flow |
| :--- | :--- | :--- | :--- |
| **`packages/ui`** | **Proteins** | Governed atomic components (`Btn`, `Surface`, `Txt`). Dumb & Safe. | ✅ **No dependencies** (self-contained) |
| **`packages/bioskin`** | **Cells** | Generative UI engine (`BioCell`, `ZodBioObject`). Smart & Adaptive. | ✅ Depends on `@aibos/ui` |
| **`src/modules/`** | **Organs** | Business features (`Payment`, `Simulation`, `Landing`). Complex. | ✅ Depends on `@aibos/bioskin`, `@aibos/ui` |
| **`src/app/`** | **Skin** | Next.js routes. Thin & Declarative. | ✅ Depends on `src/modules/` |
| **`src/components`** | **Deprecated** | 🚫 **EMPTY** (Do not put files here) | ❌ **FORBIDDEN** |

---

## 📁 Directory Structure

```
AI-BOS-Finance/
├── packages/
│   ├── ui/                    # 🧬 PROTEINS (Atoms)
│   │   ├── src/
│   │   │   ├── atoms/         # Surface, Txt, Btn, Input, StatusDot
│   │   │   ├── primitives/    # Radix UI wrappers (Dialog, Popover, etc.)
│   │   │   └── lib/
│   │   │       └── utils.ts  # cn() utility (The Brain)
│   │   └── package.json
│   │
│   └── bioskin/               # 🧬 CELLS (Generative Engine)
│       ├── src/
│       │   ├── BioCell.tsx
│       │   ├── BioObject.tsx
│       │   ├── BioList.tsx
│       │   ├── ZodBioObject.tsx    # Zod → UI translator
│       │   ├── ZodSchemaIntrospector.ts  # RNA translator
│       │   └── types.ts
│       └── package.json
│
├── src/
│   ├── modules/               # 🧬 ORGANS (Business Features)
│   │   ├── payment/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   └── PAY_01_PaymentHub.tsx
│   │   │
│   │   ├── simulation/        # ✅ Migrated
│   │   │   ├── components/
│   │   │   │   ├── StabilitySimulation.tsx
│   │   │   │   ├── useSimulationController.ts
│   │   │   │   ├── types.ts
│   │   │   │   └── primitives/
│   │   │   └── index.ts
│   │   │
│   │   ├── landing/           # ⚠️ Pending migration
│   │   │   └── components/
│   │   │
│   │   ├── metadata/          # ⚠️ Pending migration
│   │   │   └── components/
│   │   │
│   │   └── inventory/
│   │
│   ├── app/                   # 🧬 SKIN (Routes)
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── payment/
│   │   └── bioskin-demo/
│   │
│   └── components/            # 🚫 DEPRECATED (Should be empty)
│       ├── shell/             # ✅ App shell (stays)
│       ├── canon/              # ✅ Canon-specific (stays)
│       └── ui/                 # ⚠️ Radix primitives (move to packages/ui)
│
└── canon/                     # 📚 GOVERNANCE (Read-only)
    ├── contracts/
    ├── registry/
    └── E-Knowledge/
```

---

## 🔄 Import Patterns

### **✅ Correct Import Patterns**

```typescript
// ✅ From UI Package (Proteins)
import { Surface, Txt, Btn, Input, StatusDot } from '@aibos/ui'
import { cn } from '@aibos/ui/lib/utils'

// ✅ From BioSkin Package (Cells)
import { ZodBioList, ZodBioObject } from '@aibos/bioskin'
import { BioCell, BioObject } from '@aibos/bioskin'

// ✅ From Modules (Organs)
import { StabilitySimulation } from '@/modules/simulation'
import { PaymentTableGenerative } from '@/modules/payment/components'

// ✅ From Routes (Skin)
// app/page.tsx imports from modules
```

### **❌ Forbidden Import Patterns**

```typescript
// ❌ NEVER import from deprecated src/components/
import { Something } from '@/components/landing'  // ❌ FORBIDDEN
import { Something } from '@/components/metadata'   // ❌ FORBIDDEN
import { Something } from '@/components/bio'         // ❌ FORBIDDEN

// ❌ NEVER import atoms from old locations
import { Surface } from '@/components/ui/Surface'   // ❌ Use @aibos/ui
import { cn } from '@/lib/utils'                    // ❌ Use @aibos/ui/lib/utils
```

---

## 🛡️ Dependency Rules

### **Rule 1: One-Way Flow**
```
packages/ui → packages/bioskin → src/modules → src/app
```

**Never reverse:**
- ❌ `packages/ui` should NEVER import from `src/modules`
- ❌ `packages/bioskin` should NEVER import from `src/modules`
- ❌ `src/modules` should NEVER import from `src/app`

### **Rule 2: Self-Contained Packages**
- ✅ `packages/ui` is **completely self-contained** (has its own `cn`, primitives)
- ✅ `packages/bioskin` only depends on `@aibos/ui` (no `src/` dependencies)

### **Rule 3: Module Isolation**
- ✅ Each module in `src/modules/` is self-contained
- ✅ Modules communicate via shared packages (`@aibos/ui`, `@aibos/bioskin`)
- ✅ Modules do NOT import from other modules directly

---

## 🧬 The Generative UI Flow

### **DNA → RNA → Proteins → Cells → Organs → Skin**

```
┌─────────────────┐
│  Zod Schema     │ ← DNA (Structure)
│  (z.object)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Introspector   │ ← RNA (Translator)
│  (Zod → Kernel) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ExtendedMetadata│ ← Kernel Format
│ Field[]         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BioObject      │ ← Cell (Component)
│  BioList        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Atomic UI      │ ← Proteins (Atoms)
│  (Surface, Txt, │
│   Input, etc.)  │
└─────────────────┘
```

---

## 📋 Migration Checklist

### **✅ Completed**
- [x] Bio components → `packages/bioskin/src/`
- [x] Simulation module → `src/modules/simulation/components/`
- [x] UI package self-contained (`packages/ui`)
- [x] BioSkin package exports Zod components
- [x] Import paths updated for migrated modules

### **⚠️ Pending (Manual)**
- [ ] Landing module → `src/modules/landing/components/`
- [ ] Metadata module → `src/modules/metadata/components/`
- [ ] Update imports for Landing & Metadata
- [ ] Remove empty `src/components/landing/` and `src/components/metadata/`
- [ ] Remove empty `src/components/bio/` (if exists)

---

## 🚀 Quick Reference

### **Creating a New Feature Module**

```bash
# 1. Create module structure
mkdir -p src/modules/my-feature/components
mkdir -p src/modules/my-feature/hooks
mkdir -p src/modules/my-feature/schemas

# 2. Create components
# src/modules/my-feature/components/MyComponent.tsx
import { Surface, Txt, Btn } from '@aibos/ui'
import { ZodBioList } from '@aibos/bioskin'

# 3. Create route
# src/app/my-feature/page.tsx
import { MyFeature } from '@/modules/my-feature/components'
```

### **Using Generative UI**

```typescript
// 1. Define Schema (DNA)
const MySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
})

// 2. Render UI (Skin grows from DNA)
<ZodBioList schema={MySchema} data={myData} />
```

---

## 🎯 Key Principles

1. **Self-Consume Within Boundaries:** Packages manage their own dependencies
2. **Do Not Cross Boundaries:** Modules don't import from other modules
3. **Hexagonal Architecture:** Clear dependency flow (packages → modules → app)
4. **Molecularity:** Each component is a "cell" (isolated, composable)
5. **Lego-Style:** Components are truly modular and reusable

---

## 📚 Related Documents

- **REF_067_UIComponentRestructuring.md** - UI package creation
- **REF_069_SelfConsumeMigration.md** - Self-contained package migration
- **REF_070_OrganTransplantMigration.md** - Module migration guide
- **CONT_01_CanonIdentity.md** - Canon Identity Contract

---

*Last Updated: 2025-01-27*  
*Status: 🟢 **ACTIVE ARCHITECTURE** — The Biological Monorepo is alive.*
