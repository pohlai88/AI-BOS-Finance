> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_096  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_093_RegSeriesCompletion, REF_094_MetaSeriesCompletion  
> **Source:** `src/docs/05-archive/template-series.md`  
> **Date:** 2025-01-27

---

# REF_096: Frontend Completion Pack Template

**Purpose:** Template for documenting new series/modules in NexusCanon  
**Status:** 🟢 Active  
**Last Updated:** 2025-01-27

---

## 1. Purpose & Scope

**Summary:**  
`[What this module/page does, for whom, and why it exists.]`

**In-scope:**
- `[Feature A]`
- `[Feature B]`

**Out-of-scope (by design):**
- `[Delayed features / intentionally excluded areas]`

---

## 2. Screens, Routes & Navigation

**Primary routes:**
- `GET /[route]` → `[Page / Component]`
- `GET /[route]/[id]` → `[Page / Component]`

**How users arrive here:**
- From: `[Nav item / button / previous screen]`
- Deep link: `[Yes/No – sample URL if yes]`

**Redirect / navigation rules:**
- `[e.g. unauthenticated → /login, missing setup → /onboarding]`

---

## 3. Component Inventory

| Component Name | Type | Location | Purpose / Notes |
|----------------|------|----------|----------------|
| `ExamplePage` | Page | `apps/web/src/app/example/page.tsx` | Main container, layout & routing |
| `ExampleCard` | UI Component | `packages/ui/src/components/ExampleCard` | Key UI building block |

**Shared / design-system components used (important ones):**
- `[Button, Card, Dialog, Tabs, etc.]`

---

## 4. Data, State & Integration

**Data sources:**
- API: `[GET /api/v1/...]`
- Context / Provider: `[useAuth, useManifestor, useTelemetry, etc.]`
- Local mock / fixtures: `[if any]`

**State management:**
- Local state: `[useState / useReducer – where and why]`
- Global state: `[Zustand / Context / Redux – store & slice name]`
- URL state: `[query params / hash used]`

**Data flow (short narrative):**  
`[On mount, we fetch X → map/normalize → store in Y → render Z.]`

---

## 5. Contracts & APIs (Frontend View)

| API / Endpoint | Method | Used in | Expected Response (short) |
|----------------|--------|---------|---------------------------|
| `/api/v1/...` | GET | `SomeComponent` | `[List / object / status flags]` |
| `/api/v1/.../:id` | PATCH | `EditDrawer` | `Updated object with server source of truth` |

**Important assumptions / invariants:**
- `[e.g. dates are ISO 8601 strings]`
- `[e.g. status ∈ {DRAFT, ACTIVE, ARCHIVED}]`

---

## 6. Styling, Design & Tokens

**Design source:**
- Figma: `[link to file + frame names]`

**Design tokens / themes used:**
- Color roles: `[primary, accent, danger, background-strong, background-soft]`
- Typography: `[heading-xl, body-md, caption, code]`
- Layout: `[grid system, spacing scale, max-widths, breakpoints]`

**Custom styles & motion:**
- Animations: `[Framer Motion variants, key transitions, entry/exit rules]`
- Hard-coded styles that must be converted to tokens later:
  - `[List any TODOs here explicitly]`

---

## 7. Accessibility & Responsiveness

**Accessibility:**
- Landmarks / semantics: `[main, header, nav, footer, section, etc.]`
- ARIA usage: `[aria-label, aria-expanded, role, etc.]`
- Focus management: `[What receives focus on open/close, keyboard loop in dialogs]`
- Keyboard support: `[Tab/Shift+Tab, Enter, Space, Esc]`
- Contrast checks: `[Where/what has been validated (AA / AAA)]`

**Responsive behavior:**
- Mobile (`<md`): `[Stacking, hidden panels, key changes]`
- Tablet (`md–lg`): `[Columns, layout adjustments]`
- Desktop (`≥lg`): `[Default layout, max widths]`

**Known a11y gaps (if any):**
- `[Explicit list – so they are not forgotten]`

---

## 8. Testing & Quality

**Automated tests:**
- Unit: `[paths, e.g. apps/web/src/__tests__/ExamplePage.test.tsx]`
- Component / interaction: `[Testing Library / Storybook interactions]`
- E2E: `[Cypress / Playwright spec locations, if any]`

**Manual test checklist (tick when done):**
- [ ] Main flows work on desktop (Chrome)
- [ ] Main flows work on mobile viewport
- [ ] Error states render correctly
- [ ] Loading states render correctly
- [ ] Dark/Light theme sanity check
- [ ] Basic a11y check (keyboard + screen reader pass)

**Known issues / tech debt:**
- `[#1] [Short description] – severity, suggested fix`
- `[#2] [...]`

---

## 9. Extension Guide (For Next Developer)

**Where to extend safely:**
- `[Which components/hooks are "extension points"]`
- `[Which files are stable contracts and should not be broken]`

**Patterns to follow:**
- `[e.g. use shared hooks for data fetching, no raw fetch in components]`
- `[e.g. always use design-system Button, never <button> directly]`

**Refactor suggestions (future improvements):**
- `[Max 2–3 concrete suggestions – keep it short]`

---

## 10. References

- Figma: `[link]`  
- Backend API spec / docs: `[link or repo path]`  
- Design system / tokens: `[link or path]`  
- Related Canon / Metadata docs: `[paths to META_*, Canon Matrix, etc.]`

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_093_RegSeriesCompletion, REF_094_MetaSeriesCompletion, REF_095_SysSeriesCompletion  
**Maintained by:** System Architect
