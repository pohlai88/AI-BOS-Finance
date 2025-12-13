# Canon Directory — Governance & Documentation System

> **🟢 [ACTIVE]** — Canon Root Directory  
> **Purpose:** Central repository for all governed documentation, contracts, and architectural decisions  
> **Location:** `canon/`  
> **SSOT Reference:** [`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md)

---

## 🎯 Overview

The `canon/` directory is the **Single Source of Truth (SSOT)** for all governed documentation, architectural decisions, contracts, tools, and knowledge artifacts in the AI-BOS Finance system.

**Key Principles:**
- ✅ **Governed:** All files follow Canon Identity Contract (CONT_01)
- ✅ **Structured:** Organized by 5 Canon Planes (A-E)
- ✅ **Validated:** ESLint rules enforce compliance
- ✅ **Tracked:** All files registered in `registry.ts`

---

## 📍 SSOT Location

**The Single Source of Truth (SSOT) for Canon documentation is:**

### [`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md)

**Location:** `canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md`

This document contains:
- ✅ Complete Canon Identity Contract (v2.2.0)
- ✅ All 5 Canon Planes definitions (A-E)
- ✅ Naming conventions and prefixes
- ✅ File structure and organization rules
- ✅ Governance enforcement rules
- ✅ TypeScript type definitions

**All other documentation derives from this SSOT.**

---

## 📁 Directory Structure

```
canon/
├── A-Governance/          # Plane A: Laws & Decisions
│   ├── A-ADR/            # Architecture Decision Records (ADR_XXX)
│   │   ├── ADR_001_NextJsAppRouter.md
│   │   ├── ADR_002_CanonSecurity.md
│   │   └── README.md
│   ├── A-CONT/            # Contracts (CONT_XX)
│   │   ├── CONT_01_CanonIdentity.md  ⭐ SSOT
│   │   └── README.md
│   └── README.md
│
├── B-Functional/          # Plane B: Routable Features
│   ├── B-PAGE/           # Pages (PAGE_XXX or XXX)
│   ├── B-COMP/            # Components (COMP_XXX)
│   ├── B-CELL/            # Cells (CELL_XXX)
│   └── README.md
│
├── C-DataLogic/           # Plane C: Data & Logic
│   ├── C-ENT/             # Entities (ENT_XXX)
│   ├── C-SCH/             # Schemas (SCH_XXX)
│   ├── C-POLY/            # Policies (POLY_XX)
│   ├── C-CONST/           # Constants (CONST_XX)
│   └── README.md
│
├── D-Operations/          # Plane D: Operations & Tools
│   ├── D-TOOL/            # Tools (TOOL_XX)
│   │   ├── TOOL_03_CheckGovernanceStamps.ts
│   │   ├── TOOL_18_ValidateCanonCompliance.ts
│   │   ├── TOOL_29_PromoteUnauditedToCanon.ts
│   │   └── README.md
│   └── README.md
│
├── E-Knowledge/           # Plane E: Library & Evidence
│   ├── E-REF/             # References (REF_XXX)
│   │   ├── REF_040_UnauditedDocsWorkflow.md
│   │   ├── REF_045_FileAccessControl.md
│   │   └── ... (45+ reference files)
│   ├── E-SPEC/            # Specifications (SPEC_XXX)
│   └── README.md
│
├── registry.ts            # Canon file registry (TypeScript)
└── z-archive/             # Archived/Deprecated files
```

---

## 🗺️ Canon Planes Explained

### Plane A — Governance (Laws & Decisions)
**Purpose:** Immutable contracts and architectural decisions  
**Prefixes:** `CONT_XX`, `ADR_XXX`  
**Location:** `canon/A-Governance/`  
**Key Files:**
- `CONT_01_CanonIdentity.md` - ⭐ **SSOT** - Canon Identity Contract
- `ADR_001_NextJsAppRouter.md` - Next.js App Router decision
- `ADR_002_CanonSecurity.md` - Security architecture

### Plane B — Functional (Routable Features)
**Purpose:** UI components, pages, and cells that users interact with  
**Prefixes:** `PAGE_XXX`, `COMP_XXX`, `CELL_XXX`  
**Location:** `canon/B-Functional/`  
**Registry Files:** `registry.yaml` files track components, pages, and cells

### Plane C — Data & Logic (Business Rules)
**Purpose:** Data models, validation schemas, business policies  
**Prefixes:** `ENT_XXX`, `SCH_XXX`, `POLY_XX`, `CONST_XX`  
**Location:** `canon/C-DataLogic/`  
**Registry Files:** `registry.yaml` files track entities, schemas, policies, constants

### Plane D — Operations (Tools & Scripts)
**Purpose:** Operational tools, migrations, infrastructure  
**Prefixes:** `TOOL_XX`, `MIG_YYYYMMDD_Slug`, `INFRA_XX`  
**Location:** `canon/D-Operations/D-TOOL/`  
**Key Tools:**
- `TOOL_29_PromoteUnauditedToCanon.ts` - Promotion workflow tool
- `TOOL_18_ValidateCanonCompliance.ts` - Validation tool
- `TOOL_03_CheckGovernanceStamps.ts` - Governance stamp checker

### Plane E — Knowledge (Library & Evidence)
**Purpose:** Reference documentation, specifications, guides  
**Prefixes:** `REF_XXX`, `SPEC_XXX`  
**Location:** `canon/E-Knowledge/`  
**Key References:**
- `REF_040_UnauditedDocsWorkflow.md` - Staging workflow guide
- `REF_045_FileAccessControl.md` - File access control strategy
- `REF_070_OrganTransplantMigration.md` - Migration documentation

---

## 🔄 Workflow: Creating New Canon Files

**⚠️ CRITICAL:** All new Canon documentation MUST be created in `.staging-docs/` first!

### Step 1: Create in Staging
```bash
# Create file in .staging-docs/ (mirrors canon structure)
.staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md
.staging-docs/E-Knowledge/E-REF/REF_074_NewReference.md
```

### Step 2: Review & Approve
- Developer reviews file
- Ensures naming convention: `{PREFIX}_{NUMBER}_{Name}.{ext}`
- Validates content and structure

### Step 3: Promote to Canon
```bash
npm run canon:promote .staging-docs/A-Governance/A-ADR/ADR_003_NewDecision.md
```

**What happens:**
1. File moves from `.staging-docs/` → `canon/`
2. File added to `registry.ts` automatically
3. File now governed by Canon rules
4. File tracked by Git

---

## 📋 Naming Conventions

### File Naming Pattern
```
{PREFIX}_{NUMBER}_{Name}.{ext}
```

**Examples:**
- ✅ `ADR_003_NewDecision.md`
- ✅ `REF_074_NewReference.md`
- ✅ `TOOL_30_ArchiveOneTimeTools.ts`
- ❌ `new-decision.md` (missing prefix)
- ❌ `ADR_NewDecision.md` (missing number)
- ❌ `ADR_003.md` (missing name)

### Prefix Reference

| Plane | Prefixes | Example | Location |
|-------|----------|---------|----------|
| A | `CONT_XX`, `ADR_XXX` | `CONT_01`, `ADR_001` | `A-Governance/` |
| B | `PAGE_XXX`, `COMP_XXX`, `CELL_XXX` | `PAGE_META_02`, `COMP_TBLM01` | `B-Functional/` |
| C | `ENT_XXX`, `SCH_XXX`, `POLY_XX`, `CONST_XX` | `ENT_PAYMENT`, `SCH_PAYMENT` | `C-DataLogic/` |
| D | `TOOL_XX`, `MIG_YYYYMMDD_Slug` | `TOOL_29`, `MIG_20250127_Payment` | `D-Operations/D-TOOL/` |
| E | `REF_XXX`, `SPEC_XXX` | `REF_040`, `SPEC_PAY_01` | `E-Knowledge/` |

**Full details:** See [`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md) Section 3

---

## 🛡️ Governance & Validation

### ESLint Enforcement
- **Rule:** `canon/no-raw-colors` - Enforces design tokens (Drift Police)
- **Rule:** `canon/no-raw-colors` - Prevents hardcoded colors
- **Rule:** `canon/no-raw-colors` - Validates governed components

### Registry System
All Canon files are registered in `canon/registry.ts`:
```typescript
export interface CanonFile {
  path: string;
  type: CanonFileType;
  id: string;
  title: string;
  status: CanonStatus;
}
```

### Validation Tools
```bash
# Validate Canon compliance
npm run canon:validate

# Check governance stamps
npx tsx scripts/TOOL_03_CheckGovernanceStamps.ts

# Validate file access control
npx tsx canon/D-Operations/D-TOOL/TOOL_31_ValidateFileAccess.ts
```

---

## 📚 Key Documents

### ⭐ SSOT (Single Source of Truth)
- **[`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md)** - **THE SSOT** - Canon Identity Contract v2.2.0
  - Complete Canon system definition
  - All 5 planes explained
  - Naming conventions
  - Governance rules

### Contracts & Decisions
- [`ADR_001_NextJsAppRouter.md`](A-Governance/A-ADR/ADR_001_NextJsAppRouter.md) - Next.js App Router decision
- [`ADR_002_CanonSecurity.md`](A-Governance/A-ADR/ADR_002_CanonSecurity.md) - Security architecture

### Workflow References
- [`REF_040_UnauditedDocsWorkflow.md`](E-Knowledge/E-REF/REF_040_UnauditedDocsWorkflow.md) - Staging workflow guide
- [`REF_045_FileAccessControl.md`](E-Knowledge/E-REF/REF_045_FileAccessControl.md) - File access control strategy
- [`REF_070_OrganTransplantMigration.md`](E-Knowledge/E-REF/REF_070_OrganTransplantMigration.md) - Organ transplant migration

### Tools
- [`TOOL_29_PromoteUnauditedToCanon.ts`](D-Operations/D-TOOL/TOOL_29_PromoteUnauditedToCanon.ts) - Promotion tool
- [`TOOL_18_ValidateCanonCompliance.ts`](D-Operations/D-TOOL/TOOL_18_ValidateCanonCompliance.ts) - Validation tool
- [`TOOL_03_CheckGovernanceStamps.ts`](D-Operations/D-TOOL/TOOL_03_CheckGovernanceStamps.ts) - Governance checker

---

## 🚨 Forbidden Patterns

### ❌ Never Create Files Directly in `canon/`
**Wrong:**
```
canon/A-Governance/A-ADR/ADR_003.md  ❌ Direct creation
```

**Correct:**
```
.staging-docs/A-Governance/A-ADR/ADR_003.md  ✅ Staging first
→ Review & approve
→ npm run canon:promote
→ canon/A-Governance/A-ADR/ADR_003.md  ✅ After promotion
```

### ❌ Never Create Files at Project Root
**Wrong:**
```
AI-BOS-Finance/
├── ADR_003_NewDecision.md  ❌ At root
└── canon/...
```

**Correct:**
```
AI-BOS-Finance/
├── .staging-docs/
│   └── A-Governance/
│       └── A-ADR/
│           └── ADR_003_NewDecision.md  ✅ In staging
└── canon/...
```

---

## 🔍 Navigation Tips

### Finding the SSOT
**The SSOT is always at:**
```
canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md
```

### Finding Files by Type
- **ADRs:** `canon/A-Governance/A-ADR/`
- **References:** `canon/E-Knowledge/E-REF/` (45+ files)
- **Tools:** `canon/D-Operations/D-TOOL/`
- **Contracts:** `canon/A-Governance/A-CONT/`

### Finding Files by Prefix
- **CONT_XX:** `canon/A-Governance/A-CONT/`
- **ADR_XXX:** `canon/A-Governance/A-ADR/`
- **REF_XXX:** `canon/E-Knowledge/E-REF/`
- **TOOL_XX:** `canon/D-Operations/D-TOOL/`

### Registry Lookup
Check `canon/registry.ts` for complete file listing and metadata.

---

## 📖 Related Documentation

- **SSOT:** [`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md) - ⭐ **START HERE**
- **Staging Workflow:** See `.staging-docs/README.md`
- **File Access Control:** See `.cursor/rules/file-access-control.mdc`
- **Canon Governance Rules:** See `.cursor/rules/canon-governance.mdc`

---

## 🎓 Quick Start

1. **Read the SSOT:** Start with [`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md)
2. **Understand Planes:** Review Section 3 of CONT_01 (5 Canon Planes)
3. **Check Naming:** Follow `{PREFIX}_{NUMBER}_{Name}.{ext}` pattern
4. **Use Staging:** Create files in `.staging-docs/` first
5. **Promote:** Use `npm run canon:promote` after review

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**SSOT:** [`CONT_01_CanonIdentity.md`](A-Governance/A-CONT/CONT_01_CanonIdentity.md)  
**Maintainer:** Canon Governance System
