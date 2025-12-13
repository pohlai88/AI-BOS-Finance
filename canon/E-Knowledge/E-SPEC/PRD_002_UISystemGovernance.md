# PRD_002: The AIBOS UI Constitution

**Status:** ACTIVE  
**Version:** 1.0.0  
**Date:** 2025-01-27  
**Type:** SPEC (Product Requirements Document)  
**Domain:** UI System Governance

---

## 📜 Vision: The "Dual-Core" Architecture

We do not build "A Table." We build a system that supports **two modes of existence**.

### Mode A: The Solid Core (Mechanical)

**Philosophy:** "I need total control."

**Use Case:** Highly complex, bespoke features (e.g., The Radar, The Simulation).

**Building Blocks:** `packages/ui` (Atoms & Primitives).

**When to Use:**
- Custom interactions (drag-and-drop, complex animations)
- Domain-specific visualizations (radar displays, simulation grids)
- One-off features that don't fit standard patterns

**Example:**
```tsx
// Custom radar visualization - uses atoms directly
import { Surface, Txt } from '@aibos/ui'

export function ThreatRadar() {
  return (
    <Surface>
      <Txt>Custom radar implementation</Txt>
      {/* Custom SVG, canvas, or complex interactions */}
    </Surface>
  )
}
```

### Mode B: The BioSkin (Biological)

**Philosophy:** "I need speed and consistency."

**Use Case:** 80% of the app (CRUD, Admin Panels, Lists).

**Building Blocks:** `packages/bioskin` (Generative Cells).

**When to Use:**
- Standard CRUD operations
- Admin panels and data tables
- Forms and validation
- List views and detail pages

**Example:**
```tsx
// Standard data table - uses BioSkin
import { BioTable } from '@aibos/bioskin'
import { paymentSchema } from '@/modules/payment/data'

export function PaymentList() {
  return <BioTable schema={paymentSchema} data={payments} />
}
```

---

## 🏷️ Taxonomy & Naming Protocols

We stop the "Synonym Wars" (Button vs Btn, Text vs Typography).

### Atoms (3 Letters): High-usage, dumb primitives

**Rule:** High-usage, dumb primitives get 3-letter names.

**Examples:**
- `Btn` (Button)
- `Txt` (Typography)
- `Img` (Image)
- `Box` (Layout Container)

**Why?** Easy to type, easy to distinguish from HTML tags (`<button>` vs `<Btn>`).

**Location:** `packages/ui/src/atoms/`

### Molecules (Full Names): Functional groups

**Rule:** Functional component groups get descriptive full names.

**Examples:**
- `SearchInput`
- `StatusBadge`
- `UserCard`
- `PaymentTable`

**Why?** Clarity and discoverability. These are domain-specific compositions.

**Location:** `src/modules/{domain}/components/` or `src/components/nexus/`

### Bio Components (Prefix): Self-assembling components

**Rule:** Generative, schema-driven components get `Bio` prefix.

**Examples:**
- `BioTable`
- `BioForm`
- `BioModal`
- `BioList`

**Why?** Clearly indicates these are generative components that assemble from schemas.

**Location:** `packages/bioskin/src/`

---

## 🔒 Version Control & Release Strategy

We treat `packages/ui` like a third-party library (like Material UI), even though it is internal.

### The "SemVer" Rule

**Patch (1.0.x):** Changing a color token (Safe)
- ✅ Updating `--action-primary` value
- ✅ Fixing a bug in existing component
- ✅ Adding new CSS variable

**Minor (1.x.0):** Adding a new component (Safe)
- ✅ Adding `BioCalendar` to `@aibos/bioskin`
- ✅ Adding `Surface` variant to `@aibos/ui`
- ✅ Adding new utility function

**Major (x.0.0):** Renaming props or moving files (Breaking)
- ❌ Renaming `Btn` to `Button`
- ❌ Moving `Surface` from `atoms/` to `primitives/`
- ❌ Changing prop API (`variant` → `style`)

### The "Lock" Rule

**The apps/web consumes packages/ui.**

**We NEVER edit `packages/ui` to fix a bug in `apps/web` specifically. We fix it generically.**

**Example:**
```tsx
// ❌ WRONG: Fixing PaymentTable-specific issue in packages/ui
// packages/ui/src/atoms/Btn.tsx
if (props.paymentSpecific) { /* hack */ }

// ✅ CORRECT: Fixing generically in packages/ui
// packages/ui/src/atoms/Btn.tsx
if (props.variant === 'payment') { /* generic solution */ }

// OR: Fixing in the consuming module
// src/modules/payment/components/PaymentTable.tsx
<Btn variant="payment" {...paymentSpecificProps} />
```

---

## 🎮 Interaction Standards (DND & "Heavy" UI)

You mentioned Drag-and-Drop (DND). This is a **"Heavy Interaction."**

### The "Library" Rule

**We do not write DND from scratch.**

**Standard:** `@dnd-kit/core` (Headless, accessible)

**Why?** Accessibility, browser compatibility, and maintenance burden.

**Example:**
```tsx
import { DndContext, Draggable, Droppable } from '@dnd-kit/core'

export function KanbanBoard() {
  return (
    <DndContext>
      {/* Kanban implementation */}
    </DndContext>
  )
}
```

### The "Interaction Shell" Rule

**Complex interactions (Kanban boards, Resizable panels) must be wrapped in a Shell Component.**

**They are never inline.**

**Pattern:**
```tsx
// ✅ CORRECT: Wrapped in Shell Component
// src/modules/metadata/components/KanbanShell.tsx
export function KanbanShell({ children, ...props }) {
  return (
    <DndContext>
      <ResizablePanelGroup>
        {children}
      </ResizablePanelGroup>
    </DndContext>
  )
}

// Usage
<KanbanShell>
  <KanbanColumn />
  <KanbanColumn />
</KanbanShell>

// ❌ WRONG: Inline DND
export function MetadataPage() {
  return (
    <DndContext> {/* Should be in KanbanShell */}
      <div>...</div>
    </DndContext>
  )
}
```

**Shell Components:**
- `KanbanShell` - Drag-and-drop kanban boards
- `ResizableShell` - Resizable panel groups
- `SortableShell` - Sortable lists
- `FormShell` - Complex form interactions

**Location:** `src/modules/{domain}/components/{Feature}Shell.tsx`

---

## ✅ "Definition of Done" (Expectations)

A component is not "Done" when it looks good. It is **Done** when:

### 1. Governed

**It uses only tokens from `app/globals.css`.**

**No hardcoded colors, spacing, or typography.**

```tsx
// ❌ NOT DONE
<div className="bg-[#0A0A0A] text-[#28E7A2]">

// ✅ DONE
<div className="bg-surface-base text-action-primary">
```

**Verification:** Run `HARDCODED_VALUES_REPORT.md` audit.

### 2. Isolated

**It imports nothing from `src/`.**

**Exception:** Module-specific components can import from their own module.

```tsx
// ❌ NOT DONE (packages/ui component)
import { useRouterAdapter } from '@/hooks/useRouterAdapter'

// ✅ DONE (packages/ui component)
// No imports from src/

// ✅ DONE (module component)
import { usePaymentApproval } from '../hooks/usePaymentApproval'
```

### 3. Documented

**It has a Storybook entry.**

**Location:** `packages/ui/src/atoms/{Component}.stories.tsx` or component directory.

**Minimum Requirements:**
- Basic usage example
- All variant demonstrations
- Props documentation

### 4. Accessible

**It supports Keyboard Navigation (Tab/Enter).**

**Requirements:**
- Focusable elements are keyboard accessible
- Focus indicators visible
- ARIA labels where needed
- Screen reader friendly

**Verification:** Test with keyboard only, test with screen reader.

---

## 🚀 Implementation Checklist

### For New Components

- [ ] Uses only design tokens from `app/globals.css`
- [ ] No imports from `src/` (except module-specific)
- [ ] Storybook entry created
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Follows naming convention (Atom/Molecule/Bio)
- [ ] Version documented (if in `packages/ui`)

### For Existing Components (Migration)

- [ ] Audit hardcoded values (see `HARDCODED_VALUES_REPORT.md`)
- [ ] Replace hex colors with tokens
- [ ] Replace hardcoded spacing with tokens
- [ ] Update imports to use `@aibos/ui` or `@aibos/bioskin`
- [ ] Add Storybook entry if missing
- [ ] Verify accessibility

---

## 📋 Decision Matrix

### "Should I use BioSkin or build custom?"

| Criteria | Use BioSkin | Build Custom |
|----------|-------------|--------------|
| **Standard CRUD** | ✅ Yes | ❌ No |
| **Custom interactions** | ❌ No | ✅ Yes |
| **Schema-driven** | ✅ Yes | ❌ No |
| **One-off feature** | ❌ No | ✅ Yes |
| **80% use case** | ✅ Yes | ❌ No |
| **20% edge case** | ❌ No | ✅ Yes |

### "Should I use Atom or Molecule?"

| Criteria | Atom (3-letter) | Molecule (Full name) |
|----------|-----------------|----------------------|
| **High usage** | ✅ Yes | ❌ No |
| **Dumb primitive** | ✅ Yes | ❌ No |
| **Domain-specific** | ❌ No | ✅ Yes |
| **Composition** | ❌ No | ✅ Yes |

---

## 🎯 Immediate "North Star" Actions

1. **Audit Existing Components** - Use `HARDCODED_VALUES_REPORT.md`
2. **Convert High-Priority Files** - Start with shell and table components
3. **Add ESLint Rule** - Prevent new hardcoded hex colors
4. **Update Component Library** - Ensure `packages/ui` uses tokens exclusively
5. **Document Token Usage** - Create component guidelines

---

## 📚 Related Documents

- `HARDCODED_VALUES_REPORT.md` - Audit of hardcoded values
- `SRC_DIRECTORY_TREE.md` - Directory structure
- `app/globals.css` - Design tokens source of truth
- `packages/ui/README.md` - UI package documentation
- `packages/bioskin/README.md` - BioSkin package documentation

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial PRD - UI System Governance |

---

**This document serves as the "Judge" for every future code decision. If the code violates the PRD, the code is wrong.**
