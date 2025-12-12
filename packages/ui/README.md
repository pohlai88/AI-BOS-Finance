# @aibos/ui - Self-Contained UI Components Package

**Version:** 1.0.0  
**Status:** ✅ **Production Ready**  
**Purpose:** The "Proteins" layer - Governed atomic building blocks

---

## 🎯 Overview

This package is **completely self-contained** and forms the foundation of the design system. All components follow the "Biological Monorepo" architecture where:

- **DNA (Schemas)** → `canon/C-DataLogic/`
- **Proteins (Atoms)** → `@aibos/ui` (this package)
- **Cells (BioSkin)** → `@aibos/bioskin`
- **Tissue (Domain)** → `src/components`
- **Skin (Pages)** → `app/`

### **Self-Contained Structure**

```
packages/ui/
├── lib/utils.ts      # The Brain (cn utility)
├── atoms/            # Governed Components
└── primitives/       # Radix UI Wrappers
```

**✅ Zero dependencies on `src/`**  
**✅ True hexagonal, cell-based architecture**  
**✅ Lego-style modularity**

---

## 📦 Installation

This is a workspace package. No installation needed - it's automatically available via TypeScript path aliases.

---

## 🚀 Usage

### **Atomic Components**
```typescript
import { Surface, Txt, Btn, Input, StatusDot } from '@aibos/ui'
```

### **Radix Primitives**
```typescript
import { Badge, Card, Dialog, ScrollArea, Separator, Popover } from '@aibos/ui'
```

### **Utilities**
```typescript
import { cn } from '@aibos/ui'
```

---

## 🧩 Components

### **Surface**
Container component for cards, panels, and surfaces.

```tsx
<Surface variant="base" className="p-6">
  Content here
</Surface>
```

**Variants:** `base` | `flat` | `ghost`

---

### **Txt**
Typography component with semantic variants.

```tsx
<Txt variant="h1">Main Title</Txt>
<Txt variant="body">Body text</Txt>
<Txt variant="subtle">Subtle text</Txt>
```

**Variants:** `h1` | `h2` | `h3` | `h4` | `body` | `subtle` | `small`

---

### **Btn**
Action button component with loading and disabled states.

```tsx
<Btn variant="primary" size="md" onClick={handleClick}>
  Submit
</Btn>
```

**Variants:** `primary` | `secondary`  
**Sizes:** `sm` | `md` | `lg`

---

### **Input**
Form input component with perfect form symmetry with Button.

```tsx
<Input placeholder="Search..." size="md" error={hasError} />
```

**Sizes:** `sm` | `md` | `lg` (matches Button sizes exactly)

---

### **StatusDot**
Status indicator dot component.

```tsx
<StatusDot variant="success" size="md" />
```

**Variants:** `success` | `warning` | `error` | `neutral`  
**Sizes:** `sm` | `md` | `lg`

---

## 🛡️ Governance

All components:
- ✅ Use design tokens only (no hardcoded colors)
- ✅ Follow Drift Police rules
- ✅ Are fully accessible (WCAG 2.1 AA)
- ✅ Support dark mode via CSS variables
- ✅ Self-contained (no external dependencies on `src/`)

---

## 🏗️ Architecture

### **Internal Structure**

**Atoms** (`src/atoms/`):
- Governed components that enforce design system rules
- Use internal `lib/utils.ts` for utilities
- Examples: `Surface`, `Txt`, `Btn`, `Input`, `StatusDot`

**Primitives** (`src/primitives/`):
- Radix UI wrappers with design tokens
- Use internal `lib/utils.ts` for utilities
- Examples: `Badge`, `Card`, `Dialog`, `ScrollArea`, `Separator`, `Popover`

**Lib** (`src/lib/`):
- Shared utilities (the "Brain")
- `utils.ts` contains the `cn` function

### **Dependency Flow**

```
lib/utils.ts (Brain)
    ↓
atoms/ (Governed)
    ↓
primitives/ (Radix Wrappers)
    ↓
index.ts (Exports)
    ↓
External Code (src/, app/)
```

**✅ No circular dependencies!**  
**✅ Complete isolation!**

---

## 📚 Related

- **REF_047_AtomicNormalizationSystem.md** - System documentation
- **REF_067_UIComponentRestructuring.md** - Restructuring strategy
- **REF_068_UIRestructuringComplete.md** - Initial implementation
- **REF_069_SelfConsumeMigration.md** - Self-contained migration
- **packages/bioskin/** - Components that use these atoms

---

*Last Updated: 2025-01-27*
