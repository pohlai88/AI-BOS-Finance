> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_080  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_093_RegSeriesCompletion, REF_094_MetaSeriesCompletion  
> **Source:** `src/docs/02-architecture/technical-register.md`  
> **Date:** 2025-01-27

---

# REF_080: Frontend Technical Documentation Register

**Purpose:** Technical documentation register tracking all frontend system documentation  
**Scope:** NexusCanon Frontend System  
**Owner:** System Architect  
**Status:** 🟢 Active  
**Last Updated:** 2025-01-27

---

## 1. System Architecture Overview

NexusCanon is divided into three distinct "Series," each with unique architectural and aesthetic requirements.

1. **LAND Series:** Public Marketing (Landing Page).
2. **REG Series:** Authentication & Entry (The "Engine").
3. **META Series:** Application Core (The "Control Room").

This register tracks the technical documentation and completion status for the **REG** and **META** series.

---

## 2. Documentation Index

### A. Completion Packs (Status Reports)

| Series | Document | Status | Location |
|--------|----------|--------|----------|
| **REG** | `Frontend Completion Pack – REG Series` | **Complete** | REF_093_RegSeriesCompletion |
| **META** | `Frontend Completion Pack – META Series` | **Complete** | REF_094_MetaSeriesCompletion |

### B. Technical Specifications

| #  | Document Type | Title / Description | Canon Reference | Status |
|----|---------------|---------------------|-----------------|--------|
| 1  | **Master Guidelines** | `NexusCanon UX & Behavior Guidelines` | REF_077_UXGuidelines | **Final** |
| 2  | **Global Tech Doc** | `Frontend Technical Documentation Register` | REF_080 (this document) | **Active** |
| 3  | **Design System** | `Forensic UI System` | REF_075_DesignSystem | **Live** |
| 4  | **Routing Map** | `App Routing Architecture` | `/App.tsx` | **Live** |
| 5  | **State Management** | `Shell & Navigation State` | `/hooks/stateManager.ts` | **Live** |

---

## 3. Series-Specific Technical Details

### REG Series (Authentication)
* **Focus:** Security, Physics, Stability.
* **Key Component:** `IntegratedEngine.tsx` (Physics Engine).
* **Key Pages:** `LoginPage`, `SignUpPage` (Reactor), `ResetPasswordPage`.
* **Architecture:** Standalone pages (No AppShell). Direct connection to Auth Providers.

### META Series (Control Room)
* **Focus:** Data Density, Governance, Management.
* **Key Component:** `MetaAppShell.tsx` (Persistent Layout).
* **Key Pages:** `DashboardPage`, `MetadataGodView`, `RiskRadar`.
* **Architecture:** Shell-wrapped, persistent navigation, complex data grids.

---

## 4. Current System Status

**Overall Status:** `Beta / Feature Complete`

- **REG Series:** All animations and flows implemented. Ready for backend hook-up.
- **META Series:** Dashboard and Registry views implemented. Mock data used for visualization.
- **Legacy Cleanup:** Removed `SignupPage.tsx` (Legacy) in favor of `SignUpPage.tsx`.

---

## 5. Next Steps

1. **Backend Integration:** Replace mock data in `dashboard/StatusGrid.tsx` and `metadata/mockMetadata.ts` with real Supabase calls.
2. **E2E Testing:** Implement Playwright tests for "Reactor" animations and "God View" filtering.
3. **Performance:** Audit particle system performance on mobile devices.

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_093_RegSeriesCompletion, REF_094_MetaSeriesCompletion, REF_075_DesignSystem, REF_077_UXGuidelines  
**Maintained by:** System Architect
