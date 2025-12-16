# 🧬 BIOSKIN 1.0 — Production UI/UX System

**Project Type:** Infrastructure / Design System  
**Priority:** P0 — Foundation for all future UI work  
**Duration:** 4 Sprints (8 weeks)  
**Owner:** AI-BOS Engineering  
**Version:** 2.0 (Hexagonal Architecture)  
**Governance:** CONT_10_BioSkinArchitecture.md

---

## 1) Purpose

BioSkin 1.0 creates a **single governed UI cell** following hexagonal architecture principles:
- ONE package (`@aibos/bioskin`) for ALL governed UI
- Reduces manual UI work by 80%+
- Enforces **GSS/token compliance** (zero hardcoded colors)
- Standardizes list → detail → edit flows via **Side Sheet**
- Meets baseline **a11y, responsive, testing, docs** requirements

---

## 2) Architecture (Hexagonal Cell)

### The Three Zones

| Zone | Location | Governance | Rule |
|------|----------|------------|------|
| **Governed UI** | `packages/bioskin/` | BioSkin Team | ALL shared UI here |
| **External UI** | `apps/web/src/components/ui/` | shadcn/ui | DO NOT modify |
| **Routing Only** | `apps/web/app/` | Feature Teams | NO components, only pages |

### The Single Governed Cell

```
packages/bioskin/                      # THE SINGLE UI CELL
├── src/
│   ├── atoms/                         # Layer 1 - Primitives
│   │   ├── Surface.tsx
│   │   ├── Txt.tsx
│   │   ├── Btn.tsx
│   │   ├── Field.tsx
│   │   ├── Icon.tsx
│   │   ├── Stack.tsx
│   │   ├── Grid.tsx
│   │   └── Divider.tsx
│   │
│   ├── molecules/                     # Layer 2 - Composed
│   │   ├── StatusBadge.tsx
│   │   ├── DetailSheet.tsx
│   │   ├── ActionMenu.tsx
│   │   ├── StatCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingState.tsx
│   │   └── ErrorState.tsx
│   │
│   ├── organisms/                     # Layer 3 - Schema-driven
│   │   ├── BioTable/
│   │   ├── BioForm/
│   │   └── BioObject/
│   │
│   ├── introspector/                  # Layer 0 - Schema processing
│   │   └── ZodSchemaIntrospector.ts
│   │
│   └── index.ts                       # SINGLE EXPORT SURFACE
│
└── package.json                       # @aibos/bioskin
```

### Single Import Pattern

```typescript
// ✅ CORRECT - Single import from governed cell
import { 
  Surface, Txt, Btn,           // atoms
  StatusBadge, DetailSheet,     // molecules
  BioTable, BioForm, BioObject  // organisms
} from '@aibos/bioskin';

// ❌ WRONG - Multiple scattered imports
import { Surface } from '@aibos/ui-atoms';       // OLD - DEPRECATED
import { StatusBadge } from '@/components/canon'; // OLD - DEPRECATED
```

---

## 3) Scope

### In-Scope for 1.0 (MUST Ship)

| Component | Layer | Features |
|-----------|-------|----------|
| **atoms/** | 1 | Surface, Txt, Btn, Field, Icon, Stack, Grid, Divider |
| **molecules/** | 2 | StatusBadge, DetailSheet, ActionMenu, StatCard, EmptyState, LoadingState, ErrorState |
| **organisms/** | 3 | BioTable (sort, filter, paginate), BioForm (validate), BioObject (detail view) |
| **introspector/** | 0 | ZodSchemaIntrospector |

### Explicitly Out-of-Scope for 1.0 (Move to 1.1)

| Item | Reason |
|------|--------|
| BioChart | Advanced analytics - separate effort |
| Excel export | CSV acceptable first |
| Complex conditional form logic | Beyond basic show/hide |
| Virtualization (10k+ rows) | Define path only, implement in 1.1 |

---

## 4) Core Dependencies

| Layer | Technology | Purpose |
|-------|------------|---------|
| Schema | **Zod** | Runtime validation + UI introspection |
| Primitives | **Radix UI** via shadcn/ui | Accessible, unstyled components |
| Styling | **Tailwind CSS** + GSS Tokens | Design system enforcement |
| State | **React 19** + Server Components | Performance & data fetching |

---

## 5) Functional Requirements (FR)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **FR1** | Schema introspection | Zod schema → field map (type, label, required, enum/options) |
| **FR2** | Column generation | BioTable defaults columns from schema with overrides |
| **FR3** | Sorting | Per-column sorting with controlled + uncontrolled modes |
| **FR4** | Filtering | Global search + per-column filters with debouncing |
| **FR5** | Pagination | Client + server pagination support |
| **FR6** | Responsive behavior | Table → card-stack on small screens |
| **FR7** | Side Sheet detail | Row click opens DetailSheet with BioObject |
| **FR8** | Status semantics | StatusBadge auto-maps values to semantic colors |
| **FR9** | Form generation | BioForm generates fields from schema with validation |
| **FR10** | Extensibility | Per-field overrides without breaking base behavior |
| **FR11** | State handling | Empty/loading/error states consistent |
| **FR12** | Single import | All UI from `@aibos/bioskin` only |

## 6) Non-Functional Requirements (NFR)

| ID | Requirement | Target | Enforcement |
|----|-------------|--------|-------------|
| **NFR1** | Token compliance | 100% (no raw colors) | CI check |
| **NFR2** | Accessibility | Keyboard nav, focus trap, aria | axe audit |
| **NFR3** | Performance | 1k rows smooth | Benchmark |
| **NFR4** | Test coverage | ≥80% unit | Jest coverage |
| **NFR5** | Documentation | Storybook + Getting Started | Review |
| **NFR6** | Single governance | 1 UI package only | CI check |

---

## 7) Sprint Plan

### Sprint 1: Cell Foundation (Week 1-2)
**Goal:** Create the single governed cell structure.

| Task | Deliverable | Priority |
|------|-------------|----------|
| Restructure bioskin | atoms/molecules/organisms folders | **P0** |
| Merge ui-atoms | Move into bioskin/atoms/ | **P0** |
| Merge canon | Move into bioskin/molecules/ | **P0** |
| StatusBadge | Semantic color mapping | **P0** |
| DetailSheet | Side drawer pattern | **P0** |
| Single export | index.ts with all exports | **P0** |

**🚦 EXIT GATE:**
- [ ] `packages/ui-atoms/` deleted (merged)
- [ ] `apps/web/src/components/canon/` deleted (merged)
- [ ] Single import works: `import { ... } from '@aibos/bioskin'`
- [ ] Zero hardcoded colors in bioskin

### Sprint 2: BioTable Pro (Week 3-4)
**Goal:** Production-grade data table.

| Feature | Description | Priority |
|---------|-------------|----------|
| Sorting | Click column header to sort | P0 |
| Filtering | Global search + column filters | P0 |
| Pagination | Page size selector, navigation | P0 |
| Row Selection | Checkbox + bulk actions | P1 |

**API Design:**

```typescript
<BioTable
  schema={PaymentSchema}
  data={payments}
  pagination={{ pageSize: 20 }}
  onRowClick={(row) => openSheet(row)}
/>
```

**🚦 EXIT GATE:**
- [ ] Controlled + uncontrolled state modes
- [ ] Empty/loading/error states work
- [ ] Mobile responsive (card stack)

### Sprint 3: BioForm Pro (Week 5-6)
**Goal:** Schema-driven forms.

| Feature | Description | Priority |
|---------|-------------|----------|
| Auto-generation | Form fields from Zod schema | P0 |
| Validation | Real-time Zod validation | P0 |
| Field Types | Text, number, select, date, money | P0 |
| Layouts | Grid 2-col baseline | P1 |

**🚦 EXIT GATE:**
- [ ] Create + Edit flows work end-to-end
- [ ] All core field types render correctly
- [ ] Validation messages display properly

### Sprint 4: Documentation & Testing (Week 7-8)
**Goal:** Production confidence.

| Deliverable | Priority |
|-------------|----------|
| Storybook | P0 |
| Unit tests ≥80% | P0 |
| Migration guide | P1 |
| GSS audit | P0 |

**🚦 EXIT GATE (1.0 Release):**
- [ ] Coverage ≥80%
- [ ] Axe/a11y checks pass
- [ ] Token enforcement in CI
- [ ] Migration guide published

---

## 8) Success Metrics (Auditable)

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| UI governance boundaries | 3+ | **1** | Count packages with UI |
| Hardcoded colors | ~60% | 0 | `grep "#[0-9a-fA-F]" bioskin/` |
| Components in app/ | Many | **0** | `find app/ -name "*.tsx"` |
| Single import usage | 0% | 100% | All from `@aibos/bioskin` |
| Test coverage | 0% | ≥80% | Jest coverage |
| A11y score | Unknown | 90+ | axe audit |

---

## 9) Migration Plan

### Phase 1: Restructure (Day 1)

```bash
# Create new structure
mkdir -p packages/bioskin/src/{atoms,molecules,organisms}

# Move ui-atoms
mv packages/ui-atoms/src/* packages/bioskin/src/atoms/

# Move canon components
mv apps/web/src/components/canon/* packages/bioskin/src/molecules/

# Move existing bioskin components
mv packages/bioskin/src/components/* packages/bioskin/src/organisms/

# Delete old packages
rm -rf packages/ui-atoms
rm -rf apps/web/src/components/canon
```

### Phase 2: Update Imports (Day 2)

```typescript
// Find and replace all imports
// FROM:
import { Surface } from '@aibos/ui-atoms';
import { StatusBadge } from '@/components/canon';

// TO:
import { Surface, StatusBadge } from '@aibos/bioskin';
```

### Phase 3: Validate (Day 3)

```bash
# Run CI checks
pnpm type-check
pnpm test
pnpm build

# Verify single governance
grep -r "@aibos/ui-atoms" apps/  # Should return 0
grep -r "components/canon" apps/ # Should return 0
```

---

## 10) Risk Mitigation

| Risk | Mitigation | Detection |
|------|------------|-----------|
| Breaking existing pages | Feature flags + gradual rollout | Smoke tests |
| Performance regression | Benchmark before/after | Lighthouse CI |
| Import confusion | Update docs + ESLint rule | PR review |
| Scope creep | Explicit out-of-scope | Sprint review |

---

## 11) Today's Implementation Plan

| Phase | Task | Time | Acceptance Check |
|-------|------|------|------------------|
| **A** | Restructure bioskin folders | 30 min | ✅ atoms/molecules/organisms exist |
| **B** | Merge ui-atoms | 30 min | ✅ packages/ui-atoms deleted |
| **C** | Merge canon components | 30 min | ✅ components/canon deleted |
| **D** | Create single index.ts | 20 min | ✅ All exports work |
| **E** | StatusBadge semantic colors | 45 min | ✅ Auto-color mapping |
| **F** | DetailSheet component | 45 min | ✅ Focus trap, escape close |
| **G** | Update all imports | 1 hour | ✅ Single import pattern |

**Total: ~4.5 hours**

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-16 | Initial PRD |
| 1.1 | 2024-12-16 | Enterprise refinements (FR, NFR, Exit Gates) |
| 1.2 | 2024-12-16 | Added scope, risk detection |
| **2.0** | **2024-12-16** | **Hexagonal architecture - Single governed cell per CONT_10** |

---

## Approval

- [ ] **Product Owner**: Scope approved
- [ ] **Tech Lead**: Architecture contract (CONT_10) approved
- [ ] **QA**: Test coverage targets approved
- [ ] **Design**: GSS compliance approach approved

**Governance Contract:** [CONT_10_BioSkinArchitecture.md](packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md)

**Ready to implement? Start with Phase A (Restructure bioskin folders).**
