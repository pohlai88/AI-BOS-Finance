> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_094  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_080_TechnicalRegister, REF_087_BuildReadyChecklist  
> **Source:** `src/docs/03-features/meta-series-completion.md`  
> **Date:** 2025-01-27

---

# REF_094: Frontend Completion Pack – META Series (Control Room)

**Purpose:** Completion pack documenting META Series control room pages  
**Owner:** System Architect  
**Status:** Beta / Feature Complete  
**Last Updated:** 2025-01-27

---

## 1. Purpose & Scope

**Summary:**  
The **META Series** is the "Control Room" of NexusCanon. It provides the "God View" over the system's metadata registry, risk radar, and canon matrix. It strictly adheres to the "Forensic" design language—using 1px borders, void backgrounds, and monospaced data to create a high-density, professional interface.

**In-scope:**
- **META-01:** Architecture (System Map).
- **META-02:** Registry God View (SuperTable).
- **META-03:** The Prism (Detail View).
- **META-04:** Risk Radar (Visualization).
- **META-05:** Canon Matrix (Governance).
- **META-06:** Health Scan (Diagnostics).
- **META-07:** Lynx Codex (AI Integration).
- **META-08:** Implementation Playbook.

**Out-of-scope:**
- Public Marketing Pages (LAND Series).
- Authentication Logic (REG Series).

---

## 2. Screens, Routes & Navigation

**Primary routes (Wrapped in `MetaAppShell`):**
- `GET /dashboard` → `DashboardPage` (Mission Control).
- `GET /meta-registry` → `MetadataGodView`.
- `GET /meta-registry/:id` → `ThePrismPage`.
- `GET /meta-risk` → `MetaRiskRadarPage`.

**Navigation rules:**
- **SideNav:** Collapsible, persistent left navigation.
- **Command Palette:** Global access via `Cmd+K`.
- **Shortcuts:** `Cmd+.` to toggle nav, `Cmd+/` for help.
- **History:** "Recent Pages" tracked in local state.

---

## 3. Component Inventory

| Component Name | Type | Location | Purpose / Notes |
|----------------|------|----------|----------------|
| `MetaAppShell` | Shell | `/components/shell` | Master layout, handles keyboard & nav state. |
| `StatusGrid` | UI Widget | `/components/dashboard` | Metric cards with "glass" borders. |
| `ActivityFeed` | UI Widget | `/components/dashboard` | Live system logs. |
| `SuperTable` | Complex UI | `/components/metadata` | High-density data grid with sorting/filtering. |
| `ForensicClassificationStrip` | UI Decoration | `/components` | Top-bar dynamic codes (e.g., "META_02"). |
| `MetaCommandPalette` | Navigation | `/components/shell` | Quick-jump menu. |

---

## 4. Data, State & Integration

**Data sources:**
- **Mock Data:** `mockMetadata.ts`, `mockCanonMatrix.ts`.
- **Live State:** `ActivityFeed` (simulated real-time).

**State management:**
- **Shell State:** `stateManager.ts` (Zustand) for sidebar preference and recent pages.
- **Filter State:** URL Query Params for shareable "God View" states.

**Data flow:**  
Page Load → Fetch Mock Data → Render `SuperTable` → User Filters → URL Update → Table Re-render.

---

## 5. Contracts & APIs (Frontend View)

| API / Endpoint | Method | Used in | Expected Response (Target) |
|----------------|--------|---------|---------------------------|
| `/api/metrics/system` | GET | `DashboardPage` | `{ cpu, memory, active_users, latency }` |
| `/api/registry/items` | GET | `MetadataGodView` | `Array<MetadataItem>` |
| `/api/registry/:id` | GET | `ThePrismPage` | `MetadataItemDetail` |
| `/api/risk/scan` | GET | `MetaRiskRadarPage` | `RiskScoreObject` |

---

## 6. Styling, Design & Tokens

**Forensic Aesthetic:**
- **Backgrounds:** Pure `#000000` (Void) or `#0A0A0A` (Matter).
- **Borders:** `#1F1F1F` (Structure) - 1px only.
- **Typography:** `Inter` for UI, `JetBrains Mono` for data.
- **Color:** Strict utility palette. Green (`#28E7A2`) used ONLY for "Signal" (Active/Good).

**Design Rules:**
- **"The 1px Rule":** No shadows for depth. Use stroke lightness.
- **"Density":** maximize information per pixel (Control Room density).

---

## 7. Accessibility & Responsiveness

**Accessibility:**
- **Keyboard:** Full keyboard navigation support for Command Palette and SideNav.
- **Contrast:** High contrast text for legibility.
- **Screen Readers:** ARIA labels on all icon-only buttons (`Bell`, `Settings`).

**Responsiveness:**
- **Desktop:** Multi-pane layouts ("Bento" grids).
- **Mobile:**
  - Sidebar collapses to drawer.
  - Data tables scroll horizontally.
  - Charts stack vertically.

---

## 8. Testing & Quality

**Manual test checklist:**
- [x] Command Palette opens with `Cmd+K`.
- [x] Dashboard grid adjusts to window resize.
- [x] "God View" table filters work (Filter by Owner, Type).
- [x] "The Prism" detail view loads correctly from ID.

**Known issues:**
- `SuperTable` virtualization might be needed for >1000 rows.
- Charts in `MetaRiskRadarPage` are currently static placeholders.

---

## 9. Extension Guide

**Where to extend:**
- **New Metadata Views:** Add to `components/metadata/pages`.
- **New Dashboard Widgets:** Add to `components/dashboard`.

**Patterns:**
- **Shell:** Always wrap META pages in `<MetaAppShell>`.
- **Headers:** Use `<MetaPageHeader>` for consistency.
- **Classifications:** Update `ForensicClassificationStrip` code mapping in `MetaAppShell.tsx`.

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_080_TechnicalRegister, REF_087_BuildReadyChecklist, REF_082_PageCodingStandards  
**Maintained by:** System Architect
