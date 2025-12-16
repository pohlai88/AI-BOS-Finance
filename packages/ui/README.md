# NexusCanon UI System — DUAL ARCHITECTURE

**Version:** 2.4.1  
**Status:** Production Ready → BioSkin Enhancement  
**Architecture:** Biological Monorepo with Dual System

---

## 🧬 DUAL SYSTEM OVERVIEW

Your UI operates as **two complementary systems**:

### System 1: Manual Tokens (Static)
Static design configuration that defines visual language.
```
globals.css (Figma tokens) → Tailwind Config → shadcn/ui → Nexus Components
```

### System 2: Bio Transform Self (Dynamic)
Generative UI that auto-renders from schema definitions.
```
DNA (Zod Schemas) → RNA (Introspector) → Proteins (@aibos/ui) → Cells (@aibos/bioskin) → Skin (App)
```

---

## 🎯 Current State

### ✅ System 1: Manual Tokens (Implemented)
- ✅ **CSS Design Tokens** - `globals.css` with Figma mapping
- ✅ **48 shadcn/ui components** - Radix UI primitives
- ✅ **Nexus Components** - Forensic aesthetic (NexusCard, NexusButton)
- ✅ **Canon Components** - COMP_* with COMPONENT_META governance
- ✅ **Tailwind Semantic Classes** - `bg-surface-card`, `border-default`

### ⏳ System 2: Bio Transform Self (Partial)
- ✅ **DNA Layer** - `packages/schemas` (Zod schemas)
- ✅ **Self-Teaching Directory** - `packages/canon` (A→E planes)
- ✅ **Schema-First Architecture** - Documented in SCHEMA_FIRST_ARCHITECTURE.md
- ⏳ **RNA Layer** - Schema Introspector (PLANNED)
- ⏳ **Proteins** - `@aibos/ui` atoms: Surface, Txt, Btn (PLANNED)
- ⏳ **Cells** - `@aibos/bioskin` components: BioObject (PLANNED)

### Architecture
```
apps/web/
├── src/components/ui/        # shadcn/ui primitives (48 components)
├── src/components/canon/      # COMP_* governed components
├── src/components/nexus/       # NexusCanon branded components
└── src/styles/globals.css    # Design tokens (SSOT)

packages/
├── schemas/                   # DNA Layer (Zod schemas)
├── canon/                     # Self-Teaching Directory
│   ├── A-Governance/          # Contracts, ADRs
│   ├── B-Functional/          # Pages, Components, Cells
│   ├── C-DataLogic/           # Entities, Schemas, Policies
│   ├── D-Operations/          # Tools, Migrations
│   └── E-Knowledge/           # Specs, References
├── ui/                        # Component registry
├── ui-atoms/                  # @aibos/ui (PLANNED)
└── bioskin/                   # @aibos/bioskin (PLANNED)
```

---

## 🚀 Next-Level Roadmap

### Phase 0: Complete Bio System (PRIORITY)
1. ⏳ **@aibos/ui-atoms** - Surface, Txt, Btn primitives
2. ⏳ **@aibos/bioskin** - BioObject, BioForm, BioTable
3. ⏳ **Schema Introspector** - Zod → UI translation

### Phase 1: Foundation (Week 2-3)
1. ✅ **Component Registry** - Auto-discover all COMP_* components
2. ⏳ **Design Token Automation** - Figma → CSS sync
3. ⏳ **Component Testing** - Visual regression tests

### Phase 2: Developer Experience (Week 3-4)
1. ⏳ **Storybook** - Isolated component development
2. ⏳ **Documentation Site** - Unified component docs
3. ⏳ **Form Builder** - Schema-driven forms (via BioForm)

### Phase 3: Advanced (Week 5-6)
1. ⏳ **Multi-Theme** - Theme variants
2. ⏳ **Motion System** - Animation library
3. ⏳ **Data Visualization** - Enhanced charts

---

## 📚 Quick Links

- **Design System:** `apps/web/src/docs/02-design-system/DESIGN_SYSTEM.md`
- **Component Catalog:** `/app/components` (NEW)
- **Design Tokens:** `apps/web/src/styles/globals.css`
- **Canon Governance:** `packages/canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md`

---

## 🎨 Design Tokens

All design decisions flow from CSS variables in `globals.css`:

```css
--color-primary: #28E7A2;        /* Nexus Green */
--color-background: #0A0A0A;     /* Void */
--spacing-layout-md: 1.5rem;     /* 24px - 4px grid */
--text-body: 1rem;               /* 16px - minimum 12px */
```

**Rule:** Never hardcode colors or spacing. Always use design tokens.

---

## 📦 Component Structure

### shadcn/ui Primitives
Located in: `apps/web/src/components/ui/`

These are **ungoverned** Radix UI primitives. Use them as building blocks.

### COMP_* Governed Components
Located in: `apps/web/src/components/canon/` or `packages/ui/canon/`

These **MUST** have `COMPONENT_META`:

```typescript
export const COMPONENT_META = {
  code: 'COMP_StatCard',
  version: '1.0.0',
  family: 'CARD',
  purpose: 'METRICS',
  status: 'active',
} as const;
```

### NexusCanon Branded Components
Located in: `apps/web/src/components/nexus/`

Custom components with forensic aesthetic (NexusCard, NexusButton, etc.)

---

## 🔍 Component Discovery

**NEW:** Use the Component Catalog at `/app/components` to:
- Browse all available components
- See usage examples
- Check component status
- Find component files

**Coming Soon:**
- Storybook integration
- Interactive prop playground
- Usage analytics

---

## 📖 Usage Guidelines

### 1. Choose the Right Component

```
Need a table? → Use COMP_TBLM01 or COMP_TBLL01 (not raw @tanstack/react-table)
Need a card? → Use COMP_StatCard or Card from shadcn/ui
Need a form? → Use COMP_FormBuilder (coming soon)
```

### 2. Follow Design Tokens

```tsx
// ✅ DO
<div className="bg-background text-foreground p-layout-md">
  <h2 className="text-heading">Title</h2>
</div>

// ❌ DON'T
<div className="bg-[#0A0A0A] text-white p-[24px]">
  <h2 className="text-[32px]">Title</h2>
</div>
```

### 3. Canon Governance

All COMP_* components must:
- Have `COMPONENT_META` export
- Follow naming convention (COMP_Code)
- Be registered in component catalog
- Have TypeScript types
- Include ARIA labels

---

## 🛠️ Development

### Adding a New Component

1. Create component file: `packages/ui/canon/COMP_XXX_ComponentName.tsx`
2. Add `COMPONENT_META` export
3. Use design tokens (no hardcoded values)
4. Add ARIA labels for accessibility
5. Component will auto-appear in catalog

### Testing Components

```bash
# Visual regression tests (coming soon)
pnpm test:visual

# Component unit tests
pnpm test components
```

---

## 📊 Component Statistics

**Current:**
- Total Components: ~50+ (shadcn + custom)
- Governed (COMP_*): ~10
- Status: Active ✅

**Target:**
- Governed Components: 30+
- Test Coverage: 95%+
- Documentation: 100%

---

## 🎯 Next Steps

1. **Review** `docs/guides/UI_SYSTEM_NEXT_LEVEL.md` for full roadmap
2. **Explore** `/app/components` to see component catalog
3. **Start** with Component Registry (already created)
4. **Plan** Storybook integration

---

**Last Updated:** 2024-12-16  
**Maintainer:** AI-BOS Architecture Team
