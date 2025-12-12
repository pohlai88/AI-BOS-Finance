> **🟢 [ACTIVE]** — Architectural Decision  
> **Canon Code:** ADR_005  
> **Status:** Accepted  
> **Date:** 2025-12-12  
> **Context:** Monorepo Migration & Architecture Scaling  
> **Supersedes:** N/A  
> **Related:** CONT_01 (Canon Identity Contract), ADR_001 (Next.js App Router)

---

# ADR_005: Migration to Turborepo Monorepo Structure

## Status

**Accepted** — 2025-12-12

---

## Context

The current application structure places all frontend logic, shared components, business modules, and governance documentation (Canon) into a single Next.js application root.

While the code is modular (`src/modules`, `src/components`), the physical coupling creates several issues:

1. **Unclear Boundaries:** It is easy to import feature-specific logic into shared components unintentionally.
2. **Build Performance:** Any change triggers a full rebuild of the entire application, even for isolated components.
3. **Governance Isolation:** The "Canon" governance system is currently a folder inside the app, whereas it should ideally be a shared package or separate entity that can be versioned independently.
4. **Backend Coupling:** The SAP CDS backend (`srv/`) exists alongside the frontend but lacks a unified build orchestration.
5. **Scalability:** Adding new applications (e.g., documentation site, admin portal, mobile app) would require restructuring the entire codebase.
6. **Dependency Management:** Shared dependencies are duplicated across the codebase, making updates and versioning complex.

The Canon Identity Contract (CONT_01) already references a monorepo structure with `apps/` and `packages/` directories, indicating this migration aligns with the intended architecture.

---

## Decision

We will migrate the codebase to a **Turborepo** monorepo workspace.

### The New Structure

We will adopt the following workspace layout:

```
aibos/
├── apps/
│   └── web/                    # Next.js 16 application
│       ├── app/                # App Router routes (thin wrappers)
│       ├── canon-pages/        # Business logic pages
│       ├── next.config.mjs
│       └── package.json
│
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── canon/              # Canon components (TBLM01, TBLL01)
│   │   │   ├── tables/         # Table components
│   │   │   └── ...
│   │   ├── nexus/              # Design system (NexusCard, NexusButton)
│   │   └── metadata/           # Metadata visualization components
│   │
│   ├── canon/                  # Canon governance system
│   │   ├── A-Governance/      # Contracts and ADRs
│   │   ├── B-Functional/      # Pages and components registry
│   │   ├── C-DataLogic/        # Entities, schemas, policies
│   │   ├── D-Operations/       # Tools and scripts
│   │   ├── E-Knowledge/        # Specifications and references
│   │   └── registry.ts         # Canon registry exports
│   │
│   ├── shared/                 # Universal utilities
│   │   ├── lib/                # utils, stateManager, etc.
│   │   ├── types/              # TypeScript types
│   │   └── constants/         # App constants
│   │
│   ├── schemas/                # Zod schemas (SCH_*)
│   │   └── ...
│   │
│   └── config/                 # Shared configurations
│       ├── eslint/             # ESLint config
│       ├── typescript/          # TypeScript config
│       └── tailwind/            # Tailwind config
│
├── turbo.json                  # Turborepo configuration
├── package.json                # Root workspace
└── pnpm-workspace.yaml         # Workspace definition
```

### Key Principles

1. **Strict Boundaries:** Code in `packages/ui` cannot accidentally import from `apps/web`, enforcing cleaner architecture.
2. **Build Caching:** Turborepo will cache build artifacts, speeding up CI/CD and local development.
3. **Canon Independence:** The Canon system becomes a portable package that can be versioned and shared.
4. **Scalability:** Ready to add more apps without restructuring (e.g., `apps/docs`, `apps/admin`).

---

## Consequences

### Positive

- ✅ **Build Performance:** Turborepo caching dramatically speeds up builds in CI/CD and local development.
- ✅ **Strict Boundaries:** Package boundaries prevent accidental coupling between features and shared code.
- ✅ **Scalability:** Easy to add new applications (documentation site, admin portal, mobile app) without restructuring.
- ✅ **Canon Independence:** The Canon governance system becomes a portable, versioned package.
- ✅ **Dependency Management:** Centralized dependency management reduces duplication and version conflicts.
- ✅ **Type Safety:** Shared types across packages ensure consistency.
- ✅ **Code Sharing:** Components, utilities, and types can be shared across multiple apps.
- ✅ **Governance Alignment:** Matches the structure defined in CONT_01 (Canon Identity Contract).

### Negative

- ⚠️ **Complexity:** Requires management of `package.json` workspaces and potentially complex dependency versioning.
- ⚠️ **Initial Friction:** Developers must adjust to running commands from the root (e.g., `pnpm dev`) rather than the app folder.
- ⚠️ **Migration Effort:** Initial migration requires updating all import paths and build configurations.
- ⚠️ **Learning Curve:** Team must learn Turborepo concepts (pipelines, caching, dependencies).
- ⚠️ **Tooling Updates:** Storybook, ESLint, and other tools may need configuration updates for monorepo.

### Neutral

- Path aliases will change from `@/*` to `@aibos/ui/*`, `@aibos/canon/*`, etc.
- Build commands run from root: `turbo build` instead of `npm run build` in app folder.
- CI/CD pipelines need updates to use Turborepo commands.

---

## Implementation Notes

### Migration Phases

#### Phase 1: Setup Turborepo Foundation
1. Install Turborepo: `npx create-turbo@latest --empty`
2. Create `turbo.json` with pipeline configuration
3. Set up workspace configuration (pnpm workspaces)
4. Create initial package structure

#### Phase 2: Extract Packages
1. **UI Package** (`packages/ui`)
   - Move `src/components/nexus/` → `packages/ui/nexus/`
   - Move `src/components/metadata/` → `packages/ui/metadata/`
   - Extract shared components

2. **Canon Package** (`packages/canon`)
   - Move `canon/` → `packages/canon/`
   - Export types and registry functions

3. **Shared Package** (`packages/shared`)
   - Move `src/lib/` → `packages/shared/lib/`
   - Move `src/types/` → `packages/shared/types/`
   - Move `src/constants/` → `packages/shared/constants/`

4. **Schemas Package** (`packages/schemas`)
   - Extract Zod schemas from modules
   - Organize by domain (payment, metadata, etc.)

#### Phase 3: Refactor App
1. Move Next.js app to `apps/web/`
2. Update imports to use package aliases (`@aibos/ui/*`, `@aibos/canon/*`)
3. Update `next.config.mjs` for monorepo (Tailwind content paths)
4. Update `tsconfig.json` paths for monorepo

#### Phase 4: Testing & Validation
1. Run build pipeline: `turbo build`
2. Test all routes and functionality
3. Validate Canon governance system
4. Update Storybook configuration
5. Run test suite: `turbo test`

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "storybook": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Path Alias Updates

**Before:**
```typescript
import { NexusCard } from '@/components/nexus/NexusCard';
import { utils } from '@/lib/utils';
```

**After:**
```typescript
import { NexusCard } from '@aibos/ui/nexus/NexusCard';
import { utils } from '@aibos/shared/lib/utils';
```

### Next.js Config Updates

```javascript
// apps/web/next.config.mjs
const nextConfig = {
  // ... existing config
  // Update Tailwind to scan packages
  // (Turborepo handles this automatically with proper config)
};
```

---

## Applies To

1. **All Frontend Code:** Components, modules, pages
2. **Canon Governance System:** All Canon documentation and registry
3. **Shared Utilities:** Types, constants, helper functions
4. **Build System:** CI/CD pipelines, local development
5. **Future Applications:** Any new apps added to the monorepo

---

## Migration Timeline

- **Week 1:** ADR creation and approval (this document)
- **Week 2:** Phase 1-2 (Turborepo setup, package extraction)
- **Week 3:** Phase 3-4 (App refactor, testing)
- **Week 4:** Documentation updates, team training

**Estimated Effort:** 2-4 weeks for complete migration

---

## References

- **CONT_01:** Canon Identity & Cell Registration Standard v2.2.0 (Section 4: Repository Layout)
- **Turborepo Docs:** https://turbo.build/repo/docs
- **Next.js Monorepo Guide:** https://nextjs.org/docs/app/building-your-application/configuring/monorepos
- **Validation Report:** `TURBOREPO_VALIDATION_REPORT.md`
- **ADR_001:** Next.js App Router adoption

---

**End of ADR**
