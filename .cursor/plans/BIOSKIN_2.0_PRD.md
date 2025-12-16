# 🧬 BIOSKIN 2.1 — Ecosystem-Powered UI System

**Project Type:** Infrastructure / Design System  
**Priority:** P0 — Foundation for all future UI work  
**Duration:** 3 Weeks (15 working days)  
**Owner:** AI-BOS Engineering  
**Version:** 2.1.0 (Directive-Based Architecture)  
**Governance:** CONT_10_BioSkinArchitecture.md v2.1

---

## 1) Executive Summary

### What is BIOSKIN 2.0?

BIOSKIN 2.0 is an **ecosystem upgrade** that replaces manual UI implementation with battle-tested libraries:

| Manual (v1.0) | **Ecosystem (v2.0)** |
|---------------|---------------------|
| Custom table sorting | **TanStack Table** |
| Custom form validation | **react-hook-form + Zod** |
| No animations | **motion (Framer Motion)** |
| No drag-drop | **@dnd-kit** |
| Mixed client/server | **Explicit entrypoints** |

### Why This Matters

- **10x velocity:** Schema → Production UI in minutes, not days
- **Zero drift:** Single governed package with dependency gates
- **App Router native:** RSC-first architecture, proper boundaries
- **Battle-tested:** Every library is production-proven at scale

---

## 2) Architecture Overview

### The Boring Constraints (Non-Negotiable)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            @aibos/bioskin                                    │
│                                                                              │
│  ┌───────────────────────────┐    ┌───────────────────────────────────────┐ │
│  │  /server                  │    │  /client                              │ │
│  │  (No 'use client')        │    │  ('use client' required)              │ │
│  ├───────────────────────────┤    ├───────────────────────────────────────┤ │
│  │ • introspector            │    │ • BioTable (TanStack)                 │ │
│  │ • formatters              │    │ • BioForm (RHF + Zod)                 │ │
│  │ • constants               │    │ • BioKanban (@dnd-kit)                │ │
│  │ • type definitions        │    │ • StatusBadge, Spinner (motion)      │ │
│  └───────────────────────────┘    │ • atoms, molecules, organisms        │ │
│                                   │ • hooks                               │ │
│                                   └───────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  /foundation (PRIVATE - not exported)                                │    │
│  │  shadcn/ui components: button, card, sheet, table, command, etc.    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Strategy: RSC-First

```typescript
// ✅ Server Component fetches data
export default async function PaymentsPage() {
  const payments = await getPayments();  // Server-side
  return <PaymentTable data={payments} />;
}

// ✅ Client Component receives data as props
'use client';
export function PaymentTable({ data }) {
  return <BioTable schema={PaymentSchema} data={data} />;
}
```

---

## 3) Dependency Stack (Gated)

### Approved Dependencies

| Category | Library | Version | Feature |
|----------|---------|---------|---------|
| **Data** | @tanstack/react-table | ^8.x | BioTable |
| **Forms** | react-hook-form | ^7.x | BioForm |
| **Forms** | @hookform/resolvers | ^3.x | Zod integration |
| **State** | jotai | ^2.x | Atomic state |
| **Animation** | motion | ^11.x | Spring animations |
| **DnD** | @dnd-kit/core | ^6.x | Drag-drop |
| **DnD** | @dnd-kit/sortable | ^8.x | List sorting |
| **Date** | date-fns | ^3.x | Date formatting |
| **Upload** | react-dropzone | ^14.x | File upload |
| **Measure** | react-use-measure | ^2.x | Element sizing |
| **Schema** | zod | ^3.x | Validation |
| **Styling** | clsx, tailwind-merge | ^2.x | Class utilities |
| **Icons** | lucide-react | ^0.x | Icons |

### Deferred (Evaluate in v2.1)

| Library | Reason |
|---------|--------|
| @tanstack/react-query | RSC-first makes this optional |
| zustand | jotai covers component state |

---

## 4) Component Inventory

### Tier 1: P0 (Must Ship)

| Component | Layer | Powered By | Status |
|-----------|-------|------------|--------|
| **BioTable** | organism | TanStack Table + jotai | ✅ DONE |
| **BioForm** | organism | react-hook-form + Zod | ✅ DONE |
| **StatusBadge** | molecule | motion (pulsing dot) | ✅ DONE |
| **Spinner** | molecule | 8 variants (motion) | ✅ DONE |
| **Surface, Txt, Btn** | atom | GSS tokens | ✅ EXISTS |

### Tier 2: P1 (Sprint 2)

| Component | Layer | Powered By | Status |
|-----------|-------|------------|--------|
| **BioKanban** | organism | @dnd-kit | 🔴 TODO |
| **BioCalendar** | organism | date-fns + jotai | 🔴 TODO |
| **Combobox** | molecule | Radix + Command | 🔴 TODO |
| **Dropzone** | molecule | react-dropzone | 🔴 TODO |
| **MotionEffect** | molecule | motion | 🔴 TODO |
| **SlidingNumber** | molecule | motion | 🔴 TODO |

### Tier 3: P2 (Future)

| Component | Layer | Powered By |
|-----------|-------|------------|
| BioGantt | organism | date-fns |
| BioChart | organism | Recharts? |
| BioList (reorderable) | organism | @dnd-kit |

---

## 5) Sprint Plan (3 Weeks)

### Sprint 1: Foundation (Days 1-5) ✅ COMPLETE

**Goal:** Establish structure, move shadcn, install ecosystem.

| Day | Task | Deliverable | Status |
|-----|------|-------------|--------|
| 1 | Directive-based boundary (`'use client'` + `server-only`) | Entry points | ✅ |
| 2 | Move shadcn from apps/web to foundation/ | Private shadcn (47 components) | ✅ |
| 3 | Install all approved dependencies | 10+ ecosystem packages | ✅ |
| 4 | Create exports map in package.json | Two entrypoints (main + /server) | ✅ |
| 5 | Upgrade StatusBadge with pulsing dot (motion) | PulsingDot, variants, sizes | ✅ |

**Exit Gate:**
- [x] `import { X } from '@aibos/bioskin/server'` works
- [x] `import { X } from '@aibos/bioskin'` works (directive-based, not folder-based)
- [x] shadcn is in foundation/, not exported
- [x] StatusBadge has animated pulse indicator + dot variant

### Sprint 2: BioTable (Days 6-10) ✅ COMPLETE

**Goal:** Production-grade data table powered by TanStack.

| Day | Task | Deliverable | Status |
|-----|------|-------------|--------|
| 6 | Implement useBioTable hook with jotai | State management | ✅ |
| 7 | Implement BioTableHeader with sorting | Click to sort | ✅ |
| 8 | Implement BioTableFilters | Global + column filters | ✅ |
| 9 | Implement BioTablePagination | Page size, navigation | ✅ |
| 10 | Integration testing + polish | BioTable.tsx assembled | ✅ |

**Exit Gate:**
- [x] BioTable sorts columns (ascending/descending)
- [x] BioTable filters (global search + per-column)
- [x] BioTable paginates (client-side)
- [x] Empty/loading/error states work
- [x] Row selection with checkboxes

### Sprint 3: BioForm + Polish (Days 11-15) ✅ COMPLETE

**Goal:** Schema-driven forms + final validation.

| Day | Task | Deliverable | Status |
|-----|------|-------------|--------|
| 11 | Implement useBioForm hook with RHF | Form state | ✅ |
| 12 | Implement field rendering from schema | Auto-generate fields | ✅ |
| 13 | Implement validation display | Error messages | ✅ |
| 14 | Add Spinner variants + MotionEffect | 8 spinner variants | ✅ |
| 15 | Final testing, CI validation | Type check passes | ✅ |

**Exit Gate:**
- [x] BioForm generates fields from Zod schema
- [x] BioForm validates in real-time (react-hook-form + Zod)
- [x] BioForm handles submit with loading state
- [x] All type checks pass
- [x] Spinner has 8 animated variants
- [x] MotionEffect provides reusable animations

---

## 6) Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| **FR1** | Schema introspection | Zod → field definitions (unchanged) |
| **FR2** | Column generation | BioTable defaults from schema |
| **FR3** | **Sorting** | TanStack getSortedRowModel() |
| **FR4** | **Filtering** | TanStack getFilteredRowModel() |
| **FR5** | **Pagination** | TanStack getPaginationRowModel() |
| **FR6** | **Row selection** | TanStack getSelectionModel() |
| **FR7** | Form generation | RHF generates from schema |
| **FR8** | **Form validation** | Zod resolver, real-time |
| **FR9** | Status semantics | Auto color + pulsing dot |
| **FR10** | **Server/Client separation** | Explicit entrypoints |

---

## 7) Non-Functional Requirements

| ID | Requirement | Target | Enforcement |
|----|-------------|--------|-------------|
| **NFR1** | Token compliance | 100% | CI check |
| **NFR2** | Test coverage | ≥90% | Jest coverage |
| **NFR3** | Bundle increase | <50KB | bundlesize |
| **NFR4** | Deep imports | 0 | CI check |
| **NFR5** | RSC violations | 0 | CI check |
| **NFR6** | Dependency violations | 0 | Gate check |

---

## 8) Success Metrics

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| Time to create table page | 4 hours | **30 min** | Developer survey |
| Time to create form page | 3 hours | **20 min** | Developer survey |
| UI-related bugs | ~15/sprint | **<5/sprint** | Issue tracker |
| Component reuse rate | 40% | **90%** | Import analysis |
| Developer satisfaction | 3/5 | **4.5/5** | Survey |

---

## 9) Risk Mitigation

| Risk | Mitigation | Detection |
|------|------------|-----------|
| TanStack learning curve | Documentation + examples | Sprint review |
| Bundle size bloat | Tree-shaking, lazy loading | bundlesize CI |
| Migration breaks existing pages | Feature flags, gradual rollout | Smoke tests |
| Dependency conflicts | Peer deps, version pinning | CI lockfile check |

---

## 10) Out of Scope (v2.1)

| Item | Reason |
|------|--------|
| TanStack Query integration | Evaluate need with RSC-first |
| Server-side pagination | Client-side sufficient for v2.0 |
| Virtualization (10k+ rows) | Define path, implement later |
| BioChart | Separate effort |

---

## 11) Approval

- [ ] **Product Owner:** Scope approved
- [ ] **Tech Lead:** Architecture (CONT_10 v2.0) approved
- [ ] **QA:** Test coverage targets approved
- [ ] **Design:** GSS compliance approach approved

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-16 | Initial PRD |
| 1.1 | 2024-12-16 | Enterprise refinements |
| 1.2 | 2024-12-16 | Hexagonal architecture |
| **2.0** | **2024-12-16** | **Ecosystem Upgrade — TanStack, RHF, motion, dnd-kit** |

---

**Governance Contract:** [CONT_10 v2.0](packages/canon/A-Governance/A-CONT/CONT_10_BioSkinArchitecture.md)

**Ready to implement? Start Sprint 1, Day 1: Create server/client folder structure.**
