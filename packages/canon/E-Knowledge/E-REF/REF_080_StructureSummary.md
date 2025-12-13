# REF_080: Structure Summary — Quick Reference

**Date:** 2025-01-27  
**Status:** 🟢 **ACTIVE**  
**Related:** REF_078 (Hexagonal Structure), REF_079 (Migration Guide)  
**Purpose:** Quick reference for the new hexagonal structure

---

## 🎯 Structure Overview

```
AI-BOS-Finance/
├── app/                    # Next.js routes (thin wrappers)
├── src/
│   ├── domain/            # 🎯 Hexagonal Core (pure business logic)
│   ├── features/          # 🧩 Feature Components (React + Domain)
│   ├── infrastructure/    # 🔧 Adapters (API, DB, Cache)
│   └── lib/              # 🛠️ Shared utilities
├── packages/              # 📦 Shared packages (UI, BioSkin)
└── canon/                # 📜 Governance
```

---

## 📁 Directory Purposes

### `src/domain/` - Hexagonal Core
**Purpose:** Pure business logic, zero framework dependencies

```
domain/
└── payment/
    ├── core/              # Business logic (entities, value objects, services)
    ├── ports/             # Interfaces (what we need)
    └── adapters/          # Implementations (how we get it)
```

**Example:**
```typescript
import { Payment, Money } from '@/domain/payment'
```

---

### `src/features/` - Feature Components
**Purpose:** React components that compose domain + UI

```
features/
└── payment/
    └── payment-hub/      # PAY_01 Feature
        ├── components/   # React components
        ├── hooks/        # React hooks
        ├── schemas/      # Zod schemas (DNA)
        └── actions/      # Server Actions
```

**Example:**
```typescript
import { PaymentHub } from '@/features/payment/payment-hub'
```

---

### `src/infrastructure/` - Adapters
**Purpose:** External integrations (API clients, database, cache)

```
infrastructure/
├── api/                  # API clients
├── database/             # Database adapters
└── cache/               # Caching adapters
```

---

## 🔄 Dependency Flow

```
app/ (Routes)
  ↓ imports
src/features/ (Components)
  ↓ imports
src/domain/*/adapters/ (Implementations)
  ↓ implements
src/domain/*/ports/ (Interfaces)
  ↓ used by
src/domain/*/core/ (Business Logic)
```

**Rules:**
1. ✅ Domain has NO dependencies
2. ✅ Ports depend only on Domain
3. ✅ Adapters implement Ports
4. ✅ Features use Domain + Adapters
5. ✅ App imports Features only

---

## 🧬 Biological Metaphor

```
DNA (Zod Schemas)
  ↓
RNA (Schema Introspector)
  ↓
Proteins (@aibos/ui atoms)
  ↓
Cells (BioSkin components)
  ↓
Tissues (Feature components)
  ↓
Organs (Domain modules)
  ↓
Skin (App routes)
```

---

## 📝 Import Patterns

### ✅ Correct Imports

```typescript
// Domain entities
import { Payment, Money } from '@/domain/payment'

// Feature components
import { PaymentHub } from '@/features/payment/payment-hub'

// UI atoms
import { Surface, Txt, Btn } from '@aibos/ui'

// BioSkin cells
import { BioObject } from '@aibos/bioskin'
```

### ❌ Forbidden Imports

```typescript
// ❌ Domain should NOT import from features
// ❌ Features should NOT import from app
// ❌ Domain should NOT import React/Next.js
```

---

## 🎯 Key Principles

1. **Hexagonal:** Domain isolated from framework
2. **Cell-based:** Biological metaphor (DNA → Skin)
3. **Lego-style:** Composable, reusable pieces
4. **Next.js:** Route groups, thin wrappers, colocation

---

**End of Summary**
