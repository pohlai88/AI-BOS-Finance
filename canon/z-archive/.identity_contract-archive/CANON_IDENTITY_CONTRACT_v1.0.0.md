Below is a **README / mini-PRD** you can drop into your repo (e.g.
`/canon/README_CanonIdentity.md`) and refine later.

---

# AI-BOS / NexusCanon

Canon Identity & Cell Registration Standard (v1.0.0)

## 1. Purpose

AI-BOS and NexusCanon are **schema-first**. Every screen, component, flex-field and policy must be:

* **Uniquely identifiable** by a stable code (not by filename or English name),
* **Traceable end-to-end** (frontend → BFF → DB → logs),
* **Searchable in IDE and registry** without ambiguity,
* **Resistant to drift** when files are moved, renamed, or refactored.

This document defines the **Canon Identity Model** and the repository pattern from:

> **Repo → Project → Page → Component → Schema/Policy → Final Cell**

It is the foundation for future **schema registration** (Supabase / Manifestor Engine / Metadata Registry).

---

## 2. Problems We Are Solving

1. **IDE Drift / “Ghost Screens”**

   * Correct code gets refactored or moved; filenames and comments are not updated.
   * Obsolete identifiers remain in the repo forever; search results lie.

2. **Communication Gaps**

   * Business says: “Check the **Canon Landing Page**.”
   * Devs ask: “Is that `/`, `/home`, `MarketingLandingPage.tsx` or something else?”
   * No single, guaranteed mapping from business name → code → file → route.

3. **Next.js File-System Routing Ambiguity**

   * With App Router, `app/**/page.tsx` defines routes.
   * Different teams may implement “canon” logic in multiple page.tsx files with no shared identity.
   * We need a pattern that preserves Next.js routing but still anchors each screen to a **stable code**.

4. **Dynamic / Flexi Fields Without Governance**

   * Flexible schemas (Meta_09, Tab_10, Policy_25…) can break silently.
   * Without a Canon ID, it is impossible to say precisely *where* the error occurred.

---

## 3. Canon Identity Model

We assign codes to all important artefacts:

| Type                  | Example                  | Pattern                          | Meaning                                 |
| --------------------- | ------------------------ | -------------------------------- | --------------------------------------- |
| **Page**              | `META_02`, `SYS_03`      | `[A-Z]{3,5}_[0-9]{2}`            | A route / screen                        |
| **Component**         | `TBLM01`, `TBLL01`       | `[A-Z]{3,4}[0-9]{2}`             | Reusable UI (table, form, widget, etc.) |
| **Schema**            | `SCH_101`                | `SCH_[0-9]{3}`                   | Data / validation schema                |
| **Policy**            | `POLY_25`                | `POLY_[0-9]{2}`                  | Rule set / policy config                |
| **Tab/Layout**        | `TAB_10`                 | `TAB_[0-9]{2}`                   | Tab or layout variant                   |
| **Cell** (final unit) | `CELL_META_09_101_10_25` | `CELL_<page>_<sch>_<tab>_<poly>` | Smallest governed UI cell               |

Each has a **version** (SemVer), e.g.:

* `META_02 v1.1.0`
* `TBLM01 v1.0.0`
* `SCH_101 v2.0.0`
* `POLY_25 v1.0.2`
* `CELL_META_09_101_10_25 v1.0.0`

> **Rule:** All serious discussion uses these codes, not ambiguous names.
> Humans may say *“Canon Landing Page”*, but code and logs must say **`META_02`**.

---

## 4. Repository Layout (High-Level)

```text
aibos/
  apps/
    web/
      app/                    # Next.js App Router
        canon/
          page.tsx            # Thin route wrapper for META_02
        sys/
          access/
            page.tsx          # Thin route wrapper for SYS_03
      canon-pages/            # Canonical page implementations
        META/
          META_02_CanonLandingPage.tsx
          META_09_FlexFieldsPage.tsx
        SYS/
          SYS_03_AccessControlPage.tsx
  packages/
    ui/
      canon/
        tables/
          TBLM01_MonetizeFullTable.tsx
          TBLL01_LiteTable.tsx
        forms/
          FRMM01_MonetizeForm.tsx
      shells/
        MetaPageHeader.tsx
  canon/                      # Registry & manifests (source of truth)
    pages.yaml
    components.yaml
    schemas.yaml
    policies.yaml
    cells.yaml
    README_CanonIdentity.md   # this file
```

* **Next.js routing lives under `/app/**/page.tsx`**.
* **Canonical pages live under `/canon-pages/**` with codes in filenames.**
* App Router `page.tsx` files are thin wrappers that import and re-export the canonical page.

---

## 5. Canon Manifests

### 5.1 Page Registry (`canon/pages.yaml`)

```yaml
- code: "META_02"
  version: "1.1.0"
  name: "Canon Landing Page"
  app: "web"
  route: "/canon"
  file: "apps/web/canon-pages/META/META_02_CanonLandingPage.tsx"
  domain: "METADATA"
  status: "active"

- code: "SYS_03"
  version: "1.0.0"
  name: "Access Control"
  app: "web"
  route: "/sys/access"
  file: "apps/web/canon-pages/SYS/SYS_03_AccessControlPage.tsx"
  domain: "SYSTEM"
  status: "active"
```

### 5.2 Component Registry (`canon/components.yaml`)

```yaml
- code: "TBLM01"
  version: "1.0.0"
  family: "TABLE"
  name: "Monetize Full-Stack Table"
  file: "packages/ui/canon/tables/TBLM01_MonetizeFullTable.tsx"
  purpose: "MONETIZE"
  status: "active"

- code: "TBLL01"
  version: "1.0.0"
  family: "TABLE"
  name: "Lite Table"
  file: "packages/ui/canon/tables/TBLL01_LiteTable.tsx"
  purpose: "GENERAL"
  status: "active"
```

### 5.3 Cell Registry (`canon/cells.yaml`)

```yaml
- cell_id: "CELL_META_09_101_10_25"
  version: "1.0.0"
  page_code: "META_09"
  schema_code: "SCH_101"
  tab_code: "TAB_10"
  policy_codes: ["POLY_25"]
  component_code: "TBLM01"
  description: "Flex field block on Meta_09 using schema 101 and policy 25."
  status: "active"
```

These manifests are **the eventual schema registration** source; later they can be migrated into Supabase tables and surfaced in Metadata Studio.

---

## 6. In-Code Meta Blocks

### 6.1 Canonical Page Implementation

`apps/web/canon-pages/SYS/SYS_03_AccessControlPage.tsx`

```tsx
// ============================================================================
// PAGE CANON: SYS_03  // ACCESS CONTROL
// VERSION:   1.0.0
// DOMAIN:    SYSTEM
// SUMMARY:   USERS: RBAC, Invites, Team Management
// ============================================================================

export const PAGE_META = {
  code: 'SYS_03',
  version: '1.0.0',
  name: 'ACCESS CONTROL',
  subtitle: 'USERS: RBAC, Invites, Team Management',
  route: '/sys/access',
  owner: 'SEC_OPS',
  classification: 'RESTRICTED',
} as const;

import { MetaPageHeader } from '@/packages/ui/shells/MetaPageHeader';
import { MonetizeFullTable } from '@/packages/ui/canon/tables/TBLM01_MonetizeFullTable';

export function SysAccessPage() {
  return (
    <>
      <MetaPageHeader
        code={PAGE_META.code}
        version={PAGE_META.version}
        title={PAGE_META.name}
        subtitle={PAGE_META.subtitle}
      />
      <MonetizeFullTable /* props */ />
    </>
  );
}
```

### 6.2 Next.js Route Wrapper

`apps/web/app/sys/access/page.tsx`

```tsx
import { SysAccessPage } from '@/apps/web/canon-pages/SYS/SYS_03_AccessControlPage';

export default SysAccessPage;
```

* **Routing concerns** stay in `app/` (Next.js requirement).
* **Canon identity** lives in the canonical page file.

### 6.3 Canonical Component (Monetize Table)

`packages/ui/canon/tables/TBLM01_MonetizeFullTable.tsx`

```tsx
// ============================================================================
// COMPONENT CANON: TBLM01  // Monetize Full-Stack Table
// VERSION:   1.0.0
// FAMILY:    TABLE
// PURPOSE:   MONETIZE_FLOW_ONLY
// ============================================================================

export const COMPONENT_META = {
  code: 'TBLM01',
  version: '1.0.0',
  family: 'TABLE',
  purpose: 'MONETIZE',
  owner: 'FINANCE_UI',
  status: 'active',
} as const;

import { useReactTable } from '@tanstack/react-table';

export function MonetizeFullTable(/* props */) {
  // Implementation…
}
```

> **Rule:**
> Raw `@tanstack/react-table` imports are **only allowed** inside `/packages/ui/canon/tables/**`.
> All other code must use the canonical components (`TBLM01`, `TBLL01`, etc.).

### 6.4 Final Cell (Flexi Fields – Meta_09)

Inside `apps/web/canon-pages/META/META_09_FlexFieldsPage.tsx`:

```tsx
// ============================================================================
// CELL CANON: META_09 / SCH_101 / TAB_10 / POLY_25
// CELL ID:    CELL_META_09_101_10_25
// VERSION:    1.0.0
// PURPOSE:    Payment Metadata Flex Fields (Tab 10)
// ============================================================================

export const CELL_META = {
  cellId: 'CELL_META_09_101_10_25',
  pageCode: 'META_09',
  schemaCode: 'SCH_101',
  tabCode: 'TAB_10',
  policyCodes: ['POLY_25'],
  version: '1.0.0',
} as const;

import { MonetizeFullTable } from '@/packages/ui/canon/tables/TBLM01_MonetizeFullTable';

export function Meta09FlexCell() {
  return (
    <MonetizeFullTable
      canon={CELL_META}        // forwarded to BFF + logs
      /* other props */
    />
  );
}
```

---

## 7. Data & Logging Contract (BFF / Backend / DB)

Every request originating from a governed cell must carry **Canon context**:

```ts
interface CanonContext {
  pageCode: string;       // "META_09"
  schemaCode: string;     // "SCH_101"
  tabCode?: string;       // "TAB_10"
  policyCodes?: string[]; // ["POLY_25"]
  cellId?: string;        // "CELL_META_09_101_10_25"
}
```

Example API payload:

```json
{
  "canon": {
    "pageCode": "META_09",
    "schemaCode": "SCH_101",
    "tabCode": "TAB_10",
    "policyCodes": ["POLY_25"],
    "cellId": "CELL_META_09_101_10_25"
  },
  "payload": {
    "fieldValues": { /* ... */ }
  }
}
```

Backend uses `canon` to:

* Load schema `SCH_101`,
* Apply policies `POLY_25`,
* Log errors with the same codes.

**DB tables** for flex fields should also include these codes:

```sql
page_code   text not null,  -- META_09
schema_code text not null,  -- SCH_101
tab_code    text not null,  -- TAB_10
policy_code text not null   -- POLY_25
```

---

## 8. Tooling, Kits & Workflow (Doing Great from Day 1)

### 8.1 CLI Scaffolder (`canon` or `aibos` CLI)

Commands:

* `canon create:page`
  Prompts: Page code, name, route, domain.
  Generates:

  * Entry in `canon/pages.yaml`,
  * Canonical page file with `PAGE_META`,
  * Next.js `app/**/page.tsx` wrapper.

* `canon create:component`
  Generates component file with `COMPONENT_META` + registry entry.

* `canon create:cell`
  Asks for `pageCode`, `schemaCode`, `tabCode`, `policyCodes`, component.
  Writes `cells.yaml` entry + scaffolds cell component with `CELL_META`.

> **Goal:** No one manually edits manifests or meta blocks; everything comes from the CLI.

### 8.2 ESLint & Type Rules

* `no-restricted-imports`

  * Disallow raw `@tanstack/react-table` imports outside `packages/ui/canon/tables/**`.
* Custom rule:

  * Files under `canon-pages/**` must export `PAGE_META` with required fields.
  * Files under `canon/tables/**` must export `COMPONENT_META`.

### 8.3 Validation Script (Pre-commit & CI)

Node/TS script that:

1. Loads `pages.yaml`, `components.yaml`, `cells.yaml`.
2. Scans canonical code files.
3. Verifies:

   * `PAGE_META.code` & `version` exist in `pages.yaml` and `file` path matches.
   * `COMPONENT_META.code` exists in `components.yaml`.
   * `CELL_META.cellId` exists in `cells.yaml`.
4. Fails CI on any mismatch.

This eliminates **IDE drift**: if someone moves or renames a file but doesn’t update the registry or meta blocks, the build fails.

### 8.4 Telemetry Standard

All structured logs include:

* `page_code`
* `schema_code`
* `tab_code`
* `policy_codes`
* `cell_id`
* `component_code` (for critical components like `TBLM01`)

Thus any incident can be reported as:

> “Failure at **META_09 / SCH_101 / TAB_10 / POLY_25** (CELL_META_09_101_10_25)”

and traced across frontend, BFF, DB and audit logs.

### 8.5 Skills & Process

* **Mental model training**: teams speak in codes (`META_02`, `TBLM01`) not just names.
* **Code reviews** check:

  * Correct Canon codes,
  * Correct use of canonical components (no hard-coded UI for governed flows),
  * Manifest updates done through CLI.
* **Design & Figma**: frame names include the same codes (`META_02 – Canon Landing Page – v1.1.0`) to keep UX aligned with engineering and schema.

---

## 9. Simple End-to-End Use Case

> **Scenario:** Bug in “Canon Landing Page” dynamic table.

1. Business reports:
   “Filter is broken in Canon Landing Page monetize table.”

2. Architect translates:

   * Canon Landing Page → `pages.yaml` → **`META_02`**.
   * Monetize table → `components.yaml` → **`TBLM01`**.

3. Logs show:
   `SCHEMA_VALIDATION_FAILED at CELL_META_02_101_10_25 (META_02 / SCH_101 / TAB_10 / POLY_25, component TBLM01)`.

4. Engineer jumps to:

   * `cells.yaml` → `CELL_META_02_101_10_25` → file path.
   * `META_02_CanonLandingPage.tsx` & `TBLM01_MonetizeFullTable.tsx`.

5. Fix is applied; `PAGE_META.version` or `COMPONENT_META.version` is bumped; CLI updates manifests.

No guessing, no hunting; the **codes are the map**.

---

This README/PRD is your **Canon Identity Contract**.
From here, the next step is implementation of:

* The manifests (`pages.yaml`, `components.yaml`, `cells.yaml`),
* The canonical page/component/cell files with meta blocks,
* The CLI + validators.

Once those exist, plugging them into Supabase and your Schema / Metadata Studio becomes a straightforward migration of the same Canon codes.
