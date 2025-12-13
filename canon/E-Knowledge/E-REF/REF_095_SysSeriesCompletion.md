> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_095  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_080_TechnicalRegister, REF_093_RegSeriesCompletion  
> **Source:** `src/docs/03-features/sys-series-completion.md`  
> **Date:** 2025-01-27

---

# REF_095: Frontend Completion Pack – SYS Series (System Configuration)

**Purpose:** Completion pack documenting SYS Series system configuration pages  
**Owner:** System Architect  
**Status:** Beta / Feature Complete  
**Last Updated:** 2025-01-27

---

## 1. Purpose & Scope

**Summary:**  
The **SYS Series** (aka "Setup Companion") serves as the initialization layer for the NexusCanon multi-tenant environment. It replaces the traditional "Wizard" with a gamified, non-linear **Bento Grid** interface that encourages users to "stabilize" their workspace by completing configuration tasks.

**In-scope:**
- **SYS_01:** Setup Companion (The Hub / Bento Grid).
- **SYS_02:** Organization Matrix (Global Entity Variables).
- **SYS_03:** Access Control (User/Role Management).
- **SYS_04:** Personal Visor (User Profile & API Keys).

**Out-of-scope:**
- Floating Global Widget (MVP implementation uses a dedicated Page View).
- Complex permissions matrix.

---

## 2. Screens, Routes & Navigation

**Primary routes:**
- `GET /sys-bootloader` → `SysBootloaderPage`
  - *Role:* The central Setup Companion Hub. Displays status of all config modules.
- `GET /sys-organization` → `SysOrganizationPage`
  - *Role:* Defining the "Physics" (Currency, Time, Tax).
- `GET /sys-access` → `SysAccessPage`
  - *Role:* Managing the Crew (Users & Roles).
- `GET /sys-profile` → `SysProfilePage`
  - *Role:* Personal settings and developer tokens.

**Navigation rules:**
- `MetaSideNav` includes a "Setup Companion" link.
- Users are redirected to `SYS_01` if they attempt to access CORE features without configuration (Mock logic).

---

## 3. Component Inventory

| Component Name | Type | Location | Purpose / Notes |
|----------------|------|----------|----------------|
| `SysBootloaderPage` | Page | `/pages` | **Setup Companion**. Main Bento Grid interface. |
| `SysOrganizationPage` | Page | `/pages` | Form for entity details. |
| `SysAccessPage` | Page | `/pages` | User table and invite system. |
| `SysProfilePage` | Page | `/pages` | User settings. |
| `SetupCard` | Component | Internal | Used in `SysBootloaderPage` to render Bento items. |

---

## 4. "Silent Killer" Features

1. **Contextual Focus:** Hides the complexity of ERP setup behind a simple grid.
2. **Gamification:** Users "turn cards green" rather than filling forms.
3. **Role Adaptation:** (Designed) Admins see Company settings; Users see Profile only.
4. **Visual Physics:** 1px borders, ambient gradients, and "machined" feel.

---

## 5. Styling, Design & Tokens

**Aesthetic:** "Setup Companion" / "Flight Deck"
- **Colors:** Heavy use of `#0A0A0A` (Matter) and `#1F1F1F` (Structure).
- **Accents:** Emerald for "Complete/Active", Amber for "Action Required".
- **Typography:** Monospace for status labels (`COMPLETE`, `PENDING`).
- **Layout:** Responsive Grid (1 col mobile, 3 col desktop).

---

## 6. Testing & Quality

**Manual test checklist:**
- [x] Setup Companion renders Bento Grid.
- [x] Cards react to hover/tap (Visual Physics).
- [x] Navigation to sub-pages works.
- [x] Progress bar calculates based on state (mocked).
- [x] "Enter Command Deck" button appears only when ready.

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_080_TechnicalRegister, REF_093_RegSeriesCompletion, REF_094_MetaSeriesCompletion  
**Maintained by:** System Architect
